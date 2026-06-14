# EduTrack LMS — Setup Guide

## What You're Getting

A full-stack Learning Management System with:
- **Instructor** — create courses, modules, lessons (with video), assignments, grade students, view analytics
- **Student** — browse & enroll in courses, watch videos with progress tracking, submit assignments, earn certificates, receive notifications

---

## Prerequisites

Install these before starting:

| Tool | Download |
|------|----------|
| Node.js (v18+) | https://nodejs.org |
| MySQL (v8+) | https://dev.mysql.com/downloads/installer/ |

---

## Step 1 — Set Up the Database

1. Open **MySQL Workbench** or the MySQL command line
2. Run the schema file to create all tables:

```sql
SOURCE path\to\edutrack\backend\config\schema.sql;
```

Or paste the contents of `backend/config/schema.sql` directly into MySQL Workbench and execute it.

---

## Step 2 — Configure Backend

1. Open `backend/.env`
2. Update your MySQL password:

```
DB_PASSWORD=your_actual_mysql_password
```

Leave everything else as-is for local development.

---

## Step 3 — Install & Run Backend

Open a terminal in the `backend/` folder:

```bash
npm install
npm run dev
```

You should see:
```
✅ MySQL connected successfully
🚀 EduTrack server running on http://localhost:5000
```

---

## Step 4 — Install & Run Frontend

Open a **second terminal** in the `frontend/` folder:

```bash
npm install
npm start
```

Your browser will open at **http://localhost:3000**

---

## How to Use

### As an Instructor
1. Go to http://localhost:3000/register
2. Select **Instructor** and create an account
3. From your dashboard, click **Create Course**
4. Fill in course details and save
5. In the edit view, add **Modules** and **Lessons** (upload videos)
6. **Publish** the course so students can find it
7. Add **Assignments** from the Assignments tab
8. View **Analytics** to track student progress
9. Grade submissions from the **Submissions** page

### As a Student
1. Register as a **Student**
2. Browse courses and click **Enroll**
3. Watch video lessons — progress is saved automatically every 10 seconds
4. Submit assignments (text + file upload)
5. View your grades and instructor feedback
6. Once you reach 90% lesson completion, click **Get Certificate**
7. Download your certificate as a PDF

---

## Project Structure

```
edutrack/
├── backend/
│   ├── config/
│   │   ├── database.js        # MySQL connection pool
│   │   └── schema.sql         # All database tables
│   ├── controllers/           # Business logic for each feature
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── moduleController.js
│   │   ├── progressController.js
│   │   ├── assignmentController.js
│   │   ├── certificateController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verification + role guards
│   │   └── upload.js          # Multer file upload handling
│   ├── routes/                # Express route definitions
│   ├── uploads/               # Uploaded files (auto-created)
│   ├── .env                   # Environment variables
│   └── server.js              # Entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── context/
        │   └── AuthContext.js  # Global auth state
        ├── pages/
        │   ├── auth/           # Login, Register
        │   ├── instructor/     # Dashboard, CourseBuilder, Assignments, Analytics, Grading
        │   └── student/        # Dashboard, Browse, CourseView, LessonPlayer, Assignments, Certificates, Notifications
        ├── components/
        │   └── common/
        │       └── Layout.js   # Sidebar navigation
        ├── styles/
        │   └── global.css      # Design system
        ├── utils/
        │   └── api.js          # Axios with token injection
        └── App.js              # Routes
```

---

## API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get profile |
| PUT | /api/auth/profile | Update profile |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/courses | All published courses |
| POST | /api/courses | Create course (instructor) |
| GET | /api/courses/my-courses | Instructor's courses |
| GET | /api/courses/enrolled | Student's enrolled courses |
| GET | /api/courses/:id | Single course with modules |
| PUT | /api/courses/:id | Update course |
| DELETE | /api/courses/:id | Delete course |
| POST | /api/courses/:id/enroll | Enroll in course |

### Modules & Lessons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/courses/:courseId/modules | Create module |
| PUT | /api/modules/:id | Update module |
| DELETE | /api/modules/:id | Delete module |
| POST | /api/modules/:moduleId/lessons | Create lesson (with video) |
| PUT | /api/lessons/:id | Update lesson |
| DELETE | /api/lessons/:id | Delete lesson |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/lessons/:lessonId/progress | Update video progress |
| GET | /api/courses/:courseId/progress | Get course progress |
| GET | /api/courses/:courseId/lesson-progress | Get all lesson progress |
| GET | /api/courses/:courseId/analytics | Instructor analytics |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/courses/:courseId/assignments | Create assignment |
| GET | /api/courses/:courseId/assignments | List assignments |
| PUT | /api/assignments/:id | Update assignment |
| DELETE | /api/assignments/:id | Delete assignment |
| POST | /api/assignments/:id/submit | Submit assignment |
| GET | /api/assignments/:id/submissions | Get all submissions |
| PUT | /api/submissions/:id/grade | Grade a submission |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/courses/:courseId/certificate | Issue certificate |
| GET | /api/certificates | Student's certificates |
| GET | /api/certificates/:certId/download | Download PDF |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get all notifications |
| GET | /api/notifications/unread-count | Unread count |
| PUT | /api/notifications/:id/read | Mark as read |
| PUT | /api/notifications/mark-all-read | Mark all as read |

---

## Common Issues

**"Can't connect to MySQL"**
→ Make sure MySQL service is running. Check `DB_PASSWORD` in `.env`

**"Port 3000 already in use"**
→ Another app is using port 3000. Close it or React will prompt you to use a different port.

**"Port 5000 already in use"**
→ Change `PORT=5001` in `.env` and update `baseURL` in `frontend/src/utils/api.js`

**Videos not playing**
→ Make sure the backend is running. Videos are served from `http://localhost:5000/uploads/videos/`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, React Hot Toast |
| Backend | Node.js, Express.js |
| Database | MySQL 8 with mysql2 driver |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| PDF Generation | PDFKit |
| Styling | Custom CSS design system (dark theme) |
