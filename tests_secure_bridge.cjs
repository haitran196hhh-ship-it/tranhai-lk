const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const bridge=require('./akirrai_sepay_bridge');
(async()=>{
await assert.rejects(bridge.member({headers:{'x-user-id':'tranhai307'}}),e=>e.http===401);
process.env.SEPAY_WEBHOOK_SECRET='a'.repeat(40);
const raw=Buffer.from('{"id":123}');const ts=String(Math.floor(Date.now()/1000));
const sig='sha256='+crypto.createHmac('sha256',process.env.SEPAY_WEBHOOK_SECRET).update(ts+'.').update(raw).digest('hex');
assert(bridge.validSignature({'x-sepay-timestamp':ts,'x-sepay-signature':sig},raw));
assert(!bridge.validSignature({'x-sepay-timestamp':ts,'x-sepay-signature':sig},Buffer.from('{}')));
assert(!bridge.validSignature({'x-sepay-timestamp':'1','x-sepay-signature':sig},raw));
console.log('PASS: forged UID rejected; valid signature accepted; tampering and replay timestamp rejected');
})().catch(e=>{console.error(e);process.exitCode=1});
