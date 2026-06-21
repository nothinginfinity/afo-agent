const VERSION='0.3.0';
const riskRank={read:1,network:2,write:3,money:4,destructive:5};
const roleRank={public:0,read:1,operator:2,admin:3,owner:4};
const leadAgent={id:'agent.afo.lead',name:'AFO Lead Agent',mission:'Safe tool discovery, policy checks, approval gates, execution, and receipts.',allowedEnvironments:['local','cloudflare','github','browser','container','mcp','worker'],maxRisk:'write',requiredReceipts:true};
const zipTools=[
{id:'zip.status',name:'ZipStatus',description:'Read Zip Gateway v2 status and binding readiness.',capabilities:['zip status','repo artifact filesystem status','zip gateway health check'],permissions:['zip:read'],environment:'worker',risk:'read',version:'0.2.1',inputSchema:'{}',outputSchema:'zip status object',requiredRole:'public'},
{id:'zip.tools',name:'ZipTools',description:'List Zip Gateway v2 JSON-RPC methods.',capabilities:['zip tools','zip tool discovery','repo artifact filesystem manifest'],permissions:['zip:read'],environment:'worker',risk:'read',version:'0.2.1',inputSchema:'{}',outputSchema:'zip tool manifest',requiredRole:'public'},
{id:'zip.manifest',name:'ZipManifest',description:'Read the Zip Gateway v2 manifest.',capabilities:['zip manifest','json rpc manifest','agent repo filesystem manifest'],permissions:['zip:read'],environment:'worker',risk:'read',version:'0.2.1',inputSchema:'{}',outputSchema:'zip manifest object',requiredRole:'public'},
{id:'zip.repo.writeFile',name:'ZipRepoWriteFile',description:'Create or update one GitHub repository file through Zip Gateway v2. Dry-run is default.',capabilities:['write repository file','create source file','update github file','agent repo filesystem write'],permissions:['github:write','zip:write'],environment:'github',risk:'write',version:'0.2.1',inputSchema:'owner?:string,repo:string,branch?:string,path:string,content:string,dry_run?:boolean,confirm_write?:boolean,message?:string',outputSchema:'zip write result with receipt',requiredRole:'operator'},
{id:'zip.repo.writeBatch',name:'ZipRepoWriteBatch',description:'Create or update multiple GitHub repository files through Zip Gateway v2. Dry-run is default.',capabilities:['write repository files','batch repo write','publish generated files','agent repo filesystem batch write'],permissions:['github:write','zip:write'],environment:'github',risk:'write',version:'0.2.1',inputSchema:'owner?:string,repo:string,branch?:string,files:array,dry_run?:boolean,confirm_write?:boolean,message?:string',outputSchema:'zip batch write result with receipt',requiredRole:'operator'},
{id:'zip.repo.planPatch',name:'ZipRepoPlanPatch',description:'Dry-run deterministic text patch operations against provided content.',capabilities:['plan text patch','preview code change','dry run mutation','patch preview'],permissions:['zip:read'],environment:'worker',risk:'read',version:'0.2.1',inputSchema:'content:string,operations:array,verify?:array,return_content?:boolean',outputSchema:'patch preview result',requiredRole:'public'},
{id:'zip.repo.applyPatch',name:'ZipRepoApplyPatch',description:'Read a GitHub file, apply anchored text patch operations, verify, and optionally commit. Dry-run is default.',capabilities:['patch repository file','apply code change','safe text mutation','agent repo filesystem patch'],permissions:['github:write','r2:write','zip:write'],environment:'github',risk:'write',version:'0.2.1',inputSchema:'owner?:string,repo:string,branch?:string,path:string,operations:array,verify?:array,dry_run?:boolean,confirm_write?:boolean,message?:string',outputSchema:'zip patch result with rollback receipt',requiredRole:'operator'},
{id:'zip.repo.applyPatchBatch',name:'ZipRepoApplyPatchBatch',description:'Apply multiple repository text patch jobs with shared defaults. Dry-run is default.',capabilities:['patch repository files','batch code mutation','multi file patch','agent repo filesystem patch batch'],permissions:['github:write','r2:write','zip:write'],environment:'github',risk:'write',version:'0.2.1',inputSchema:'defaults?:object,patches:array,dry_run?:boolean,confirm_write?:boolean',outputSchema:'zip patch batch result',requiredRole:'operator'},
{id:'zip.artifact.list',name:'ZipArtifactList',description:'List Zip artifacts from the configured R2 bucket.',capabilities:['list artifacts','r2 list','artifact inventory','zip artifact list'],permissions:['r2:read','zip:read'],environment:'cloudflare',risk:'read',version:'0.2.1',inputSchema:'prefix?:string,limit?:number',outputSchema:'artifact object list',requiredRole:'read'},
{id:'zip.artifact.get',name:'ZipArtifactGet',description:'Read a text artifact from the Zip R2 bucket.',capabilities:['get artifact','r2 get','read bundle','zip artifact read'],permissions:['r2:read','zip:read'],environment:'cloudflare',risk:'read',version:'0.2.1',inputSchema:'key:string',outputSchema:'artifact content object',requiredRole:'read'},
{id:'zip.artifact.put',name:'ZipArtifactPut',description:'Store an artifact in the Zip R2 bucket and write a receipt.',capabilities:['store artifact','r2 put','publish bundle','zip artifact write'],permissions:['r2:write','zip:write'],environment:'cloudflare',risk:'write',version:'0.2.1',inputSchema:'key:string,content:string,content_type?:string,session_id?:string',outputSchema:'artifact write result with receipt',requiredRole:'operator'},
{id:'zip.artifact.head',name:'ZipArtifactHead',description:'Read metadata for an artifact in the Zip R2 bucket.',capabilities:['artifact metadata','r2 head','zip artifact metadata'],permissions:['r2:read','zip:read'],environment:'cloudflare',risk:'read',version:'0.2.1',inputSchema:'key:string',outputSchema:'artifact metadata object',requiredRole:'read'},
{id:'zip.receipt',name:'ZipReceipt',description:'List receipts for a Zip session.',capabilities:['read receipt','audit zip session','operation ledger','zip receipts'],permissions:['r2:read','zip:read'],environment:'cloudflare',risk:'read',version:'0.2.1',inputSchema:'session_id:string,limit?:number',outputSchema:'zip receipt list',requiredRole:'read'},
{id:'zip.rollback',name:'ZipRollback',description:'Restore a repository file from provided prior content through Zip Gateway v2. Dry-run is default.',capabilities:['rollback repository file','restore source file','reverse patch','zip rollback'],permissions:['github:write','r2:write','zip:write'],environment:'github',risk:'write',version:'0.2.1',inputSchema:'owner?:string,repo:string,branch?:string,path:string,content:string,dry_run?:boolean,confirm_write?:boolean,message?:string',outputSchema:'rollback result with receipt',requiredRole:'operator'},
{id:'zip.clone.plan',name:'ZipClonePlan',description:'Unified clone namespace entrypoint that delegates to the existing chunked gitZip Clone engine.',capabilities:['plan zip clone','clone repository','chunked repo ingestion','zip clone plan'],permissions:['github:read','zip:read'],environment:'github',risk:'read',version:'0.2.1',inputSchema:'src_owner:string,src_repo:string,dst_owner:string,dst_repo:string,src_ref?:string,src_path?:string,dst_branch?:string,dst_path?:string',outputSchema:'clone delegation object',requiredRole:'read'},
{id:'zip.clone.resume',name:'ZipCloneResume',description:'Unified clone resume namespace for Zip Gateway v2 delegation.',capabilities:['resume zip clone','clone resume','chunked repo ingestion resume'],permissions:['github:write','zip:write'],environment:'github',risk:'write',version:'0.2.1',inputSchema:'session_id:string,confirm_write?:boolean,max_batches?:number',outputSchema:'clone resume delegation object',requiredRole:'operator'},
{id:'zip.clone.verify',name:'ZipCloneVerify',description:'Unified clone verify namespace for Zip Gateway v2 delegation.',capabilities:['verify zip clone','clone verify','repo clone audit'],permissions:['github:read','zip:read'],environment:'github',risk:'read',version:'0.2.1',inputSchema:'session_id:string,repair_sessions?:array,auto_detect_siblings?:boolean',outputSchema:'clone verify delegation object',requiredRole:'read'}
];
const tools=[
...zipTools,
{id:'registry.search',name:'RegistrySearch',description:'Search the live AFO tool registry for tools and child agents by capability.',capabilities:['discover tools','search tool registry','find child agents','list capabilities'],permissions:['registry:read'],environment:'worker',risk:'read',version:VERSION,inputSchema:'capability:string,riskMax?:ToolRisk',outputSchema:'matches:ToolManifest[]',requiredRole:'public'},
{id:'registry.inspect',name:'RegistryInspect',description:'Inspect one tool manifest by id.',capabilities:['inspect tool','read tool manifest','explain capability'],permissions:['registry:read'],environment:'worker',risk:'read',version:VERSION,inputSchema:'toolId:string',outputSchema:'tool:ToolManifest',requiredRole:'public'},
{id:'agent.invoke',name:'AgentInvoke',description:'Invoke an allowed AFO.Agent tool through the policy and receipt gateway.',capabilities:['invoke tool','run agent tool','write receipt'],permissions:['agent:invoke','receipts:write'],environment:'worker',risk:'write',version:VERSION,inputSchema:'toolId:string,purpose:string,input:object',outputSchema:'output:any,receipts:Receipt[]',requiredRole:'operator'},
{id:'receipts.list',name:'ReceiptsList',description:'List recent AFO.Agent execution and sync receipts.',capabilities:['list receipts','audit agent activity','view ledger'],permissions:['receipts:read'],environment:'worker',risk:'read',version:VERSION,inputSchema:'limit?:number',outputSchema:'receipts:Receipt[]',requiredRole:'operator'},
{id:'github.repo.inspect',name:'GitHubRepoInspect',description:'Read safe metadata for a GitHub repository.',capabilities:['inspect github repo','read repository metadata','github read'],permissions:['github:read'],environment:'github',risk:'read',version:VERSION,inputSchema:'owner:string,repo:string',outputSchema:'repository metadata object',requiredRole:'read'},
{id:'github.file.read',name:'GitHubFileRead',description:'Read one UTF-8 file from GitHub through the configured GitHub API token.',capabilities:['read github file','inspect source file','github code read'],permissions:['github:read'],environment:'github',risk:'read',version:VERSION,inputSchema:'owner:string,repo:string,path:string,ref?:string',outputSchema:'file content metadata',requiredRole:'read'},
{id:'github.workflow.runs',name:'GitHubWorkflowRuns',description:'Read recent GitHub Actions workflow runs for a repository.',capabilities:['read github actions','inspect workflow runs','ci status'],permissions:['github:read'],environment:'github',risk:'read',version:VERSION,inputSchema:'owner:string,repo:string,limit?:number',outputSchema:'workflow run summaries',requiredRole:'read'},
{id:'cloudflare.workers.list',name:'CloudflareWorkersList',description:'List Cloudflare Workers visible to the configured Cloudflare API token.',capabilities:['list cloudflare workers','inspect worker inventory','cloudflare read'],permissions:['cloudflare:read'],environment:'cloudflare',risk:'read',version:VERSION,inputSchema:'{}',outputSchema:'workers[]',requiredRole:'read'},
{id:'cloudflare.worker.inspect',name:'CloudflareWorkerInspect',description:'Read Cloudflare Worker settings and binding names/types without exposing secret values.',capabilities:['inspect cloudflare worker','read worker settings','inspect bindings'],permissions:['cloudflare:read'],environment:'cloudflare',risk:'read',version:VERSION,inputSchema:'scriptName:string',outputSchema:'worker settings object',requiredRole:'read'},
{id:'cloudflare.d1.tables',name:'CloudflareD1Tables',description:'List tables for the configured or supplied Cloudflare D1 database.',capabilities:['inspect d1 database','list d1 tables','cloudflare d1 read'],permissions:['cloudflare:read','d1:read'],environment:'cloudflare',risk:'read',version:VERSION,inputSchema:'databaseId?:string,databaseName?:string',outputSchema:'tables[]',requiredRole:'read'},
{id:'approvals.request',name:'ApprovalsRequest',description:'Create a pending approval for a write, money, or destructive tool call.',capabilities:['request approval','approval gate','write approval record'],permissions:['approvals:write'],environment:'worker',risk:'write',version:VERSION,inputSchema:'toolId:string,purpose:string,input:object',outputSchema:'approval object',requiredRole:'operator'},
{id:'approvals.list',name:'ApprovalsList',description:'List pending or recent approval records.',capabilities:['list approvals','review pending actions','approval queue'],permissions:['approvals:read'],environment:'worker',risk:'read',version:VERSION,inputSchema:'status?:string,limit?:number',outputSchema:'approvals[]',requiredRole:'operator'},
{id:'approvals.decide',name:'ApprovalsDecide',description:'Approve or reject a pending approval record.',capabilities:['approve action','reject action','human approval'],permissions:['approvals:decide'],environment:'worker',risk:'write',version:VERSION,inputSchema:'approvalId:string,decision:approved|rejected,reason:string',outputSchema:'approval object',requiredRole:'owner'},
{id:'cloudflare.worker.deployPlan',name:'CloudflareWorkerDeployPlan',description:'Create a safe deployment plan for a Cloudflare Worker without deploying it.',capabilities:['plan cloudflare worker','edge worker planning','deployment planning'],permissions:['cloudflare:plan'],environment:'cloudflare',risk:'read',version:VERSION,inputSchema:'workerName:string,purpose:string',outputSchema:'workerName:string,steps:string[]',requiredRole:'public'},
{id:'cloudflare.worker.deployApply',name:'CloudflareWorkerDeployApply',description:'Approval-gated write scaffold for a future Cloudflare Worker deploy apply action.',capabilities:['apply cloudflare worker deploy','approval gated deploy','write worker deployment'],permissions:['cloudflare:write','approvals:required'],environment:'cloudflare',risk:'write',version:VERSION,inputSchema:'approvalId:string,workerName:string,sourceRef?:string',outputSchema:'deployment status object',requiredRole:'operator',requiresApproval:true},
{id:'afo.agent.status',name:'AfoAgentStatus',description:'Return AFO.Agent gateway status and runtime shape.',capabilities:['agent status','gateway status','health check'],permissions:['agent:read'],environment:'worker',risk:'read',version:VERSION,inputSchema:'{}',outputSchema:'status object',requiredRole:'public'},
{id:'orchestrator.plan',name:'OrchestratorPlan',description:'Interpret a natural language task into a capability, rank candidate tools from the live registry, and propose a tool without invoking anything.',capabilities:['plan task execution','interpret natural language task','propose tool selection','assess approval requirement'],permissions:['registry:read'],environment:'worker',risk:'read',version:VERSION,inputSchema:'task:string,riskMax?:ToolRisk,environment?:string,requiredRole?:string,requireApproval?:boolean,dryRun?:boolean',outputSchema:'capability:string,candidates:RankedCandidate[],selected:ToolSummary|null,riskSummary:object|null,approvalRequired:boolean,proposedNextAction:string',requiredRole:'public'},
{id:'orchestrator.route',name:'OrchestratorRoute',description:'Resolve a task, or an explicit toolId, to one fully inspected candidate tool plus its policy evaluation, without invoking it.',capabilities:['resolve task to tool','lock candidate tool','inspect selected tool','evaluate routing policy'],permissions:['registry:read'],environment:'worker',risk:'read',version:VERSION,inputSchema:'task:string,toolId?:string,riskMax?:ToolRisk,environment?:string,requiredRole?:string',outputSchema:'capability:string,candidatesConsidered:RankedCandidate[],selected:ToolManifest|null,approvalRequired:boolean,locked:boolean,proposedNextAction:string',requiredRole:'public'},
{id:'orchestrator.execute',name:'OrchestratorExecute',description:'Plan a task, then either invoke the selected tool directly when safe, or create a pending approval when the tool is write, money, destructive, or role-restricted for the caller.',capabilities:['execute planned task','route to approval when gated','invoke selected tool','write orchestrator receipt'],permissions:['agent:invoke','receipts:write','approvals:write'],environment:'worker',risk:'write',version:VERSION,inputSchema:'task:string,input?:object,riskMax?:ToolRisk,environment?:string,requiredRole?:string',outputSchema:'executed:boolean,approvalRequired:boolean,result?:any,approval?:object,reason?:string,selectedTool?:string',requiredRole:'operator'},
{id:'orchestrator.explain',name:'OrchestratorExplain',description:'Look up receipts for a requestId and return a human readable explanation of what an orchestrator run decided and why.',capabilities:['explain orchestrator run','summarize receipt','audit decision reason'],permissions:['receipts:read'],environment:'worker',risk:'read',version:VERSION,inputSchema:'requestId:string',outputSchema:'found:boolean,receipts:Receipt[],summary:string',requiredRole:'operator'}
];
const mcpTools=tools.map(t=>({name:t.id,description:t.description,inputSchema:inputSchemaFor(t.id)}));
function inputSchemaFor(name){const schemas={
'registry.search':{type:'object',properties:{capability:{type:'string'},riskMax:{type:'string',enum:['read','network','write','money','destructive']}},required:['capability']},
'registry.inspect':{type:'object',properties:{toolId:{type:'string'}},required:['toolId']},
'agent.invoke':{type:'object',properties:{toolId:{type:'string'},purpose:{type:'string'},input:{type:'object'}},required:['toolId','purpose']},
'receipts.list':{type:'object',properties:{limit:{type:'number'}},required:[]},
'github.repo.inspect':{type:'object',properties:{owner:{type:'string'},repo:{type:'string'}},required:['owner','repo']},
'github.file.read':{type:'object',properties:{owner:{type:'string'},repo:{type:'string'},path:{type:'string'},ref:{type:'string'}},required:['owner','repo','path']},
'github.workflow.runs':{type:'object',properties:{owner:{type:'string'},repo:{type:'string'},limit:{type:'number'}},required:['owner','repo']},
'cloudflare.workers.list':{type:'object',properties:{},required:[]},
'cloudflare.worker.inspect':{type:'object',properties:{scriptName:{type:'string'}},required:['scriptName']},
'cloudflare.d1.tables':{type:'object',properties:{databaseId:{type:'string'},databaseName:{type:'string'}},required:[]},
'approvals.request':{type:'object',properties:{toolId:{type:'string'},purpose:{type:'string'},input:{type:'object'}},required:['toolId','purpose']},
'approvals.list':{type:'object',properties:{status:{type:'string'},limit:{type:'number'}},required:[]},
'approvals.decide':{type:'object',properties:{approvalId:{type:'string'},decision:{type:'string',enum:['approved','rejected']},reason:{type:'string'}},required:['approvalId','decision']},
'cloudflare.worker.deployPlan':{type:'object',properties:{workerName:{type:'string'},purpose:{type:'string'}},required:['workerName']},
'cloudflare.worker.deployApply':{type:'object',properties:{approvalId:{type:'string'},workerName:{type:'string'},sourceRef:{type:'string'}},required:['approvalId','workerName']},
'afo.agent.status':{type:'object',properties:{},required:[]},
'orchestrator.plan':{type:'object',properties:{task:{type:'string'},riskMax:{type:'string',enum:['read','network','write','money','destructive']},environment:{type:'string'},requiredRole:{type:'string'},requireApproval:{type:'boolean'},dryRun:{type:'boolean'}},required:['task']},
'orchestrator.route':{type:'object',properties:{task:{type:'string'},toolId:{type:'string'},riskMax:{type:'string',enum:['read','network','write','money','destructive']},environment:{type:'string'},requiredRole:{type:'string'}},required:['task']},
'orchestrator.execute':{type:'object',properties:{task:{type:'string'},input:{type:'object'},riskMax:{type:'string',enum:['read','network','write','money','destructive']},environment:{type:'string'},requiredRole:{type:'string'}},required:['task']},
'orchestrator.explain':{type:'object',properties:{requestId:{type:'string'}},required:['requestId']}
};if(String(name).startsWith('zip.')&&String(name).includes('.repo.'))return{type:'object',properties:{owner:{type:'string'},repo:{type:'string'},branch:{type:'string'},path:{type:'string'},content:{type:'string'},operations:{type:'array'},files:{type:'array'},patches:{type:'array'},dry_run:{type:'boolean'},confirm_write:{type:'boolean'},message:{type:'string'}},required:[]};if(String(name).startsWith('zip.artifact.'))return{type:'object',properties:{key:{type:'string'},content:{type:'string'},content_type:{type:'string'},prefix:{type:'string'},limit:{type:'number'},session_id:{type:'string'}},required:[]};if(String(name)==='zip.receipt')return{type:'object',properties:{session_id:{type:'string'},limit:{type:'number'}},required:['session_id']};return schemas[name]||{type:'object',properties:{},required:[]}}
function cors(){return{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization,x-afo-token,x-afo-role'}}
function json(data,init={}){return new Response(JSON.stringify(data,null,2),{...init,headers:{'content-type':'application/json; charset=utf-8',...cors(),...(init.headers||{})}})}
async function readJson(request){try{return await request.json()}catch{return {}}}
function safeInt(n,def=50,max=200){return Math.max(1,Math.min(Number(n)||def,max))}
function tokenFromRequest(request){const auth=request.headers.get('authorization')||'';if(auth.toLowerCase().startsWith('bearer '))return auth.slice(7).trim();return request.headers.get('x-afo-token')||request.headers.get('x-afo-admin-token')||''}
function roleTokens(env){return{read:env.AFO_AGENT_READ_TOKEN||'',operator:env.AFO_AGENT_OPERATOR_TOKEN||'',owner:env.AFO_AGENT_OWNER_TOKEN||'',admin:env.AFO_AGENT_ADMIN_TOKEN||''}}
function roleFromRequest(request,env){const token=tokenFromRequest(request);const tokens=roleTokens(env);if(tokens.admin&&token===tokens.admin)return'admin';if(tokens.owner&&token===tokens.owner)return'owner';if(tokens.operator&&token===tokens.operator)return'operator';if(tokens.read&&token===tokens.read)return'read';return'public'}
function hasRole(actual,required){return roleRank[actual]>=roleRank[required||'public']||actual==='admin'}
function requireRole(request,env,required){const role=roleFromRequest(request,env);if(hasRole(role,required))return{ok:true,role};return{ok:false,role,response:json({ok:false,error:'role_required',requiredRole:required,actualRole:role},{status:401})}}
function redactHeaders(h){const out={};for(const [k,v] of h.entries()){out[k]=k.toLowerCase().includes('authorization')||k.toLowerCase().includes('token')?'[redacted]':v}return out}
async function dbTools(env){if(!env.AFO_DB)return tools;try{const res=await env.AFO_DB.prepare('SELECT manifest_json FROM tools ORDER BY id').all();const rows=res.results||[];if(!rows.length)return tools;const fromDb=rows.map(r=>JSON.parse(r.manifest_json));const byId=new Map([...tools,...fromDb].map(t=>[t.id,t]));return [...byId.values()].sort((a,b)=>a.id.localeCompare(b.id))}catch{return tools}}
async function dbReceipts(env,limit=50){if(!env.AFO_DB)return[];try{const safeLimit=safeInt(limit);const res=await env.AFO_DB.prepare('SELECT * FROM receipts ORDER BY created_at DESC LIMIT ?').bind(safeLimit).all();return res.results||[]}catch{return[]}}
async function writeReceipt(env,item){const receipt={id:crypto.randomUUID(),requestId:item.requestId||crypto.randomUUID(),agentId:item.agentId||leadAgent.id,toolId:item.toolId,purpose:item.purpose||'',status:item.status,reason:item.reason||null,role:item.role||null,input:item.input??null,output:item.output??null,error:item.error||null,createdAt:new Date().toISOString()};if(env.AFO_DB){await env.AFO_DB.prepare('INSERT INTO receipts (id,request_id,agent_id,tool_id,purpose,status,reason,input_json,output_json,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(receipt.id,receipt.requestId,receipt.agentId,receipt.toolId,receipt.purpose,receipt.status,receipt.reason,JSON.stringify(receipt.input),JSON.stringify(receipt.output),receipt.error,receipt.createdAt).run()}if(env.AFO_ARTIFACTS){await env.AFO_ARTIFACTS.put(`receipts/${receipt.createdAt.slice(0,10)}/${receipt.id}.json`,JSON.stringify(receipt,null,2),{httpMetadata:{contentType:'application/json'}})}return receipt}
function searchTools(toolList,query={}){const capability=String(query.capability||'').toLowerCase();const riskMax=query.riskMax;return toolList.filter(t=>{const cap=!capability||t.name.toLowerCase().includes(capability)||t.description.toLowerCase().includes(capability)||(t.capabilities||[]).some(c=>c.toLowerCase().includes(capability));const risk=!riskMax||riskRank[t.risk]<=riskRank[riskMax];return cap&&risk})}
function status(env){return{ok:true,name:'afo-agent-gateway',version:env.AFO_AGENT_VERSION||VERSION,leadAgent,bindings:{d1:Boolean(env.AFO_DB),r2:Boolean(env.AFO_ARTIFACTS),githubToken:Boolean(env.GITHUB_TOKEN),cfToken:Boolean(env.CF_API_TOKEN),cfAccount:Boolean(env.CF_ACCOUNT_ID),readToken:Boolean(env.AFO_AGENT_READ_TOKEN),operatorToken:Boolean(env.AFO_AGENT_OPERATOR_TOKEN),ownerToken:Boolean(env.AFO_AGENT_OWNER_TOKEN),adminToken:Boolean(env.AFO_AGENT_ADMIN_TOKEN)},routes:['/status','/registry/tools','/registry/search','/registry/tools/:id','/agent/agent.afo.lead/invoke','/orchestrator/plan','/orchestrator/route','/orchestrator/execute','/receipts','/approvals','/mcp','/openapi.json'],persistence:'d1+r2',hardened:true,auth:'role tokens',approvalGates:true,source:'github:worker/standalone/index.js'}}
async function gh(env,path){if(!env.GITHUB_TOKEN)throw new Error('github_token_missing');const res=await fetch(`https://api.github.com${path}`,{headers:{authorization:`Bearer ${env.GITHUB_TOKEN}`,'user-agent':'afo-agent-gateway','accept':'application/vnd.github+json'}});const text=await res.text();let data;try{data=JSON.parse(text)}catch{data={text}}if(!res.ok)throw new Error(`github_${res.status}:${data.message||text.slice(0,120)}`);return data}
async function cf(env,path){if(!env.CF_API_TOKEN)throw new Error('cf_api_token_missing');const account=env.CF_ACCOUNT_ID;if(!account)throw new Error('cf_account_id_missing');const full=path.replaceAll('{account_id}',account);const res=await fetch(`https://api.cloudflare.com/client/v4${full}`,{headers:{authorization:`Bearer ${env.CF_API_TOKEN}`,'content-type':'application/json'}});const data=await res.json().catch(()=>({}));if(!res.ok||data.success===false)throw new Error(`cloudflare_${res.status}:${JSON.stringify(data.errors||data)}`);return data}
async function invokeZipGateway(env,method,input){const url=env.ZIP_GATEWAY_RPC_URL||'https://afo-zip-gateway-v2.jaredtechfit.workers.dev/rpc';const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'afo-agent-'+crypto.randomUUID(),method,params:input||{}})});const text=await res.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!res.ok)throw new Error('zip_gateway_http_'+res.status+':'+text.slice(0,200));if(data.error)throw new Error('zip_gateway_rpc_'+data.error.code+':'+data.error.message);return{remote:'afo-zip-gateway-v2',url,method,result:data.result}}
async function approvalsTableReady(env){if(!env.AFO_DB)return false;try{await env.AFO_DB.prepare('SELECT id FROM approvals LIMIT 1').all();return true}catch{return false}}
async function createApproval(env,args,role){const now=new Date().toISOString();const approval={id:crypto.randomUUID(),request_id:crypto.randomUUID(),agent_id:leadAgent.id,tool_id:args.toolId,purpose:args.purpose,input_json:JSON.stringify(args.input??null),status:'pending',requested_by:role,decided_by:null,decision_reason:null,created_at:now,decided_at:null};if(!env.AFO_DB)throw new Error('d1_missing');if(!(await approvalsTableReady(env)))throw new Error('approvals_table_missing');await env.AFO_DB.prepare('INSERT INTO approvals (id,request_id,agent_id,tool_id,purpose,input_json,status,requested_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(approval.id,approval.request_id,approval.agent_id,approval.tool_id,approval.purpose,approval.input_json,approval.status,approval.requested_by,approval.created_at).run();return approval}
async function listApprovals(env,args){if(!env.AFO_DB)throw new Error('d1_missing');if(!(await approvalsTableReady(env)))return[];const limit=safeInt(args.limit,25,100);if(args.status){const res=await env.AFO_DB.prepare('SELECT * FROM approvals WHERE status=? ORDER BY created_at DESC LIMIT ?').bind(args.status,limit).all();return res.results||[]}const res=await env.AFO_DB.prepare('SELECT * FROM approvals ORDER BY created_at DESC LIMIT ?').bind(limit).all();return res.results||[]}
async function decideApproval(env,args,role){if(!env.AFO_DB)throw new Error('d1_missing');if(!(await approvalsTableReady(env)))throw new Error('approvals_table_missing');const decision=args.decision==='approved'?'approved':'rejected';const now=new Date().toISOString();await env.AFO_DB.prepare('UPDATE approvals SET status=?,decided_by=?,decision_reason=?,decided_at=? WHERE id=? AND status="pending"').bind(decision,role,args.reason||'',now,args.approvalId).run();const res=await env.AFO_DB.prepare('SELECT * FROM approvals WHERE id=?').bind(args.approvalId).first();if(!res)throw new Error('approval_not_found');return res}
async function requireApproved(env,approvalId,toolId){if(!env.AFO_DB)throw new Error('d1_missing');if(!(await approvalsTableReady(env)))throw new Error('approvals_table_missing');const row=await env.AFO_DB.prepare('SELECT * FROM approvals WHERE id=?').bind(approvalId).first();if(!row)throw new Error('approval_not_found');if(row.tool_id!==toolId)throw new Error('approval_tool_mismatch');if(row.status!=='approved')throw new Error('approval_not_approved');return row}
const ORCH_STOPWORDS=new Set(['the','a','an','to','of','for','and','or','please','can','you','i','we','need','want','this','that','on','in','with','my','our','it','is','are','be','me','let','lets',"let's",'do','does','via','using','use','should','would','could','just','now','up']);
function extractCapability(task){
  const cleaned=String(task||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w&&!ORCH_STOPWORDS.has(w));
  return cleaned.join(' ');
}
function significantWords(capability){return String(capability||'').split(/\s+/).filter(Boolean)}
function searchCandidates(toolList,capability,riskMax){
  const words=significantWords(capability);
  const phraseMatches=capability?searchTools(toolList,{capability,riskMax}):[];
  const hitCounts=new Map();
  for(const t of phraseMatches)hitCounts.set(t.id,words.length||1);
  const byId=new Map(phraseMatches.map(t=>[t.id,t]));
  if(words.length>1||!byId.size){
    for(const w of words){
      for(const t of searchTools(toolList,{capability:w,riskMax})){
        byId.set(t.id,t);
        hitCounts.set(t.id,(hitCounts.get(t.id)||0)+1);
      }
    }
  }
  return [...byId.values()].map(tool=>({tool,keywordHits:hitCounts.get(tool.id)||0,totalKeywords:words.length||1}));
}
function rankCandidates(candidates,ctx={}){
  const {environment,requiredRole,role}=ctx;
  const scored=candidates.map(c=>{
    const tool=c.tool;const reasons=[];let score=0;
    const ratio=c.totalKeywords?c.keywordHits/c.totalKeywords:0;
    if(ratio>=1){score+=5;reasons.push('matched all extracted capability keywords')}
    else if(ratio>0){score+=2+Math.round(ratio*2);reasons.push(`matched ${c.keywordHits}/${c.totalKeywords} capability keywords`)}
    else{score+=1;reasons.push('weak capability match (substring relevance only)')}
    score+=5-(riskRank[tool.risk]||3);reasons.push(`risk tier: ${tool.risk}`);
    const roleOk=role?hasRole(role,tool.requiredRole||'public'):true;
    if(roleOk){score+=2;reasons.push(`caller role satisfies requiredRole ${tool.requiredRole||'public'}`)}
    else{reasons.push(`caller role does not satisfy requiredRole ${tool.requiredRole||'public'} (would require approval)`)}
    if(environment){if(tool.environment===environment){score+=2;reasons.push('environment matches constraint')}else{score-=1;reasons.push('environment differs from constraint')}}
    if(requiredRole&&tool.requiredRole===requiredRole){score+=1;reasons.push('requiredRole matches constraint')}
    const complete=Boolean(tool.description&&tool.capabilities?.length&&tool.inputSchema&&tool.outputSchema&&tool.version);
    if(complete){score+=1;reasons.push('manifest is complete')}else{reasons.push('manifest is missing recommended fields')}
    if(tool.requiresApproval){score-=1;reasons.push('manifest flags requiresApproval')}else{reasons.push('no explicit requiresApproval flag')}
    return{tool,score,reasons,roleOk};
  });
  scored.sort((a,b)=>b.score-a.score);
  return scored;
}
function approvalRequiredFor(tool,role){
  if(!tool)return false;
  if(tool.requiresApproval===true)return true;
  if(riskRank[tool.risk]>=riskRank.write)return true;
  if(!hasRole(role,tool.requiredRole||'public'))return true;
  return false;
}
async function planOrchestration(env,role,args){
  const task=String(args?.task||'').trim();
  if(!task)throw new Error('task_required');
  const capability=extractCapability(task);
  const toolList=await dbTools(env);
  const candidates=searchCandidates(toolList,capability,args?.riskMax);
  const ranked=rankCandidates(candidates,{environment:args?.environment,requiredRole:args?.requiredRole,role});
  const top=ranked[0]||null;
  const selected=top?top.tool:null;
  const approvalRequired=approvalRequiredFor(selected,role);
  const riskSummary=selected?{risk:selected.risk,requiredRole:selected.requiredRole||'public',roleSatisfied:hasRole(role,selected.requiredRole||'public'),withinLeadMaxRisk:riskRank[selected.risk]<=riskRank[leadAgent.maxRisk],requiresApprovalFlag:Boolean(selected.requiresApproval)}:null;
  const proposedNextAction=!selected?'no_matching_tool: refine the task description or call registry.search directly':approvalRequired?`call orchestrator.execute, or approvals.request, for "${selected.id}" (approval required)`:`call orchestrator.execute to run "${selected.id}" directly`;
  return{
    task,capability,
    constraints:{riskMax:args?.riskMax||null,environment:args?.environment||null,requiredRole:args?.requiredRole||null,requireApproval:Boolean(args?.requireApproval),dryRun:args?.dryRun!==false},
    candidates:ranked.slice(0,5).map(r=>({toolId:r.tool.id,risk:r.tool.risk,requiredRole:r.tool.requiredRole||'public',environment:r.tool.environment,score:r.score,reasons:r.reasons})),
    selected:selected?{toolId:selected.id,name:selected.name,description:selected.description,risk:selected.risk,requiredRole:selected.requiredRole||'public',environment:selected.environment,requiresApproval:Boolean(selected.requiresApproval)}:null,
    riskSummary,approvalRequired,proposedNextAction
  };
}
async function routeOrchestration(env,role,args){
  const plan=await planOrchestration(env,role,args);
  const toolList=await dbTools(env);
  let selectedTool=null;
  if(args?.toolId){
    selectedTool=toolList.find(t=>t.id===args.toolId)||null;
    if(!selectedTool)throw new Error('tool_not_found');
  }else if(plan.selected){
    selectedTool=toolList.find(t=>t.id===plan.selected.toolId)||null;
  }
  const approvalRequired=approvalRequiredFor(selectedTool,role);
  return{
    task:plan.task,capability:plan.capability,constraints:plan.constraints,
    candidatesConsidered:plan.candidates,
    selected:selectedTool,
    approvalRequired,
    locked:Boolean(selectedTool),
    proposedNextAction:selectedTool?(approvalRequired?`call orchestrator.execute, or approvals.request, for "${selectedTool.id}"`:`call orchestrator.execute to run "${selectedTool.id}"`):'no_tool_selected'
  };
}
async function executeOrchestration(env,role,args){
  const task=String(args?.task||'').trim();
  if(!task)throw new Error('task_required');
  let plan;
  try{plan=await planOrchestration(env,role,args)}catch(e){return{executed:false,approvalRequired:false,reason:`plan_failed:${e.message||e}`}}
  const toolList=await dbTools(env);
  const selected=plan.selected?toolList.find(t=>t.id===plan.selected.toolId):null;
  if(!selected){
    return{executed:false,approvalRequired:false,reason:'no_matching_tool',capability:plan.capability,candidates:plan.candidates,proposedNextAction:plan.proposedNextAction};
  }
  const approvalRequired=approvalRequiredFor(selected,role);
  if(approvalRequired){
    try{
      const approval=await createApproval(env,{toolId:selected.id,purpose:task,input:args?.input||{}},role);
      return{executed:false,approvalRequired:true,approval,selectedTool:selected.id,capability:plan.capability,candidates:plan.candidates,reason:`gated:${selected.risk}/${selected.requiredRole||'public'}`};
    }catch(e){
      return{executed:false,approvalRequired:true,approval:null,selectedTool:selected.id,capability:plan.capability,candidates:plan.candidates,reason:`approval_request_failed:${e.message||e}`};
    }
  }
  try{
    const result=await invokeTool(env,{toolId:selected.id,purpose:task,input:args?.input||{}},role);
    return{executed:true,approvalRequired:false,selectedTool:selected.id,capability:plan.capability,candidates:plan.candidates,result:result.output,innerReceiptId:result.receipt?.id||null};
  }catch(e){
    return{executed:false,approvalRequired:false,selectedTool:selected.id,capability:plan.capability,candidates:plan.candidates,reason:`execute_failed:${e.message||e}`};
  }
}
function safeParseJson(v){if(v==null)return null;if(typeof v!=='string')return v;try{return JSON.parse(v)}catch{return v}}
async function dbReceiptsByRequestId(env,requestId){
  if(!env.AFO_DB)return[];
  try{
    const res=await env.AFO_DB.prepare('SELECT * FROM receipts WHERE request_id=? ORDER BY created_at DESC LIMIT 25').bind(requestId).all();
    return res.results||[];
  }catch{return[]}
}
async function explainOrchestration(env,args){
  const requestId=String(args?.requestId||'').trim();
  if(!requestId)throw new Error('requestId_required');
  const rows=await dbReceiptsByRequestId(env,requestId);
  if(!rows.length)return{requestId,found:false,receipts:[],summary:'No receipts found for this requestId.'};
  const parsed=rows.map(r=>({...r,input:safeParseJson(r.input_json),output:safeParseJson(r.output_json)}));
  const top=parsed.find(r=>String(r.tool_id||'').startsWith('orchestrator.'))||parsed[0];
  const lines=[];
  lines.push(`Request ${requestId} ran tool "${top.tool_id}" with role "${top.role}".`);
  if(top.output?.capability)lines.push(`Interpreted capability: "${top.output.capability}".`);
  if(top.output?.selectedTool)lines.push(`Selected tool: ${top.output.selectedTool}.`);
  else if(top.output?.selected)lines.push(`Selected tool: ${typeof top.output.selected==='string'?top.output.selected:top.output.selected.toolId||JSON.stringify(top.output.selected)}.`);
  lines.push(`Status: ${top.status}${top.reason?` (${top.reason})`:''}${top.error?` — error: ${top.error}`:''}.`);
  if(top.output?.approval)lines.push(`Approval id: ${top.output.approval.id||'unknown'}, status: ${top.output.approval.status||'unknown'}.`);
  return{requestId,found:true,receipts:parsed,summary:lines.join(' ')};
}
async function invokeTool(env,call,role){const requestId=crypto.randomUUID();const toolList=await dbTools(env);const tool=toolList.find(t=>t.id===call.toolId);if(!tool){await writeReceipt(env,{requestId,toolId:call.toolId,purpose:call.purpose||'',status:'failed',role,input:call.input,error:'tool_not_found'});throw new Error('tool_not_found')}if(!hasRole(role,tool.requiredRole||'public')){await writeReceipt(env,{requestId,toolId:call.toolId,purpose:call.purpose||'',status:'denied',role,input:call.input,error:'role_denied'});throw new Error(`role_denied:${tool.requiredRole||'public'}`)}if(!call.purpose||String(call.purpose).trim().length<3){await writeReceipt(env,{requestId,toolId:call.toolId,purpose:call.purpose||'',status:'denied',role,input:call.input,error:'purpose_required'});throw new Error('purpose_required')}if(riskRank[tool.risk]>riskRank[leadAgent.maxRisk]){await writeReceipt(env,{requestId,toolId:call.toolId,purpose:call.purpose,status:'denied',role,input:call.input,error:'risk_denied'});throw new Error('risk_denied')}let output;const input=call.input||{};
if(tool.id==='registry.search')output={matches:searchTools(toolList,input)};
else if(tool.id==='registry.inspect'){const found=toolList.find(t=>t.id===input.toolId);if(!found)throw new Error('tool_not_found');output={tool:found}}
else if(tool.id==='receipts.list')output={receipts:await dbReceipts(env,input.limit||50)};
else if(tool.id==='afo.agent.status')output=status(env);
else if(tool.id==='github.repo.inspect'){const r=await gh(env,`/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}`);output={repository:{id:r.id,full_name:r.full_name,private:r.private,default_branch:r.default_branch,html_url:r.html_url,updated_at:r.updated_at,pushed_at:r.pushed_at,visibility:r.visibility}}}
else if(tool.id==='github.file.read'){const ref=input.ref?`?ref=${encodeURIComponent(input.ref)}`:'';const f=await gh(env,`/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/contents/${input.path.split('/').map(encodeURIComponent).join('/')}${ref}`);const content=f.encoding==='base64'?atob(String(f.content||'').replace(/\s/g,'')):f.content;output={path:f.path,sha:f.sha,size:f.size,html_url:f.html_url,content}}
else if(tool.id==='github.workflow.runs'){const r=await gh(env,`/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/actions/runs?per_page=${safeInt(input.limit,10,30)}`);output={total_count:r.total_count,runs:(r.workflow_runs||[]).map(x=>({id:x.id,name:x.name,status:x.status,conclusion:x.conclusion,head_branch:x.head_branch,head_sha:x.head_sha,run_started_at:x.run_started_at,html_url:x.html_url}))}}
else if(tool.id==='cloudflare.workers.list'){const r=await cf(env,'/accounts/{account_id}/workers/scripts');output={workers:(r.result||[]).map(w=>({id:w.id,created_on:w.created_on,modified_on:w.modified_on,usage_model:w.usage_model,compatibility_date:w.compatibility_date}))}}
else if(tool.id==='cloudflare.worker.inspect'){const r=await cf(env,`/accounts/{account_id}/workers/scripts/${encodeURIComponent(input.scriptName)}/settings`);output={settings:r.result}}
else if(tool.id==='cloudflare.d1.tables'){const dbid=input.databaseId||env.AFO_AGENT_D1_DATABASE_ID;if(!dbid)throw new Error('d1_database_id_missing');const r=await cf(env,`/accounts/{account_id}/d1/database/${encodeURIComponent(dbid)}/query`);output={note:'D1 direct query endpoint requires POST in Cloudflare API; use Cloudflare MCP query tool for live table reads.',databaseId:dbid,raw:r}}
else if(tool.id==='approvals.request')output={approval:await createApproval(env,input,role)};
else if(tool.id==='approvals.list')output={approvals:await listApprovals(env,input)};
else if(tool.id==='approvals.decide')output={approval:await decideApproval(env,input,role)};
else if(tool.id==='cloudflare.worker.deployPlan'){const workerName=input.workerName||'afo-agent-gateway';output={workerName,steps:['inspect current worker bindings','read GitHub source ref','create approval request for deployApply','verify approval status','deploy with preserve-bindings transport only','smoke test status, registry, mcp, receipts','write D1 and R2 receipts']}}
else if(tool.id==='cloudflare.worker.deployApply'){await requireApproved(env,input.approvalId,tool.id);output={status:'approved_but_not_executed',reason:'deployApply is a safety scaffold; use the Cloudflare preserve-bindings MCP for actual deployment.',workerName:input.workerName,sourceRef:input.sourceRef||null}}
else if(tool.id.startsWith('zip.'))output=await invokeZipGateway(env,tool.id,input);
else if(tool.id==='orchestrator.plan')output=await planOrchestration(env,role,input);
else if(tool.id==='orchestrator.route')output=await routeOrchestration(env,role,input);
else if(tool.id==='orchestrator.execute')output=await executeOrchestration(env,role,input);
else if(tool.id==='orchestrator.explain')output=await explainOrchestration(env,input);
else throw new Error('handler_not_found');
const receipt=await writeReceipt(env,{requestId,toolId:tool.id,purpose:call.purpose,status:'executed',role,input,output});return{output,receipt}}
function openApiSchema(){return{openapi:'3.1.0',info:{title:'AFO.Agent Gateway',version:VERSION,description:'Role-gated AFO.Agent gateway for ChatGPT Actions and MCP.'},servers:[{url:'https://afo-agent-gateway.jaredtechfit.workers.dev'}],components:{securitySchemes:{AFOBearer:{type:'http',scheme:'bearer'}}},paths:{'/status':{get:{operationId:'getStatus',summary:'Get status',responses:{'200':{description:'Status'}}}},'/registry/search':{post:{operationId:'searchRegistry',summary:'Search tools',requestBody:{required:true,content:{'application/json':{schema:inputSchemaFor('registry.search')}}},responses:{'200':{description:'Search results'}}}},'/registry/tools/{toolId}':{get:{operationId:'inspectTool',summary:'Inspect tool',parameters:[{name:'toolId',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Tool manifest'}}}},'/agent/agent.afo.lead/invoke':{post:{operationId:'invokeLeadAgent',summary:'Invoke a role-gated tool',security:[{AFOBearer:[]}],requestBody:{required:true,content:{'application/json':{schema:inputSchemaFor('agent.invoke')}}},responses:{'200':{description:'Invocation result'},'401':{description:'Role token required'}}}},'/orchestrator/plan':{post:{operationId:'orchestratorPlan',summary:'Plan a task without invoking anything',requestBody:{required:true,content:{'application/json':{schema:inputSchemaFor('orchestrator.plan')}}},responses:{'200':{description:'Plan result'}}}},'/orchestrator/route':{post:{operationId:'orchestratorRoute',summary:'Resolve a task to one inspected candidate tool',requestBody:{required:true,content:{'application/json':{schema:inputSchemaFor('orchestrator.route')}}},responses:{'200':{description:'Route result'}}}},'/orchestrator/execute':{post:{operationId:'orchestratorExecute',summary:'Plan, then execute or request approval',security:[{AFOBearer:[]}],requestBody:{required:true,content:{'application/json':{schema:inputSchemaFor('orchestrator.execute')}}},responses:{'200':{description:'Execute result'},'401':{description:'Role token required'}}}},'/receipts':{get:{operationId:'listReceipts',summary:'List receipts',security:[{AFOBearer:[]}],responses:{'200':{description:'Receipts'}}}},'/mcp':{get:{operationId:'getMcpInfo',summary:'Get MCP information',responses:{'200':{description:'MCP capabilities'}}},post:{operationId:'mcpRpc',summary:'JSON-RPC MCP endpoint',responses:{'200':{description:'MCP JSON-RPC response'}}}}}}}
async function handleMcp(request,env){if(request.method==='GET')return json({ok:true,protocol:'mcp',serverInfo:{name:'afo-agent-gateway',version:VERSION},capabilities:{tools:{listChanged:false}},tools:mcpTools});const body=await readJson(request);const id=body.id??null;try{if(body.method==='initialize')return json({jsonrpc:'2.0',id,result:{protocolVersion:'2024-11-05',capabilities:{tools:{listChanged:false}},serverInfo:{name:'afo-agent-gateway',version:VERSION}}});if(body.method==='tools/list')return json({jsonrpc:'2.0',id,result:{tools:mcpTools}});if(body.method==='tools/call'){const name=body.params?.name;const args=body.params?.arguments||{};let result;if(name==='agent.invoke'){const auth=requireRole(request,env,'operator');if(!auth.ok)return auth.response;result=await invokeTool(env,args,auth.role)}else{const role=roleFromRequest(request,env);result=await invokeTool(env,{toolId:name,purpose:`MCP call ${name}`,input:args},role)}return json({jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(result,null,2)}]}})}return json({jsonrpc:'2.0',id,error:{code:-32601,message:'method_not_found'}})}catch(e){return json({jsonrpc:'2.0',id,error:{code:-32000,message:e.message||String(e)}})}}
async function handleOrchestratorRoute(request,env,toolId){
  const body=await readJson(request);
  const role=roleFromRequest(request,env);
  const purpose=body.purpose||body.task||`orchestrator call: ${toolId}`;
  try{
    const result=await invokeTool(env,{toolId,purpose,input:body},role);
    return json({ok:true,...result});
  }catch(e){
    const msg=e.message||String(e);
    const status=msg.startsWith('role_denied')?401:400;
    return json({ok:false,error:msg},{status});
  }
}
export default{async fetch(request,env){const url=new URL(request.url);if(request.method==='OPTIONS')return new Response(null,{headers:cors()});if(request.method==='GET'&&(url.pathname==='/'||url.pathname==='/status'))return json(status(env));if(request.method==='GET'&&(url.pathname==='/openapi.json'||url.pathname==='/.well-known/openapi.json'||url.pathname==='/actions/openapi.json'))return json(openApiSchema());if(url.pathname==='/mcp')return handleMcp(request,env);if(request.method==='GET'&&url.pathname==='/registry/tools')return json({ok:true,tools:await dbTools(env)});if(request.method==='POST'&&url.pathname==='/registry/search'){const body=await readJson(request);return json({ok:true,tools:searchTools(await dbTools(env),body)})}const inspect=url.pathname.match(/^\/registry\/tools\/([^/]+)$/);if(request.method==='GET'&&inspect){const tool=(await dbTools(env)).find(t=>t.id===decodeURIComponent(inspect[1]));return tool?json({ok:true,tool}):json({ok:false,error:'tool_not_found'},{status:404})}const invoke=url.pathname.match(/^\/agent\/([^/]+)\/invoke$/);if(request.method==='POST'&&invoke){const body=await readJson(request);const toolList=await dbTools(env);const requestedTool=toolList.find(t=>t.id===body.toolId);const required=requestedTool?.requiredRole||'operator';const auth=requireRole(request,env,required);if(!auth.ok)return auth.response;try{const result=await invokeTool(env,body,auth.role);return json({ok:true,...result,receipts:await dbReceipts(env,10)})}catch(e){return json({ok:false,error:e.message||String(e),receipts:await dbReceipts(env,10)},{status:400})}}if(request.method==='POST'&&url.pathname==='/orchestrator/plan')return handleOrchestratorRoute(request,env,'orchestrator.plan');if(request.method==='POST'&&url.pathname==='/orchestrator/route')return handleOrchestratorRoute(request,env,'orchestrator.route');if(request.method==='POST'&&url.pathname==='/orchestrator/execute')return handleOrchestratorRoute(request,env,'orchestrator.execute');if(request.method==='GET'&&url.pathname==='/receipts'){const auth=requireRole(request,env,'operator');if(!auth.ok)return auth.response;return json({ok:true,receipts:await dbReceipts(env,url.searchParams.get('limit')||50)})}if(request.method==='GET'&&url.pathname==='/approvals'){const auth=requireRole(request,env,'operator');if(!auth.ok)return auth.response;try{return json({ok:true,approvals:await listApprovals(env,{status:url.searchParams.get('status')||undefined,limit:url.searchParams.get('limit')||25})})}catch(e){return json({ok:false,error:e.message||String(e)},{status:400})}}if(url.pathname.startsWith('/admin/')){const auth=requireRole(request,env,'admin');if(!auth.ok)return auth.response;return json({ok:true,admin:true,status:status(env),receipts:await dbReceipts(env,25),headers:redactHeaders(request.headers)})}return json({ok:false,error:'not_found'},{status:404})}};
