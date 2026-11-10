/**
 * Meitu XiuXiu & Wink VIP Unlocker (Clean Version)
 * Author: TranHai307
 */
let body = $response.body;
if (body) {
  try {
    let obj = JSON.parse(body);
    if (obj.data) {
      obj.data.is_vip = true;
      obj.data.vip_type = 1;
      obj.data.sub_biz_type = 1;
      obj.data.expire_time = 4092599349000;
      obj.data.valid_time = 4092599349000;
    }
    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    $done({});
  }
} else {
  $done({});
}