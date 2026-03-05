# Đổ request từ Facebook Ads vào Order

Có **2 cách** chính để đưa lead/request từ Facebook Ads vào hệ thống Order:

---

## 1. Facebook Lead Ads + Webhook (tự động, real-time)

Khi chạy **Lead Ad** trên Facebook, user điền form ngay trên Facebook (tên, SĐT, email...). Facebook gửi webhook về server của bạn → backend tạo Order.

### Đã implement trong project

- **Webhook URL:** `GET` và `POST` → `https://your-domain.com/api/webhooks/facebook-leadgen`
- **Service:** `FacebookService::getLead()` gọi Graph API lấy chi tiết lead (`field_data`).
- **Controller:** `FacebookLeadgenWebhookController` — verify token (GET), xử lý leadgen (POST), tạo/update Order với `source=facebook`, `external_id=fb_lead_{leadgen_id}`.

### Cấu hình

1. **`.env`**
   ```env
   FB_LEADGEN_VERIFY_TOKEN=your_secret_verify_token_here
   ```
   (Dùng khi đăng ký webhook trong Facebook App.)

2. **Connected Account (Facebook)**  
   Trong credentials của tài khoản Facebook (type `facebook`), cần có:
   - `access_token`: Page access token có quyền `leads_retrieval`.
   - `page_id`: ID trang Facebook (để webhook biết lead thuộc company nào).

3. **Facebook App / Meta for Developers**
   - Tạo App → thêm product **Webhooks** → chọn **Page**.
   - Subscribe field **leadgen**.
   - Callback URL: `https://your-domain.com/api/webhooks/facebook-leadgen`.
   - Verify Token: cùng giá trị với `FB_LEADGEN_VERIFY_TOKEN`.
   - Cấp quyền: `pages_manage_metadata`, `pages_show_list`, `leads_retrieval` (và các quyền Page cần thiết).

4. **Lead form (trên Facebook)**  
   Các field chuẩn (tên, SĐT, email) sẽ được map vào Order:
   - `full_name` / `name` / `ho_ten` → `customer_name`
   - `phone_number` / `phone` / `sdt` → `phone`
   - Order mới có `status = 'lead'`.

Tài liệu Meta: [Webhooks for Leadgen](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen/), [Retrieving Lead Ads](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving/).

---

## 2. Landing page (link ads) + form gửi về backend

Ví dụ link ads: `https://www.teechhub.vn/kichotobomlop4in1` — đây là **landing page** bên ngoài. User click quảng cáo → vào trang → điền form. Để “đổ” thành Order bạn cần **form submit gửi về backend** của bạn.

### Cách làm

1. **Form trên landing page gửi về API của bạn**
   - Trên site (teechhub.vn hoặc domain bạn kiểm soát), form đăng ký/đặt hàng cần **POST** tới API, ví dụ:
     ```
     POST https://your-api.com/api/webhooks/landing-order
     Body: { "name": "...", "phone": "...", "email": "...", "utm_source": "facebook", "utm_campaign": "..." }
     ```
   - Backend nhận request → tạo Order với `source=facebook` (và lưu thêm utm nếu có cột/JSON).

2. **UTM trên link quảng cáo**
   - Link ads nên có UTM để biết nguồn từ Facebook Ads, ví dụ:
     ```
     https://www.teechhub.vn/kichotobomlop4in1?utm_source=facebook&utm_medium=cpc&utm_campaign=kich_binh
     ```
   - Khi user submit form, trang có thể gửi kèm `utm_source`, `utm_campaign`... trong body hoặc query.

3. **Nếu không sửa được form trên landing**
   - Dùng dịch vụ trung gian (Zapier, Make, form builder có webhook) nhận submit từ form → gọi API của bạn để tạo Order.
   - Hoặc export CSV từ nền tảng form/CRM rồi **import CSV** vào hệ thống (cần thêm chức năng import trong app).

---

## Tóm tắt

| Cách | Nguồn | Cách đổ vào Order |
|------|--------|-------------------|
| **Lead Ads + Webhook** | Form Lead Ad trên Facebook | Webhook `POST /api/webhooks/facebook-leadgen` → tự tạo Order (đã có trong code). |
| **Landing page** | Form trên site (vd: teechhub.vn) | Form POST về API của bạn (cần thêm endpoint `POST /api/webhooks/landing-order` hoặc tương tự) → tạo Order. |

Nếu bạn dùng **Lead Ad** (form trên Facebook): chỉ cần cấu hình App, webhook và Connected Account như mục 1.  
Nếu bạn dùng **link ads** tới landing (như teechhub.vn): cần form trên trang đó gửi dữ liệu về API của bạn (mục 2); có thể bổ sung endpoint nhận POST và tạo Order nếu bạn muốn.
