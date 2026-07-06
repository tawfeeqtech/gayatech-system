# Gayatech System — نظام إدارة الشركات المالي والتشغيلي

## 1. نظرة عامة على المشروع

غايتك (Gayatech) هو نظام متكامل لإدارة الشركات الصغيرة والمتوسطة، مبني على هندسة REST API مع واجهة ويب حديثة. يغطي النظام جميع العمليات المالية والتشغيلية: إدارة العملاء، العقود، المشاريع، المعاملات المالية متعددة العملات، الفواتير، الرواتب، الاشتراكات، والمحافظ.

- **الجمهور المستهدف:** شركات الخدمات التقنية والتسويقية التي تدير عقوداً شهرية ومشاريع لمرة واحدة
- **طبيعة العمل:** 90% من العمليات مالية (فواتير، مدفوعات، مصاريف، رواتب، تحويلات عملات)، 10% تشغيلية (مشاريع، مهام، موظفين)
- **اللغات:** الواجهة عربية بالكامل (RTL)، الكود بالإنجليزية، البيانات بالعربية

## 2. الهيكل التقني

```
/data/gayatech-system/
├── server/                          # Express.js API — المنفذ 9001
│   ├── server.js                    # نقطة الدخول: 28 نموذج Mongoose + 25 مسار API
│   ├── config/
│   │   ├── db.js                    # اتصال MongoDB (process.env.MONGODB_URI)
│   │   ├── cors.js                  # CORS: يسمح بـ blog.ghayatech.com + localhost
│   │   ├── env.js                   # تحميل .env وتصدير port, jwtSecret, nodeEnv
│   │   └── roles.js                 # نظام الصلاحيات: 5 أدوار × 21 وحدة
│   ├── models/                      # 28 نموذج Mongoose (انظر القسم 4)
│   ├── controllers/                 # منطق الأعمال لكل مسار
│   ├── routes/                      # تعريف المسارات (25 ملف)
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect + authorize(...roles)
│   │   ├── roleCheck.js             # بديل لـ authorize بنفس الوظيفة
│   │   ├── permissionCheck.js       # صلاحيات متقدمة على مستوى الوحدات
│   │   └── errorHandler.js          # معالج أخطاء مركزي
│   ├── cron/scheduledTasks.js       # مهام مجدولة: توليد رواتب + فواتير شهرية تلقائياً
│   └── seed/seedData.js             # بيانات اختبار أولية
├── client/                          # React + Vite — المنفذ 9173
│   ├── src/
│   │   ├── main.jsx                 # نقطة الدخول: Redux + Router + AntD ConfigProvider (RTL)
│   │   ├── App.jsx                  # 45+ مسار مع حماية ProtectedRoute حسب الأدوار
│   │   ├── api/                     # 32 ملف Axios (واحد لكل وحدة)
│   │   │   └── axios.js             # baseURL: https://api.ghayatech.com/api + JWT interceptor
│   │   ├── components/
│   │   │   ├── layout/              # MainLayout, Sidebar, TopBar, NotificationBell, PageTitleUpdater
│   │   │   ├── ui/                  # DataTable, StatCard, StatusBadge, SmartSelect, FormField, ConfirmDialog, Modal, EmptyState, WalletSelector, BulkEditModal, Loading, NetworkStatus
│   │   │   └── charts/              # BarChart, LineChart, PieChart (مغلفات Recharts)
│   │   ├── pages/                   # صفحات كاملة — مجلد لكل وحدة
│   │   ├── redux/                   # Redux Toolkit: authSlice, clientSlice, transactionSlice, notificationSlice
│   │   ├── hooks/                   # useAuth, useCurrencies, useNotification, usePermission
│   │   └── utils/                   # auth, constants, formatters, permissions, validators
│   └── dist/                        # بناء إنتاجي (يُخدم عبر vite preview)
├── docs/
│   ├── design-language-audit.md     # تدقيق واجهة المستخدم الحالية
│   └── design-system-proposal.md    # مقترح نظام تصميم موحد
└── .cloudflared/config-gayatech.yml # Cloudflare Tunnel: blog → 9173, api → 9001
```

### الحزمة التقنية

| الطبقة | التقنية |
|--------|---------|
| **الخادم** | Node.js + Express 4 + Mongoose 8 |
| **قاعدة البيانات** | MongoDB 7 (بدون كلمة مرور، localhost:27017) |
| **الواجهة** | React 19 + Vite 8 + Ant Design 5 + Tailwind CSS 3 |
| **إدارة الحالة** | Redux Toolkit |
| **التوجيه** | React Router 7 |
| **الرسوم البيانية** | Recharts 3 |
| **المصادقة** | JWT (access token في localStorage) |
| **النطاق** | Cloudflare Tunnel → blog.ghayatech.com + api.ghayatech.com |
| **الخط** | Cairo (Google Fonts)، الواجهة RTL كاملة |
| **السحب والإفلات** | @hello-pangea/dnd |
| **التصدير** | html2canvas + jsPDF (PDF)، xlsx (Excel)، react-csv (CSV) |

### تشغيل الخدمات

```bash
# MongoDB
/data/mongodb/mongod --dbpath /data/mongodb/data --fork --logpath /data/mongodb/mongod.log

# الخادم (Express)
cd /data/gayatech-system/server && node server.js    # أو npm run dev مع nodemon

# الواجهة (بعد البناء)
cd /data/gayatech-system/client && npm run build && npx vite preview --port 9173 --host 0.0.0.0

# Cloudflare Tunnel
cloudflared tunnel --config /data/.cloudflared/config-gayatech.yml run gayatech-blog

# البناء الكامل + النشر
cd /data/gayatech-system/client && npm run build
# ثم أعد تشغيل vite preview
```

> **⚠️ أبداً لا تغير بورتات غايتك:** API على 9001، الواجهة على 9173. مثبتة في إعدادات Cloudflare والـ nginx/CORS.

---

## 3. أدوار المستخدمين والصلاحيات

| الدور | الاسم | الوحدات | بيانات مالية؟ | حذف؟ | إدارة مستخدمين؟ |
|-------|-------|---------|:---:|:---:|:---:|
| `admin` | مدير النظام | **الكل** (21 وحدة) | ✅ | ✅ | ✅ |
| `finance` | مدير مالي | dashboard, transactions, invoices, expenses, vendors, accounts, wallets, currencyExchange, reports, subscriptions | ✅ | ❌ | ❌ |
| `pm` | مدير مشاريع | dashboard, clients, contracts, projects, employees, reports (غير مالية) | ❌ | ❌ | ❌ |
| `accountant` | محاسب | dashboard, invoices, expenses, vendors, accounts, wallets | ✅ | ❌ | ❌ |
| `employee` | موظف | dashboard, salaries (راتبي فقط) | ❌ | ❌ | ❌ |

### توزيع الصلاحيات في الملفات

1. **الخادم** — `server/config/roles.js`: صلاحيات على مستوى الوحدات (VIEW/CREATE/EDIT/DELETE)
2. **الخادم** — `server/middleware/auth.js`: `protect` + `authorize(...roles)` على المسارات
3. **الواجهة** — `client/src/App.jsx`: `ROUTE_ROLES` + `ProtectedRoute` لإخفاء/عرض المسارات
4. **الواجهة** — `client/src/components/layout/Sidebar.jsx`: إخفاء عناصر القائمة حسب الدور
5. **المستخدم** — `User.permissions`: صلاحيات مخصصة (canDeleteInvoices, canImportData, canManageUsers, canExportReports, canViewFinancialReports)

### المستخدم الافتراضي (admin)
- **اسم المستخدم:** `admin`
- **كلمة المرور:** `admin123`
- **الدور:** `admin`

---

## 4. نماذج قاعدة البيانات (28 نموذج)

### النماذج الأساسية

| النموذج | الملف | الحقول الرئيسية | ملاحظات |
|---------|-------|-----------------|--------|
| **User** | `User.js` | username, email, password, fullName, role, permissions{}, isActive, employee(ref), preferences{} | password: `select: false` |
| **Account** | `Account.js` | name, accountType (بنك/محفظة/وسيط/نقد/أخرى), currency, computedBalance, isActive, wallets[] | الحسابات تحتوي محافظ |
| **Wallet** | `Wallet.js` | name, account(ref), currency, balance, isActive, isDefault | مؤشر مركب: account+currency فريد |
| **Transaction** | `Transaction.js` | transactionNumber, type (دخل/مصروف/تحويل), nature (خارجي/داخلي), amount, currency, transactionDate, fromWallet, toWallet, client, contractMonth, invoice, project, allocations[], paymentMethod, status | **Middleware:** pre-delete يعكس الرصيد |
| **CurrencyExchange** | `CurrencyExchange.js` | fromWallet, toWallet, fromAmount, toAmount, exchangeRate, status | تحويلات بين العملات |

### العملاء والعقود والمشاريع

| النموذج | الحقول الرئيسية | حالات (enum) |
|---------|-----------------|-------------|
| **Client** | name, company, email, phone, clientType, source(ref:IncomeSource), status, preferredCurrency, computedStats{} | نشط / غير نشط / متوقف مؤقتاً / محظور |
| **Contract** | contractNumber, client, title, serviceType, defaultMonthlyValue, currency, startDate, endDate, dueDayOfMonth, status, autoGeneration{} | نشط / متوقف / منتهي / ملغي |
| **ContractMonth** | contract, client, month (YYYY-MM), value, currency, status, paidAmount, remainingAmount, assignedEmployees[] | pending_review / confirmed / paid / partially_paid / overdue / cancelled / paused |
| **Project** | projectNumber, client, title, serviceType, totalValue, currency, startDate, deliveryDate, status, deliveryStatus | قيد التخطيط / قيد التنفيذ / تحت المراجعة / مكتمل / تم التسليم / متوقف / ملغي |
| **ProjectTask** | project, title, status, assignedTo[{employee}], priority, dueDate | لم تبدأ / قيد التنفيذ / مكتملة / ملغاة / قيد المراجعة |
| **Invoice** | invoiceNumber, client/employee/vendor, project, salary/advance/expense/subscription (ref), invoiceType, totalAmount, currency, issueDate, dueDate, status, paidAmount, remainingAmount | مسودة / مرسلة / مدفوعة / مدفوعة جزئياً / متأخرة / ملغاة |
| **Vendor** | name, vendorType, email, phone, services[] | — |

### الموارد البشرية

| النموذج | الحقول الرئيسية | حالات |
|---------|-----------------|-------|
| **Employee** | name, email, phone, jobTitle, department, baseSalary, salaryCurrency, joiningDate, status, user(ref), computedStats{}, skills[] | نشط / إجازة / متوقف / مستقيل / مفصول |
| **Salary** | employee(ref), month, baseAmount, deductionItems[], deductions, bonuses, totalAmount, currency, status, paidAmount, invoice(ref), transaction(ref) | مستحق / مدفوع / مدفوع جزئياً / معلق |
| **Advance** | employee(ref), amount, currency, requestDate, repaidAmount, remainingAmount, status, repaymentMethod, installmentAmount, invoice(ref) | معلقة / موافق عليها / مرفوضة / مسددة / مسددة جزئياً |
| **JobTitle** | name (مثال: 'مطور برمجيات')، department | — |
| **Department** | name | — |

### الشراكات والاشتراكات والمصاريف

| النموذج | الحقول الرئيسية | ملاحظات |
|---------|-----------------|--------|
| **Partner** | name, partnerType, email, phone, computedStats{totalFunded, totalRepaid, balance}, status | مؤشرات محسوبة تلقائياً |
| **PartnerFunding** | partner(ref), amount, currency, type (تمويل/سداد), date | — |
| **Subscription** | provider, vendorRef, serviceName, category, amount, currency, startDate, endDate, renewalType, status, isPaid, invoices[], reminderDays[] | تجديد: شهري/ربع/نصف/سنوي/مرة |
| **Expense** | description, amount, currency, expenseDate, category(ref:ExpenseCategory), vendor(ref), invoice(ref), receipt, status | — |
| **ExpenseCategory** | name | — |
| **IncomeSource** | name | مصادر الدخل لتصنيف العملاء |

### الإعدادات والبيانات المرجعية

| النموذج | الوصف |
|---------|-------|
| **SystemSettings** | إعدادات النظام العامة |
| **Notification** | إشعارات المستخدمين |
| **Country** / **City** | بيانات الدول والمدن |
| **Currency** | العملات المدعومة (USD, ILS, SAR, JOD, EUR) |

### تحذيرات معمارية مهمة

- **Wallet.balance مخزن static وليس محسوباً من Transaction:** أي حذف مباشر من MongoDB سيترك الرصيد خاطئاً. تمت إضافة middleware `pre('findOneAndDelete')` و `pre('deleteMany')` على Transaction ليعكس الرصيد تلقائياً — لكن يفضل دائماً حذف المعاملات عبر API.
- **Account.computedBalance** منفصل عن Wallet.balance ولا يُحدث تلقائياً مع كل معاملة.
- **Client.computedStats** يخزن إحصائيات محسوبة تحتاج للتحديث عند تغير البيانات المرتبطة.

---

## 5. مسارات API الرئيسية

| المسار | الوظيفة | الصلاحيات |
|--------|---------|-----------|
| `POST /api/auth/login` | تسجيل الدخول | عام |
| `GET /api/auth/me` | بيانات المستخدم الحالي | protect |
| `POST /api/auth/logout` | تسجيل الخروج | protect |
| `GET /api/dashboard/:role` | لوحة التحكم حسب الدور (admin/finance/pm/accountant/employee) | protect |
| `GET /api/dashboard/notifications` | الإشعارات الأخيرة | protect |
| `GET /api/dashboard/export?type=json` | تصدير بيانات اللوحة | protect |
| `GET /api/clients` | قائمة العملاء | admin, pm |
| `POST /api/clients` | إنشاء عميل | admin, pm |
| `GET /api/contracts` | قائمة العقود | admin, pm |
| `POST /api/contracts` | إنشاء عقد | admin, pm |
| `GET /api/contract-months` | أشهر العقود | admin, pm |
| `PUT /api/contract-months/:id` | تحديث شهر عقد | admin, pm |
| `GET /api/projects` | قائمة المشاريع | admin, pm |
| `POST /api/projects` | إنشاء مشروع | admin, pm |
| `GET /api/projects/:id/tasks` | مهام مشروع | admin, pm |
| `POST /api/projects/:id/tasks` | إضافة مهمة | admin, pm |
| `GET /api/transactions` | قائمة المعاملات | admin, finance |
| `POST /api/transactions` | إنشاء معاملة | admin, finance |
| `DELETE /api/transactions/:id` | حذف معاملة (مع عكس الرصيد) | admin |
| `GET /api/invoices` | قائمة الفواتير | admin, finance, accountant |
| `POST /api/invoices` | إنشاء فاتورة | admin, finance, accountant |
| `GET /api/expenses` | قائمة المصاريف | admin, finance, accountant |
| `POST /api/expenses` | إضافة مصروف | admin, finance, accountant |
| `GET /api/accounts` | الحسابات والمحافظ | admin, finance, accountant |
| `POST /api/wallets` | إنشاء محفظة | admin, finance, accountant |
| `GET /api/employees` | قائمة الموظفين | admin, finance, pm |
| `POST /api/employees` | إضافة موظف | admin, finance, pm |
| `GET /api/salaries` | قائمة الرواتب | admin, finance, employee |
| `POST /api/salaries` | إنشاء راتب | admin, finance |
| `GET /api/salaries/my-salaries` | رواتب الموظف الحالي | admin, finance, employee |
| `GET /api/advances` | قائمة السلف | admin, finance |
| `POST /api/advances` | طلب سلفة | admin, finance |
| `GET /api/partners` | قائمة الشركاء | admin, finance |
| `GET /api/subscriptions` | قائمة الاشتراكات | admin, finance |
| `POST /api/subscriptions` | إضافة اشتراك | admin, finance |
| `GET /api/reports/*` | التقارير المختلفة (15+ تقرير) | admin, finance, pm |
| `POST /api/import` | استيراد بيانات من Excel | admin, finance |
| `GET/PUT /api/settings` | إعدادات النظام | admin |
| `GET/POST /api/users` | إدارة المستخدمين | admin |
| `GET /api/currencies` | العملات وأسعار الصرف | admin |

---

## 6. سير العمل النموذجي

### سير العمل المالي (Admin/Finance)
1. **إضافة عميل** → clients/new
2. **إنشاء عقد شهري** → contracts/new (يولد أشهر العقد تلقائياً على حسب المدة)
3. **تأكيد أشهر العقد** → contract-months (تغيير الحالة من pending_review → confirmed)
4. **إنشاء فاتورة** ← من شهر عقد مؤكد
5. **تسجيل دفعة (معاملة)** → transactions/new — تحدد الفاتورة والمحفظة
6. **الفاتورة تصبح مدفوعة/مدفوعة جزئياً** تلقائياً

### سير العمل التشغيلي (PM)
1. **إضافة عميل** → clients/new
2. **إنشاء مشروع** → projects/new (يرتبط بالعميل)
3. **إضافة مهام** ← من داخل تفاصيل المشروع
4. **تعيين موظفين للمهام** → assignedTo
5. **تتبع حالة المشروع** → dashboard/pm

### سير عمل الموظف
1. **تسجيل الدخول** → يشاهد لوحة تحكم الموظف (راتبي، مهامي، إحصائياتي)
2. **عرض الراتب** → /my-salary (تفاصيل الراتب الشهري مع الخصومات والسلف)

### التوليد التلقائي
- **الرواتب:** cron job يومي — يولد رواتب الموظفين النشطين تلقائياً أول كل شهر
- **فواتير العقود:** cron job يومي — يولد فواتير أشهر العقود المؤكدة تلقائياً
- **تنبيهات الاشتراكات:** cron job — ينبه قبل انتهاء الاشتراكات حسب reminderDays

---

## 7. قواعد التطوير

### قبل أي تعديل
- **اقرأ الملفات ذات الصلة أولاً** — لا تفترض أسماء حقول أو قيم enum
- **جميع القيم بالعربية** في MongoDB (status, type, role, إلخ) — لا تستخدم الإنجليزية أبداً
- **أسماء الحقول بالإنجليزية** (transactionDate وليس date، computedStats وليس stats)
- **كل نموذج له `createdBy`** — لا تنسَ تعبئته من `req.user._id`
- **كل استعلام dashboard** يجب أن يستخدم `transactionDate` (Transaction) و `expenseDate` (Expense)

### عند تعديل الواجهة
- **البناء الإنتاجي:** الواجهة تُخدم من `client/dist/` عبر `vite preview`. أي تعديل يتطلب:
  ```bash
  cd /data/gayatech-system/client && npm run build
  # ثم أعد تشغيل vite preview (اقتل العملية القديمة أولاً)
  ```
- **Cairo font:** لا تكرر `fontFamily: 'Cairo'` في المكونات — الخط موروث من ConfigProvider
- **RTL:** استخدم `direction: 'rtl'` موروث من ConfigProvider، لا تضبطه يدوياً
- **استدعاءات API:** استخدم `api` من `../../api/axios` (وليس axios مباشرة) ليتم تضمين التوكن تلقائياً. الـ baseURL هو `https://api.ghayatech.com/api` فلا تضف `/api` في بداية المسار.
- **المسارات:** استخدم `@components`, `@pages`, `@api`, `@utils`, `@hooks` كـ aliases

### عند تعديل الخادم
- **التوثيق:** استخدم `protect` + `authorize(...roles)` على كل مسار
- **التحقق:** استخدم Joi للتحقق من المدخلات
- **الأخطاء:** استخدم `ApiError` (موجود في `utils/ApiError.js`) مع رسائل عربية
- **المهام المجدولة:** عدل `server/cron/scheduledTasks.js` لتعديل سلوك التوليد التلقائي

### GitHub
- **المستودع:** `github.com/tawfeeqtech/gayatech-system`
- **بعد كل تعديل:** commit + push (توفيق يفضّل push تلقائي دون سؤال)
- **قبل البدء:** `git pull` لتفادي التعارضات

---

## 8. بيانات الاختبار

### مستخدمون
| username | password | الدور |
|----------|----------|-------|
| `admin` | `admin123` | مدير النظام |
| `finance1` | `finance123` | مدير مالي |
| `pm1` | `pm123` | مدير مشاريع |
| `accountant1` | `accountant123` | محاسب |
| `employee1` | `employee123` | موظف |

### عملات
USD (دولار), ILS (شيكل), SAR (ريال سعودي), JOD (دينار أردني), EUR (يورو)

---

## 9. نصائح للاختبار

### اختبار الصلاحيات
- سجل دخول بكل دور وتأكد من:
  - عناصر القائمة الجانبية الظاهرة
  - الوصول للمسارات (المسموح يعمل، الممنوع يعرض رسالة ⛔)
  - API يرفض بـ 403 للأدوار غير المصرحة

### اختبار صحة البيانات
- أنشئ عميل → أنشئ عقد → أكد شهر → أنشئ فاتورة → سجل دفعة → تأكد من تحديث حالة الفاتورة للشهر
- أنشئ معاملة وحاول حذفها → تأكد من عكس أثرها على رصيد المحفظة
- لوحة التحكم: تأكد من تغير البيانات مع تغيير الفلتر الزمني (يوم/أسبوع/شهر/سنة)

### اختبار التوليد التلقائي
- غيّر تاريخ النظام أو انتظر بداية الشهر → تحقق من توليد الرواتب وفواتير العقود

### سيناريوهات حرجة
- حذف معاملة مرتبطة بفاتورة → هل تتحدث حالة الفاتورة؟
- إنشاء عقد ثم تقصير مدته → هل تحذف الأشهر غير المدفوعة؟
- تحويل بين عملات → هل تُنشأ معاملتان (مصروف + دخل) بعملات مختلفة؟
