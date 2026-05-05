# ⚕️ Nexus Care — Modern Healthcare Platform

A production-grade Doctor Management & Health Platform with full backend + frontend integration.

---

## 🏗️ Architecture Overview

```
nexuscare/
├── backend/           # Node.js + Express API
│   ├── controllers/   # Business logic
│   ├── routes/        # API endpoints
│   ├── models/        # MongoDB schemas
│   ├── services/      # Email, cache, notifications
│   ├── middlewares/   # Auth, rate limiting, upload
│   └── utils/         # DB, socket, PDF, JWT
└── frontend/          # React + Vite + Tailwind
    └── src/
        ├── pages/     # Patient, Doctor, Admin, Receptionist
        ├── layouts/   # Dashboard sidebar layout
        ├── components/# Reusable UI components
        ├── context/   # Auth, Theme, Socket
        └── services/  # Axios API client
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd nexuscare/backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend
cd nexuscare/frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexuscare
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords

> **Cloudinary:** Free account at cloudinary.com (or leave blank — file upload will fail gracefully)

### 3. Seed Database

```bash
cd backend
node seed.js
```

### 4. Run Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev        # Uses nodemon for hot-reload
# OR
npm start          # Production mode
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nexuscare.com | admin123 |
| Doctor | doctor@nexuscare.com | doctor123 |
| Doctor 2 | doctor2@nexuscare.com | doctor123 |
| Doctor 3 | doctor3@nexuscare.com | doctor123 |
| Patient | patient@nexuscare.com | patient123 |
| Receptionist | reception@nexuscare.com | reception123 |

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

### Authentication
All protected routes require: `Authorization: Bearer <token>`

---

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/verify-otp` | Verify email OTP | No |
| POST | `/auth/resend-otp` | Resend OTP | No |
| POST | `/auth/login` | Login | No |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/change-password` | Change password | Yes |
| POST | `/auth/create-staff` | Create staff account | Admin |

**Register body:**
```json
{ "name": "John Smith", "email": "john@example.com", "password": "secret123", "role": "patient" }
```

**Login response:**
```json
{ "success": true, "data": { "token": "eyJ...", "user": {...}, "doctorProfile": {...} } }
```

---

### Doctor Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/doctors` | List doctors (paginated) | No |
| GET | `/doctors/:id` | Doctor profile | No |
| GET | `/doctors/:id/slots` | Available slots | No |
| GET | `/doctors/my-profile` | Own profile | Doctor |
| PUT | `/doctors/profile` | Update profile | Doctor |
| GET | `/doctors/dashboard` | Dashboard stats | Doctor |
| POST | `/doctors/:id/review` | Add review | Patient |

**Query params for GET /doctors:**
- `page`, `limit`, `specialization`, `search`, `sort`, `minFee`, `maxFee`

**GET /doctors/:id/slots query:**
- `date` — ISO date string (e.g. `2025-01-15`)

---

### Appointment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/appointments` | Book appointment | Patient/Receptionist |
| GET | `/appointments/my` | Patient's appointments | Patient |
| GET | `/appointments/doctor` | Doctor's appointments | Doctor |
| GET | `/appointments/all` | All appointments | Admin/Receptionist |
| GET | `/appointments/:id` | Single appointment | Auth |
| PUT | `/appointments/:id/status` | Update status | Auth |
| GET | `/appointments/patient/:id/history` | Patient history | Doctor/Admin |

**Book appointment body:**
```json
{
  "doctorId": "...",
  "date": "2025-01-15",
  "timeSlot": { "startTime": "09:00", "endTime": "09:15" },
  "type": "in-person",
  "reasonForVisit": "Chest pain",
  "symptoms": ["chest pain", "shortness of breath"],
  "isEmergency": false
}
```

---

### Prescription Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/prescriptions` | Create prescription | Doctor |
| GET | `/prescriptions/my` | Patient's prescriptions | Patient |
| GET | `/prescriptions/doctor` | Doctor's prescriptions | Doctor |
| GET | `/prescriptions/:id` | Single prescription | Auth |
| PUT | `/prescriptions/:id` | Update prescription | Doctor |

---

### Report Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/reports` | Upload report | Auth |
| GET | `/reports/my` | My reports | Auth |
| GET | `/reports/patient/:id` | Patient reports | Doctor/Admin |
| DELETE | `/reports/:id` | Delete report | Auth |

---

### AI Endpoints

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/ai/symptoms` | `{ symptoms: [...] }` | Yes |
| POST | `/ai/health-risk` | `{ age, weight, height, ... }` | Yes |
| POST | `/ai/analyze-report` | `{ reportType, values: {...} }` | Yes |

---

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics` | Platform stats |
| GET | `/admin/users` | All users |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/doctors/pending` | Pending approvals |
| PUT | `/admin/doctors/:id/approve` | Approve/reject doctor |
| CRUD | `/admin/categories` | Manage specializations |
| CRUD | `/admin/banners` | Manage banners |

---

## 🗄️ Database Schema

### User
```
_id, name, email, password(hashed), role, phone, avatar, dateOfBirth,
gender, address, bloodGroup, isVerified, isActive, otp, medicalHistory[],
allergies[], emergencyContact, timestamps
```

### Doctor
```
_id, user(ref), licenseNumber, specializations[](ref), qualifications[],
experience, bio, consultationFee, consultationDuration, schedule[{
  dayOfWeek, isWorking, slots[{startTime, endTime, isAvailable}], maxPatientsPerDay
}], rating{average, count}, reviews[], isApproved, timestamps
```

### Appointment
```
_id, patient(ref), doctor(ref), date, timeSlot{startTime, endTime},
type, status, reasonForVisit, symptoms[], notes, tokenNumber,
isEmergency, priority, prescription(ref), vitals{}, fee,
paymentStatus, createdBy, timestamps
Indexes: [patient+date], [doctor+date], [doctor+date+timeSlot.startTime UNIQUE]
```

### Prescription
```
_id, appointment(ref), patient(ref), doctor(ref), prescriptionNumber,
diagnosis, symptoms[], medicines[{name,dosage,frequency,duration,instructions}],
labTests[{testName,urgency,instructions}], notes, followUpDate,
pdfUrl, timestamps
```

---

## ⚡ Performance Features

### Rate Limiting
- General: 200 req/15min per IP
- Auth: 10 req/15min (prevents brute force)
- OTP: 3 req/min
- Upload: 50 req/hour

### Caching (node-cache)
- Doctor listings: 2 min TTL
- Doctor profiles: 5 min TTL
- Available slots: 30 sec TTL
- Categories: 10 min TTL
- Admin analytics: 5 min TTL
- Cache invalidated on mutations

### Database Indexes
- User: email(unique), role, isVerified+isActive
- Doctor: user, specializations, isApproved, rating.average
- Appointment: patient+date, doctor+date, status, doctor+date+slot(unique)
- Prescription: patient+createdAt, doctor+createdAt, prescriptionNumber
- Notification: recipient+isRead, recipient+createdAt

### Other Optimizations
- Helmet.js security headers
- Gzip compression
- Payload size limit: 10MB
- Async/await everywhere (no blocking)
- MongoDB projection (select only needed fields)
- Pagination on all list endpoints
- Socket.IO for real-time (no polling)

---

## 🔌 Real-Time Features (Socket.IO)

**Events emitted to client:**
- `notification` — New notification
- `appointment_updated` — Status change
- `consultation_message` — Chat message
- `typing` — Typing indicator
- `user_joined` / `user_left` — Consultation room

**Events from client:**
- `join_consultation` / `leave_consultation`
- `consultation_message`
- `typing`
- `update_queue`

---

## 🔒 Security

- JWT tokens (7 day expiry)
- Bcrypt password hashing (12 rounds)
- Role-based access control (RBAC)
- OTP email verification
- Rate limiting per IP
- Input validation (express-validator)
- MongoDB injection prevention (mongoose)
- CORS configured for frontend only
- Helmet.js HTTP headers

---

## 📧 Email System

Sends emails for:
- OTP verification on registration
- Appointment confirmation (to patient + doctor)
- Prescription ready notification
- Appointment reminders

Uses Gmail SMTP with connection pooling.

---

## 🚀 Production Deployment

```bash
# Backend
NODE_ENV=production npm start

# Frontend build
npm run build
# Serve dist/ with nginx or any static host

# Environment
MONGODB_URI=mongodb+srv://...  # Use MongoDB Atlas
JWT_SECRET=<256-bit random key>
```

---

## 🐛 Troubleshooting

**MongoDB not connecting:** Ensure MongoDB is running: `mongod`

**Email not sending:** Enable "Less secure apps" or use Gmail App Password

**CORS errors:** Check `FRONTEND_URL` in backend `.env`

**Socket.IO not connecting:** Token must be valid; check browser console

**Cloudinary upload failing:** Verify API credentials; file upload gracefully degrades
