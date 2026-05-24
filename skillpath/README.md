# SkillPath Bank LMS — To'liq Joylashtirish Qo'llanmasi

## Tizim haqida
SkillPath — bank xodimlari uchun to'liq HR/LMS tizimi:
- **HR Manager**: Xodimlar, career tracklar, traininglar, promotion boshqaruvi,AI chatbot
- **Branch Manager**: Jamoa, feedback, promotion tavsiyalari,AI chatbot
- **Xodim**: O'quv yo'li, traininglar, profil,AI chatbot

---

## 1. SUPABASE — Database

### 1.1. Supabase loyiha yaratish
1. https://supabase.com ga kiring → "New Project"
2. Loyiha nomi: `skillpath-bank`
3. Database parol yozing (eslab qoling)
4. Region: Europe (Frankfurt) yoki yaqin

### 1.2. SQL Schema yuklash
1. Supabase → SQL Editor → "New query"
2. `database/schema.sql` faylidagi barcha kodni nusxalab joylashtiring
3. "Run" tugmasini bosing

### 1.3. Kalitlarni olish
Settings → API:
- `Project URL` → `SUPABASE_URL`
- `anon public` key → `SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. RENDER — Backend

### 2.1. GitHub'ga yuklash
```bash
cd skillpath/backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/sizning-username/skillpath-backend.git
git push -u origin main
```

### 2.2. Render.com sozlamalari
1. https://render.com → "New Web Service"
2. GitHub reponi ulang
3. Sozlamalar:
   - **Name**: `skillpath-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 2.3. Environment Variables
Render → Environment qismiga qo'shing:
```
PORT=5000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=skillpath-super-secret-key-2024-minimum-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.netlify.app
NODE_ENV=production
```

### 2.4. Deploy URL
Deploy tugagandan so'ng URL olasiz:
`https://skillpath-backend.onrender.com`

---

## 3. NETLIFY — Frontend

### 3.1. `.env` fayl yaratish
`skillpath/frontend/.env` faylini yarating:
```
VITE_API_URL=https://skillpath-backend.onrender.com
```

### 3.2. Build qiling
```bash
cd skillpath/frontend
npm install
npm run build
```

### 3.3. Netlify'ga yuklash (Drag & Drop usul)
1. https://app.netlify.com → "Sites" → "Add new site" → "Deploy manually"
2. `frontend/dist` papkasini drag & drop qiling

### 3.4. Yoki GitHub orqali avtomatik
```bash
cd skillpath/frontend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/sizning-username/skillpath-frontend.git
git push -u origin main
```
Netlify → "New site from Git" → GitHub → reponi tanlang → Build:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 3.5. Environment Variables (Netlify)
Site settings → Environment variables:
```
VITE_API_URL=https://skillpath-backend.onrender.com
```

---

## 4. CORS Sozlash

Backend `.env` ga frontendning Netlify URL'ini qo'shing:
```
FRONTEND_URL=https://sizning-site.netlify.app
```

---

## 5. Birinchi kirish

### Demo hisob (seed data)
```
Email: hr@skillpathbank.uz
Parol: Admin@12345
```

### Boshlash tartibi
1. HR sifatida kiring
2. Branches → Filial yarating
3. Career Tracks → Track va darajalar yarating
4. Trainings → Traininglar yarating
5. Employees → Xodimlar qo'shing va career track tayinlang

---

## 6. Local Development

### Backend
```bash
cd skillpath/backend
cp .env.example .env
# .env ni to'ldiring
npm install
npm run dev
```

### Frontend
```bash
cd skillpath/frontend
echo "VITE_API_URL=http://localhost:5000" > .env
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

---

## 7. Loyiha Tuzilmasi

```
skillpath/
├── database/
│   └── schema.sql              # Supabase SQL schema
├── backend/
│   ├── src/
│   │   ├── index.js            # Express server
│   │   ├── config/supabase.js  # DB client
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT auth
│   │   │   └── audit.js        # Audit logging
│   │   ├── auth/auth.routes.js # Login/logout
│   │   ├── employees/          # Employee CRUD
│   │   └── routes.js           # All other routes
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx             # Router
    │   ├── context/AuthContext # Global auth state
    │   ├── utils/api.js        # Axios API client
    │   ├── pages/
    │   │   ├── auth/           # Login
    │   │   ├── hr/             # HR pages
    │   │   ├── manager/        # Manager pages
    │   │   └── employee/       # Employee pages
    │   └── components/modals/  # Modal dialogs
    ├── index.html
    ├── vite.config.js
    ├── netlify.toml            # SPA routing
    └── package.json
```

---

## 8. API Endpointlar

### Auth
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/auth/login | Kirish |
| GET | /api/auth/me | Joriy foydalanuvchi |
| POST | /api/auth/logout | Chiqish |
| POST | /api/auth/change-password | Parol o'zgartirish |

### Employees
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | /api/employees | Ro'yxat (filter/search) |
| GET | /api/employees/:id | Profil |
| POST | /api/employees | Yaratish |
| PUT | /api/employees/:id | Yangilash |
| PATCH | /api/employees/:id/assign-career-track | Career track |
| GET | /api/employees/:id/learning-path | O'quv yo'li |
| GET | /api/employees/:id/trainings | Traininglar |
| GET | /api/employees/:id/feedback | Feedbacklar |

### Career Tracks
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | /api/career-tracks | Ro'yxat |
| POST | /api/career-tracks | Yaratish |
| GET | /api/career-tracks/:id | Batafsil |
| POST | /api/career-tracks/:id/levels | Daraja qo'shish |
| POST | /api/career-levels/:id/skills | Ko'nikma qo'shish |
| POST | /api/career-levels/:id/trainings | Training qo'shish |

### Trainings
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | /api/trainings | Kutubxona |
| POST | /api/trainings | Yaratish |
| POST | /api/trainings/assign | Tayinlash |
| PATCH | /api/employee-trainings/:id/start | Boshlash |
| PATCH | /api/employee-trainings/:id/complete | Tugallash |

### Promotion
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/promotion-packets/generate | Packet yaratish |
| GET | /api/promotion-packets | Ro'yxat |
| GET | /api/promotion-packets/:id | Batafsil |
| PATCH | /api/promotion-packets/:id/status | Qaror |

---

## 9. Xavfsizlik

- JWT token (7 kun)
- bcrypt parol hashing (12 rounds)
- Rate limiting (200 req/15 min, login: 20/15 min)
- Helmet.js HTTP headers
- Role-based access control (HR/Manager/Employee)
- Audit log barcha muhim amallarga

---

## 10. Muammolar va Yechimlar

### Backend Render'da ishlamayapti?
- Health check: `https://your-app.onrender.com/health`
- Logs: Render → Logs
- Free tier 15 daqiqadan keyin "sleep" bo'ladi (birinchi so'rov sekin)

### CORS xatosi?
- `FRONTEND_URL` ni to'g'ri Netlify URL ga o'zgartiring
- `https://` ni unutmang

### Login ishlamayapti?
- `SUPABASE_SERVICE_ROLE_KEY` ni tekshiring
- Supabase → Auth → Users da foydalanuvchi bormi?

### Build xatosi Netlify'da?
- `VITE_API_URL` environment variable qo'shilganmi?
- `netlify.toml` fayl `dist` papkasida bormi?
## ⚠️ Loyihadagi joriy cheklovlar (Known Issues)

* **SkillPath AI Chatbot:** Chatbot interfeysi tizimga muvaffaqiyatli integratsiya qilindi, biroq hozirda API ulanishlari va backend sozlamalari ustida ish bormoqda. Shu sababli chatbot hozircha xabarlarga to'liq javob bera olmasligi yoki "Kechirasiz, javob bera olmadim" xatoligini qaytarishi mumkin. Tez orada sun'iy intellekt modeli to'liq rejimda ishga tushiriladi.
