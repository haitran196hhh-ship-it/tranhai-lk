'use strict';
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {member,db}=require('./akirrai_sepay_bridge');
const {compile}=require('./akirrai_cms_stage6_runtime');
exports.install=(app,cms,root)=>{
 const route=(method,url,admin,fn)=>app[method](url,async(req,res)=>{res.setHeader('Cache-Control','no-store');try{const u=await member(req,admin);await fn(req,res,u)}catch(e){if(!res.headersSent)res.status(e.http||(['Invalid catalog','Catalog exceeds 10 MB','Invalid CMS item','Invalid name'].includes(e.message)?400:503)).json({error:e.http||['Invalid catalog','Catalog exceeds 10 MB','Invalid CMS item','Invalid name'].includes(e.message)?e.message:'Không thể kết nối dịch vụ dữ liệu. Bản đang sửa vẫn được giữ; hãy thử lưu lại sau.'})}});
 app.get('/akirrai-captions.module',(_req,res)=>{res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','no-store');res.send(['#!name=AKIRRAI Public Captions','#!desc=Published captions only. No personal API key.','[Script]','AKIRRAI_CAPTIONS = type=http-response,pattern=^https://firebaseremoteconfig[.]googleapis[.]com/.*,requires-body=1,max-size=2097152,script-path=https://tranhai-lk.onrender.com/js/akirrai_catalog_sync.js,argument=captions-only,timeout=10','[MITM]','hostname = %APPEND% firebaseremoteconfig.googleapis.com'].join('\n'));});
 const read=async key=>(await db('GET','platform_kv_store?key=eq.'+encodeURIComponent(key)+'&select=value_json,updated_at&limit=1'))?.[0];
 const put=(key,value)=>db('POST','platform_kv_store',{key,value_json:value,updated_at:new Date().toISOString()},'resolution=merge-duplicates,return=representation');
 route('get','/api/akirrai/v2/cms/draft',true,async(_q,res)=>{const row=await read('cms_draft');res.json(row||{value_json:cms.fallback,updated_at:null})});
 route('post','/api/akirrai/v2/cms/draft',true,async(req,res)=>{
  const catalog=req.body?.catalog;compile(catalog,root,{draft:true});
  const current=await read('cms_draft');if(current&&req.body.expected!==current.updated_at)return res.status(409).json({error:'Draft changed. Reload before saving.'});
  if(current){const rows=await db('PATCH','platform_kv_store?key=eq.cms_draft&updated_at=eq.'+encodeURIComponent(current.updated_at),{value_json:catalog,updated_at:new Date().toISOString()});if(!rows?.length)return res.status(409).json({error:'Draft changed'});res.json(rows[0]);}
  else{const rows=await db('POST','platform_kv_store',{key:'cms_draft',value_json:catalog});res.json(rows[0]);}
 });
 route('post','/api/akirrai/v2/cms/publish',true,async(req,res,u)=>{
  const draft=await read('cms_draft');if(!draft||req.body.expected!==draft.updated_at)return res.status(409).json({error:'Save and reload the current draft first'});
  compile(draft.value_json,root,{publish:true});const version=crypto.randomUUID();
  await put('cms_version_'+version,{catalog:draft.value_json,version,author:u.internal_user_id,createdAt:new Date().toISOString()});
  await put('cms_live',{catalog:draft.value_json,version});await cms.refresh(true);res.json({version});
 });
 route('get','/api/akirrai/v2/cms/versions',true,async(_q,res)=>res.json({versions:await db('GET','platform_kv_store?key=like.cms_version_*&select=key,updated_at&order=updated_at.desc&limit=50')}));
 route('post','/api/akirrai/v2/cms/rollback',true,async(req,res)=>{
  const id=String(req.body.version||'');if(!/^[a-f0-9-]{36}$/.test(id))return res.status(400).json({error:'Invalid version'});
  const row=await read('cms_version_'+id);if(!row)return res.status(404).json({error:'Version missing'});
  compile(row.value_json.catalog,root);await put('cms_live',{catalog:row.value_json.catalog,version:id});await cms.refresh(true);res.json({version:id});
 });
 route('post','/api/akirrai/v2/admin/member',true,async(req,res,u)=>{
  const id=String(req.body.userId||'');if(!/^[a-f0-9-]{36}$/.test(id))return res.status(400).json({error:'Invalid account'});
  const target=(await db('GET','users?internal_user_id=eq.'+id+'&select=role&limit=1'))?.[0];
  if(!target||target.role==='SUPER_ADMIN'||id===u.internal_user_id)return res.status(403).json({error:'Protected owner account'});
  const action=req.body.action,patch=action==='approve'?{account_status:'ACTIVE',verification_status:'ADMIN_VERIFIED'}:action==='suspend'?{account_status:'SUSPENDED'}:null;
  if(!patch)return res.status(400).json({error:'Invalid action'});
  res.json(await db('PATCH','users?internal_user_id=eq.'+id,patch));
 });
 route('get','/api/akirrai/v2/history',false,async(_q,res,u)=>res.json({jobs:await db('GET','ai_jobs?user_id=eq.'+u.internal_user_id+'&select=job_id,filter_id,status,reservation_type,created_at&order=created_at.desc&limit=50'),ledger:await db('GET','credit_ledger?user_id=eq.'+u.internal_user_id+'&select=delta_credits,balance_after,reason,created_at&order=created_at.desc&limit=50')}));
 route('post','/api/akirrai/v2/device',false,async(req,res,u)=>{
  // Device keys are accepted for AI requests only; never for management routes.
  if(req.headers['x-akirrai-device-key'])return res.status(403).json({error:'Use a web login to issue a device key'});
  const token=crypto.randomBytes(32).toString('hex'),hash=crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt=new Date(Date.now()+30*86400000).toISOString();
  await put('device_'+hash,{userId:u.internal_user_id,expiresAt,revoked:false});
  const origin=String(process.env.AKIRRAI_PUBLIC_URL||'https://tranhai-lk.onrender.com');
  if(!/^https:\/\/[a-z0-9.-]+$/.test(origin))throw Error('Invalid public URL');
  const moduleText=['#!name=AKIRRAI Authenticated AI','# Keep this personal module private. Expires '+expiresAt,'[Script]', 'AKIRRAI_AI = type=http-request,pattern=^https:\\/\\/(?:us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com|gateway\\.locketcamera\\.com|tranhai-lk\\.onrender\\.com)\\/(?:api\\/)?generateFilteredImage,requires-body=1,max-size=-1,script-path='+origin+'/js/akirrai_authenticated.js,argument='+token+',timeout=120','AKIRRAI_CMS = type=http-response,pattern=^https://firebaseremoteconfig[.]googleapis[.]com/.*,requires-body=1,max-size=2097152,script-path='+origin+'/js/akirrai_catalog_sync.js,timeout=10','[MITM]','hostname = %APPEND% firebaseremoteconfig.googleapis.com, api.locketcamera.com, gateway.locketcamera.com, us-central1-locket-4252a.cloudfunctions.net, tranhai-lk.onrender.com'].join('\n');
  res.json({deviceId:hash,expiresAt,module:moduleText,shadowrocketModule:moduleText});
 });
 route('post','/api/akirrai/v2/device/revoke',false,async(req,res,u)=>{
  if(req.headers['x-akirrai-device-key'])return res.status(403).json({error:'Use web login'});
  const hash=String(req.body.deviceId||'');if(!/^[a-f0-9]{64}$/.test(hash))return res.status(400).json({error:'Invalid device'});
  const row=await read('device_'+hash);if(!row||row.value_json.userId!==u.internal_user_id)return res.status(404).json({error:'Device missing'});
  await put('device_'+hash,{...row.value_json,revoked:true});res.json({revoked:true});
 });
 app.post('/api/akirrai/v2/auth/login',async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  try{
   const email=String(req.body?.email||''),password=String(req.body?.password||'');
   if(!email.includes('@')||email.length>250||password.length<8||password.length>250)return res.status(400).json({error:'Invalid login'});
   const r=await fetch(process.env.SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:process.env.SUPABASE_SECRET_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(15000)});
   if(!r.ok)return res.status(401).json({error:'Invalid login'});
   const j=await r.json();let pending=false;
   try{await member({headers:{authorization:'Bearer '+j.access_token}})}catch(e){if(e.http===403)pending=true;else throw e}
   res.json({accessToken:j.access_token,expiresIn:j.expires_in,pendingApproval:pending});
  }catch(_){res.status(503).json({error:'Login service unavailable'})}
 });
 app.get('/akirrai-manage',(_q,res)=>res.sendFile(path.join(root,'public/akirrai-manage.html')));
};
