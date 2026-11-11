# 🛠️ HƯỚNG DẪN DÙNG BẢN TEST & PHÁT TRIỂN (ios_test)

Thư mục này là **bản sao thử nghiệm độc lập 100%**, đã được kết nối với repository riêng biệt:
🔗 **GitHub Test Repo:** [https://github.com/haitran196hhh-ship-it/tranhai-lk](https://github.com/haitran196hhh-ship-it/tranhai-lk)

Bạn có thể tự do chỉnh sửa, test tính năng mới, thêm khung, sửa bộ lọc mà **tuyệt đối không đụng chạm đến bản đang chạy ổn định của repo gốc** (`TranHai307-byte/locket`).

---

### 📲 1. Cách Cài Đặt Mô-đun Test Trên Điện Thoại (Shadowrocket / Surge / Loon):
Thêm mô-đun bằng đường dẫn trực tiếp từ repo test:
```text
https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main/Locket_Test.sgmodule
```
*(Mô-đun `Locket_Test.sgmodule` đã được cấu hình trỏ toàn bộ script về `haitran196hhh-ship-it/tranhai-lk/main/js/`)*

---

### 📂 2. Cấu Trúc Bản Test:
- **`Locket_Test.sgmodule`**: Tệp module thử nghiệm với icon TestFlight, tải script trực tiếp từ repo test.
- **`src/`**: Chứa toàn bộ mã nguồn gốc chưa mã hóa (Locket Gold, Photobooth, Bộ lọc AI, YouTube, Spotify...). Bạn chỉnh sửa thoải mái tại đây.
- **`build.bat` (hoặc `node build.js`)**: Công cụ mã hóa tự động từ `src/` sang `js/`.
- **`push.bat`**: Tự động commit và đẩy mã nguồn lên repo test `https://github.com/haitran196hhh-ship-it/tranhai-lk.git`.
- **`server.js`**: Backend local xử lý ảnh filter & photobooth (dùng kiểm tra hoặc chạy local).

---

### 🚀 3. Quy Trình Chỉnh Sửa & Test:
1. Mở file bạn muốn sửa trong thư mục `src/` (ví dụ: `src/Locket_Photobooth.js` hoặc `src/Locket_Unlocked.js`).
2. Nhấp đúp vào **`build.bat`** (hoặc gõ lệnh `node build.js`). Mã nguồn sẽ được mã hóa sang `js/`.
3. Nhấp đúp vào **`push.bat`** để tự động đẩy code lên repo test trên GitHub.
4. Trên điện thoại: Vào Shadowrocket $\rightarrow$ vuốt làm mới mô-đun **Locket VIP Test & Dev** để nhận ngay code mới nhất!
