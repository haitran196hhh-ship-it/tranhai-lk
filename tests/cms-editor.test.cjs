const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {compile}=require('../akirrai_cms_stage6_runtime'),sync=require('../js/akirrai_catalog_sync'),root=path.resolve(__dirname,'..');
test('unfinished frame can be saved; publishing gives its ID and a 400 error',()=>{
 const c={schemaVersion:1,items:[{id:'unfinished_ptb',name:'Draft',type:'ptb'}]};
 assert.equal(compile(c,root,{draft:true}).size,0);
 assert.throws(()=>compile(c,root,{publish:true}),e=>e.http===400&&e.message.includes('unfinished_ptb'));
 c.items[0].enabled=false;assert.equal(compile(c,root,{publish:true}).size,0);
});
test('blank AI is publish validation only; existing runtime remains compatible',()=>{
 const c={schemaVersion:1,items:[{id:'empty_ai',name:'AI',type:'ai',prompt:''}]};
 assert.equal(compile(c,root).size,1);assert.throws(()=>compile(c,root,{publish:true}),e=>e.http===400);
});
test('public caption synchronization works without camera config and leaves camera data untouched',()=>{
 const b={entries:{camera_filter_config:'unchanged',overlay_items:'[]'}};
 sync(b,{schemaVersion:1,items:[{id:'hello',type:'caption',value:'Xin chào',color:'#123456'}]},true);
 assert.equal(b.entries.camera_filter_config,'unchanged');assert.equal(JSON.parse(b.entries.overlay_items)[0].items[0].caption.text,'Xin chào');
 const noCamera={entries:{}};sync(noCamera,{schemaVersion:1,items:[]},true);assert.equal(noCamera.entries.camera_filter_config,undefined);
});
