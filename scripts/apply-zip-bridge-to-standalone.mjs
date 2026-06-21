import fs from 'node:fs';

const file = 'worker/standalone/index.js';
let source = fs.readFileSync(file, 'utf8');

const zipTools = `const zipTools=[
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
`;

if (!source.includes('const zipTools=[')) {
  source = source.replace("const tools=[\n{id:'registry.search'", zipTools + "const tools=[\n...zipTools,\n{id:'registry.search'");
}

const bridge = `async function invokeZipGateway(env,method,input){const url=env.ZIP_GATEWAY_RPC_URL||'https://afo-zip-gateway-v2.jaredtechfit.workers.dev/rpc';const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'afo-agent-'+crypto.randomUUID(),method,params:input||{}})});const text=await res.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!res.ok)throw new Error('zip_gateway_http_'+res.status+':'+text.slice(0,200));if(data.error)throw new Error('zip_gateway_rpc_'+data.error.code+':'+data.error.message);return{remote:'afo-zip-gateway-v2',url,method,result:data.result}}\n`;

if (!source.includes('async function invokeZipGateway')) {
  source = source.replace('async function approvalsTableReady(env){', bridge + 'async function approvalsTableReady(env){');
}

if (!source.includes("tool.id.startsWith('zip.')")) {
  source = source.replace(
    "else if(tool.id==='orchestrator.plan')output=await planOrchestration(env,role,input);",
    "else if(tool.id.startsWith('zip.'))output=await invokeZipGateway(env,tool.id,input);\nelse if(tool.id==='orchestrator.plan')output=await planOrchestration(env,role,input);"
  );
}

if (!source.includes("startsWith('zip.')&&")) {
  source = source.replace(
    "};return schemas[name]||{type:'object',properties:{},required:[]}}",
    "};if(String(name).startsWith('zip.')&&String(name).includes('.repo.'))return{type:'object',properties:{owner:{type:'string'},repo:{type:'string'},branch:{type:'string'},path:{type:'string'},content:{type:'string'},operations:{type:'array'},files:{type:'array'},patches:{type:'array'},dry_run:{type:'boolean'},confirm_write:{type:'boolean'},message:{type:'string'}},required:[]};if(String(name).startsWith('zip.artifact.'))return{type:'object',properties:{key:{type:'string'},content:{type:'string'},content_type:{type:'string'},prefix:{type:'string'},limit:{type:'number'},session_id:{type:'string'}},required:[]};if(String(name)==='zip.receipt')return{type:'object',properties:{session_id:{type:'string'},limit:{type:'number'}},required:['session_id']};return schemas[name]||{type:'object',properties:{},required:[]}}"
  );
}

fs.writeFileSync(file, source);
console.log('Zip Gateway bridge patch applied to', file);
