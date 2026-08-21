# WolloShare

Wollo University Academic Resource Sharing Platform

A modern, production-ready platform for verified university students to upload, discover, download, bookmark, review, and share academic materials within their department and academic level.

## Tech Stack

- **Frontend:** React.js (Vite), React Router, Context API, Axios, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT, bcrypt
- **Architecture:** MVC + Service Layer, REST API, Role-Based Authorization

## Features

### Student Features

- Register with @wollo.edu.et email and student ID
- Upload academic resources (PDF, DOCX, PPT, ZIP, images, videos)
- Browse resources filtered by department, academic level, and semester
- Search resources by title, course, description, or uploader
- Bookmark resources
- Download history tracking
- Rate and review resources (1-5 stars)
- Report inappropriate resources
- Receive notifications (verification, resource approval, reports)
- Profile management with password change

### Admin Features

- Full admin dashboard with statistics
- Student verification (approve/reject with ID card review)
- User management (suspend, activate, disable)
- Academic assignment (department, level, semester)
- Resource management (approve, reject, delete)
- Course management (CRUD)
- Report management (resolve/dismiss)
- Analytics dashboard (charts, trends, statistics)
- System settings

## Project Structure

```
WolloShare/
├── client/          # React Frontend
├── server/          # Express Backend (MVC)
├── database/        # SQL Schema & Seeds
├── .gitignore
├── README.md
└── PLAN.md
```

## Getting Started

### Prerequisites

- Node.js v18+
- MySQL 8+
- npm or yarn

### 1. Database Setup

```bash
# Run the schema and seed files
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend Setup

```bash
cd server
cp .env.example .env  # Configure your database credentials
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- API Health Check: http://localhost:3000/api/health

### Demo Accounts

**Admin**

- Email: admin@wollo.edu.et
- Password: Admin@123

**Test Student (verified, SWE Year 2 Semester 1)**

- Email: student1@wollo.edu.et
- Password: Student@123

## API Endpoints

### Authentication

- POST /api/auth/register - Student registration
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user
- PUT /api/auth/change-password - Change password
- POST /api/auth/logout - Logout

### Resources

- GET /api/resources/dashboard - Student dashboard (filtered)
- GET /api/resources/search - Search resources
- GET /api/resources/:id - Resource details
- POST /api/resources/upload - Upload resource
- PUT /api/resources/:id - Update resource (admin)
- DELETE /api/resources/:id - Delete resource
- PUT /api/resources/:id/review - Approve/reject (admin)
- GET /api/resources/pending - Pending resources (admin)

### Bookmarks

- GET /api/bookmarks - User bookmarks
- POST /api/bookmarks/:resourceId - Toggle bookmark

### Downloads

- POST /api/downloads/:resourceId - Download resource
- GET /api/downloads/history - Download history

### Ratings

- POST /api/ratings/:resourceId - Rate resource
- GET /api/ratings/:resourceId - Resource ratings
- DELETE /api/ratings/:id - Delete rating

### Reports

- POST /api/reports - Create report
- GET /api/reports - List reports (admin)
- PUT /api/reports/:id/resolve - Resolve report (admin)

### Notifications

- GET /api/notifications - User notifications
- GET /api/notifications/unread-count - Unread count
- PUT /api/notifications/:id/read - Mark as read
- PUT /api/notifications/read-all - Mark all as read

### Courses

- GET /api/courses - List courses
- POST /api/courses - Create course (admin)
- PUT /api/courses/:id - Update course (admin)
- DELETE /api/courses/:id - Delete course (admin)

### Admin

- GET /api/users - List users
- GET /api/users/pending-verifications - Pending verifications
- PUT /api/users/:id/verify - Verify student
- PUT /api/users/:id/status - Update status
- PUT /api/users/:id/assign - Update assignment

### Analytics (Admin)

- GET /api/analytics/dashboard - Dashboard stats
- GET /api/analytics/charts - Chart data
- GET /api/analytics/top-resources - Most downloaded
- GET /api/analytics/active-students - Most active
- GET /api/analytics/verifications - Verification stats
- GET /api/analytics/departments - Department stats

## Architecture Decisions

- **Normalized Database:** All departments, levels, semesters stored in DB - nothing hardcoded
- **Multi-University Ready:** Schema supports multiple universities with separate faculties
- **Service Layer Pattern:** Business logic separated from controllers
- **Role-Based Access:** JWT with role-aware middleware
- **Secure Uploads:** File type validation, MIME checking, size limits
- **Parameterized Queries:** All SQL uses prepared statements
- **Extensible Design:** Architecture allows future AI features (auto-tagging, recommendations, semantic search)

## Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- JWT authentication with refresh tokens
- bcrypt password hashing (12 rounds)
- Input validation (express-validator)
- File upload validation (extensions, MIME types, size)
- Parameterized SQL queries
- Role-based authorization middleware

## License

MIT
