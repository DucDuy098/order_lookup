# Hướng dẫn cài đặt Website Tra cứu Cost Đơn Hàng

Web này là 1 file tĩnh (`index.html`), không cần server/database. Đăng nhập Google ngay trên trình duyệt, gọi thẳng Google Sheets API để đọc dữ liệu — sheet của anh vẫn ở chế độ riêng tư như cũ, web không lưu trữ hay copy dữ liệu đi đâu cả.

Cần làm 1 lần duy nhất: tạo "chứng nhận" (OAuth Client ID) để Google cho phép web này xin quyền đọc Sheet khi anh đăng nhập. Mất khoảng 10-15 phút.

## Bước 1: Tạo Google Cloud Project

1. Vào https://console.cloud.google.com/ (đăng nhập bằng `ducduynd098@gmail.com`)
2. Góc trên bên trái, bấm chọn project → **New Project**
3. Đặt tên bất kỳ, VD "Cost Order Lookup" → Create

## Bước 2: Bật Google Sheets API

1. Vào https://console.cloud.google.com/apis/library/sheets.googleapis.com (đảm bảo đang chọn đúng project vừa tạo)
2. Bấm **Enable**

## Bước 3: Tạo màn hình xin quyền (OAuth consent screen)

1. Vào https://console.cloud.google.com/apis/credentials/consent
2. Chọn **External** → Create
3. Điền: App name (VD "Cost Lookup"), User support email (email của anh), Developer contact (email của anh) → Save and Continue
4. Phần Scopes: bấm Save and Continue (không cần thêm gì)
5. Phần Test users: bấm **Add Users**, thêm chính email `ducduynd098@gmail.com` (và email của các bạn trong team nếu họ cũng dùng web này) → Save and Continue
6. Xong, quay về Dashboard

(App đang ở chế độ "Testing" — chỉ những email anh thêm ở Test users mới đăng nhập được. Nếu sau này muốn ai cũng dùng được thì cần bấm "Publish App", nhưng với 2-5 người trong team thì cứ để Testing là đủ, khỏi cần verify với Google.)

## Bước 4: Tạo OAuth Client ID

1. Vào https://console.cloud.google.com/apis/credentials
2. Bấm **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: bất kỳ
5. **Authorized JavaScript origins** → bấm Add URI, điền domain sẽ deploy web (xem Bước 5 để lấy domain trước, hoặc tạm điền `http://localhost:3000` để test local trước, quay lại thêm domain thật sau)
6. Bấm Create → Google hiện ra 1 đoạn **Client ID** dạng `123456-xxxx.apps.googleusercontent.com` → copy lại

## Bước 5: Deploy web lên Vercel (miễn phí)

Cách nhanh nhất không cần biết code/Git:

1. Vào https://vercel.com/ → đăng ký/đăng nhập (dùng Google cho tiện)
2. Bấm **Add New** → **Project** → chọn tab **Deploy without Git** / hoặc kéo thả cả thư mục chứa file `index.html` vào (Vercel hỗ trợ "Drag and drop" ở trang New Project)
3. Deploy xong, Vercel cho 1 domain dạng `https://ten-du-an.vercel.app`

**Quay lại Bước 4**, vào lại OAuth Client ID vừa tạo → Edit → thêm domain `https://ten-du-an.vercel.app` vào **Authorized JavaScript origins** → Save.

(Nếu chưa quen Vercel, có thể thay bằng Netlify — cách làm tương tự, kéo thả file vào https://app.netlify.com/drop)

## Bước 6: Điền Client ID vào web

1. Mở file `index.html` bằng bất kỳ trình soạn thảo text nào (Notepad cũng được)
2. Tìm dòng:
   ```
   const CLIENT_ID = 'DÁN_CLIENT_ID_CỦA_ANH_VÀO_ĐÂY.apps.googleusercontent.com';
   ```
3. Thay bằng Client ID đã copy ở Bước 4
4. Deploy lại (upload lại file lên Vercel/Netlify)

## Bước 7: Dùng thử

1. Mở domain đã deploy
2. Bấm **Đăng nhập Google** → chọn tài khoản `ducduynd098@gmail.com` → Allow
3. Web đã tự có sẵn danh sách Fullfill Check + Bên 1, 2, 3, 5 (theo đúng cấu hình đã chốt trước đó)
4. Gõ 1 Order ID vào ô tìm kiếm → Enter

## Thêm sheet mới sau này

Không cần code lại gì — bấm nút **"+ Thêm sheet"** ngay trên web, điền:
- Tên hiển thị
- Link Google Sheet
- Tab (để trống nếu muốn tìm trên tất cả các tab, như file Fullfill Check nhiều tab tháng)
- Cột Order ID: đúng tên tiêu đề cột trong sheet đó (VD "Order ID", "Mã đơn")
- Cột Cost: tên tiêu đề cột cost, HOẶC nếu cột đó không có tên rõ ràng (bị dính công thức tổng như Bên 1/Bên 5) thì điền **chữ cái cột** (VD "L" cho cột thứ 12)

Danh sách sheet lưu trong trình duyệt (localStorage) — mỗi máy/mỗi trình duyệt cần tự thêm lại 1 lần.

## Lưu ý

- Web chỉ **xem/tra cứu**, không sửa được dữ liệu — sửa cost/trạng thái vẫn làm trực tiếp trên Google Sheet như cũ.
- Bên 4 (`1JS9hn0gOaCnazjpjdquR2xPzAfg7xcQrZy5L36Nhy90`) hiện chưa share quyền cho `ducduynd098@gmail.com` nên chưa thêm được vào danh sách mặc định — share lại rồi thêm bằng nút "+ Thêm sheet".
- Nếu 1 team member khác cần dùng, chỉ cần: (a) share Google Sheet cho email họ, (b) thêm email họ vào "Test users" ở Bước 3, (c) họ tự mở domain và đăng nhập bằng email của họ.
