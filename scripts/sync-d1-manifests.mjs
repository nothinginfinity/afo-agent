import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestsDir = path.join(root, 'manifests');
const dryRun = process.argv.includes('--dry-run');
const requireSecrets = process.argv.includes('--require-secrets');
const startedAt = new Date().toISOString();
const syncId = `manifest-sync-${startedAt.replace(/[:.]/g, '-')}`;

const requiredToolFields = ['id', 'name', 'description', 'capabilities', 'permissions', 'environment', 'risk'];
const requiredAgentFields = ['id', 'name', 'mission'];
const allowedRisks = new Set(['read', 'network', 'write', 'money', 'destructive']);
const allowedEnvironments = new Set(['local', 'cloudflare', 'github', 'browser', 'container', 'mcp', 'worker']);

function env(name) {
  return process.env[name] || '';
}

function requireEnv(name) {
  const value = env(name);
  if (!value && requireSecrets && !dryRun) throw new Error(`${name} is required`);
  return value;
}

async function readJsonFile(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${filePath} is invalid JSON: ${error.message}`);
  }
}

async function listJsonFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listJsonFiles(full));
    if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
  }
  return files.sort();
}

function withInheritedVersion(tool, version) {
  if (tool.version) return tool;
  if (!version) return tool;
  return { ...tool, version };
}

function normalizeManifest(raw, sourceFile) {
  if (Array.isArray(raw)) return { tools: raw, agents: [], sourceFile };
  if (raw && Array.isArray(raw.tools)) {
    const inheritedVersion = typeof raw.version === 'string' ? raw.version : undefined;
    const tools = raw.tools.map((tool) => withInheritedVersion(tool, inheritedVersion));
    const agents = Array.isArray(raw.agents) ? raw.agents : [];
    return { tools, agents, sourceFile };
  }
  if (raw && raw.id && raw.mission) return { tools: [], agents: [raw], sourceFile };
  if (raw && raw.id && raw.capabilities) return { tools: [raw], agents: [], sourceFile };
  throw new Error(`${sourceFile} must contain a tool object, an agent object, an array of tools, or { tools, agents }`);
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string`);
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`${label} must be a non-empty string array`);
  }
}

function validateTool(tool, sourceFile) {
  for (const field of requiredToolFields) if (!(field in tool)) throw new Error(`${sourceFile} tool missing ${field}`);
  assertString(tool.id, `${sourceFile} tool.id`);
  assertString(tool.name, `${sourceFile} ${tool.id}.name`);
  assertString(tool.description, `${sourceFile} ${tool.id}.description`);
  assertStringArray(tool.capabilities, `${sourceFile} ${tool.id}.capabilities`);
  assertStringArray(tool.permissions, `${sourceFile} ${tool.id}.permissions`);
  assertString(tool.environment, `${sourceFile} ${tool.id}.environment`);
  assertString(tool.risk, `${sourceFile} ${tool.id}.risk`);
  tool.version = typeof tool.version === 'string' && tool.version.trim() ? tool.version : '0.1.0';
  assertString(tool.version, `${sourceFile} ${tool.id}.version`);
  if (!allowedRisks.has(tool.risk)) throw new Error(`${sourceFile} ${tool.id}.risk is unsupported`);
  if (!allowedEnvironments.has(tool.environment)) throw new Error(`${sourceFile} ${tool.id}.environment is unsupported`);
  return tool;
}

function validateAgent(agent, sourceFile) {
  for (const field of requiredAgentFields) if (!(field in agent)) throw new Error(`${sourceFile} agent missing ${field}`);
  assertString(agent.id, `${sourceFile} agent.id`);
  assertString(agent.name, `${sourceFile} ${agent.id}.name`);
  assertString(agent.mission, `${sourceFile} ${agent.id}.mission`);
  return agent;
}

async function cloudflareD1(sql, params = []) {
  const accountId = requireEnv('CF_ACCOUNT_ID');
  const token = requireEnv('CF_API_TOKEN');
  const databaseId = requireEnv('AFO_AGENT_D1_DATABASE_ID');
  if (!accountId || !token || !databaseId) {
    if (dryRun) return { skipped: true, sql, params };
    throw new Error('CF_ACCOUNT_ID, CF_API_TOKEN, and AFO_AGENT_D1_DATABASE_ID are required');
  }
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params })
  });
  const data = await response.json();
  if (!response.ok || data.success === false) throw new Error(`D1 query failed: ${JSON.stringify(data)}`);
  return data;
}

async function emitInngest(name, data) {
  const key = env('INNGEST_EVENT_KEY');
  if (!key) return { skipped: true, reason: 'missing INNGEST_EVENT_KEY' };
  const response = await fetch('https://inn.gs/e', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify([{ name, data, id: `${syncId}-${name}` }])
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Inngest event failed: ${JSON.stringify(result)}`);
  return result;
}

async function syncTool(tool) {
  await cloudflareD1('INSERT OR REPLACE INTO tools (id,name,description,capabilities_json,permissions_json,environment,risk,version,manifest_json,updated_at) VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)', [tool.id, tool.name, tool.description, JSON.stringify(tool.capabilities), JSON.stringify(tool.permissions), tool.environment, tool.risk, tool.version, JSON.stringify(tool)]);
}

async function syncAgent(agent) {
  const instructions = typeof agent.instructions === 'string' ? agent.instructions : 'Discover tools through the registry before execution. Inspect manifests. Obey policy. Write receipts.';
  const maxRisk = typeof agent.maxRisk === 'string' ? agent.maxRisk : 'write';
  const requiredReceipts = agent.requiredReceipts === false ? 0 : 1;
  await cloudflareD1('INSERT OR REPLACE INTO agents (id,name,mission,instructions,max_risk,required_receipts,updated_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)', [agent.id, agent.name, agent.mission, instructions, maxRisk, requiredReceipts]);
}

async function writeReceipt(summary, status, reason) {
  await cloudflareD1('INSERT INTO receipts (id,request_id,agent_id,tool_id,purpose,status,reason,input_json,output_json,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)', [`${syncId}-${status}`, syncId, 'agent.afo.lead', 'github.manifestSync', 'Sync GitHub tool manifests into D1', status, reason, JSON.stringify({ source: 'github-actions', dryRun }), JSON.stringify(summary), null]);
}

async function main() {
  await emitInngest('afo.agent.manifest_sync.started', { syncId, dryRun, startedAt });
  const files = await listJsonFiles(manifestsDir);
  const tools = [];
  const agents = [];
  for (const file of files) {
    const raw = await readJsonFile(file);
    const normalized = normalizeManifest(raw, path.relative(root, file));
    for (const tool of normalized.tools) tools.push(validateTool(tool, normalized.sourceFile));
    for (const agent of normalized.agents) agents.push(validateAgent(agent, normalized.sourceFile));
  }
  const toolIds = new Set();
  for (const tool of tools) {
    if (toolIds.has(tool.id)) throw new Error(`duplicate tool id ${tool.id}`);
    toolIds.add(tool.id);
  }
  const agentIds = new Set();
  for (const agent of agents) {
    if (agentIds.has(agent.id)) throw new Error(`duplicate agent id ${agent.id}`);
    agentIds.add(agent.id);
  }
  const summary = { syncId, dryRun, files: files.map((file) => path.relative(root, file)), tools: tools.map((tool) => tool.id), agents: agents.map((agent) => agent.id) };
  if (!dryRun) {
    for (const agent of agents) await syncAgent(agent);
    for (const tool of tools) await syncTool(tool);
    await writeReceipt(summary, 'executed', 'manifest_sync_completed');
  }
  await emitInngest('afo.agent.manifest_sync.completed', summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(async (error) => {
  const failure = { syncId, dryRun, error: error.message };
  try { await emitInngest('afo.agent.manifest_sync.failed', failure); } catch {}
  console.error(JSON.stringify(failure, null, 2));
  process.exit(1);
});
