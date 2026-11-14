// Personal module key is supplied by the user's private module argument.
(function(){
 const token=String(typeof $argument==='undefined'?'':$argument).trim();
 if(!/^[a-f0-9]{64}$/.test(token)){$done({response:{status:401,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'Create a personal module at /akirrai-manage'})}});return;}
 const key='module_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)+'_'+Math.random().toString(36).slice(2);
 $httpClient.post({url:'https://tranhai-lk.onrender.com/api/generateFilteredImage',headers:{'Content-Type':'application/json','X-Akirrai-Device-Key':token,'Idempotency-Key':key},body:$request.body,timeout:110},function(err,resp,data){
  if(err){$done({response:{status:503,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'AI server unavailable; check history before retrying'})}});return;}
  $done({response:{status:resp.status||resp.statusCode||503,headers:{'Content-Type':'application/json'},body:data||'{}'}});
 });
})();
