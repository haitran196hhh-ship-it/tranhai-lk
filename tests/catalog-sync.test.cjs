const test=require('node:test'),assert=require('node:assert/strict'),sync=require('../js/akirrai_catalog_sync');
test('CMS adds filters and captions without changing entitlements; replaces deleted CMS entries',()=>{
 const original={entries:{feature_gates:'unchanged',camera_filter_config:JSON.stringify({remoteFilters:[{id:'native'}],pickerFilters:['native']}),overlay_items:'[]'}};
 const catalog={schemaVersion:1,version:'v1',items:[{id:'my_ai',name:'AI',type:'ai'},{id:'my_cap',name:'Caption',type:'caption',value:'Hello'}]};
 sync(original,catalog);sync(original,catalog);
 assert.equal(JSON.parse(original.entries.camera_filter_config).remoteFilters.length,2);
 assert.equal(JSON.parse(original.entries.overlay_items)[0].items[0].caption.text,'Hello');
 assert.equal(original.entries.feature_gates,'unchanged');
 sync(original,{schemaVersion:1,version:'v2',items:[]});
 assert.deepEqual(JSON.parse(original.entries.camera_filter_config).remoteFilters,[{id:'native'}]);
});
test('unsupported config fails without fabricating schema',()=>assert.throws(()=>sync({entries:{}},{schemaVersion:1,items:[]})));
