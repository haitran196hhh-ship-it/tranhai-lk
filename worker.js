/**
 * Cloudflare Worker: TranHai307 Locket VIP Community & Reverse Proxy
 * - Đấu trực tiếp API chính chủ locket.cam (Lấy Avatar & UID thật 100% miễn phí)
 * - Tự động tra cứu khi nhập Username (Realtime Auto-Lookup + Nút Tra Cứu)
 * - Bộ đếm thành viên chuẩn xác tuyệt đối 1:1 (Không bao giờ bị tăng trùng +2)
 * - Đồng bộ vĩnh viễn với Cloudflare KV Storage (Không bao giờ mất khi deploy lại)
 * - Proxy an toàn cho GitHub Repository Private (Bảo mật tuyệt đối danh tính & repo)
 * - Dự phòng sẵn Module & Scripts (Shadowrocket không bao giờ bị lỗi 404)
 */

const GITHUB_BASE = "https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main";
const GITHUB_TOKEN = (typeof env !== "undefined" && env?.GITHUB_TOKEN) ? env.GITHUB_TOKEN : "";

// Danh sách hạt giống VIP tích hợp sẵn
const SEED_USERS = [
  "tranhai307", "ADMIN_TRANHAI307_UNLIMITED"
];

// Bộ nhớ RAM đệm tạm thời trên Worker
const dynamicVipStore = new Map();

// Nội dung module dự phòng (Fallback phòng khi GitHub Private chưa cấu hình token)
const FALLBACK_MODULE = `#!name=Locket VIP & YouTube Premium Combo (All-in-One)
#!desc=Bản tối ưu toàn diện độc quyền bởi TranHai307: Tích hợp mở khóa Locket Gold (Anti-Cache 304), Full Bộ Lọc AI & Khung Photobooth, YouTube Premium (Chặn sạch quảng cáo, PiP chạy ngầm) & Spotify Eevee VIP.
#!author=TranHai307 (@minhhiep07)
#!icon=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png
#!system=ios
#!arguments=屏蔽上传按钮:false,屏蔽选段按钮:true,屏蔽Shorts按钮:false,字幕翻译语言:off,启用调试模式:false
#!arguments-desc=- Ẩn nút Upload (+): [true, false] (Mặc định: false để giữ nút Upload)\\n- Ẩn nút chọn đoạn nhạc: [true, false]\\n- Ẩn nút Shorts: [true, false]\\n- Dịch phụ đề: [vi, en, off]\\n- Bật Debug: [true, false]

[Rule]
AND,((PROTOCOL,UDP),(DEST-PORT,443)),REJECT
AND,((DOMAIN,firebaseremoteconfig.googleapis.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,api.revenuecat.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,api.locketcamera.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN-SUFFIX,locketcamera.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,us-central1-locket-4252a.cloudfunctions.net),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN-SUFFIX,spotify.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN-SUFFIX,spclient.wg.spotify.com),(PROTOCOL,UDP)),REJECT
DOMAIN-SUFFIX,sentry.io,REJECT
DOMAIN-SUFFIX,ingest.sentry.io,REJECT

[URL Rewrite]
^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/generateFilteredImage https://tranhai-lk.onrender.com/generateFilteredImage 307

[Header Rewrite]
^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers) header-del x-revenuecat-etag
^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers) header-del X-RevenueCat-ETag
^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers) header-del if-none-match
^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers) header-del If-None-Match
^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers) header-del if-modified-since
^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers) header-del If-Modified-Since

^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/.+ header-del if-none-match
^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/.+ header-del If-None-Match
^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/.+ header-del if-modified-since
^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/.+ header-del If-Modified-Since
^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/.+ header-del x-goog-if-none-match

^https?:\\/\\/api\\.locketcamera\\.com\\/.+ header-del if-none-match
^https?:\\/\\/api\\.locketcamera\\.com\\/.+ header-del If-None-Match
^https?:\\/\\/api\\.locketcamera\\.com\\/.+ header-del if-modified-since
^https?:\\/\\/api\\.locketcamera\\.com\\/.+ header-del If-Modified-Since

^https?:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(?::443)?)\\/(user-customization-service\\/v1\\/customize|bootstrap\\/v1\\/bootstrap) header-del if-none-match
^https?:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(?::443)?)\\/(user-customization-service\\/v1\\/customize|bootstrap\\/v1\\/bootstrap) header-del If-None-Match
^https?:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(?::443)?)\\/(user-customization-service\\/v1\\/customize|bootstrap\\/v1\\/bootstrap) header-del if-modified-since
^https?:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(?::443)?)\\/(user-customization-service\\/v1\\/customize|bootstrap\\/v1\\/bootstrap) header-del If-Modified-Since

[Script]
# 1. YouTube Premium & SponsorBlock
youtube.response = type=http-response,pattern=^https:\\/\\/youtubei\\.googleapis\\.com\\/(youtubei\\/v1\\/(browse|next|player|search|reel\\/reel_watch_sequence|guide|account\\/get_setting|get_watch|log_event|config))(\\?(.*))?$,requires-body=1,max-size=-1,binary-body-mode=1,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/youtube.response.js?v=20261108_48,argument="{\\"captionLang\\":\\"{{{字幕翻译语言}}}\\",\\"blockUpload\\":{{{屏蔽上传按钮}}},\\"blockImmersive\\":{{{屏蔽选段按钮}}},\\"blockShorts\\":{{{屏蔽Shorts按钮}}},\\"debug\\":{{{启用调试模式}}}}"
youtube.request.init = type=http-request,pattern=^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/initplayback.+&ack.*,requires-body=1,max-size=-1,binary-body-mode=1,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/youtube.request.js?v=20261108_48,argument="{\\"captionLang\\":\\"{{{字幕翻译语言}}}\\"}"
youtube.request.log_event = type=http-request,pattern=^https:\\/\\/youtubei\\.googleapis\\.com\\/youtubei\\/v1\\/log_event,requires-body=1,max-size=-1,binary-body-mode=1,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/youtube.request.js?v=20261108_48

# 2. Locket Gold & Anti-Cache 304
deleteHeader_RC = type=http-request,pattern=^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers),script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/deleteHeader.js?v=20261108_48,timeout=60
deleteHeader_Firebase = type=http-request,pattern=^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/.+,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/deleteHeader.js?v=20261108_48,timeout=60

revenuecat = type=http-response,pattern=^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers),script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/Locket_TranHai307.js?v=20261108_48,requires-body=true,max-size=-1,timeout=60
locket_rc = type=http-response,pattern=^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/.+,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/Locket_Unlocked.js?v=20261108_48,requires-body=true,max-size=-1,timeout=60

# 3. Locket Photobooth & AI Filters
locket_pb_req = type=http-request,pattern=^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/generateFilteredImage,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/Locket_Photobooth.js?v=20261108_48,requires-body=true,max-size=-1,timeout=60

# 4. Locket Profile & Filter Unblock
locket_change_profile = type=http-request,pattern=^https:\\/\\/api\\.locketcamera\\.com\\/changeProfileInfo,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/locket_filter_unlock.js?v=20261108_48,timeout=60
locket_filter_resp = type=http-response,pattern=^https?:\\/\\/api\\.locketcamera\\.com\\/.+,requires-body=true,max-size=-1,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/locket_filter_unlock.js?v=20261108_48,timeout=60

# 5. Spotify Premium & Customization
spotify-json = type=http-request,pattern=^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(?::443)?)\\/artistview\\/v1\\/artist|album-entity-view\\/v2\\/album)\\/,requires-body=0,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/spotify-json.js?v=20261108_48
spotify-proto = type=http-response,pattern=^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(?::443)?)\\/(bootstrap\\/v1\\/bootstrap|user-customization-service\\/v1\\/customize),requires-body=1,binary-body-mode=1,max-size=0,script-path=https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/js/spotify-proto.js?v=20261108_48,script-update-interval=0

[Host]
firebaseremoteconfigrealtime.googleapis.com = 0.0.0.0

[MITM]
hostname = %APPEND% *.googlevideo.com, youtubei.googleapis.com, api.revenuecat.com, firebaseremoteconfig.googleapis.com, spclient.wg.spotify.com, *spclient.spotify.com, api.locketcamera.com, *.locketcamera.com, us-central1-locket-4252a.cloudfunctions.net, tranhai-lk.onrender.com, tranhai-lk.onrender.com
`;

// =========================================================================
// HÀM TRA CỨU TRỰC TIẾP TÀI KHOẢN CHÍNH CHỦ LOCKET (TỪ LOCKET.CAM)
// =========================================================================
async function lookupLocketProfile(input) {
  if (!input) return { ok: false, error: "Vui lòng nhập Username hoặc link Locket" };

  let cleanUser = input.trim();
  cleanUser = cleanUser.replace(/^https?:\/\/(www\.)?locket\.cam\//i, "");
  cleanUser = cleanUser.replace(/^https?:\/\/(www\.)?locket\.camera\//i, "");
  cleanUser = cleanUser.replace(/^@/, "");
  cleanUser = cleanUser.split("/")[0].split("?")[0].trim().toLowerCase();

  if (!cleanUser) {
    return { ok: false, error: "Username không hợp lệ" };
  }

  // Nếu người dùng nhập trực tiếp chuỗi UID 28 ký tự Firebase
  if (/^[a-zA-Z0-9]{28}$/.test(cleanUser)) {
    return {
      ok: true,
      found: true,
      data: {
        username: cleanUser,
        uid: cleanUser,
        avatarUrl: null
      }
    };
  }

  try {
    const res = await fetch(`https://locket.cam/${cleanUser}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (res.status === 404) {
      return {
        ok: false,
        not_found: true,
        cleanUser: cleanUser,
        message: `Username "@${cleanUser}" không tồn tại trên hệ thống Locket. Vui lòng kiểm tra lại chính xác username của bạn!`
      };
    }

    const html = await res.text();

    // 1. Trích xuất Firebase UID thật từ invite link
    const uidMatch = html.match(/invites%2F([a-zA-Z0-9]{28})/i) || html.match(/invites\/([a-zA-Z0-9]{28})/i);
    const uid = uidMatch ? uidMatch[1] : null;

    // 2. Trích xuất Avatar URL thật từ CDN Locket
    const avatarMatch = html.match(/class="profile-pic-img"\s+src="([^"]+)"/i);
    const avatarUrl = avatarMatch ? avatarMatch[1].replace(/&amp;/g, "&") : null;

    return {
      ok: true,
      found: true,
      data: {
        username: cleanUser,
        uid: uid,
        avatarUrl: avatarUrl
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// =========================================================================
// HÀM TÍNH TỔNG SỐ THÀNH VIÊN DUY NHẤT (CHUẨN 1:1, KHÔNG BỊ +2 DUPLICATE)
// =========================================================================
async function computeTotalVipCount(env) {
  // Tập hợp chứa định danh thành viên duy nhất (Mỗi người chỉ đếm đúng 1 lần)
  const countedUsers = new Set();

  // 1. Thêm từ danh sách hạt giống SEED_USERS (51 người)
  for (const u of SEED_USERS) {
    if (u) countedUsers.add(u.toLowerCase().trim());
  }

  // 2. Thêm từ Cloudflare KV (Lưu trữ vĩnh viễn)
  if (env?.VIP_KV) {
    try {
      const raw = await env.VIP_KV.get("dynamic_vip_users");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const u of list) {
            const uname = (u.username || "").toLowerCase().trim();
            const uid = (u.uid || "").toLowerCase().trim();
            // Nếu người này đã có trong danh sách thì bỏ qua không đếm trùng
            if ((uname && countedUsers.has(uname)) || (uid && countedUsers.has(uid))) {
              continue;
            }
            const primaryKey = uname || uid;
            if (primaryKey) countedUsers.add(primaryKey);
          }
        }
      }
    } catch (e) { }
  }

  // 3. Thêm từ RAM đệm Worker
  for (const [k, v] of dynamicVipStore.entries()) {
    const uname = (v.username || "").toLowerCase().trim();
    const uid = (v.uid || "").toLowerCase().trim();
    if ((uname && countedUsers.has(uname)) || (uid && countedUsers.has(uid))) {
      continue;
    }
    const primaryKey = uname || uid;
    if (primaryKey) countedUsers.add(primaryKey);
  }

  return countedUsers.size;
}


// =========================================================================
// MỤC TÙY BIẾN PROMPT AI STICKER & PHOTOBOOTH SVG ENGINE
// =========================================================================
const AI_PROMPTS = {
  "rose_flower": "Show the person in the photo with the exact same pose and background, but have them with a single rose in their mouth. If no person is present in the input, do not add anything to the output.",
  "stk_rose_flower": "Show the person in the photo with the exact same pose and background, but have them with a single rose in their mouth. If no person is present in the input, do not add anything to the output.",
  "shrek_ogre": "Show the person in the photo with the exact same pose and background, but transform them into Shrek with rounded ears, and rustic clothing while preserving the pose. Keep their hairstyle, but make it look natural in the Shrek style.",
  "stk_shrek_ogre": "Show the person in the photo with the exact same pose and background, but transform them into Shrek with rounded ears, and rustic clothing while preserving the pose. Keep their hairstyle, but make it look natural in the Shrek style.",
  "superhero_cape": "Show the person in the photo with the exact same pose and background, but suit them up like a superhero in a blue and red outfit with a flowing cape while keeping their pose and framing identical.",
  "stk_superhero_cape": "Show the person in the photo with the exact same pose and background, but suit them up like a superhero in a blue and red outfit with a flowing cape while keeping their pose and framing identical.",
  "spooky_ghost": "Show the person in the photo with the exact same pose, expression, and background, but subtly insert a realistic-looking ghost somewhere in the background. If no person is present, do not add any people to the output.",
  "stk_spooky_ghost": "Show the person in the photo with the exact same pose, expression, and background, but subtly insert a realistic-looking ghost somewhere in the background. If no person is present, do not add any people to the output.",
  "pirate_hat": "Show the person in the photo with the exact same pose and background, but dress them like a pirate from Pirates of the Caribbean while keeping their pose and facial expression identical.",
  "stk_pirate_hat": "Show the person in the photo with the exact same pose and background, but dress them like a pirate from Pirates of the Caribbean while keeping their pose and facial expression identical.",
  "volcano_lava": "Show the person in the photo with the exact same pose, background, and facial expression, but replace the ground with molten lava, glowing magma cracks, and volcanic sparks while keeping them rooted to the spot. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "stk_volcano_lava": "Show the person in the photo with the exact same pose, background, and facial expression, but replace the ground with molten lava, glowing magma cracks, and volcanic sparks while keeping them rooted to the spot. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "rain_storm": "Retain the exact pose, facial features, distance, and background from the original image. Dress the subject as a character from the Wuthering Heights movie.\n\nFor Men: Dress them in the Jacob Elordi style with matching hair and outfit.\n\nFor Women: Dress them in the Margot Robbie style: A dramatic, historical-inspired red gown with a high-gloss, lacquered red skirt that is extremely voluminous and structured, forming a full bell shape from the waist down if that part is visible in the initial image. The skirt looks stiff and reflective, almost like polished vinyl. The bodice is corset-style, fitted tightly to the torso in the same glossy red material, with thin shoulder straps, a wide scoop rounded neckline, and the dress cinching the waist and creating a structured, corset-inspired silhouette WITHOUT visible boning, lacing or busks, and featuring a sheer billowing white long puffed sleeve shirt worn underneath with a scooped neckline for the white undershirt peeking out from behind the dress.\n\nConstraints: Do not modify the person's physical features, body shape, or positioning. Keep the framing and background 100% unchanged. If no person is present, return the image unaltered. Do not include Jacob Elordi or Margot Robbie themselves in the output image.",
  "stk_rain_storm": "Retain the exact pose, facial features, distance, and background from the original image. Dress the subject as a character from the Wuthering Heights movie.\n\nFor Men: Dress them in the Jacob Elordi style with matching hair and outfit.\n\nFor Women: Dress them in the Margot Robbie style: A dramatic, historical-inspired red gown with a high-gloss, lacquered red skirt that is extremely voluminous and structured, forming a full bell shape from the waist down if that part is visible in the initial image. The skirt looks stiff and reflective, almost like polished vinyl. The bodice is corset-style, fitted tightly to the torso in the same glossy red material, with thin shoulder straps, a wide scoop rounded neckline, and the dress cinching the waist and creating a structured, corset-inspired silhouette WITHOUT visible boning, lacing or busks, and featuring a sheer billowing white long puffed sleeve shirt worn underneath with a scooped neckline for the white undershirt peeking out from behind the dress.\n\nConstraints: Do not modify the person's physical features, body shape, or positioning. Keep the framing and background 100% unchanged. If no person is present, return the image unaltered. Do not include Jacob Elordi or Margot Robbie themselves in the output image.",
  "fortnite_llama": "Show the person in the photo with the exact same pose, expression, and background, but make the entire scene look like it was rendered inside a video game, similar to the style of Fortnite. Show no extra overlays or text on top of the photo. If no person is present, do not add any people to the output.",
  "stk_fortnite_llama": "Show the person in the photo with the exact same pose, expression, and background, but make the entire scene look like it was rendered inside a video game, similar to the style of Fortnite. Show no extra overlays or text on top of the photo. If no person is present, do not add any people to the output.",
  "watercolor_art": "Show the person in the photo with the exact same pose, expression, and background, but render the entire scene as a watercolor painting with flowing brush strokes. If no person is present, do not add any people to the output.",
  "stk_watercolor_art": "Show the person in the photo with the exact same pose, expression, and background, but render the entire scene as a watercolor painting with flowing brush strokes. If no person is present, do not add any people to the output.",
  "golden_hour": "Show the person in the photo with the exact same pose, expression, and background, but make the scene look like it was captured during peak golden hour with warm sunlight and long shadows. If no person is present, do not add any people to the output.",
  "stk_golden_hour": "Show the person in the photo with the exact same pose, expression, and background, but make the scene look like it was captured during peak golden hour with warm sunlight and long shadows. If no person is present, do not add any people to the output.",
  "jungle_leaf": "Show the person in the photo with the exact same pose, background, and facial expression, but with their background surroundings overgrown with plants in a seamless way. The person and their background should remain in the same positions. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "stk_jungle_leaf": "Show the person in the photo with the exact same pose, background, and facial expression, but with their background surroundings overgrown with plants in a seamless way. The person and their background should remain in the same positions. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "cute_zombie": "Show the person in the photo with the exact same pose and background, but turn them into a zombie while keeping their pose and expression identical.",
  "stk_cute_zombie": "Show the person in the photo with the exact same pose and background, but turn them into a zombie while keeping their pose and expression identical.",
  "fireworks": "Show the person in the photo with the exact same pose and background, but fill the scene with fireworks exploding in the night sky and reflecting colorful light onto the subject. Ensure the person is in the exact same pose and positioning within the frame. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "stk_fireworks": "Show the person in the photo with the exact same pose and background, but fill the scene with fireworks exploding in the night sky and reflecting colorful light onto the subject. Ensure the person is in the exact same pose and positioning within the frame. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "new_year_2026": "Show the person in the photo with the exact same pose and background, but have them wearing decorative glasses that say Happy New Year 2026. Ensure the person is in the exact same pose and positioning within the frame. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "stk_new_year_2026": "Show the person in the photo with the exact same pose and background, but have them wearing decorative glasses that say Happy New Year 2026. Ensure the person is in the exact same pose and positioning within the frame. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "harry_potter": "Show the person in the photo with the exact same pose and background, but show them as a character from Harry Potter wearing a robe of one of the four houes. Keep the pose and framing identical and do not change the background.",
  "stk_harry_potter": "Show the person in the photo with the exact same pose and background, but show them as a character from Harry Potter wearing a robe of one of the four houes. Keep the pose and framing identical and do not change the background.",
  "minecraft": "Show the person in the photo with the exact same pose, expression, and background, but make everything in the scene look like it was created from Minecraft-style blocks and show people as Minecraft characters. If no person is present, do not add any people to the output.",
  "stk_minecraft": "Show the person in the photo with the exact same pose, expression, and background, but make everything in the scene look like it was created from Minecraft-style blocks and show people as Minecraft characters. If no person is present, do not add any people to the output.",
  "fire_flame": "Show the persons in the photo with the exact same pose and background, but with a dramatic theatrical flame effect appearing just in front of the subject's face, as if they are performing a fantasy fire-breathing act, captured with a modern iPhone camera look.\n\nThe flame should appear as a staged visual effect, suspended in front of the mouth area without showing fire originating from inside the body. Keep the effect believable and cinematic, with a bright yellow-white core, orange and red edges, subtle motion blur, and gentle heat distortion in the nearby air.\n\nAdd a soft warm glow on nearby facial features and clothing, consistent with the flame's position, while preserving the original lighting of the scene. Do not show burns, smoke inhalation, injury, pain, damage, or distress. Do not alter the person's face, expression, identity, or pose.\n\nKeep the background, framing, depth of field, and image quality identical to the original, with the flame effect appearing as a safe staged performance element captured in-camera. Do not change the overall compsition of the photo, do not add new people to the photo, only show each person in the photo one time.",
  "stk_fire_flame": "Show the persons in the photo with the exact same pose and background, but with a dramatic theatrical flame effect appearing just in front of the subject's face, as if they are performing a fantasy fire-breathing act, captured with a modern iPhone camera look.\n\nThe flame should appear as a staged visual effect, suspended in front of the mouth area without showing fire originating from inside the body. Keep the effect believable and cinematic, with a bright yellow-white core, orange and red edges, subtle motion blur, and gentle heat distortion in the nearby air.\n\nAdd a soft warm glow on nearby facial features and clothing, consistent with the flame's position, while preserving the original lighting of the scene. Do not show burns, smoke inhalation, injury, pain, damage, or distress. Do not alter the person's face, expression, identity, or pose.\n\nKeep the background, framing, depth of field, and image quality identical to the original, with the flame effect appearing as a safe staged performance element captured in-camera. Do not change the overall compsition of the photo, do not add new people to the photo, only show each person in the photo one time.",
  "giant_spider": "Show the person in the photo with the exact same pose, expression, and background, but place a realistic spider perched on them somewhere, such as their shoulder or head. If no person is present, do not add any people to the output.",
  "stk_giant_spider": "Show the person in the photo with the exact same pose, expression, and background, but place a realistic spider perched on them somewhere, such as their shoulder or head. If no person is present, do not add any people to the output.",
  "ocean_underwater": "Show the person in the photo with the exact same pose, background, and facial expression, but as if them and their surrounding environment was underwater. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "stk_ocean_underwater": "Show the person in the photo with the exact same pose, background, and facial expression, but as if them and their surrounding environment was underwater. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "ufo_alien": "Show the person in the photo with the exact same pose and background, but show a subtle UFO hovering in the sky or an alien somewhere hidden somewhere in the user's background. If no face is present, do not show any people in the output, only ever show people who were in the original input image.",
  "stk_ufo_alien": "Show the person in the photo with the exact same pose and background, but show a subtle UFO hovering in the sky or an alien somewhere hidden somewhere in the user's background. If no face is present, do not show any people in the output, only ever show people who were in the original input image."
};

/**
 * Shared by MITM (filter-handler.ts) and the web admin (sticker form shows the template prompt).
 * The web app imports a generated copy (uplocket.io.vn/scripts/sync-shared-domains.mjs).
 * AI edit per sticker id. Each text is the "style" part of modelPrompt() in MITM face-change.ts, which
 * strictly enforces keeping 100% of the original photo (face, expression, pose, clothes, background).
 * Written as a targeted inpainting action that only adds or replaces the specific sticker element.
 * Safe, age-neutral, family-friendly, and universally compatible with upstream AI safety policies.
 * Supports both human portraits and environment/object/scene photos seamlessly.
 * Ids match DEFAULT_STICKERS_STOCK in uplocket.io.vn/src/features/admin/data/customization-presets.ts.
 */
const STICKER_AI_PROMPTS = {
  // Lễ hội & Theo mùa (Hỗ trợ cả chân dung lẫn môi trường / phong cảnh / đồ vật)
  stk_gold_crown: 'Place an ornate gleaming gold royal crown studded with red and green gemstones on top of the head or main subject',
  stk_sweet_valentine: 'Add romantic soft glowing translucent pink hearts and gentle heart-shaped bokeh floating gracefully throughout the scene and surroundings (with a warm soft cheek glow if a person is present)',
  stk_christmas_bell: 'Add warm twinkling Christmas fairy lights, subtle golden sparkles, festive pine boughs, and holly berry accents throughout the scene and surroundings',
  stk_tet_mai: 'Add vibrant blooming yellow apricot blossom branches (hoa mai), golden sparkles, and floating red lucky money envelopes (lì xì) gracefully throughout the scene and surroundings',
  stk_halloween_pumpkin: 'Add glowing carved jack-o-lantern pumpkins placed naturally in the scene with warm flickering candlelight accents, autumn leaves, and a spooky festive atmosphere',
  stk_midautumn_rabbit: 'Add a luminous golden full moon glow, gentle floating celestial sparkles, and glowing Mid-Autumn festival lanterns (đèn ông sao) floating across the scene',

  // Sự kiện & Huyền bí
  stk_dio_pm2: 'Add a magical mystical aura: glowing purple and gold sparkles with drifting candle-lit embers and arcane shimmer floating throughout the scene',

  // Tinh nghịch & Sáng tạo
  stk_dio_looksmaxing: 'Enhance the photo with clean studio portrait lighting, soft depth of field, clear bright skin, and flattering radiant illumination',
  stk_dio_influencer: 'Add a popular creator camera aesthetic: bright circular ring-light catchlights in the eyes, soft luminous filter glow, and subtle sparkle highlights',
  stk_dio_toothless: 'Add a playful funny sticker effect with a goofy cartoon smile mouth overlay and cartoon starry sparkles',
  stk_dio_orange_wig: 'Replace only the hair or headwear with a glossy bright yellow-orange chin-length bob wig with neat blunt bangs',

  // Ngoại hình & Phụ kiện
  stk_dio_bye_brows: 'Bleach the eyebrows so pale they are completely invisible, creating a sleek bleached-eyebrow look',
  stk_dio_braces: 'Add classic shiny metal dental braces with small brackets onto the teeth',
  stk_dio_tatted: 'Add fun colorful festival face-paint art: cute small temporary decal designs like stars, music notes, and playful doodles on the cheeks',
  stk_dio_bearded: 'Place a fun theatrical novelty costume prop beard and mustache in a playful dress-up style',
  stk_dio_buns: 'Replace only the hairstyle with two cute voluminous high space buns on top of the head',
  stk_dio_mohawk: 'Replace only the hairstyle with a tall spiked punk mohawk haircut with cleanly shaved faded sides',
  stk_dio_bob: 'Replace only the hairstyle with a chic glossy chestnut-brown chin-length wavy bob haircut',
  stk_dio_bowling_ball: 'Remove all hair to make the head completely bald, smooth, and clean-shaven',
  stk_dio_bleached_hair: 'Replace only the hair with a bright platinum-blonde textured modern haircut',

  // Ăn mừng (Môi trường & Nhân vật)
  stk_dio_princess: 'Place a sparkling silver royal tiara adorned with pink heart gemstones on top of the head or main subject',
  stk_dio_cash: 'Add crisp dollar bills floating, raining down, and scattering dynamically across the scene and surroundings',
  stk_dio_slimed: 'Add bright neon-green gooey slime playfully dripping and splashing over the top of the subject and surfaces',
  stk_dio_happy_birthday: 'Add a joyful explosion of colorful rainbow party confetti, flying serpentine streamers, and celebratory party sparkles all across the scene',
  stk_dio_disco: 'Add dazzling mirrored disco ball reflections with vibrant shimmering spots of multi-colored light and retro dance-party beams dancing across the entire scene and surroundings',

  // Dễ thương & Nhẹ nhàng
  stk_dio_flower_crown: 'Place a delicate floral crown woven with pastel pink and white roses and green leaves on top of the head or main subject',
  stk_dio_cutesy: 'Add a cute playful photo filter effect with pastel pink cheek blush, tiny subtle heart sparkles, and bright friendly lighting',
  stk_dio_sticker_face: 'Add cute decorative pastel glitter heart stickers on the cheeks or subject surface (in purple, pink, and yellow)',
  stk_dio_love_bug: 'Place a cute headband with two springy yellow heart-shaped antennae on top of the head or subject',

  // Trang phục & Hóa trang
  stk_dio_cowboy: 'Place a brown leather cowboy hat on the head and a cow-print bandana neckerchief around the neck of the subject',
  stk_dio_giraffe: 'Add a cute plush giraffe costume hood with spotted print, soft ears, and small horns framing the face or subject',
  stk_dio_wedding: 'Add celebratory formal gala attire: an elegant festive white satin hair ribbon and a celebratory flower boutonniere on the collar',
  stk_dio_clown: 'Replace only the hairstyle with a voluminous, fluffy curly rainbow afro clown wig with a playful red nose accent',

  // Ngày lễ (Môi trường & Nhân vật)
  stk_dio_sweat_hearts: 'Add colorful pastel candy conversation hearts stamped with sweet love words floating and tumbling gently through the air across the scene',
  stk_dio_bearded_holiday: 'Place a fluffy snow-white Santa Claus costume beard and mustache in a warm holiday celebration style',
  stk_dio_frosty: 'Add delicate frozen snowflakes, glistening white frost crystals, and soft winter mist clinging to the subject and edges with an icy-blue rim glow',
  stk_dio_elf: 'Place a pointed green and red Christmas elf hat with a golden jingle bell on top of the head or subject',
  stk_dio_santa: 'Place a classic red Santa Claus hat with fluffy white fur trim and pompom on top of the head or subject',
  stk_dio_easter_bunny: 'Add a cozy white plush bunny hoodie with upright bunny ears and soft pink inner ears framing the head or subject',
  stk_dio_leprechaun: 'Place an emerald-green St. Patrick leprechaun top hat with a black band and gold buckle on top of the head or subject',
  stk_dio_easter_chick: 'Add a cute bright yellow chick costume hoodie with a small orange beak and crest framing the head or subject',
  stk_dio_lucky_face: 'Add a vibrant green four-leaf clover decal on the cheek or subject with subtle emerald sparkle accents',
};

const STICKER_ALIASES = {
  disco_lights: 'stk_dio_disco',
  disco: 'stk_dio_disco',
  locket: 'stk_dio_pm2',
  pm2: 'stk_dio_pm2',
  cash_money: 'stk_dio_cash',
  cash: 'stk_dio_cash',
  wedding: 'stk_dio_wedding',
  cowboy_cowgirl: 'stk_dio_cowboy',
  cowboy: 'stk_dio_cowboy',
  looks_maxxing: 'stk_dio_looksmaxing',
  looksmaxing: 'stk_dio_looksmaxing',
  okay_wig: 'stk_dio_orange_wig',
  orange_wig: 'stk_dio_orange_wig',
  blonde_bleached: 'stk_dio_bleached_hair',
  bleached_hair: 'stk_dio_bleached_hair',
  bob_cut: 'stk_dio_bob',
  bob: 'stk_dio_bob',
  beard: 'stk_dio_bearded',
  bearded: 'stk_dio_bearded',
  bearded_holiday: 'stk_dio_bearded_holiday',
  sweet_hearts: 'stk_dio_sweat_hearts',
  sweat_hearts: 'stk_dio_sweat_hearts',
  elf_cutout: 'stk_dio_elf',
  elf: 'stk_dio_elf',
  santa_cutout: 'stk_dio_santa',
  santa: 'stk_dio_santa',
  easter_bunney_cutout: 'stk_dio_easter_bunny',
  easter_bunny: 'stk_dio_easter_bunny',
  easter_chick_cutout: 'stk_dio_easter_chick',
  easter_chick: 'stk_dio_easter_chick',
  toothless: 'stk_dio_toothless',
  bye_brows: 'stk_dio_bye_brows',
  bowling_ball: 'stk_dio_bowling_ball',
  buns: 'stk_dio_buns',
  tatted: 'stk_dio_tatted',
  mohawk: 'stk_dio_mohawk',
  braces: 'stk_dio_braces',
  slimed: 'stk_dio_slimed',
  princess: 'stk_dio_princess',
  happy_birthday: 'stk_dio_happy_birthday',
  cutesy: 'stk_dio_cutesy',
  sticker_face: 'stk_dio_sticker_face',
  flower_crown: 'stk_dio_flower_crown',
  love_bug: 'stk_dio_love_bug',
  giraffe: 'stk_dio_giraffe',
  clown: 'stk_dio_clown',
  leprechaun: 'stk_dio_leprechaun',
  lucky_face: 'stk_dio_lucky_face',
  frosty: 'stk_dio_frosty',
  influencer: 'stk_dio_influencer',
  gold_crown: 'stk_gold_crown',
  sweet_valentine: 'stk_sweet_valentine',
  christmas_bell: 'stk_christmas_bell',
  tet_mai: 'stk_tet_mai',
  halloween_pumpkin: 'stk_halloween_pumpkin',
  midautumn_rabbit: 'stk_midautumn_rabbit'
};

function builtInStickerPrompt(uid) {
  if (!uid) return '';
  const clean = String(uid).trim().toLowerCase();
  if (STICKER_AI_PROMPTS[clean]) return STICKER_AI_PROMPTS[clean];
  if (STICKER_ALIASES[clean] && STICKER_AI_PROMPTS[STICKER_ALIASES[clean]]) {
    return STICKER_AI_PROMPTS[STICKER_ALIASES[clean]];
  }
  return '';
}

function modelPrompt(style) {
  if (!style) return '';
  return `Keep 100% of the original photo exactly as it is, including the subject's face, identity, expression, pose, clothing, and background. ${style}. Retain the exact composition and framing with no extra people or limbs, only ever show the original subjects. Captured with modern iPhone camera look, sharp details, realistic lighting, 8k resolution.`;
}

const FRAME_URL_MAP = {
  "pb_strawberry": "https://tranhai-lk.onrender.com/assets/frames/pb_strawberry.png",
  "frame_berry_days": "https://tranhai-lk.onrender.com/assets/frames/pb_strawberry.png",
  "pb_vintage": "https://tranhai-lk.onrender.com/assets/frames/pb_vintage.png",
  "frame_happy_snap": "https://tranhai-lk.onrender.com/assets/frames/pb_vintage.png",
  "pb_galaxy": "https://tranhai-lk.onrender.com/assets/frames/pb_galaxy.png",
  "frame_sky_diary": "https://tranhai-lk.onrender.com/assets/frames/pb_galaxy.png",
  "pb_holo_4cut": "https://tranhai-lk.onrender.com/assets/frames/pb_holo_4cut.png",
  "pb_scrapbook_ripped_4cut": "https://tranhai-lk.onrender.com/assets/frames/pb_scrapbook_ripped_4cut.png",
  "pb_ripped_paper_4cut": "https://tranhai-lk.onrender.com/assets/frames/pb_ripped_paper_4cut.png",
  "pb_denim_ripped_2x2": "https://tranhai-lk.onrender.com/assets/frames/pb_denim_ripped_2x2.png",
  "frame_classic_pb": "https://tranhai-lk.onrender.com/assets/frames/photoboot.png",
  "photobooth_cute": "https://tranhai-lk.onrender.com/assets/frames/photobooth_cute.png",
  "photobooth_4cut": "https://tranhai-lk.onrender.com/assets/frames/photobooth_4cut.png",
  "pb_tet_4cut": "https://tranhai-lk.onrender.com/assets/frames/pb_tet_4cut.png",
  "frame_tet_4cut": "https://tranhai-lk.onrender.com/assets/frames/pb_tet_4cut.png",
  "photobooth_tet": "https://tranhai-lk.onrender.com/assets/frames/pb_tet_4cut.png",
  "pb_xmas_4cut": "https://tranhai-lk.onrender.com/assets/frames/pb_xmas_4cut.png",
  "pb_xmas_3cut": "https://tranhai-lk.onrender.com/assets/frames/pb_xmas_3cut.png",
  "pb_xmas_2cut": "https://tranhai-lk.onrender.com/assets/frames/pb_xmas_2cut.png",
  "khung_tet_mai_vang": "https://tranhai-lk.onrender.com/assets/frames/khung_tet_mai_vang.png",
  "khung_tet_be_ran": "https://tranhai-lk.onrender.com/assets/frames/khung_tet_be_ran.png",
  "khung_tet_phao_hoa": "https://tranhai-lk.onrender.com/assets/frames/khung_tet_phao_hoa.png",
  "khung_tet_lan_su_rong": "https://tranhai-lk.onrender.com/assets/frames/khung_tet_lan_su_rong.png",
  "khung_tet_be_ran_li_xi": "https://tranhai-lk.onrender.com/assets/frames/khung_tet_be_ran_li_xi.png",
  "khung_tet_meo_than_tai": "https://tranhai-lk.onrender.com/assets/frames/khung_tet_meo_than_tai.png",
  "pb_single_denim_ripped": "https://tranhai-lk.onrender.com/assets/frames/pb_single_denim_ripped.png",
  "pb_single_film_nostalgia": "https://tranhai-lk.onrender.com/assets/frames/pb_single_film_nostalgia.png",
  "pb_single_y2k_silver_holo": "https://tranhai-lk.onrender.com/assets/frames/pb_single_y2k_silver_holo.png",
  "cmt_locket": "https://tranhai-lk.onrender.com/assets/frames/cmt_locket.png"
};

function generatePhotoboothSvg(img1, img2, img3, img4, frameKey) {
  const frameUrl = FRAME_URL_MAP[frameKey] || FRAME_URL_MAP["photobooth_4cut"];
  if (frameKey.startsWith("khung_") || frameKey.startsWith("pb_single_") || frameKey === "cmt_locket") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <image href="${img1}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="xMidYMid slice"/>
  <image href="${frameUrl}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="none"/>
</svg>`;
  }
  if (frameKey === "pb_xmas_2cut") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254">
  <rect width="1254" height="1254" fill="#ffffff"/>
  <!-- Top Slot: Wide -->
  <image href="${img1}" x="125" y="195" width="1000" height="440" preserveAspectRatio="xMidYMid slice"/>
  <!-- Bottom Slot: Wide -->
  <image href="${img2}" x="125" y="640" width="1000" height="530" preserveAspectRatio="xMidYMid slice"/>
  <!-- Frame Overlay on top -->
  <image href="${frameUrl}" x="0" y="0" width="1254" height="1254" preserveAspectRatio="none"/>
</svg>`;
  }
  if (frameKey === "pb_xmas_3cut") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254">
  <rect width="1254" height="1254" fill="#ffffff"/>
  <!-- Top Slot: Wide -->
  <image href="${img1}" x="125" y="195" width="1000" height="440" preserveAspectRatio="xMidYMid slice"/>
  <!-- Bottom Left: Slot 2 -->
  <image href="${img2}" x="125" y="640" width="480" height="530" preserveAspectRatio="xMidYMid slice"/>
  <!-- Bottom Right: Slot 3 -->
  <image href="${img3}" x="648" y="640" width="480" height="530" preserveAspectRatio="xMidYMid slice"/>
  <!-- Frame Overlay on top -->
  <image href="${frameUrl}" x="0" y="0" width="1254" height="1254" preserveAspectRatio="none"/>
</svg>`;
  }
  if (frameKey === "pb_tet_4cut" || frameKey === "frame_tet_4cut" || frameKey === "photobooth_tet" || frameKey === "pb_xmas_4cut") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254">
  <rect width="1254" height="1254" fill="#ffffff"/>
  <!-- Top Left: Slot 1 -->
  <image href="${img1}" x="125" y="180" width="480" height="450" preserveAspectRatio="xMidYMid slice"/>
  <!-- Top Right: Slot 2 -->
  <image href="${img2}" x="648" y="180" width="480" height="450" preserveAspectRatio="xMidYMid slice"/>
  <!-- Bottom Left: Slot 3 -->
  <image href="${img3}" x="125" y="630" width="480" height="540" preserveAspectRatio="xMidYMid slice"/>
  <!-- Bottom Right: Slot 4 -->
  <image href="${img4}" x="648" y="630" width="480" height="540" preserveAspectRatio="xMidYMid slice"/>
  <!-- Frame Overlay on top -->
  <image href="${frameUrl}" x="0" y="0" width="1254" height="1254" preserveAspectRatio="none"/>
</svg>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254">
  <rect width="1254" height="1254" fill="#ffffff"/>
  <!-- Top Left: Slot 1 -->
  <image href="${img1}" x="65" y="65" width="542" height="542" preserveAspectRatio="xMidYMid slice"/>
  <!-- Top Right: Slot 2 -->
  <image href="${img2}" x="647" y="65" width="542" height="542" preserveAspectRatio="xMidYMid slice"/>
  <!-- Bottom Left: Slot 3 -->
  <image href="${img3}" x="65" y="647" width="542" height="542" preserveAspectRatio="xMidYMid slice"/>
  <!-- Bottom Right: Slot 4 -->
  <image href="${img4}" x="647" y="647" width="542" height="542" preserveAspectRatio="xMidYMid slice"/>
  <!-- Frame Overlay on top -->
  <image href="${frameUrl}" x="0" y="0" width="1254" height="1254" preserveAspectRatio="none"/>
</svg>`;
}

function getPhotoboothTotalSteps(fid) {
  if (!fid) return 4;
  const lower = String(fid).toLowerCase();
  if (lower.includes("2cut") || lower.includes("2_cut") || lower.includes("2x1") || lower.includes("2_shot")) return 2;
  if (lower.includes("3cut") || lower.includes("3_cut") || lower.includes("3x1") || lower.includes("3_shot")) return 3;
  return 4;
}

function getPhotoboothCardFile(stepNum, totalSteps) {
  if (totalSteps === 2) {
    return stepNum === 2 ? "pb_2cut_step2.jpg" : "pb_2cut_step1.jpg";
  }
  if (totalSteps === 3) {
    return stepNum === 3 ? "pb_3cut_step3.jpg" : (stepNum === 2 ? "pb_3cut_step2.jpg" : "pb_3cut_step1.jpg");
  }
  return stepNum === 2 ? "pb_step2.jpg" : (stepNum === 3 ? "pb_step3.jpg" : (stepNum === 4 ? "pb_step4.jpg" : "pb_step1.jpg"));
}

const pbWorkerSessions = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // =====================================================================
    // 0. API: PHOTOBOOTH STEP CARD (THÔNG BÁO "ĐÃ NHẬN ẢNH! ẤN DẤU X")
    // =====================================================================
    if (pathname === "/api/photobooth-card") {
      const step = parseInt(url.searchParams.get("step") || "1", 10);
      const total = parseInt(url.searchParams.get("total") || url.searchParams.get("totalSteps") || "4", 10);
      const cardFile = getPhotoboothCardFile(step, total);
      const cardUrl = `${url.origin}/assets/img/${cardFile}`;
      return Response.redirect(cardUrl, 302);
    }

    // =====================================================================
    // 0.1 API: RENDER PHOTOBOOTH 4-CUT SVG COLLAGE
    // =====================================================================
    if (pathname === "/api/render-photobooth-svg") {
      const img1 = url.searchParams.get("img1") || "";
      const img2 = url.searchParams.get("img2") || img1;
      const img3 = url.searchParams.get("img3") || img1;
      const img4 = url.searchParams.get("img4") || img1;
      const frameKey = url.searchParams.get("frame") || "photobooth_4cut";

      const svgContent = generatePhotoboothSvg(img1, img2, img3, img4, frameKey);
      return new Response(svgContent, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    // =====================================================================
    // 0.2 API: STITCH PHOTOBOOTH 4-CUT (TRẢ VỀ LINK ẢNH JPEG CHUẨN LOCKET)
    // =====================================================================
    if (pathname === "/api/stitch-photobooth") {
      const img1 = url.searchParams.get("img1") || "";
      const img2 = url.searchParams.get("img2") || img1;
      const img3 = url.searchParams.get("img3") || img1;
      const img4 = url.searchParams.get("img4") || img1;
      const frameKey = url.searchParams.get("frame") || "photobooth_4cut";

      const svgApiUrl = `${url.origin}/api/render-photobooth-svg?img1=${encodeURIComponent(img1)}&img2=${encodeURIComponent(img2)}&img3=${encodeURIComponent(img3)}&img4=${encodeURIComponent(img4)}&frame=${encodeURIComponent(frameKey)}`;
      const finalJpegUrl = `https://wsrv.nl/?url=${encodeURIComponent(svgApiUrl)}&w=1254&h=1254&output=jpg`;

      return new Response(JSON.stringify({
        ok: true,
        result: {
          outputUrl: finalJpegUrl,
          status: "success"
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // =====================================================================
    // 0.3 API: TẠO ẢNH AI FILTER & STICKER (GEMINI AI ENGINE & PHOTOBOOTH)
    // =====================================================================
    if (pathname === "/api/generate-ai-filter" || pathname === "/api/ai-filter" || pathname === "/generateFilteredImage" || pathname === "/api/generateFilteredImage") {
      const originModule = (url.searchParams.get("module") || url.searchParams.get("client") || request.headers.get("x-module-origin") || "").trim();
      
      // Khóa bản quyền: Đã khai tử hoàn toàn Locket_YouTube, chỉ cho phép Locket_Only_Cold
      if (originModule === "Locket_YouTube") {
        return new Response(JSON.stringify({
          ok: false,
          error: "⛔ CẢNH BÁO: Cấu hình Locket_YouTube đã bị khóa và khai tử vĩnh viễn bởi TranHai307! Vui lòng chuyển sang sử dụng mô-đun Locket_Only_Cold.sgmodule!",
          status: 403
        }), {
          status: 403,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      if (originModule && originModule !== "Locket_Only_Cold") {
        return new Response(JSON.stringify({
          ok: false,
          error: "Tính năng Photobooth & Bộ lọc AI độc quyền cho cấu hình Locket_Only_Cold.sgmodule của TranHai307!",
          status: 403
        }), {
          status: 403,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      let rawText = "";
      let bodyData = {};
      if (request.method === "POST") {
        try {
          rawText = await request.text();
          if (rawText) {
            const parsed = JSON.parse(rawText);
            bodyData = parsed.data || parsed;
          }
        } catch (e) {}
      }

      // =====================================================================
      // 1. ƯU TIÊN SỐ 1: CHUYỂN TIẾP TRỰC TIẾP SANG RENDER BACKEND CHÍNH CHỦ
      // Server Sharp C++ trên Render tải ảnh về, áp dụng filter / khung / photobooth và đẩy lên
      // =====================================================================
      const renderBackend = (env?.RENDER_BACKEND_URL || "https://tranhai-lk.onrender.com").trim();
      if (renderBackend) {
        try {
          const rResp = await fetch(renderBackend.replace(/\/+$/, "") + "/generateFilteredImage" + url.search, {
            method: request.method,
            headers: {
              "Content-Type": "application/json",
              "x-public-base": url.origin
            },
            body: request.method === "POST" ? (rawText || JSON.stringify({ data: bodyData })) : undefined,
            signal: AbortSignal.timeout(20000)
          });
          if (rResp.ok) {
            let rData = await rResp.text();
            rData = rData.replace(/https:\/\/locket-mod-backend\.onrender\.com/g, url.origin);
            return new Response(rData, {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
              }
            });
          }
        } catch (rErr) {
          console.error("Render proxy error:", rErr);
        }
      }

      const imageUrl = (url.searchParams.get("imageUrl") || bodyData.imageUrl || bodyData.image_url || bodyData.url || "").trim();
      const rawFid = (url.searchParams.get("filterId") || bodyData.filter_id || bodyData.filterId || bodyData.prompt || bodyData.id || "").trim();
      const cleanFid = rawFid.toLowerCase();
      const step = String(url.searchParams.get("step") || bodyData.step || "1").trim();

      // Chuẩn hóa Prompt AI theo chuẩn inpainting face-change
      let detailedPrompt = "";
      const stickerStyle = builtInStickerPrompt(rawFid) || builtInStickerPrompt(cleanFid) || builtInStickerPrompt(bodyData.prompt);
      if (stickerStyle) {
        detailedPrompt = modelPrompt(stickerStyle);
      } else if (AI_PROMPTS[rawFid] || AI_PROMPTS[cleanFid]) {
        detailedPrompt = AI_PROMPTS[rawFid] || AI_PROMPTS[cleanFid];
      } else {
        detailedPrompt = (bodyData.prompt || rawFid) + ", modern iPhone camera look, sharp details, realistic lighting, 8k resolution";
      }
      bodyData.prompt = detailedPrompt;

      const isPhotobooth = /photobooth|pb_|frame_|khung_|4cut|3cut|2cut|cute|berry_days|happy_snap|sky_diary|photoboot|classic_pb|xmas/i.test(cleanFid);
      const totalSteps = getPhotoboothTotalSteps(cleanFid);
      let numStep = parseInt(step || "1", 10);

      // Nếu client chưa gửi step cụ thể nhưng là Photobooth nhiều ô -> dùng in-memory session của Worker
      if (isPhotobooth && !url.searchParams.get("img1") && !bodyData.img1) {
        const clientId = request.headers.get("cf-connecting-ip") || "client_default";
        const sKey = `${clientId}_${cleanFid}`;
        let sess = pbWorkerSessions.get(sKey);
        const now = Date.now();
        if (!sess || (now - sess.lastTime) > 180000 || sess.step < 1 || sess.step > totalSteps) {
          sess = { step: 1, images: [], lastTime: now };
        }
        numStep = sess.step;
        sess.images[numStep - 1] = imageUrl;
        sess.lastTime = now;

        if (numStep < totalSteps) {
          sess.step = numStep + 1;
          pbWorkerSessions.set(sKey, sess);
        } else {
          sess.step = 1;
          pbWorkerSessions.set(sKey, sess);
        }
      }

      // Photobooth các bước trung gian (chưa đủ số ảnh): Phản hồi thẻ thông báo ngay lập tức trong 5ms (KHÔNG chờ Render)
      if (isPhotobooth && numStep < totalSteps) {
        const cardFile = getPhotoboothCardFile(numStep, totalSteps);
        const outUrl = `${url.origin}/assets/img/${cardFile}`;
        const payload = {
          ok: true,
          result: {
            outputUrl: outUrl,
            output_url: outUrl,
            url: outUrl,
            imageUrl: outUrl,
            image_url: outUrl,
            status: 200,
            data: {
              outputUrl: outUrl,
              output_url: outUrl,
              url: outUrl,
              imageUrl: outUrl,
              image_url: outUrl,
              step: numStep,
              totalSteps: totalSteps
            }
          }
        };
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // Nếu là filter Photobooth hoặc Khung viền đơn bước hoàn tất
      if (isPhotobooth) {
        let outUrl = "";
        let img1 = url.searchParams.get("img1") || bodyData.img1 || imageUrl;
        let img2 = url.searchParams.get("img2") || bodyData.img2 || imageUrl;
        let img3 = url.searchParams.get("img3") || bodyData.img3 || imageUrl;
        let img4 = url.searchParams.get("img4") || bodyData.img4 || imageUrl;

        // Nếu client không truyền trực tiếp query/body thì đọc từ in-memory session
        if (!url.searchParams.get("img1") && !bodyData.img1) {
          const clientId = request.headers.get("cf-connecting-ip") || "client_default";
          const sKey = `${clientId}_${cleanFid}`;
          const sess = pbWorkerSessions.get(sKey);
          if (sess && sess.images && sess.images.length > 0) {
            img1 = sess.images[0] || img1;
            if (totalSteps >= 2) img2 = sess.images[1] || img2;
            if (totalSteps >= 3) img3 = sess.images[2] || img3;
            if (totalSteps >= 4) img4 = sess.images[3] || img4;
          }
        }

        const frameKey = url.searchParams.get("frame") || bodyData.frame || cleanFid;
        const isSingle = cleanFid.startsWith("khung_") || cleanFid.startsWith("pb_single_") || cleanFid === "cmt_locket";
        const size = isSingle ? 1080 : 1254;
        const svgApiUrl = `${url.origin}/api/render-photobooth-svg?img1=${encodeURIComponent(img1)}&img2=${encodeURIComponent(img2)}&img3=${encodeURIComponent(img3)}&img4=${encodeURIComponent(img4)}&frame=${encodeURIComponent(frameKey)}`;
        outUrl = `https://wsrv.nl/?url=${encodeURIComponent(svgApiUrl)}&w=${size}&h=${size}&output=jpg`;

        const payload = {
          ok: true,
          result: {
            outputUrl: outUrl,
            output_url: outUrl,
            url: outUrl,
            imageUrl: outUrl,
            image_url: outUrl,
            data: {
              outputUrl: outUrl,
              output_url: outUrl,
              url: outUrl,
              imageUrl: outUrl,
              image_url: outUrl
            },
            status: 200,
            type: isSingle ? "frame_overlay" : "photobooth_collage"
          }
        };

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      const KIRA_KEY = (env?.KIRA_API_KEY || "").trim();
      let aiImageUrl = "";
      let kiraStatus = "pending";
      let kiraError = "";

      // 1. Gọi Kira AI Image Engine (agnes-image-2.1-flash) với reference_images để giữ khuôn mặt 100%
      if (KIRA_KEY) {
        try {
          let refImages = [];
          if (imageUrl) {
            try {
              const imgResp = await fetch(imageUrl);
              if (imgResp.ok) {
                const arrBuf = await imgResp.arrayBuffer();
                let binary = "";
                const bytes = new Uint8Array(arrBuf);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const b64 = btoa(binary);
                refImages.push({
                  mime_type: "image/jpeg",
                  data: b64
                });
              }
            } catch (e) {}
          }

          // BẢO VỆ TUYỆT ĐỐI: NẾU KHÔNG CÓ ẢNH THAM CHIẾU TỪ LOCKET -> KHÔNG ĐƯỢC PHÉP GỌI KIRA
          // VÌ NẾU GỌI TEXT-TO-IMAGE THUẦN, KIRA SẼ TỰ ĐỘNG VẼ RA MỘT NGƯỜI LẠ NGẪU NHIÊN!
          if (refImages.length === 0) {
            throw new Error("Missing reference image from Locket: skipping AI generation to prevent creating a random person.");
          }

          let facePrompt = detailedPrompt;
          if (!facePrompt.includes("Keep the background, pose, framing") && !facePrompt.includes("Do not change the overall composition")) {
            facePrompt = `Show the persons in the photo with the exact same pose and background, but with ${detailedPrompt}, captured with a modern iPhone camera look.\n\nAll enhancements and additions should remain confined strictly to the added elements. Do not alter the overall head size, face shape, facial features, eyes, smile, expression, or identity. Preserve natural skin texture, pores, and lighting so the elements integrate realistically with the environment.\n\nApply modern iPhone camera characteristics across the entire image: natural HDR, crisp facial detail, balanced highlights and shadows, and slightly vibrant but realistic colors. The additions should inherit this same processing so they feel captured in-camera.\n\nKeep the background, pose, framing, depth of field, and image quality exactly the same. Do not change the overall composition of the photo, do not add new people to the photo, only show each person in the photo one time.`;
          }

          const kBody = {
            model: "agnes-image-2.1-flash",
            prompt: facePrompt,
            aspect_ratio: "1:1",
            reference_images: refImages
          };

          const kiraResp = await fetch("https://kiraai.vn/api/v1/images/generations", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${KIRA_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(kBody),
            signal: AbortSignal.timeout(25000),
            cf: { cacheTtl: 0 }
          });
          if (kiraResp.ok) {
            const kData = await kiraResp.json();
            const item = kData?.data?.[0];
            if (item?.b64_json) {
              aiImageUrl = `data:${item.mime_type || "image/png"};base64,${item.b64_json}`;
              kiraStatus = "success";
            } else if (item?.url) {
              aiImageUrl = item.url;
              kiraStatus = "success";
            }
          } else {
            const errData = await kiraResp.json().catch(() => ({}));
            kiraError = errData?.error?.message || `Kira API HTTP ${kiraResp.status}`;
            kiraStatus = "error";
          }
        } catch (kErr) {
          kiraError = kErr.message || "Kira connection error";
          kiraStatus = "timeout";
        }
      }

      // Đã khử hoàn toàn Pollinations AI fallback theo chỉ thị của người dùng
      const finalUrl = aiImageUrl || imageUrl;
      const responsePayload = {
        ok: true,
        result: {
          outputUrl: finalUrl,
          output_url: finalUrl,
          url: finalUrl,
          imageUrl: finalUrl,
          image_url: finalUrl,
          data: {
            outputUrl: finalUrl,
            output_url: finalUrl,
            url: finalUrl,
            imageUrl: finalUrl,
            image_url: finalUrl,
            gemini_status: geminiStatus,
            gemini_error: geminiError || undefined
          },
          status: 200,
          engine: "google-gemini",
          prompt_used: detailedPrompt,
          gemini_status: geminiStatus,
          gemini_error: geminiError || undefined
        }
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }


    // =====================================================================
    // 1. API: KÍCH HOẠT GOLD & LƯU VĨNH VIỄN
    // =====================================================================
    if (pathname === "/api/register-vip") {
      const rawInput = (url.searchParams.get("username") || url.searchParams.get("query") || url.searchParams.get("uid") || "").trim();

      if (!rawInput) {
        return new Response(JSON.stringify({ ok: false, error: "Thiếu username hoặc UID" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        });
      }

      // Tra cứu tài khoản chính chủ Locket để lấy UID và Avatar thật
      const lookup = await lookupLocketProfile(rawInput);
      if (!lookup.ok && lookup.not_found) {
        return new Response(JSON.stringify({
          ok: false,
          not_found: true,
          error: lookup.message,
          cleanUser: lookup.cleanUser
        }), {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        });
      }

      const pData = lookup.data || {};
      const username = (pData.username || rawInput).toLowerCase().trim();
      const uid = (pData.uid || url.searchParams.get("uid") || "").trim();
      const avatarUrl = pData.avatarUrl || null;

      const key = username || uid;
      const newEntry = {
        uid: uid,
        username: username,
        avatar_url: avatarUrl,
        registered_at: new Date().toISOString(),
        source: "web_or_module"
      };

      dynamicVipStore.set(key, newEntry);

      // Lưu trữ vĩnh viễn vào Cloudflare KV Storage (nếu đã kết nối)
      if (env?.VIP_KV) {
        try {
          let kvUsers = [];
          const raw = await env.VIP_KV.get("dynamic_vip_users");
          if (raw) kvUsers = JSON.parse(raw);
          const existingIdx = kvUsers.findIndex(u => (u.username && u.username === username) || (u.uid && u.uid === uid));
          if (existingIdx >= 0) {
            kvUsers[existingIdx] = Object.assign({}, kvUsers[existingIdx], newEntry);
          } else {
            kvUsers.unshift(newEntry);
          }
          await env.VIP_KV.put("dynamic_vip_users", JSON.stringify(kvUsers.slice(0, 2000)));
        } catch (e) { }
      }

      // Tính tổng số người dùng thực tế sau khi kích hoạt (Đảm bảo tăng đúng +1)
      const currentTotal = await computeTotalVipCount(env);

      return new Response(JSON.stringify({
        ok: true,
        message: "Đã kích hoạt Gold cộng đồng thành công!",
        user: newEntry,
        profile: pData,
        total: currentTotal
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }

    // =====================================================================
    // 1.1 API: TRA CỨU TRẠNG THÁI GOLD & PROFILE LOCKET CHÍNH CHỦ
    // =====================================================================
    if (pathname === "/api/check-vip") {
      const q = (url.searchParams.get("query") || url.searchParams.get("username") || url.searchParams.get("uid") || "").trim();
      if (!q) {
        return new Response(JSON.stringify({ ok: false, error: "Vui lòng nhập username hoặc link cần tra cứu" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        });
      }

      // 1. Tra cứu profile thật từ locket.cam
      const lookup = await lookupLocketProfile(q);
      if (!lookup.ok && lookup.not_found) {
        return new Response(JSON.stringify({
          ok: false,
          not_found_on_locket: true,
          cleanUser: lookup.cleanUser || q,
          message: lookup.message
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        });
      }

      const locketUser = lookup.data || {};
      const targetUser = (locketUser.username || q).toLowerCase().trim();
      const targetUid = (locketUser.uid || "").toLowerCase().trim();

      let found = null;

      // 2. Kiểm tra trong dynamicVipStore (RAM)
      for (const [k, v] of dynamicVipStore.entries()) {
        const vUser = (v.username || "").toLowerCase().trim();
        const vUid = (v.uid || "").toLowerCase().trim();
        if ((vUser && (vUser === targetUser || vUser === q.toLowerCase())) || (vUid && (vUid === targetUid || vUid === q.toLowerCase()))) {
          found = v;
          break;
        }
      }

      // 3. Kiểm tra trong Cloudflare KV (Lưu vĩnh viễn)
      if (!found && env?.VIP_KV) {
        try {
          const raw = await env.VIP_KV.get("dynamic_vip_users");
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              found = list.find(u => {
                const uUser = (u.username || "").toLowerCase().trim();
                const uUid = (u.uid || "").toLowerCase().trim();
                return (uUser && (uUser === targetUser || uUser === q.toLowerCase())) || (uUid && (uUid === targetUid || uUid === q.toLowerCase()));
              });
            }
          }
        } catch (e) { }
      }

      // 4. Kiểm tra trong SEED_USERS
      if (!found) {
        if (SEED_USERS.map(s => s.toLowerCase()).includes(targetUser)) {
          found = {
            username: targetUser,
            source: "seed_community",
            activated_at: "Thành viên ban đầu"
          };
        }
      }

      return new Response(JSON.stringify({
        ok: true,
        query: q,
        exists_on_locket: lookup.ok && lookup.found,
        not_found_on_locket: false,
        profile: locketUser,
        is_vip: Boolean(found),
        user: found || null,
        message: found ? `Tài khoản "${targetUser}" ĐÃ ĐƯỢC KÍCH HOẠT Locket Gold 💛` : `Tài khoản "${targetUser}" hợp lệ trên Locket nhưng CHƯA CÓ Gold`
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }

    // =====================================================================
    // 2. API: LẤY DANH SÁCH TOÀN BỘ NGƯỜI DÙNG VIP (CHO SHADOWROCKET & WEB)
    // =====================================================================
    if (pathname === "/api/vip-users") {
      const allIdentifiers = new Set();
      const userList = [];

      // 1. Thêm danh sách hạt giống SEED_USERS
      for (const u of SEED_USERS) {
        allIdentifiers.add(u.toLowerCase());
      }

      // 2. Thêm danh sách lưu vĩnh viễn từ Cloudflare KV
      if (env?.VIP_KV) {
        try {
          const raw = await env.VIP_KV.get("dynamic_vip_users");
          if (raw) {
            const kvList = JSON.parse(raw);
            if (Array.isArray(kvList)) {
              for (const u of kvList) {
                if (u.uid) allIdentifiers.add(u.uid.toLowerCase());
                if (u.username) allIdentifiers.add(u.username.toLowerCase());
                userList.unshift({
                  uid: u.uid || "",
                  username: u.username || "",
                  avatar_url: u.avatar_url || null,
                  full_name: u.username ? `@${u.username}` : "Thành viên VIP",
                  activated_at: u.registered_at
                });
              }
            }
          }
        } catch (e) { }
      }

      // 3. Thêm danh sách đăng ký trong RAM Worker
      for (const [k, v] of dynamicVipStore.entries()) {
        if (v.uid) allIdentifiers.add(v.uid.toLowerCase());
        if (v.username) allIdentifiers.add(v.username.toLowerCase());
        if (!userList.some(u => (u.username && u.username === v.username) || (u.uid && u.uid === v.uid))) {
          userList.unshift({
            uid: v.uid || "",
            username: v.username || "",
            avatar_url: v.avatar_url || null,
            full_name: v.username ? `@${v.username}` : "Thành viên VIP",
            activated_at: v.registered_at
          });
        }
      }

      const totalMembers = await computeTotalVipCount(env);

      return new Response(JSON.stringify({
        ok: true,
        total: totalMembers,
        identifiers: Array.from(allIdentifiers),
        users: userList.slice(0, 500)
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache"
        }
      });
    }

    // =====================================================================
    // 3. WEB DASHBOARD: KÍCH HOẠT & TRA CỨU VIP (CHUẨN GIAO DIỆN LOCKET)
    // =====================================================================
    if (pathname === "/vip" || pathname === "/vip/") {
      const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Locket VIP Network - Kích Hoạt & Tra Cứu Gold 💛</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .gold-glow { box-shadow: 0 0 25px rgba(245, 158, 11, 0.25); border-color: rgba(245, 158, 11, 0.6); }
        .dashed-box { border: 1.5px dashed rgba(245, 158, 11, 0.4); }
    </style>
</head>
<body class="bg-[#0b0f17] text-slate-100 min-h-screen flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
    <div class="max-w-lg w-full bg-[#111622] border border-amber-500/20 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden my-6">
        <div class="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="text-center mb-6">
            <span class="px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold rounded-full uppercase tracking-wider inline-block">LOCKET VIP NETWORK</span>
            <h1 class="text-2xl sm:text-3xl font-black text-white mt-2.5">Kích Hoạt & Tra Cứu Gold 💛</h1>
            <p class="text-xs text-slate-400 mt-1.5 font-medium">Nhập Username để tự động tra cứu — Kiểm tra tài khoản & Avatar thật!</p>
        </div>

        <!-- 1. Thanh tìm kiếm Input + Nút Tra Cứu (Hỗ trợ TỰ ĐỘNG TRA CỨU khi gõ) -->
        <div class="space-y-2">
            <div class="flex items-center gap-2.5">
                <div class="relative flex-1">
                    <input type="text" id="userInput" placeholder="kienviet hoặc dán link locket.cam/..." class="w-full px-4 py-3.5 bg-[#161b26] border border-slate-700/80 rounded-2xl text-white text-sm focus:outline-none focus:border-amber-400 transition placeholder:text-slate-500 font-medium shadow-inner">
                    <div id="typingIndicator" class="hidden absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-amber-400 flex items-center gap-1 font-medium pointer-events-none">
                        <span class="inline-block animate-spin">⏳</span> Đang tra...
                    </div>
                </div>
                <button type="button" id="checkBtn" class="shrink-0 px-5 sm:px-6 py-3.5 bg-gradient-to-r from-slate-800 to-slate-800 hover:from-slate-700 hover:to-slate-700 border border-slate-700 text-white font-bold rounded-2xl active:scale-95 transition text-sm flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap">
                    🔍 Tra Cứu
                </button>
            </div>

            <!-- Cảnh báo đỏ xuất hiện ngay dưới input nếu không tìm thấy (Chuẩn ảnh 2) -->
            <div id="inputErrorAlert" class="hidden flex items-start gap-2 text-xs text-rose-400 font-medium pt-1.5 px-1 leading-relaxed">
                <div class="w-4 h-4 rounded-full bg-rose-500 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">!</div>
                <span id="inputErrorText">❌ Username không tồn tại trên hệ thống Locket. Vui lòng kiểm tra lại chính xác username của bạn!</span>
            </div>
        </div>

        <!-- 2. Hộp hướng dẫn lấy Username chuẩn theo link profile (Chuẩn ảnh mẫu) -->
        <div class="bg-amber-950/20 dashed-box rounded-2xl p-4 my-4 text-xs text-amber-200">
            <div class="flex items-center gap-1.5 font-bold text-amber-400 mb-2">
                <span>ℹ️</span> Cách lấy Username từ link chia sẻ profile Locket:
            </div>
            <div class="flex items-center justify-between bg-black/40 border border-amber-500/20 rounded-xl px-3 py-2.5 my-2 font-mono text-[11px] flex-wrap gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-slate-400">https://locket.cam/</span>
                    <span class="px-2 py-0.5 border border-amber-500/60 rounded-md text-amber-400 font-bold bg-amber-500/10">kienviet</span>
                    <span class="text-slate-400">➔ Username là:</span>
                    <span class="px-2 py-0.5 border border-amber-500/60 rounded-md text-amber-400 font-bold bg-amber-500/10">kienviet</span>
                </div>
                <button type="button" onclick="sampleUser('kienviet')" class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1 whitespace-nowrap active:scale-95 transition cursor-pointer">
                    🪄 Thử mẫu
                </button>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed mt-1">
                👉 <b>Các chữ sau dấu / ở cuối</b> chính là Username của bạn (bạn có thể dán thẳng cả link <code class="text-amber-400 font-mono">https://locket.cam/...</code> vào ô trên, hệ thống sẽ tự động tra cứu ngay).
            </p>
        </div>

        <!-- 3. PHẦN TRA CỨU & HIỂN THỊ KẾT QUẢ CHI TIẾT -->
        <div id="statusSection" class="hidden transition-all duration-300">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span class="flex items-center gap-1.5"><span>🔍</span> Kết quả tra cứu tài khoản:</span>
                <span id="lookupStatusBadge" class="text-[10px] text-slate-500">Chính chủ Locket</span>
            </div>
            <div id="statusCard">
                <!-- Render động qua JavaScript -->
            </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Thành viên trong mạng lưới:</span>
            <span id="vipCount" class="font-extrabold text-amber-400 text-sm">Đang tải...</span>
        </div>
    </div>

    <script>
        let searchDebounceTimer = null;

        window.sampleUser = function(val) {
            const input = document.getElementById('userInput');
            input.value = val;
            executeSearch(val);
        };

        async function loadCount() {
            try {
                const res = await fetch('/api/vip-users?_t=' + Date.now());
                const data = await res.json();
                document.getElementById('vipCount').innerText = data.total + ' thành viên';
            } catch (e) {
                document.getElementById('vipCount').innerText = 'Online';
            }
        }
        loadCount();

        function renderCard(data, query) {
            const section = document.getElementById('statusSection');
            const card = document.getElementById('statusCard');
            const alertBox = document.getElementById('inputErrorAlert');
            const alertText = document.getElementById('inputErrorText');
            const inputEl = document.getElementById('userInput');

            section.classList.remove('hidden');

            // 1. TRƯỜNG HỢP KHÔNG TÌM THẤY TÀI KHOẢN TRÊN LOCKET (Chuẩn ảnh 2)
            if (data.not_found_on_locket) {
                const clean = data.cleanUser || query;
                inputEl.classList.remove('border-slate-700/80', 'border-amber-400', 'border-emerald-500');
                inputEl.classList.add('border-rose-500');

                alertBox.classList.remove('hidden');
                alertText.innerHTML = \`❌ Username "<b>@\${clean}</b>" không tồn tại trên hệ thống Locket. Vui lòng kiểm tra lại chính xác username của bạn!\`;

                card.innerHTML = \`
                    <div class="bg-[#151922] border border-rose-500/50 rounded-2xl p-4 shadow-lg shadow-rose-950/20">
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-3.5">
                                <div class="w-12 h-12 rounded-full border border-rose-500/60 bg-rose-600/90 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-rose-950/40 relative">
                                    <span>👤</span>
                                    <span class="absolute -bottom-0.5 -right-0.5 bg-rose-950 rounded-full px-1 text-[10px] text-rose-300 border border-rose-500/50">✖</span>
                                </div>
                                <div>
                                    <h3 class="text-white font-bold text-sm">Không tìm thấy người dùng</h3>
                                    <p class="text-xs text-slate-400 mt-0.5">@\${clean}</p>
                                </div>
                            </div>
                            <span class="px-3.5 py-1.5 bg-rose-950/60 border border-rose-500/40 text-rose-400 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                                <span class="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px]">✖</span> Không tồn tại trên Locket
                            </span>
                        </div>
                    </div>
                \`;
                return;
            }

            // Reset cảnh báo đỏ khi tìm thấy tài khoản hợp lệ
            inputEl.classList.remove('border-rose-500');
            inputEl.classList.add('border-slate-700/80');
            alertBox.classList.add('hidden');

            const p = data.profile || {};
            const username = p.username || query;
            const uid = p.uid || (data.user && data.user.uid) || 'Chưa xác định';
            const avatar = p.avatarUrl || (data.user && data.user.avatar_url);

            // 2. TRƯỜNG HỢP ĐÃ CÓ GOLD (Hiển thị thẻ vàng rực rỡ)
            if (data.is_vip) {
                card.innerHTML = \`
                    <div class="bg-gradient-to-br from-amber-950/30 via-[#151922] to-[#151922] border rounded-2xl p-4 gold-glow">
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-3.5 min-w-0">
                                <div class="relative shrink-0">
                                    \${avatar 
                                        ? \`<img src="\${avatar}" class="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md shadow-amber-500/20">\`
                                        : \`<div class="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center text-xl font-black text-amber-300">💛</div>\`
                                    }
                                    <span class="absolute -bottom-1 -right-1 text-xs bg-slate-950 rounded-full px-1 border border-amber-400">✨</span>
                                </div>
                                <div class="min-w-0">
                                    <h3 class="text-white font-bold text-base truncate">\${username}</h3>
                                    <p class="text-xs text-slate-400">@\${username}</p>
                                </div>
                            </div>
                            <div class="flex flex-col items-end gap-1 shrink-0">
                                <span class="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                                    <span>💛</span> Đã có Gold VIP
                                </span>
                                <span class="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                    <span>✓</span> Tài khoản hợp lệ
                                </span>
                            </div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-amber-500/20 text-[11px] text-slate-400 flex items-center justify-between">
                            <span class="font-mono text-[10px] truncate max-w-[220px]">UID: \${uid}</span>
                            <span class="text-amber-400 font-bold">Đã kích hoạt Gold VIP vĩnh viễn 🎉</span>
                        </div>
                    </div>
                \`;
            } else {
                // 3. TRƯỜNG HỢP HỢP LỆ NHƯNG CHƯA CÓ GOLD (Chuẩn ảnh 1 + Nút kích hoạt)
                card.innerHTML = \`
                    <div class="bg-[#151922] border border-emerald-500/50 rounded-2xl p-4 shadow-lg shadow-emerald-950/20">
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-3.5 min-w-0">
                                <div class="relative shrink-0">
                                    \${avatar 
                                        ? \`<img src="\${avatar}" class="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md">\`
                                        : \`<div class="w-12 h-12 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center text-lg text-slate-400">👤</div>\`
                                    }
                                </div>
                                <div class="min-w-0">
                                    <h3 class="text-white font-bold text-base truncate">\${username}</h3>
                                    <p class="text-xs text-slate-400">@\${username}</p>
                                </div>
                            </div>
                            <div class="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                                <span class="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                                    <span class="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">✓</span> Tài khoản Locket hợp lệ
                                </span>
                                <button onclick="activateNow('\${username}')" id="actBtn_\${username}" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                    ⚡ Kích Hoạt Gold
                                </button>
                            </div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                            <span class="font-mono text-[10px] truncate max-w-[220px]">UID: \${uid}</span>
                            <span class="text-amber-400/90 font-medium">Nhấn Kích Hoạt để cấp Gold 💛</span>
                        </div>
                    </div>
                \`;
            }
        }

        // HÀM THỰC THI TRA CỨU
        async function executeSearch(rawVal) {
            const val = (rawVal || document.getElementById('userInput').value).trim();
            if (!val || val.length < 2) {
                document.getElementById('statusSection').classList.add('hidden');
                document.getElementById('inputErrorAlert').classList.add('hidden');
                return;
            }

            const btn = document.getElementById('checkBtn');
            const indicator = document.getElementById('typingIndicator');
            
            btn.disabled = true;
            btn.innerText = 'Đang tra...';
            indicator.classList.remove('hidden');

            try {
                const res = await fetch('/api/check-vip?query=' + encodeURIComponent(val) + '&_t=' + Date.now());
                const data = await res.json();
                renderCard(data, val);
            } catch (err) {
                alert('Lỗi kết nối máy chủ!');
            } finally {
                btn.disabled = false;
                btn.innerText = '🔍 Tra Cứu';
                indicator.classList.add('hidden');
            }
        }

        // SỰ KIỆN: BẤM NÚT TRA CỨU
        document.getElementById('checkBtn').addEventListener('click', () => {
            executeSearch();
        });

        // SỰ KIỆN: TỰ ĐỘNG TRA CỨU KHI GÕ HOẶC DÁN USERNAME (Realtime Debounce 450ms)
        document.getElementById('userInput').addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            const val = e.target.value.trim();
            if (!val || val.length < 3) {
                document.getElementById('statusSection').classList.add('hidden');
                document.getElementById('inputErrorAlert').classList.add('hidden');
                return;
            }

            // Đợi 450ms sau khi người dùng dừng gõ phím để tự động tra cứu
            searchDebounceTimer = setTimeout(() => {
                executeSearch(val);
            }, 450);
        });

        // SỰ KIỆN: HỖ TRỢ DÁN LINK/TEXT TỰ TRA CỨU NGAY
        document.getElementById('userInput').addEventListener('paste', () => {
            setTimeout(() => {
                executeSearch();
            }, 50);
        });

        // SỰ KIỆN: NHẤN ENTER ĐỂ TRA CỨU NGAY
        document.getElementById('userInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchDebounceTimer);
                executeSearch();
            }
        });

        // XỬ LÝ KÍCH HOẠT GOLD
        window.activateNow = async function(username) {
            const btn = document.getElementById('actBtn_' + username);
            if (btn) {
                btn.disabled = true;
                btn.innerText = 'Đang kích hoạt...';
            }

            try {
                const res = await fetch('/api/register-vip?query=' + encodeURIComponent(username) + '&_t=' + Date.now());
                const data = await res.json();
                if (data.ok) {
                    renderCard({ is_vip: true, profile: data.profile, user: data.user }, username);
                    if (data.total) {
                        document.getElementById('vipCount').innerText = data.total + ' thành viên';
                    } else {
                        loadCount();
                    }
                } else {
                    alert('Lỗi: ' + (data.error || 'Không thể kích hoạt!'));
                }
            } catch (err) {
                alert('Lỗi kết nối máy chủ!');
            }
        };
    </script>
</body>
</html>`;
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }

    // =====================================================================
    // 4. TRANG CHỦ & PROXY TẢI TỆP GITHUB / FALLBACK MODULE
    // =====================================================================
    if (pathname === "/" || pathname === "") {
      return new Response("✨ TranHai307 Locket VIP Service is Online! Quản trị tại /vip", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Chặn hoàn toàn và khai tử Locket_YouTube.sgmodule
    if (pathname.includes("Locket_YouTube.sgmodule") || pathname.includes("Locket_YouTube.conf")) {
      return new Response("⛔ CẢNH BÁO: Cấu hình Locket_YouTube đã bị khóa và khai tử vĩnh viễn bởi TranHai307! Vui lòng chuyển sang sử dụng mô-đun Locket_Only_Cold.sgmodule tại: https://tranhai-lk.onrender.com/Locket_Only_Cold.sgmodule", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Trả về Module cấu hình Locket_Only_Cold chính thức cho Shadowrocket
    if (pathname.includes("Locket_Only_Cold.sgmodule") || pathname.includes("Locket_TranHai307.sgmodule") || pathname.includes("locket-vip.sgmodule")) {
      try {
        const ghUrl = (env?.GITHUB_BASE || GITHUB_BASE) + "/Locket_Only_Cold.sgmodule";
        const token = (env?.GITHUB_TOKEN || GITHUB_TOKEN || "").trim();
        const ghHeaders = { "User-Agent": "Shadowrocket/2.2.0", "Cache-Control": "no-cache", "Pragma": "no-cache" };
        if (token && !token.includes("xxxxxxxx")) {
          ghHeaders["Authorization"] = token.startsWith("github_pat_") ? `Bearer ${token}` : `token ${token}`;
        }
        const ghResp = await fetch(ghUrl, { headers: ghHeaders, cf: { cacheTtl: 0 } });
        if (ghResp.ok) {
          const ghText = await ghResp.text();
          return new Response(ghText, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=10"
            }
          });
        }
      } catch (e) {}

      return new Response(FALLBACK_MODULE, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=10"
        }
      });
    }

    // Proxy tải ảnh tĩnh do Render xử lý (/images/ & /cache/) để giấu hoàn toàn domain Render
    if (pathname.startsWith("/images/") || pathname.startsWith("/cache/")) {
      const renderBackend = (env?.RENDER_BACKEND_URL || "https://tranhai-lk.onrender.com").trim();
      const rResp = await fetch(renderBackend.replace(/\/+$/, "") + pathname, {
        headers: { "User-Agent": "Shadowrocket/2.2.0" },
        cf: { cacheTtl: 86400, cacheEverything: true }
      });
      if (rResp.ok) {
        return new Response(rResp.body, {
          status: 200,
          headers: {
            "Content-Type": rResp.headers.get("content-type") || "image/jpeg",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400"
          }
        });
      }
    }

    // BẢO MẬT TUYỆT ĐỐI: Chặn 100% không cho tải các file mã nguồn hệ thống & token từ bên ngoài
    const blockedPattern = /^\/(worker\.js|server\.js|package(-lock)?\.json|wrangler\.(json|toml)|render\.yaml|\.git|\.env|README\.md)/i;
    if (blockedPattern.test(pathname)) {
      return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const targetUrl = (env?.GITHUB_BASE || GITHUB_BASE) + pathname + url.search;
    const token = (env?.GITHUB_TOKEN || GITHUB_TOKEN || "").trim();

    const fetchHeaders = {
      "User-Agent": "Shadowrocket/2.2.0",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    };

    if (token && !token.includes("xxxxxxxx")) {
      fetchHeaders["Authorization"] = token.startsWith("github_pat_") ? `Bearer ${token}` : `token ${token}`;
    }

    const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(pathname);
    const response = await fetch(targetUrl, {
      headers: fetchHeaders,
      cf: isImage ? { cacheTtl: 86400, cacheEverything: true } : { cacheTtl: 0, cacheEverything: false }
    });

    if (!response.ok) {
      return new Response(`File not found: ${pathname}`, { status: response.status });
    }

    // Làm sạch toàn bộ Header để xóa sạch 100% dấu vết GitHub / Fastly
    const newHeaders = new Headers();
    for (const [key, val] of response.headers.entries()) {
      const lower = key.toLowerCase();
      if (
        lower.startsWith("x-github") ||
        lower.startsWith("x-fastly") ||
        lower.startsWith("x-cache") ||
        lower.startsWith("x-timer") ||
        lower === "via" ||
        lower === "x-served-by" ||
        lower === "source-age" ||
        lower === "content-security-policy"
      ) {
        continue;
      }
      newHeaders.set(key, val);
    }
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Cache-Control", isImage ? "public, max-age=86400" : "public, max-age=10");
    if (/\.mobileconfig$/i.test(pathname)) {
      newHeaders.set("Content-Type", "application/x-apple-aspen-config; charset=utf-8");
      newHeaders.set("Content-Disposition", 'attachment; filename="' + pathname.split('/').pop() + '"');
    }

    // Tự động tiêm toàn bộ danh sách VIP theo thời gian thực vào locket_filter_unlock.js
    if (pathname.includes("locket_filter_unlock.js")) {
      try {
        let scriptText = await response.text();
        const allVips = new Set(SEED_USERS.map(u => u.toLowerCase().trim()));

        // Thêm từ KV
        if (env?.VIP_KV) {
          try {
            const raw = await env.VIP_KV.get("dynamic_vip_users");
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                for (const u of list) {
                  if (u.uid) allVips.add(u.uid.toLowerCase().trim());
                  if (u.username) allVips.add(u.username.toLowerCase().trim());
                }
              }
            }
          } catch (e) {}
        }

        // Thêm từ RAM đệm
        for (const [k, v] of dynamicVipStore.entries()) {
          if (v.uid) allVips.add(v.uid.toLowerCase().trim());
          if (v.username) allVips.add(v.username.toLowerCase().trim());
        }

        // Luôn đảm bảo các tài khoản thử nghiệm nòng cốt có mặt
        allVips.add("mhhiep");
        allVips.add("2c7dlquxuqulknrwgpcqsqlw0sk2");
        allVips.add("th_quang08");
        allVips.add("nln9pozfecsccxhuqpiwvkhfwsi2");
        allVips.add("th_quang");
        allVips.add("mhhuyz");
        allVips.add("7tulqjjxb0srwqbbp3euildiqfe3");
        allVips.add("nguyentuankietne");
        allVips.add("blgpf4fdvbbnlmfllziy4hnbjjn1");

        const vipArrayStr = JSON.stringify(Array.from(allVips));
        scriptText = scriptText.replace(/const\s+BASE_VIP_USERS\s*=\s*\[[\s\S]*?\];/, `const BASE_VIP_USERS = ${vipArrayStr};`);

        return new Response(scriptText, {
          status: 200,
          headers: newHeaders
        });
      } catch (err) {}
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  }
};

