# Gayatech System — نظام المحاسبة المالية

## المشروع
نظام محاسبة مالية متعدد العملات (USD, ILS, JOD, SAR) مع إدارة محافظ وتحويلات عملات.

## الهيكل

```
/data/gayatech-system/
├── server/                    # Express.js backend
│   ├── server.js              # نقطة الدخول (بورت 5000)
│   ├── config/
│   │   ├── db.js              # اتصال MongoDB
│   │   └── cors.js            # إعدادات CORS مع trycloudflare
│   ├── models/
│   │   ├── Account.js         # حسابات المستخدمين
│   │   ├── Wallet.js          # المحافظ (belongsTo Account, currency, balance)
│   │   ├── Transaction.js     # المعاملات المالية (income/expense)
│   │   └── CurrencyExchange.js# تحويلات العملات (fromWallet→toWallet)
│   ├── controllers/           # منطق الأعمال
│   └── routes/                # تعريف المسارات
├── client/                    # React + Vite + Ant Design
│   └── src/
│       ├── api/               # دوال API (axios)
│       ├── components/        # مكونات قابلة لإعادة الاستخدام
│       │   └── ui/
│       │       ├── DataTable.jsx
│       │       └── WalletSelector.jsx  # عرض المحافظ مع الرصيد
│       ├── pages/             # الصفحات
│       │   ├── Transactions/  # المعاملات المالية
│       │   └── CurrencyExchange/ # تحويل العملات
│       └── App.jsx
```

## Spec Kit

Spec Kit (specify-cli v0.11.3) مثبت ومهيّأ في `.specify/`. استخدم الـ workflow التالي للميزات الجديدة:

1. اطلب مني "use speckit-specify for [feature]" ← أخلق ملف spec
2. "use speckit-plan for [feature]" ← أخلق خطة تنفيذ
3. "use speckit-tasks for [feature]" ← أخلق قائمة مهام
4. أنفذ مباشرة

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
