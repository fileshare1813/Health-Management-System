# Health Management System (HMS)

A Node.js/Express-based Health Management System that lets patients register, find doctors, book appointments with prescription uploads, leave feedback/ratings for doctors, and chat in real time with a support agent. Includes role-based accounts (patient, doctor, support, admin), JWT authentication, MongoDB persistence via Mongoose, Cloudinary file storage, and Socket.IO-powered live chat with history.

## Features

- **User accounts & auth** — Register/login with JWT, role-based access (`patient`, `doctor`, `support`, `admin`), password change endpoint, rate-limited auth routes.
- **Doctors** — Admin-created doctor profiles (with linked login account), searchable/filterable doctor listing, doctor dashboard showing their appointments.
- **Patients & appointments** — Book appointments with a chosen doctor/slot, upload a prescription file (image or PDF via Cloudinary), prevent double-booking of the same doctor/slot, view/cancel own appointments, confirmation email on booking.
- **Feedback & ratings** — Patients rate doctors (0–5) with comments; doctor's average rating is recalculated automatically; endpoints for positive feedback and per-doctor feedback.
- **Support live chat** — Socket.IO-based chat between a patient and a support agent, persisted to MongoDB per room, with chat history replay on join.
- **Email** — Nodemailer/Gmail SMTP integration for transactional emails (e.g. appointment confirmations).
- **Server-rendered UI** — EJS views for login, registration, patient booking, doctor listing, my-appointments, doctor dashboard, admin panel, and support chat.

## Tech Stack

- **Runtime/Framework:** Node.js, Express 5
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.IO
- **Auth:** JSON Web Tokens (jsonwebtoken), bcryptjs
- **File uploads:** Multer + Cloudinary (`multer-storage-cloudinary`)
- **Email:** Nodemailer
- **Validation:** express-validator
- **Views:** EJS
- **Dev tooling:** Nodemon

## Project Structure

```
.
├── index.js                     # App entry point, Express + Socket.IO setup
├── config/
│   ├── mongoose.js              # MongoDB connection
│   └── cloudinary.js            # Cloudinary + Multer storage config
├── middlewares/
│   ├── auth.js                  # JWT authenticate/authorize middleware
│   ├── upload.js                # Multer upload middleware
│   └── errorHandler.js          # 404 + global error handler
├── models/
│   ├── userModel.js             # Login accounts (patient/doctor/support/admin)
│   ├── patientModel.js          # Patient appointment records
│   ├── doctorModel.js           # Doctor profiles
│   ├── feedbackModel.js         # Doctor feedback/ratings
│   ├── supportModel.js          # Support agent accounts
│   └── chatModel.js             # Persisted chat rooms/messages
├── controllers/
│   ├── userController.js        # register/login/changePassword
│   ├── doctorController.js      # create/list/get doctors, doctor appointments
│   ├── patientController.js     # create patient, book/cancel appointment, prescriptions
│   ├── feedbackController.js    # create feedback, rating aggregation
│   └── supportController.js     # create support agent account
├── routes/
│   ├── userRoutes.js
│   ├── doctorRoutes.js
│   ├── patientRoutes.js
│   ├── feedbackRoutes.js
│   └── supportRoutes.js
├── utils/
│   └── validate.js              # express-validator wrapper middleware
├── scripts/
│   └── createAdmin.js           # CLI script to seed an admin user
├── views/                       # EJS templates (login, register, patient, doctors, etc.)
├── nodemailer.js                # Email transporter + sendMail helper
└── package.json
```

## Prerequisites

- Node.js (v18+ recommended)
- A MongoDB instance (local or hosted, e.g. MongoDB Atlas)
- A Cloudinary account (for prescription file uploads)
- An SMTP-capable email account (e.g. Gmail with an App Password) for sending emails

## Setup

1. **Clone the repository and install dependencies**

   ```bash
   git clone <repo-url>
   cd <repo-folder>
   npm install
   ```

2. **Create a `.env` file** in the project root with the following variables:

   ```env
   # Server
   PORT=3000

   # MongoDB
   MONGO_URI=mongodb://localhost:27017/hms

   # JWT
   JWT_SECRET=your_jwt_secret_here

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Email (SMTP via Gmail)
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

3. **Run the app**

   ```bash
   npm start
   ```

   This runs `nodemon index.js`, which connects to MongoDB and starts the server (default `http://localhost:3000`).

4. **(Optional) Create an admin account**

   ```bash
   node scripts/createAdmin.js <username> <email> <password>
   ```

## Available Pages (server-rendered)

| Route               | Description                          |
|----------------------|--------------------------------------|
| `/`                  | Redirects based on stored role/token |
| `/register`          | Patient self-registration            |
| `/login`             | Login for all roles                  |
| `/patient`           | Book an appointment                  |
| `/doctors`           | Browse/search doctors                |
| `/my-appointments`   | View/cancel patient appointments     |
| `/doctor-dashboard`  | Doctor's appointments and profile    |
| `/admin`             | Admin panel — add doctors            |
| `/support`           | Live support chat                    |

## API Overview

All JSON API routes are mounted under `/api`.

### Users — `/api/users`
| Method | Endpoint            | Auth | Description               |
|--------|----------------------|------|----------------------------|
| POST   | `/register`          | No   | Register a patient account |
| POST   | `/login`              | No   | Login, returns JWT         |
| POST   | `/change-password`    | Yes  | Change own password        |

### Doctors — `/api/doctors`
| Method | Endpoint             | Auth        | Description                          |
|--------|------------------------|-------------|----------------------------------------|
| GET    | `/`                    | No          | List doctors (filter by name/specialisation) |
| GET    | `/:id`                 | No          | Get doctor by ID (with feedback)       |
| GET    | `/my-appointments`     | Doctor      | Get logged-in doctor's appointments    |
| POST   | `/add-doctor`          | Admin       | Create a doctor profile + login account |

### Patients — `/api/patients`
| Method | Endpoint                     | Auth        | Description                              |
|--------|--------------------------------|-------------|--------------------------------------------|
| POST   | `/add-patient`                | No          | Create a patient record                    |
| POST   | `/book-appointment`           | Yes         | Book appointment (with prescription file)  |
| POST   | `/:id/upload-prescription`    | Yes         | Add a prescription file to an appointment  |
| GET    | `/my-appointments`            | Yes         | List logged-in patient's appointments      |
| DELETE | `/appointments/:id`           | Yes         | Cancel own appointment                     |

### Feedback — `/api/feedback`
| Method | Endpoint              | Auth | Description                          |
|--------|-------------------------|------|----------------------------------------|
| POST   | `/add-feedback`         | Yes  | Submit rating/comment for a doctor     |
| GET    | `/positive`             | No   | List feedback with rating ≥ 4          |
| GET    | `/doctor/:doctorId`     | No   | List feedback for a specific doctor    |

### Support — `/api/support`
| Method | Endpoint         | Auth | Description               |
|--------|--------------------|------|----------------------------|
| POST   | `/add-support`     | No   | Create a support agent account |

### Misc
| Method | Endpoint          | Description                          |
|--------|--------------------|----------------------------------------|
| GET    | `/api/send-email`  | Send a test email                     |
| POST   | `/upload-file`     | Generic file upload (returns file URL)|

## Real-Time Chat (Socket.IO)

- Client connects to the Socket.IO server and emits `joinRoom` with `{ room, userId, role }` to join a `patient_<id>|support_<id>` room; existing history is sent back via `chat history`.
- Sending a message emits `chat message` with sender/receiver metadata; the server broadcasts it to the room via `chat message` and persists it to the `Chat` collection (`chatKey` = room).
- The `views/support.ejs` page is a working reference client for this flow.

## Notes & Known Limitations

- `controllers/supportController.js` hashes passwords with SHA-256 for demonstration; it's recommended to switch to bcrypt (as used elsewhere in the app) before production use.
- CORS is currently open (`origin: "*"` for Socket.IO, default `cors()` for Express) — tighten this for production.
- Ensure `.env` is never committed (already covered by `.gitignore`).

## License

ISC
