# EduTrack LMS

![React](https://img.shields.io/badge/React-Frontend-blue)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express](https://img.shields.io/badge/Express-API-lightgrey)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange)
![JWT](https://img.shields.io/badge/JWT-Authentication-yellow)
![Status](https://img.shields.io/badge/Status-Completed-success)

---

## Overview

EduTrack LMS is a full-stack Learning Management System designed to provide a complete online learning experience for both instructors and students.

The platform enables instructors to create and manage courses, upload video lessons, assign coursework, track learner progress, and analyze performance. Students can enroll in courses, watch lessons, submit assignments, monitor progress, and earn completion certificates.

Built using React, Node.js, Express, and MySQL, EduTrack LMS offers a modern and scalable educational platform with secure authentication and role-based access control.

---

## Technologies Used

### Frontend

* React.js
* React Router DOM
* Axios
* React Hot Toast
* Recharts
* Custom CSS

### Backend

* Node.js
* Express.js
* JWT Authentication
* bcryptjs
* Multer File Uploads

### Database

* MySQL
* mysql2 Driver

### Tools

* Git & GitHub
* VS Code
* Postman
* npm

---

## Features

### Authentication

* User Registration & Login
* JWT-Based Authentication
* Role-Based Access Control
* Protected Routes
* Profile Management

### Instructor Features

* Create Courses
* Manage Course Content
* Create Modules and Lessons
* Upload Video Lessons
* Publish Courses
* Create Assignments
* Grade Student Submissions
* View Course Analytics
* Track Student Progress

### Student Features

* Browse Available Courses
* Enroll in Courses
* Watch Video Lessons
* Automatic Progress Tracking
* Submit Assignments
* View Grades and Feedback
* Receive Notifications
* Download Course Certificates

### Learning Management

* Structured Course Modules
* Video-Based Learning
* Progress Monitoring
* Assignment Management
* Performance Analytics
* Certificate Generation

---

## User Capabilities

### Instructors Can

* Create and manage courses
* Upload educational video content
* Organize modules and lessons
* Publish courses
* Create assignments
* Grade submissions
* Track student performance
* Analyze course engagement

### Students Can

* Register and enroll in courses
* Watch learning videos
* Track course progress
* Submit assignments
* View grades and feedback
* Receive notifications
* Earn and download certificates

---

## Development Process

The project was developed using a full-stack architecture with React, Express, Node.js, and MySQL.

Development began with database design and API planning, followed by authentication implementation, course management, lesson creation, assignment workflows, progress tracking, analytics, certificate generation, and notification systems.

The frontend and backend were integrated using REST APIs, followed by extensive testing and debugging to ensure smooth communication between all components.

---

## How I Built This Project

1. Designed LMS architecture and workflow.
2. Created MySQL database schema and relationships.
3. Developed REST APIs using Express.js.
4. Implemented JWT authentication and authorization.
5. Built instructor and student dashboards.
6. Developed course, module, and lesson management.
7. Integrated video upload functionality using Multer.
8. Implemented assignment and grading systems.
9. Added progress tracking and analytics.
10. Tested and optimized the complete application.

---

## What I Learned

Through this project, I gained practical experience in:

* Full-Stack Development
* React Application Development
* REST API Design
* Express.js Backend Development
* JWT Authentication
* MySQL Database Design
* File Upload Management
* Role-Based Authorization
* Frontend-Backend Integration
* Git & GitHub Workflow
* Debugging and Problem Solving

---

## Future Improvements

Possible future enhancements include:

* Live Online Classes
* Video Streaming Optimization
* AI-Powered Learning Recommendations
* Discussion Forums
* Course Reviews and Ratings
* Payment Gateway Integration
* Email Notifications
* Mobile Application Support
* Cloud Storage Integration
* Real-Time Chat System

---

## Installation & Setup

### Clone Repository

```bash
git clone https://github.com/RishikaSadhukhan/full-stack-learning-management-system.git

cd full-stack-learning-management-system
```

### Database Setup

1. Install MySQL Server
2. Open MySQL Workbench
3. Execute:

```sql
SOURCE backend/config/schema.sql;
```

Or run the contents of `schema.sql` manually.

---

### Backend Setup

```bash
cd backend

npm install

npm run dev
```

Backend:

```text
http://localhost:5000
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm start
```

Frontend:

```text
http://localhost:3000
```

---

## Project Structure

```text
full-stack-learning-management-system/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   └── styles/
│
├── README.md
```

---

## Key Modules

### Authentication Module

* Registration
* Login
* JWT Authorization
* User Roles

### Course Management Module

* Course Creation
* Publishing
* Enrollment

### Lesson Management Module

* Video Upload
* Lesson Organization
* Learning Progress

### Assignment Module

* Assignment Creation
* Submission Management
* Grading System

### Analytics Module

* Student Progress Reports
* Course Performance Metrics

### Certification Module

* Automated Certificate Generation
* PDF Downloads

---

## Author

**Rishika Sadhukhan**

Computer Science Engineering Student

Interested in Full-Stack Development, Software Engineering, Machine Learning, and building practical technology solutions.
