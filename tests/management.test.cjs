const test=require('node:test'),assert=require('node:assert/strict');
const {compile}=require('../akirrai_cms_stage6_runtime');
const path=require('node:path'),root=path.resolve(__dirname,'..');
test('CMS rejects duplicate disabled ids, traversal assets, and out-of-bounds layouts',()=>{
 assert.throws(()=>compile({schemaVersion:1,items:[{id:'aa',name:'A',type:'ai',enabled:false},{id:'aa',name:'B',type:'ai'}]},root));
 assert.throws(()=>compile({schemaVersion:1,items:[{id:'aa',name:'A',type:'frame',assetUrl:'/assets/frames/../../server.js'}]},root));
 assert.throws(()=>compile({schemaVersion:1,items:[{id:'aa',name:'A',type:'ptb',assetUrl:'/assets/frames/not_here.png',layout:{width:1080,height:1080,slots:[]}}]},root));
});
test('Device credentials cannot authorize management endpoints',async()=>{
 const {member}=require('../akirrai_sepay_bridge');
 await assert.rejects(member({path:'/api/akirrai/v2/history',headers:{'x-akirrai-device-key':'a'.repeat(64)}}),e=>e.http===403);
});
test('Publish stores a full immutable revision before live pointer; rollback checks version',async()=>{
 const bridge=require('../akirrai_sepay_bridge'),orig={member:bridge.member,db:bridge.db};
 const store=new Map([['cms_draft',{value_json:{schemaVersion:1,items:[{id:'effect_a',type:'ai',name:'A',prompt:'A'}]},updated_at:'revision1'}]]),calls=[];
 bridge.member=async()=>({internal_user_id:'owner'});
 bridge.db=async(method,resource,body)=>{calls.push({method,body});if(method==='GET'){const key=decodeURIComponent(resource.match(/key=eq\.([^&]+)/)[1]);return store.has(key)?[store.get(key)]:[]}if(method==='POST'){store.set(body.key,{value_json:body.value_json,updated_at:'new'});return [body]}throw Error('Unexpected request')};
 const routes=new Map(),app={get:(u,f)=>routes.set('GET '+u,f),post:(u,f)=>routes.set('POST '+u,f)};
 delete require.cache[require.resolve('../akirrai_management')];let refresh=0;
 require('../akirrai_management').install(app,{refresh:async()=>refresh++,fallback:{}},root);
 const res={setHeader(){},status(n){this.code=n;return this},json(j){this.body=j;return this}};
 try{
  await routes.get('POST /api/akirrai/v2/cms/publish')({headers:{},body:{expected:'revision1'}},res);
  assert(res.body.version);assert.equal(refresh,1);
  const writes=calls.filter(x=>x.method==='POST');assert.match(writes[0].body.key,/^cms_version_/);assert.equal(writes[1].body.key,'cms_live');
  await routes.get('POST /api/akirrai/v2/cms/rollback')({headers:{},body:{version:'../../../etc/passwd'}},res);assert.equal(res.code,400);
 }finally{bridge.member=orig.member;bridge.db=orig.db;delete require.cache[require.resolve('../akirrai_management')]}
});
