# 🚀 دليل تشغيل واختبار نظام غايتك

## المتطلبات
- Node.js (الإصدار 14+)
- MongoDB (محلي أو سحابي)
- npm أو yarn

---

## 1️⃣ التثبيت والإعداد

### الخطوة 1: تثبيت الحزم
```bash
cd d:\ghayaTech\_النظام المال\gayatech-system
npm run install:all
```

### الخطوة 2: إعداد متغيرات البيئة

**ملف `server/.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/gayatech_system
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

**ملف `client/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### الخطوة 3: زرع البيانات الأولية
```bash
npm run seed
```

---

## 2️⃣ التشغيل

### تشغيل الكل معاً (المفضل):
```bash
npm run dev
```

### أو تشغيل الأجزاء منفصلة:

**الخادم في نافذة:**
```bash
npm run dev:server
```

**الواجهة في نافذة أخرى:**
```bash
npm run dev:client
```

---

## 3️⃣ الدخول للنظام

بعد التشغيل، انتقل إلى:
```
http://localhost:5173
```

### بيانات دخول تجريبية:

| الدور | البريد الإلكتروني | كلمة المرور |
|------|------------------|----------|
| مدير | admin@gayatech.ps | admin123 |
| مالي | finance@gayatech.ps | finance123 |
| مشاريع | pm@gayatech.ps | pm123 |
| محاسب | accountant@gayatech.ps | accountant123 |
| موظف | employee@gayatech.ps | employee123 |

---

## 4️⃣ اختبار API (باستخدام Postman أو curl)

### التحقق من الخادم يعمل:
```bash
curl http://localhost:5000/
```

### تسجيل الدخول:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### الحصول على قائمة العملاء:
```bash
curl -X GET http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### إضافة عميل جديد:
```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "شركة التقنية",
    "email": "tech@company.ps",
    "phone": "0599123456",
    "address": "غزة"
  }'
```

---

## 5️⃣ اختبار الواجهة الأمامية

### التحقق من الصفحات الرئيسية:

1. **لوحة التحكم** `/`
   - عرض المؤشرات الرئيسية
   - عرض الإيرادات والمصاريف
   - الرسوم البيانية

2. **العملاء** `/clients`
   - عرض القائمة
   - إضافة عميل: `/clients/new`
   - تعديل عميل: `/clients/edit/:id`
   - تفاصيل العميل: `/clients/:id`

3. **العقود** `/contracts`
   - عرض القائمة
   - إضافة عقد: `/contracts/new`
   - تفاصيل العقد: `/contracts/:id`

4. **المشاريع** `/projects`
   - عرض القائمة
   - إضافة مشروع: `/projects/new`
   - تفاصيل المشروع: `/projects/:id`

5. **المعاملات المالية** `/transactions`
   - عرض المعاملات
   - إضافة معاملة: `/transactions/new`
   - فلترة حسب النوع

6. **الفواتير** `/invoices`
   - عرض الفواتير
   - إضافة فاتورة: `/invoices/new`

7. **المصاريف** `/expenses`
   - عرض المصاريف
   - إضافة مصروف: `/expenses/new`

8. **الموظفون** `/employees`
   - عرض القائمة
   - إضافة موظف: `/employees/new`
   - ملف الموظف: `/employees/:id`

9. **الرواتب** `/salaries`
   - عرض الرواتب
   - صرف راتب: `/salaries/new`

10. **السلف** `/advances`
    - عرض السلف
    - إضافة سلفة: `/advances/new`

11. **الشركاء** `/partners`
    - عرض الشركاء
    - إضافة شريك: `/partners/new`
    - ملف الشريك: `/partners/:id`

12. **الاشتراكات** `/subscriptions`
    - عرض الاشتراكات
    - إضافة اشتراك: `/subscriptions/new`

13. **التقارير** `/reports`
    - الإيرادات الشهرية: `/reports/monthly-revenue`
    - المصاريف الشهرية: `/reports/monthly-expenses`
    - الأرباح والخسائر: `/reports/profit-loss`
    - الديون المستحقة: `/reports/outstanding-debts`
    - أرصدة العملاء: `/reports/client-balances`
    - أرصدة الشركاء: `/reports/partner-balances`
    - أداء الموظفين: `/reports/employee-performance`
    - العقود النشطة: `/reports/active-contracts`
    - الاشتراكات: `/reports/subscriptions`

14. **الإعدادات** `/settings`
    - إدارة المستخدمين
    - الإعدادات النظام

---

## 6️⃣ اختبار الوظائف الأساسية

### ✅ اختبار CRUD كامل:

```javascript
// 1. إنشاء عميل جديد
POST /api/clients
{
  "name": "عميل تجريبي",
  "email": "test@client.ps",
  "phone": "0599111222"
}

// 2. الحصول على العميل
GET /api/clients/:id

// 3. تعديل العميل
PATCH /api/clients/:id
{
  "name": "عميل محدث"
}

// 4. حذف العميل
DELETE /api/clients/:id
```

### ✅ اختبار المعاملات المالية:

```javascript
// 1. دخل من عميل
POST /api/transactions
{
  "type": "income",
  "amount": 1000,
  "currency": "USD",
  "fromAccount": "reem",
  "description": "دفعة من العميل",
  "clientId": "..."
}

// 2. تحويل إلى حساب الشركة
POST /api/transactions
{
  "type": "transfer",
  "amount": 1000,
  "currency": "USD",
  "fromAccount": "reem",
  "toAccount": "company",
  "description": "تحويل من ريم"
}

// 3. مصروف من حساب الشركة
POST /api/transactions
{
  "type": "expense",
  "amount": 200,
  "currency": "USD",
  "toAccount": "company",
  "description": "إيجار مكتب"
}
```

### ✅ اختبار التقارير:

```javascript
// الإيرادات الشهرية
GET /api/reports/monthly-revenue

// المصاريف الشهرية
GET /api/reports/monthly-expenses

// الأرباح والخسائر
GET /api/reports/profit-loss
```

---

## 7️⃣ استكشاف الأخطاء

### مشاكل شائعة وحلولها:

#### ❌ لا يوجد اتصال بقاعدة البيانات
```bash
# تحقق من MongoDB يعمل
mongod --version

# تأكد من MONGODB_URI في .env
```

#### ❌ الخادم لا يعمل على المنفذ
```bash
# غيّر المنفذ في server/.env
PORT=5001

# أو اقتل العملية على المنفذ
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

#### ❌ الواجهة لا تتصل بالخادم
- تحقق من `VITE_API_URL` في `client/.env`
- تأكد من أن الخادم يعمل على `http://localhost:5000`

#### ❌ مشاكل CORS
- تأكد من إعدادات CORS في `server/config/cors.js`
- يجب أن تسمح بـ `http://localhost:5173`

---

## 8️⃣ أدوات مفيدة

### عرض السجلات:
```bash
# سجلات الخادم
npm run dev:server

# سجلات المتصفح (F12)
```

### قاعدة البيانات:
```bash
# عرض قاعدة البيانات عبر MongoDB Compass
# أو استخدم:
mongosh
> use gayatech_system
> db.clients.find()
```

### قائمة API كاملة:
```bash
curl http://localhost:5000/
```

---

## 9️⃣ تقرير النتائج

بعد الاختبار الشامل:
1. ✅ املأ [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
2. 📸 خذ لقطات شاشة للصفحات الرئيسية
3. 📊 وثّق أي مشاكل أو ملاحظات

---

## 🎯 الخطوات التالية

- [ ] اختبار جميع الصفحات
- [ ] اختبار جميع API endpoints
- [ ] اختبار الصلاحيات (Permissions)
- [ ] اختبار التقارير والتصدير
- [ ] اختبار البحث والفلترة
- [ ] اختبار الاستجابة على الأجهزة المختلفة
