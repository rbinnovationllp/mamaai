const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..');const load=Module._load,resolve=Module._resolveFilename;
Module._extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
Module._resolveFilename=function(name,parent,...args){if(name.startsWith('@/'))name=path.join(root,name.slice(2))+'.ts';if(name.startsWith('.')&&parent?.filename.endsWith('.ts')&&fs.existsSync(path.resolve(path.dirname(parent.filename),name+'.ts')))name=path.resolve(path.dirname(parent.filename),name+'.ts');return resolve.call(this,name,parent,...args)};
Module._load=function(name,parent,...args){
 if(name==='@/lib/auth/session')return{getSession:async()=>null};
 if(name==='@/lib/server/auth')return{requireUser:async()=>{throw Error('anonymous')}};
 if(name==='@/lib/server/durable-rate-limit')return{configuredPositiveInt:(_v,d)=>d,enforceDurableRateLimit:async()=>{},requestIpAddress:()=> '127.0.0.1',RateLimitExceededError:class extends Error{},RateLimitStorageError:class extends Error{}};
 if(name==='@/lib/repositories/dynamo')return{docClient:{send:()=>{throw Error('Unexpected DB access')}},TABLE_NAMES:{}};
 if(name==='@/lib/repositories/customer-profile-repository')return{CustomerProfileRepository:class{}};
 if(name==='@/lib/ai/knowledge-retriever')return{retrieveKnowledgeChunks:()=>{throw Error('Unexpected provider retrieval')}};
 if(name==='@google/generative-ai')return{GoogleGenerativeAI:class{constructor(){throw Error('Unexpected AI call')}}};
 return load.call(this,name,parent,...args);
};
const {POST}=require('../app/api/ask-mama/route.ts');
test('actual Ask MAMA route answers offered product-help suggestions without AI or customer storage',async()=>{
 for(const language of ['en','hi','kn'])for(const message of ['How does MAMAAI work?','How do I sign in?','How is my data protected?','How does Pet Meal Plan work?']){
 const response=await POST(new Request('http://localhost/api/ask-mama',{method:'POST',body:JSON.stringify({message,language})}));const body=await response.json();assert.equal(response.status,200,JSON.stringify({language,message,body}));assert.ok(body.response);assert.equal(body.unresolved,false);
 }
});
test('actual Ask MAMA route continues to reject pet-feeding requests',async()=>{const response=await POST(new Request('http://localhost/api/ask-mama',{method:'POST',body:JSON.stringify({message:'What food should I feed my dog?'})}));assert.equal(response.status,400)});
