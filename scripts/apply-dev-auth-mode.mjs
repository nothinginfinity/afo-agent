import fs from 'node:fs';

const file = 'worker/standalone/index.js';
const source = fs.readFileSync(file, 'utf8');

const strictRoleFromRequest = "function roleFromRequest(request,env){const token=tokenFromRequest(request);const tokens=roleTokens(env);if(tokens.admin&&token===tokens.admin)return'admin';if(tokens.owner&&token===tokens.owner)return'owner';if(tokens.operator&&token===tokens.operator)return'operator';if(tokens.read&&token===tokens.read)return'read';return'public'}";

const devRoleFromRequest = "function roleFromRequest(request,env){const authMode=String(env.AFO_AGENT_AUTH_MODE||'').toLowerCase();const devConfirm=String(env.AFO_AGENT_DEV_CONFIRM||'');if(authMode==='dev'&&devConfirm==='I_UNDERSTAND_DEV_PUBLIC_ACCESS'){const devRole=String(env.AFO_AGENT_DEV_ROLE||'read').toLowerCase();if(['public','read','operator','admin','owner'].includes(devRole))return devRole;return'read'}const token=tokenFromRequest(request);const tokens=roleTokens(env);if(tokens.admin&&token===tokens.admin)return'admin';if(tokens.owner&&token===tokens.owner)return'owner';if(tokens.operator&&token===tokens.operator)return'operator';if(tokens.read&&token===tokens.read)return'read';return'public'}";

if (source.includes(devRoleFromRequest)) {
  console.log('Dev auth mode already present');
  process.exit(0);
}

if (!source.includes(strictRoleFromRequest)) {
  throw new Error('Expected roleFromRequest anchor not found');
}

const next = source.replace(strictRoleFromRequest, devRoleFromRequest);
fs.writeFileSync(file, next);
console.log('Applied dev auth mode patch to worker/standalone/index.js');
