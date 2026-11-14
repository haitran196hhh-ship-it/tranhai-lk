"use strict";

const crypto = require("node:crypto");
const path = require("node:path");

const env = n => String(process.env[n] || "").trim();
const enabled = () => env("AKIRRAI_SECURE_PAYMENTS") === "1";

function equal(a,b) {
  const x=Buffer.from(String(a||""));
  const y=Buffer.from(String(b||""));
  return x.length===y.length && x.length>0 &&
    crypto.timingSafeEqual(x,y);
}

function answer(res,code,data) {
  return res.status(code).set("Cache-Control","no-store").json(data);
}

function guarded(fn) {
  return (req,res) => Promise.resolve()
    .then(() => fn(req,res))
    .catch(error => {
      console.error("SePay:",String(error.message).slice(0,100));
      if (!res.headersSent)
        answer(res,error.http||503,{
          error:error.http?error.message:"Service unavailable"
        });
    });
}

async function db(method,resource,body,prefer="return=representation") {
  const url=env("SUPABASE_URL");
  const key=env("SUPABASE_SECRET_KEY");

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) ||
      !key.startsWith("sb_secret_"))
    throw Error("Supabase ENV missing");

  const response=await fetch(url+"/rest/v1/"+resource,{
    method,
    headers:{
      apikey:key,
      Accept:"application/json",
      ...(body?{
        "Content-Type":"application/json",
        Prefer:prefer
      }:{})
    },
    body:body?JSON.stringify(body):undefined,
    signal:AbortSignal.timeout(15000)
  });

  const text=await response.text();
  let data;

  try {data=text?JSON.parse(text):null}
  catch {throw Error("Invalid database response")}

  if (!response.ok)
    throw Error("Supabase HTTP "+response.status);

  return data;
}

async function member(req,admin=false) {
  if (!admin && req.headers['x-akirrai-device-key']) {
    if(!/^\/(api\/)?generateFilteredImage$/.test(req.path||''))throw Object.assign(Error('Device key only supports image processing'),{http:403});
    const raw=String(req.headers['x-akirrai-device-key']);
    if(!/^[a-f0-9]{64}$/.test(raw))throw Object.assign(Error('Invalid device key'),{http:401});
    const hash=crypto.createHash('sha256').update(raw).digest('hex');
    const records=await db('GET','platform_kv_store?key=eq.device_'+hash+'&select=value_json&limit=1');
    const device=records?.[0]?.value_json;
    if(!device||device.revoked||Date.parse(device.expiresAt)<Date.now())throw Object.assign(Error('Device key expired or revoked'),{http:401});
    const rows=await db('GET','users?internal_user_id=eq.'+encodeURIComponent(device.userId)+'&select=internal_user_id,provider_uid,role,account_status,verification_status&limit=1');
    const u=rows?.[0];if(!u||u.account_status!=='ACTIVE'||u.verification_status!=='ADMIN_VERIFIED')throw Object.assign(Error('Account inactive'),{http:403});return u;
  }
  const match=/^Bearer ([^\s]+)$/.exec(
    String(req.headers.authorization||"")
  );

  if (!match || match[1].length>8192)
    throw Object.assign(Error("Login required"),{http:401});

  const response=await fetch(
    env("SUPABASE_URL")+"/auth/v1/user",{
      headers:{
        apikey:env("SUPABASE_SECRET_KEY"),
        Authorization:"Bearer "+match[1]
      },
      signal:AbortSignal.timeout(15000)
    }
  );

  if (!response.ok)
    throw Object.assign(Error("Invalid session"),{http:401});

  const auth=await response.json();

  if (!/^[0-9a-f-]{36}$/i.test(auth.id||""))
    throw Error("Invalid Auth account");

  const rows=await db(
    "GET",
    "users?auth_user_id=eq."+encodeURIComponent(auth.id)+
    "&select=internal_user_id,provider_uid,role,verification_status,account_status&limit=1"
  );

  let u=rows?.[0];
  // Bootstrap only a confirmed Supabase identity belonging to the configured owner.
  if (!u && auth.email_confirmed_at && env("AKIRRAI_ADMIN_EMAIL") &&
      String(auth.email||"").toLowerCase()===env("AKIRRAI_ADMIN_EMAIL").toLowerCase()) {
    const created=await db("POST","users",{
      auth_user_id:auth.id,provider_uid:"auth:"+auth.id,
      role:"SUPER_ADMIN",is_unlimited:true,
      account_status:"ACTIVE",verification_status:"ADMIN_VERIFIED"
    });
    u=created?.[0];
  }

  if(!u && auth.email_confirmed_at){
    const created=await db('POST','users',{auth_user_id:auth.id,provider_uid:'auth:'+auth.id});u=created?.[0];
  }
  if (!u || u.account_status!=="ACTIVE" ||
      u.verification_status!=="ADMIN_VERIFIED")
    throw Object.assign(Error("Unverified account"),{http:403});

  if (admin && !["ADMIN","SUPER_ADMIN"].includes(u.role))
    throw Object.assign(Error("Admin only"),{http:403});

  return u;
}

function validSignature(headers,raw) {
  const secret=env("SEPAY_WEBHOOK_SECRET");
  const ts=String(headers["x-sepay-timestamp"]||"");
  const sig=String(headers["x-sepay-signature"]||"");

  if (secret.length<32 || !Buffer.isBuffer(raw) ||
      !/^\d{10}$/.test(ts) ||
      Math.abs(Date.now()/1000-Number(ts))>300)
    return false;

  const expected="sha256="+crypto
    .createHmac("sha256",secret)
    .update(ts+".")
    .update(raw)
    .digest("hex");

  return equal(sig,expected);
}

const normalize=v=>String(v||"")
  .replace(/[\s.\-]/g,"")
  .toUpperCase();

function installWebhook(app,express) {
  // MUST run before express.json()
  app.post(
    "/api/akirrai/sepay/webhook",
    express.raw({type:"application/json",limit:"64kb"}),
    guarded(async(req,res)=>{
      if (!enabled())
        return answer(res,503,{success:false});

      if (!validSignature(req.headers,req.body))
        return answer(res,401,{success:false});

      let x;
      try {x=JSON.parse(req.body.toString("utf8"))}
      catch {return answer(res,400,{success:false})}

      const id=Number(x.id);
      const amount=Number(x.transferAmount);
      const acct=normalize(x.accountNumber);
      const expected=normalize(env("SEPAY_ACCOUNT_NUMBER"));

      const content=String(
        x.code||x.content||x.description||""
      ).toUpperCase();

      const ref=content.match(
        /(?:^|[^A-Z0-9])(AKR[A-F0-9]{16})(?=$|[^A-Z0-9])/
      )?.[1];

      if (!Number.isSafeInteger(id) || id<1 ||
          x.transferType!=="in" ||
          !Number.isSafeInteger(amount) || amount<=0 ||
          !expected || acct!==expected || !ref) {
        return answer(res,201,{
          success:true,ignored:true
        });
      }

      await db("POST","rpc/akirrai_sepay_apply_webhook",{
        p_sepay_id:id,
        p_reference:ref,
        p_amount:amount,
        p_account:acct,
        p_expected_account:expected,
        p_payload:x
      });

      return answer(res,201,{success:true});
    })
  );
}

function packages() {
  let p;
  try {
    p=JSON.parse(env("AKIRRAI_PACKAGES_JSON")||"{}");
  } catch {
    throw Error("Invalid packages JSON");
  }
  return p && typeof p==="object" &&
    !Array.isArray(p)?p:{};
}

function installRoutes(app) {
  app.get('/api/akirrai/v2/account',guarded(async(req,res)=>{
    const u=await member(req);
    const rows=await db('GET','users?internal_user_id=eq.'+u.internal_user_id+'&select=role,paid_credits_balance,total_images_created');
    return answer(res,200,rows[0]);
  }));
  app.get('/api/akirrai/v2/admin/users',guarded(async(req,res)=>{
    await member(req,true);
    return answer(res,200,{users:await db('GET','users?select=internal_user_id,provider_uid,role,account_status,verification_status,paid_credits_balance&limit=100')});
  }));
  app.get('/api/akirrai/v2/packages',(_req,res)=>answer(res,200,{packages:packages(),enabled:enabled()}));
  app.get('/akirrai',(_req,res)=>res.sendFile(path.join(__dirname,'public','akirrai.html')));

  // Disable legacy payment mutations in secure mode
  app.use([
    "/api/payment",
    "/api/admin",
    "/api/user/quota"
  ],(req,res,next)=>{
    return answer(res,410,{
        error:"Legacy payment disabled"
      });
  });

  app.get("/api/akirrai/v2/payments/health",(_req,res)=>
    answer(res,200,{
      installed:true,
      paymentsEnabled:enabled()
    })
  );

  app.post(
    "/api/akirrai/v2/payments/create",
    guarded(async(req,res)=>{
      if (!enabled())
        return answer(res,503,{error:"Payments disabled"});

      const u=await member(req);
      const id=String(req.body?.packageId||"");
      const p=packages()[id];

      if (!/^[a-z0-9_-]{2,40}$/i.test(id) ||
          !p ||
          !Number.isSafeInteger(p.amount_vnd) ||
          p.amount_vnd<100 ||
          p.amount_vnd>100000000 ||
          !Number.isSafeInteger(p.credits) ||
          p.credits<1 || p.credits>10000)
        return answer(res,400,{error:"Invalid package"});

      const bank=env("SEPAY_BANK_CODE");
      const account=normalize(env("SEPAY_ACCOUNT_NUMBER"));

      if (!/^[A-Z0-9]{2,20}$/i.test(bank) ||
          !/^\d{6,24}$/.test(account))
        throw Error("Bank ENV missing");

      const ref="AKR"+
        crypto.randomBytes(8).toString("hex").toUpperCase();

      const order="ord_"+
        crypto.randomUUID().replace(/-/g,"");

      const expiresAt=new Date(
        Date.now()+30*60000
      ).toISOString();

      await db("POST","payment_orders",{
        order_id:order,
        user_id:u.internal_user_id,
        provider_uid:u.provider_uid,
        package_id:id,
        amount_vnd:p.amount_vnd,
        credits:p.credits,
        payment_reference:ref,
        status:"PENDING",
        expires_at:expiresAt
      });

      const qr=
        "https://img.vietqr.io/image/"+
        encodeURIComponent(bank)+"-"+
        encodeURIComponent(account)+
        "-compact2.png?amount="+p.amount_vnd+
        "&addInfo="+ref+
        "&accountName="+
        encodeURIComponent(env("SEPAY_ACCOUNT_NAME"));

      return answer(res,201,{
        orderId:order,
        reference:ref,
        amountVnd:p.amount_vnd,
        credits:p.credits,
        expiresAt,
        qrImageUrl:qr
      });
    })
  );

  app.get(
    "/api/akirrai/v2/payments/status/:reference",
    guarded(async(req,res)=>{
      if (!enabled())
        return answer(res,503,{error:"Payments disabled"});

      const u=await member(req);
      const ref=String(req.params.reference||"")
        .toUpperCase();

      if (!/^AKR[A-F0-9]{16}$/.test(ref))
        return answer(res,400,{error:"Invalid reference"});

      const rows=await db(
        "GET",
        "payment_orders?payment_reference=eq."+ref+
        "&user_id=eq."+
        encodeURIComponent(u.internal_user_id)+
        "&select=order_id,status,amount_vnd,credits,paid_at,expires_at&limit=1"
      );

      return rows?.length
        ?answer(res,200,rows[0])
        :answer(res,404,{error:"Order not found"});
    })
  );

  app.get(
    "/api/akirrai/v2/admin/orders",
    guarded(async(req,res)=>{
      await member(req,true);

      const orders=await db(
        "GET",
        "payment_orders?select=order_id,payment_reference,status,amount_vnd,credits,created_at,paid_at&order=created_at.desc&limit=100"
      );

      return answer(res,200,{orders});
    })
  );

  app.post(
    "/api/akirrai/v2/admin/login",
    guarded(async(req,res)=>{
      const email=String(req.body?.email||"");
      const password=String(req.body?.password||"");

      if (!email.includes("@") || email.length>250 ||
          password.length<8 || password.length>250)
        return answer(res,400,{error:"Invalid login"});

      const r=await fetch(
        env("SUPABASE_URL")+
        "/auth/v1/token?grant_type=password",{
          method:"POST",
          headers:{
            apikey:env("SUPABASE_SECRET_KEY"),
            "Content-Type":"application/json"
          },
          body:JSON.stringify({email,password}),
          signal:AbortSignal.timeout(12000)
        }
      );

      if (!r.ok)
        return answer(res,401,{error:"Invalid login"});

      const j=await r.json();

      await member({
        headers:{
          authorization:"Bearer "+j.access_token
        }
      },true);

      return answer(res,200,{
        accessToken:j.access_token,
        expiresIn:j.expires_in
      });
    })
  );

  app.get("/akirrai-admin-v2",(_req,res)=>{
    res.sendFile(
      path.join(__dirname,"public","akirrai-admin-v2.html")
    );
  });
}

module.exports={installWebhook,installRoutes,member,db,validSignature};
