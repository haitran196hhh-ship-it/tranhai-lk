// Only adds the owner's published CMS entries; leaves other service settings unchanged.
(function(root){
 function transform(body,catalog,captionsOnly){
  if(!body||!body.entries||!catalog||catalog.schemaVersion!==1||!Array.isArray(catalog.items))throw Error('Unsupported config');
  var entries=body.entries, raw=entries.camera_filter_config;
  if(!captionsOnly&&typeof raw!=='string')throw Error('Unsupported camera config');
  var config=captionsOnly?{}:JSON.parse(raw),previous=config.akirraiCmsIds||[];
  var items=catalog.items.filter(function(i){return ['ai','ptb','frame','sticker'].indexOf(i.type)>=0;});
  var ids=items.map(function(i){return i.id;});
  function keep(id){return previous.indexOf(id)<0&&ids.indexOf(id)<0;}
  var filters=items.map(function(i){var url=i.assetUrl?'https://tranhai-lk.onrender.com'+i.assetUrl:null;return {uid:i.id,id:i.id,name:i.name,prompt:i.id,type:'normal',style:'cutout',filterType:'cutout',imageUrl:url,iconUrl:url,icon:{url:url,sfSymbol:i.type==='ptb'?'square.grid.2x2':'sparkles'},referenceImages:[],colors:['#3864DB','#18223A'],captureButtonColors:['#3864DB','#18223A'],textColor:'#FFFFFF'};});
  ['remoteFilters','remote_filters','filters'].forEach(function(k){config[k]=(Array.isArray(config[k])?config[k]:[]).filter(function(i){return keep(i.id||i.uid);}).concat(filters);});
  ['pickerFilters','picker_filters'].forEach(function(k){config[k]=(Array.isArray(config[k])?config[k]:[]).filter(keep).concat(ids);});
  ['filterGroups','filter_groups'].forEach(function(k){config[k]=(Array.isArray(config[k])?config[k]:[]).filter(function(g){return g.id!=='akirrai_cms';}).concat([{id:'akirrai_cms',title:{vi:'AKIRRAI',en:'AKIRRAI'},filterIds:ids,filter_ids:ids}]);});
  config.akirraiCmsIds=ids;config.akirraiCmsVersion=catalog.version;
  if(!captionsOnly)entries.camera_filter_config=JSON.stringify(config);
  var overlays=JSON.parse(entries.overlay_items||'[]');if(!Array.isArray(overlays))throw Error('Unsupported captions');
  var captions=catalog.items.filter(function(i){return i.type==='caption'&&typeof i.value==='string';}).map(function(i){return {overlay_id:'caption:akirrai_'+i.id,source:'remote',caption:{type:'static_content',text:i.value,max_lines:3,text_color:'#FFFFFF',background:{colors:[/^#[0-9a-f]{6}$/i.test(i.color)?i.color:'#3864DB']}}};});
  entries.overlay_items=JSON.stringify(overlays.filter(function(s){return s.section!=='AKIRRAI CMS';}).concat([{section:'AKIRRAI CMS',items:captions}]));
  return body;
 }
 if(typeof module!=='undefined'&&module.exports){module.exports=transform;return;}
 var done=false;function finish(value){if(!done){done=true;$done(value);}}
 var timer=setTimeout(function(){finish({});},8000);
 $httpClient.get({url:'https://tranhai-lk.onrender.com/api/akirrai/catalog',timeout:7},function(error,response,data){
  clearTimeout(timer);if(error||!response||Number(response.status||response.statusCode)!==200){finish({});return;}
  try{finish({body:JSON.stringify(transform(JSON.parse($response.body),JSON.parse(data),typeof $argument!=='undefined'&&$argument==='captions-only'))});}catch(e){finish({});}
 });
})(this);
