# Đưa Rankev lên Google Play — hướng dẫn từng bước

Mọi thứ kỹ thuật đã sẵn sàng: app Android đã ký, ảnh, mô tả, chính sách. Bạn chỉ cần làm các bước
cần **tài khoản / thanh toán / danh tính** của bạn (Google không cho người khác làm thay).

| Có sẵn | Ở đâu |
|---|---|
| Icon 512×512 | `store/icon-512.png` |
| Ảnh bìa 1024×500 | `store/feature-graphic.png` |
| 7 ảnh chụp màn hình 1080×2160 | `store/screenshots/` |
| Khoá ký app (upload key) | `C:\Users\MyPC\Desktop\rankev-keys\` (KHÔNG nằm trong Git) |
| Chính sách quyền riêng tư | https://rankev-backend.onrender.com/legal/privacy |
| Trang xoá tài khoản | https://rankev-backend.onrender.com/legal/delete-account |
| Tiêu chuẩn an toàn trẻ em | https://rankev-backend.onrender.com/legal/child-safety |

> **Thời gian thực tế:** tài khoản cá nhân mới phải **thử nghiệm kín ≥ 12 người trong 14 ngày liên tục**
> trước khi được phát hành công khai (quy định của Google cho tài khoản cá nhân tạo sau 11/2023).
> Kế hoạch hợp lý: tuần này lên "Thử nghiệm nội bộ" để bạn tự cài từ Play → mời 12+ người vào
> "Thử nghiệm kín" → sau 14 ngày nộp "Phát hành chính thức" (Google duyệt thường vài ngày).

---

## Bước 1 — Sao lưu khoá ký app (2 phút, làm NGAY)

Thư mục `C:\Users\MyPC\Desktop\rankev-keys\` chứa khoá dùng để ký mọi bản cập nhật app.
**Chép cả thư mục vào Google Drive riêng tư hoặc USB.** Mất khoá → phải xin Google đặt lại
(Play Console → App integrity → Request upload key reset), mất vài ngày.

## Bước 2 — Cho GitHub ký app tự động (3 phút)

1. Mở https://github.com/tobi-tan/rankev-web/settings/secrets/actions → **New repository secret**.
2. Secret thứ nhất:
   - Name: `RANKEV_UPLOAD_KEYSTORE_BASE64`
   - Secret: mở file `rankev-keys\rankev-upload.p12.base64.txt` bằng Notepad → Ctrl+A → Ctrl+C → dán.
3. Secret thứ hai:
   - Name: `RANKEV_UPLOAD_KEYSTORE_PASSWORD`
   - Secret: nội dung file `rankev-keys\rankev-upload-password.txt`.
4. Nhắn Claude "đã thêm secrets" — Claude sẽ chạy build. Sau ~8 phút có file nộp Play:
   **https://github.com/tobi-tan/rankev-web/releases/download/android-latest/rankev-play.aab**
   (mỗi lần cập nhật code, file này tự build lại với số phiên bản mới).

## Bước 3 — Đăng ký tài khoản nhà phát triển (25 USD, một lần)

1. https://play.google.com/console/signup — đăng nhập Gmail của bạn.
2. Chọn **Cá nhân (Personal)** (tổ chức cần số D-U-N-S, để sau).
3. Trả phí 25 USD bằng thẻ quốc tế; xác minh danh tính bằng **CCCD**; xác minh một **điện thoại
   Android thật** qua app Play Console (Google yêu cầu với tài khoản cá nhân).
4. Thông tin liên hệ công khai: email `letrannhattan1104@gmail.com` (đổi sau khi có tên miền).

## Bước 4 — Bật đăng nhập Google trong app Android (5 phút)

App Android đăng nhập Google theo cách native — Google cần biết "chữ ký" của app.

1. Mở https://console.cloud.google.com/apis/credentials — chọn **đúng project** đang chứa
   OAuth client Web của Rankev (`990057326052-…apps.googleusercontent.com`).
2. **Create credentials → OAuth client ID → Application type: Android**
   - Name: `Rankev Android (upload key)`
   - Package name: `com.rankev.app`
   - SHA-1: `15:CF:94:95:6E:41:42:DA:C5:AF:09:B1:63:E2:6C:39:E8:55:83:27`
3. Sau khi tải AAB lên Play (Bước 6), vào Play Console → **Test and release → App integrity →
   App signing** → copy **SHA-1 của "App signing key certificate"** → tạo thêm một OAuth client
   Android nữa với SHA-1 đó (`Rankev Android (Play)`). Bản cài từ Play dùng khoá này.
4. Gửi Claude **SHA-256** của "App signing key certificate" (cùng trang) — Claude sẽ thêm
   `assetlinks.json` để link `https://rankev-web.vercel.app/...` mở thẳng app.

Không cần sửa code — app dùng chung Client ID loại Web.

## Bước 5 — Tạo app trong Play Console

**Create app**:
- App name: `Rankev - Bình chọn & xếp hạng`
- Default language: `Tiếng Việt – vi`
- App or game: **App** · Free or paid: **Free**
- Tích các cam kết (Developer Program Policies, US export laws).

### 5.1 Store listing (Grow users → Store presence → Main store listing)

**Tên app (≤ 30 ký tự):** `Rankev - Bình chọn & xếp hạng`

**Mô tả ngắn (≤ 80 ký tự):**
```
Bình chọn, xếp hạng mọi thứ và xem ngay cả cộng đồng đang nghĩ gì.
```

**Mô tả đầy đủ:**
```
Rankev là mạng xã hội bình chọn: bạn hỏi — cộng đồng chọn — kết quả hiện ngay.

🏆 RANKIE — BÌNH CHỌN MỌI THỨ
Món ăn sáng quốc dân? Đội nào vô địch mùa này? Mèo hay chó? Tạo bình chọn trong vài giây với nhiều kiểu: đối đầu 1-1, xếp hạng nhiều lựa chọn, bình chọn không giới hạn. Biểu đồ cập nhật trực tiếp, kèm "dòng thời gian cạnh tranh" cho thấy ai vượt lên dẫn đầu.

⚔️ GIẢI ĐẤU LOẠI TRỰC TIẾP
Tổ chức giải 8, 16 đấu thủ như World Cup: mỗi trận là một cuộc bình chọn, bảng nhánh tự cập nhật từ tứ kết tới chung kết. Dự đoán kết quả, theo dõi từng vòng, cổ vũ đội của bạn.

🧭 PATH — TRẮC NGHIỆM TÍNH CÁCH
Trả lời vài câu hỏi để khám phá bạn là ai: hợp nghề gì, sống sót trong rừng thế nào… Có cả câu hỏi chạm vào ảnh. Xem bao nhiêu người cùng kết quả với bạn.

📝 SURVEY & EXAM
Khảo sát ẩn danh, đố vui chấm điểm tự động, trình chiếu trực tiếp cho cả lớp hoặc cả nhóm tham gia bằng mã.

💬 KẾT NỐI
Bình luận, @nhắc tên bạn bè, nhắn tin, chia sẻ bài, RankUp những người bạn yêu thích để thấy bài của họ trước.

🛡️ AN TOÀN & RIÊNG TƯ
• Báo cáo, chặn, ẩn nội dung bất cứ lúc nào — mọi báo cáo được xem xét trong 24 giờ.
• Thông tin cá nhân bạn đặt "Ẩn" chỉ dùng ẩn danh cho thống kê.
• Không bán dữ liệu, không quảng cáo theo dõi.
• Tải bản sao dữ liệu và xoá tài khoản ngay trong ứng dụng.

Rankev dành cho người từ 13 tuổi trở lên.
```

- App icon: `store/icon-512.png` · Feature graphic: `store/feature-graphic.png`
- Phone screenshots: tải lên 7 ảnh trong `store/screenshots/` theo thứ tự tên file.
- Category: **Social** · Tags: Social networking, Polls/Voting (chọn gần nhất có).
- Contact email: `letrannhattan1104@gmail.com`.

### 5.2 App content (Policy → App content) — trả lời như sau

| Mục | Trả lời |
|---|---|
| **Privacy policy** | `https://rankev-backend.onrender.com/legal/privacy` |
| **App access** | *All or some functionality is restricted* → thêm hướng dẫn: tài khoản kiểm duyệt viên (xem dưới) |
| **Ads** | No, my app does not contain ads |
| **Content rating** | Làm bảng câu hỏi IARC (xem dưới) |
| **Target audience** | 13–15, 16–17, 18+ (KHÔNG chọn dưới 13). "Appeals to children": **No** |
| **News app** | No |
| **Data safety** | Xem bảng dưới |
| **Government app** | No |
| **Financial features** | My app doesn't provide any financial features |
| **Health** | No health features |
| **Account deletion** | Có tạo tài khoản → URL: `https://rankev-backend.onrender.com/legal/delete-account` |
| **Child safety standards** | URL: `https://rankev-backend.onrender.com/legal/child-safety` · Đầu mối: `letrannhattan1104@gmail.com` |

**Tài khoản cho người duyệt của Google (App access):** tự đăng ký trong app một tài khoản riêng,
ví dụ `rankev.review@gmail.com` (hoặc email phụ của bạn) + mật khẩu riêng, chọn @handle như
`rankev_review`, đi hết phần giới thiệu. Điền email + mật khẩu đó vào ô hướng dẫn và ghi:
"Đăng nhập bằng email/mật khẩu ở màn hình đầu tiên. Mọi tính năng mở sau khi đăng nhập."

**Content rating (IARC):** Category → *Social networking, forums, blogs and UGC sharing*.
- Người dùng tương tác / trao đổi nội dung với nhau: **Yes**
- Chia sẻ vị trí: **No** · Mua hàng số: **No** · Cờ bạc / mô phỏng cờ bạc: **No**
- Nội dung bạo lực / tình dục / ngôn từ thô tục do chính app tạo ra: **No**
- Có cơ chế kiểm duyệt nội dung người dùng (báo cáo, chặn): **Yes**
→ Kết quả thường là **12+ / Teen**.

**Data safety** (Policy → App content → Data safety):
- *Does your app collect or share any of the required user data types?* **Yes**
- *Is all user data encrypted in transit?* **Yes**
- *Do you provide a way for users to request that their data be deleted?* **Yes**
- *Shared with third parties?* **No** (nhà cung cấp hạ tầng xử lý thay mặt Rankev không tính là "chia sẻ").

| Loại dữ liệu | Thu thập | Bắt buộc? | Mục đích |
|---|---|---|---|
| Personal info → **Name** | Có | Bắt buộc | App functionality, Account management |
| Personal info → **Email address** | Có | Bắt buộc | Account management, Developer communications |
| Personal info → **User IDs** | Có | Bắt buộc | App functionality, Account management |
| Personal info → **Other info** (ngày sinh, giới tính, nghề) | Có | Tuỳ chọn | App functionality, Analytics |
| Photos and videos → **Photos**, **Videos** | Có | Tuỳ chọn | App functionality |
| Messages → **Other in-app messages** | Có | Tuỳ chọn | App functionality |
| App activity → **App interactions** (bình chọn, tham gia) | Có | Bắt buộc | App functionality, Analytics |
| App activity → **Other user-generated content** (bài, bình luận) | Có | Tuỳ chọn | App functionality |

Không thu thập: vị trí, danh bạ, tài chính, sức khoẻ, lịch sử duyệt web, mã thiết bị quảng cáo.
Lịch sử tìm kiếm chỉ lưu trên máy (không gửi lên máy chủ) → không khai.

## Bước 6 — Phát hành

1. **Test and release → Testing → Internal testing → Create new release**
   - Tải file `rankev-play.aab` (link ở Bước 2) lên.
   - Chọn **Use Google Play App Signing** (mặc định) → Next.
   - Release notes: `Phiên bản đầu tiên của Rankev.`
   - Tab **Testers**: tạo danh sách gồm Gmail của bạn → copy link tham gia → mở trên điện thoại →
     cài Rankev từ Play Store.
2. Làm Bước 4.3 (SHA-1 khoá Play) để đăng nhập Google chạy trên bản tải từ Play.
3. **Closed testing → Create track** → thêm **ít nhất 12 Gmail** (bạn bè, người thân) → họ bấm link
   tham gia + cài app + giữ trong 14 ngày.
4. Sau 14 ngày: **Production → Apply for production** → trả lời vài câu về đợt thử nghiệm → nộp.

## Cập nhật app về sau

Mỗi lần Claude đẩy code lên `main`, GitHub tự build `rankev-play.aab` mới (số phiên bản tự tăng).
Vào Play Console → track đang dùng → **Create new release** → tải file mới lên → **Rollout**.
- **Máy chủ** (dữ liệu, bình chọn, chính sách, kiểm duyệt…) cập nhật tức thì cho mọi người, không cần nộp lại.
- **Giao diện** được đóng gói sẵn trong app → người dùng Android chỉ thấy thay đổi giao diện khi bạn nộp
  bản mới và họ cập nhật từ Play (Google duyệt bản cập nhật thường trong vài giờ – 1 ngày).
  Không cần nộp sau mỗi thay đổi nhỏ — gom lại nộp 1–2 tuần/lần là hợp lý. Bản web vẫn cập nhật ngay.
