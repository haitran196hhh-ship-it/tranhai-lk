# 🎵 Spotify Rules (Standalone)

> Bộ quy tắc mở khóa Spotify độc lập, tối ưu hoá cho iOS và tích hợp mượt mà qua máy chủ Cloudflare Worker riêng biệt.
> Tác giả: **VIP Team (@minhhiep07)**

---

## 🌟 Tính năng nổi bật

1. **Chặn quảng cáo (Ad-blocking)**:
   - Loại bỏ hoàn toàn quảng cáo âm thanh chen ngang khi đang nghe nhạc.
   - Ẩn các banner khuyến mãi, tab mua Premium trong app.
2. **Mở khóa trải nghiệm Premium (On-demand)**:
   - Tắt tính năng ép phát ngẫu nhiên (Shuffle), tự do bấm chọn bất kỳ bài hát nào bạn thích.
   - Chuyển bài không giới hạn (Unlimited skips).
   - Xem đầy đủ danh sách ca sĩ, danh sách bài hát trong album không bị giới hạn.
3. **Mở rộng tùy chọn**:
   - Tệp script `spotify-lyric.js` (dịch lời song ngữ qua Google Translate) được lưu trữ sẵn trong thư mục `js/` để người dùng có thể kích hoạt tùy ý nếu muốn.

---

## 📁 Cấu trúc thư mục

```
Spotify-Rules/
├── Spotify.conf                      # Cấu hình độc lập hoàn chỉnh cho Shadowrocket
├── js/                               # Bộ script JavaScript xử lý Request & Response
│   ├── spotify-json.js               # Đổi platform iPhone sang iPad để mở khóa chọn bài tùy ý
│   ├── spotify-proto.js              # Xử lý Protobuf: gỡ ads, bật on-demand, unlock tính năng
│   ├── spotify-qx-header.js          # Xóa header If-None-Match dành riêng cho Quantumult X
│   └── spotify-lyric.js              # Tự động dịch lời bài hát sang tiếng Việt (Tùy chọn)
├── module/                           # Cấu hình Module cho Shadowrocket, Surge, Stash, QX
│   ├── Spotify.sgmodule              # Module chính cho Shadowrocket / Surge
│   ├── spotify.module                # Module Surge
│   ├── spotify.conf                  # Cấu hình Rewrite cho Quantumult X
│   └── spotify.stoverride            # Cấu hình Stash Stoverride
├── plugin/                           # Cấu hình Plugin cho Loon
│   └── spotify.plugin                # Plugin hoàn chỉnh cho Loon
└── README.md                         # Hướng dẫn chi tiết
```

---

## 🔗 Liên kết cài đặt nhanh

### 1. Shadowrocket (Cấu hình độc lập - Khuyên dùng)
Dán link sau vào **Shadowrocket** $\to$ tab **Cấu hình (Config)** $\to$ bấm dấu **`+` (Tệp từ xa)**:
```text
https://tranhai-lk.onrender.com/Spotify-Rules/Spotify.conf
```

### 2. Shadowrocket / Surge (Dạng Mô-đun)
Dán link sau vào **Mô-đun (Modules)** $\to$ **Cài đặt mô-đun từ URL**:
```text
https://tranhai-lk.onrender.com/Spotify-Rules/module/Spotify.sgmodule
```

### 3. Loon (Plugin)
```text
https://tranhai-lk.onrender.com/Spotify-Rules/plugin/spotify.plugin
```

### 4. Quantumult X (Rewrite Remote)
```text
https://tranhai-lk.onrender.com/Spotify-Rules/module/spotify.conf
```

### 5. Stash (Override)
```text
https://tranhai-lk.onrender.com/Spotify-Rules/module/spotify.stoverride
```

---

## ⚠️ Lưu ý quan trọng khi sử dụng

* **Yêu cầu hệ điều hành**: iOS / iPadOS $\ge$ 15.
* **Chứng chỉ CA**: Đảm bảo đã bật **HTTPS Decryption (MITM)** và đã **Cài đặt & Tin cậy hoàn toàn chứng chỉ Root CA** trong Cài đặt iPhone (`Cài đặt chung` $\to$ `Giới thiệu` $\to$ `Cài đặt tin cậy chứng nhận`).
* **Chất lượng âm thanh**: **KHÔNG ĐƯỢC** chọn chất lượng âm thanh mức **"Rất cao" (Very High)** trong cài đặt Spotify. Hãy đặt ở mức **"Cao" (High)** trở xuống.
* **Kích hoạt lần đầu**: Đăng nhập tài khoản Spotify trước $\to$ Bật Shadowrocket $\to$ Vuốt tắt app Spotify (kill app) $\to$ Mở lại Spotify để script nạp dữ liệu tài khoản mới.
