const test=require('node:test'),assert=require('node:assert/strict'),sync=require('../js/akirrai_catalog_sync');
const cat=items=>({schemaVersion:1,version:'test',items});
const filters=b=>JSON.parse(b.entries.camera_filter_config).remoteFilters;
const captions=b=>JSON.parse(b.entries.overlay_items).flatMap(s=>s.items);
test('legacy catalog survives; CMS adds and updates without duplicates; deletion restores baseline',()=>{
 const b={entries:{feature_gates:'unchanged',camera_filter_config:JSON.stringify({remoteFilters:[{id:'native',name:'Original'}]}),overlay_items:'[]'}};
 sync(b,cat([]));assert.equal(filters(b).length,112);assert.equal(captions(b).length,156);
 const original=filters(b).find(x=>x.id!=='native');const id=original.id;
 const items=[{id,name:'Updated',type:'ai'},{id:'new_cms',name:'New',type:'ptb'},{id:'new_caption',type:'caption',value:'Hello'}];
 sync(b,cat(items));sync(b,cat(items));assert.equal(filters(b).length,113);assert.equal(filters(b).find(x=>x.id===id).name,'Updated');assert.equal(captions(b).length,157);assert.equal(b.entries.feature_gates,'unchanged');
 sync(b,cat([]));assert.equal(filters(b).length,112);assert.deepEqual(filters(b).find(x=>x.id===id),original);assert.equal(captions(b).length,156);
});
test('caption IDs replace legacy caption and restore original after deletion',()=>{
 const b={entries:{}};sync(b,cat([]));const original=captions(b).find(x=>x.source==='remote');const id=original.overlay_id.slice(8);
 sync(b,cat([{id,type:'caption',value:'Changed'}]));assert.equal(captions(b).filter(x=>x.overlay_id===original.overlay_id).length,1);assert.equal(captions(b).find(x=>x.overlay_id===original.overlay_id).caption.text,'Changed');
 sync(b,cat([]));assert.deepEqual(captions(b).find(x=>x.overlay_id===original.overlay_id),original);
});
test('disabled CMS items are excluded and native entries remain',()=>{const b={entries:{}};sync(b,cat([{id:'hidden',type:'ai',name:'Hidden',enabled:false}]));assert(!filters(b).some(x=>x.id==='hidden'));});
