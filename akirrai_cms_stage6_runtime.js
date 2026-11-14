'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function compile(catalog,root){
 if(catalog?.schemaVersion!==1||!Array.isArray(catalog.items)||catalog.items.length>500)throw Error('Invalid catalog');
 if(Buffer.byteLength(JSON.stringify(catalog))>10000000)throw Error('Catalog exceeds 10 MB');
 const seen=new Set();
 const map=new Map(),base=fs.realpathSync(path.join(root,'assets'))+path.sep;
 for(const source of catalog.items){
  const i=JSON.parse(JSON.stringify(source));
  if(!/^[a-z0-9][a-z0-9_-]{1,59}$/.test(i.id)||seen.has(i.id)||!['frame','ptb','sticker','caption','color','ai'].includes(i.type))throw Error('Invalid CMS item');
  seen.add(i.id);
  if(typeof i.name!=='string'||i.name.length>160)throw Error('Invalid name');
  if(['frame','ptb','sticker'].includes(i.type)){
   if(i.assetBase64){
    if(!/^[A-Za-z0-9+/=]+$/.test(i.assetBase64)||i.assetBase64.length>7000000)throw Error('Invalid asset');
    const buf=Buffer.from(i.assetBase64,'base64');
    const png=buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpg=buf[0]===255&&buf[1]===216&&buf[2]===255;
    const webp=buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP';
    if(!png&&!jpg&&!webp)throw Error('Use PNG, JPEG or WebP');
    i.assetUrl='/assets/frames/cms_'+crypto.createHash('sha256').update(buf).digest('hex')+'.'+(png?'png':jpg?'jpg':'webp');
    const dest=path.join(root,i.assetUrl.slice(1));fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.writeFileSync(dest,buf);
   }
   if(!/^\/assets\/(frames|stickers)\/[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(i.assetUrl||''))throw Error('Invalid asset URL');
   const f=path.join(root,i.assetUrl.slice(1));if(!fs.existsSync(f)||!fs.realpathSync(f).startsWith(base))throw Error('Missing asset');i._asset=f;
  }
  if(i.type==='ptb'){
   const l=i.layout;if(l?.width!==1080||l?.height!==1080||![2,3,4].includes(l?.slots?.length))throw Error('Invalid layout');
   for(const s of l.slots)if(!['left','top','width','height'].every(k=>Number.isInteger(s[k]))||s.left<0||s.top<0||s.width<1||s.height<1||s.left+s.width>1080||s.top+s.height>1080)throw Error('Invalid slot');
  }
  if(i.prompt&&String(i.prompt).length>3500)throw Error('Prompt too long');
  if(i.enabled!==false)map.set(i.id,i);
 }
 return map;
}
exports.compile=compile;
exports.install=(app,root)=>{
 const fallback=JSON.parse(fs.readFileSync(path.join(root,'data/cms_catalog.json'),'utf8'));
 let map=compile(fallback,root),revision='bundled',last=0,pending=null;
 async function refresh(force=false){
  if(!process.env.SUPABASE_SECRET_KEY)return;
  if(pending)return pending;if(!force&&Date.now()-last<5000)return;
  pending=(async()=>{const db=require('./akirrai_sepay_bridge').db;const rows=await db('GET','platform_kv_store?key=eq.cms_live&select=value_json&limit=1');
   const live=rows?.[0]?.value_json;if(live&&live.version!==revision){const next=compile(live.catalog,root);map=next;revision=live.version;}last=Date.now();
  })().finally(()=>pending=null);return pending;
 }
 app.use(async(req,res,next)=>{if(req.path.startsWith('/api/akirrai/catalog')||req.path.includes('generateFilteredImage')){try{await refresh()}catch(_){return res.status(503).json({error:'CMS synchronization unavailable'});}}next();});
 app.get('/api/akirrai/catalog',(_q,res)=>{res.setHeader('Cache-Control','no-store');res.json({schemaVersion:1,version:revision,count:map.size,items:[...map.values()].map(({id,type,name,assetUrl,layout,color,value})=>({id,type,name,assetUrl,layout,color,value}))});});
 app.get('/api/akirrai/cms-health',(_q,res)=>res.json({ok:true,count:map.size,version:revision}));
 const get=id=>map.get(String(id||'').toLowerCase());
 return {has:(id,t)=>get(id)?.type===t,layout:id=>get(id)?.layout||null,prompt:id=>get(id)?.type==='ai'?String(get(id).prompt||''):'',asset:id=>get(id)?._asset||null,get count(){return map.size},refresh,fallback};
};
