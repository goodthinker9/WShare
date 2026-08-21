# WolloShare - Complete Development Plan

## Project Structure Overview

```
C:/Users/hp/WShare/WolloShare/
├── client/                          # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI Components
│   │   │   ├── common/              # Button, Input, Modal, Table, Card, etc.
│   │   │   ├── layout/              # Navbar, Sidebar, Footer, Layout
│   │   │   └── ui/                  # Toast, Spinner, Pagination, etc.
│   │   ├── contexts/                # AuthContext, AppContext
│   │   ├── hooks/                   # Custom hooks
│   │   ├── pages/                   # Page components
│   │   │   ├── auth/                # Login, Register
│   │   │   ├── student/             # Dashboard, Bookmarks, Downloads, etc.
│   │   │   ├── admin/               # Dashboard, Users, Resources, Analytics
│   │   │   └── public/              # Home, About, Contact
│   │   ├── services/                # API service layer (Axios)
│   │   ├── utils/                   # Helpers, validators
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Express.js Backend
│   ├── config/                      # Database, JWT, App config
│   ├── middleware/                   # Auth, role, validation, upload, error
│   ├── models/                      # Database models/queries
│   ├── controllers/                 # Route controllers
│   ├── routes/                      # Express routes
│   ├── services/                    # Business logic layer
│   ├── validators/                  # Request validation schemas
│   ├── utils/                       # Helpers, constants
│   ├── uploads/                     # File storage directory
│   ├── swagger/                     # OpenAPI documentation
│   ├── seeds/                       # Database seed files
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── database/                        # SQL files
│   ├── schema.sql                   # Full database schema
│   ├── seed.sql                     # Initial data (departments, levels, etc.)
│   └── init.sql                     # Database initialization
│
├── .gitignore
└── README.md
```

## Phase 1: Database Design & Setup

### 1.1 Database Schema

**Tables:**

- `universities` - Multi-university support
- `faculties` - Faculties/colleges
- `departments` - Departments (normalized)
- `academic_levels` - Academic levels (freshman S1, S2, Y2-Y4+)
- `semesters` - Semester 1, Semester 2
- `users` - All users (students, admins)
- `student_verifications` - Verification records
- `courses` - Courses by dept/level/semester
- `resources` - Uploaded resources
- `resource_types` - Enum-like table for types
- `bookmarks` - User bookmarks
- `downloads` - Download history
- `ratings` - Ratings & reviews
- `reports` - Resource reports
- `notifications` - User notifications
- `audit_logs` - Admin action audit
- `system_settings` - App settings

### 1.2 Indexes

- Foreign key indexes
- Search indexes on title, description
- User lookup indexes
- Resource filter indexes

## Phase 2: Backend Development (API)

### 2.1 Project Setup

- Initialize Express server
- Configure middleware (Helmet, CORS, Rate Limiting)
- Database connection pool (mysql2)
- Error handling middleware

### 2.2 Authentication

- POST /api/auth/register - Student registration
- POST /api/auth/login - Login (students + admins)
- GET /api/auth/me - Get current user
- POST /api/auth/change-password

### 2.3 User Management (Admin)

- GET /api/admin/users - List users
- GET /api/admin/users/:id - User details
- PUT /api/admin/users/:id/verify - Approve/reject
- PUT /api/admin/users/:id/status - Suspend/activate
- DELETE /api/admin/users/:id - Delete user

### 2.4 Assignment (Admin)

- PUT /api/admin/users/:id/assign - Assign dept/level/semester

### 2.5 Resource Management

- POST /api/resources/upload - Upload (student/admin)
- GET /api/resources - List (filtered)
- GET /api/resources/:id - Single resource
- PUT /api/resources/:id - Update (admin)
- DELETE /api/resources/:id - Delete
- PUT /api/resources/:id/approve - Approve/reject (admin)

### 2.6 Resource Filtering

- GET /api/resources/dashboard - Filtered by user's dept/level/semester
- GET /api/resources/search - Search endpoint

### 2.7 Bookmarks

- POST /api/bookmarks/:resourceId
- DELETE /api/bookmarks/:resourceId
- GET /api/bookmarks

### 2.8 Downloads

- POST /api/downloads/:resourceId
- GET /api/downloads/history

### 2.9 Ratings & Reviews

- POST /api/ratings/:resourceId
- GET /api/ratings/:resourceId
- GET /api/resources/:id/reviews

### 2.10 Reports

- POST /api/reports
- GET /api/admin/reports
- PUT /api/admin/reports/:id/resolve

### 2.11 Notifications

- GET /api/notifications
- PUT /api/notifications/:id/read
- GET /api/notifications/unread-count

### 2.12 Admin Analytics

- GET /api/admin/analytics/dashboard
- GET /api/admin/analytics/charts
- GET /api/admin/analytics/export

### 2.13 Courses (Admin)

- CRUD /api/admin/courses

### 2.14 Academic Structure (Admin)

- CRUD for departments, levels, semesters

## Phase 3: Frontend Development

### 3.1 Project Setup

- Vite + React setup
- Tailwind CSS configuration
- Axios service layer
- Context API setup

### 3.2 Authentication Pages

- Login page
- Register page (student registration with ID card upload)

### 3.3 Public Pages

- Landing/Home page (Hero, About, Features, etc.)
- 404 page

### 3.4 Student Pages

- Dashboard (filtered resources with cards)
- Resource detail view
- Bookmarks page
- Download history
- Profile page
- Notifications page
- Resource upload form

### 3.5 Admin Pages

- Admin Dashboard (stats cards, charts)
- User Management (table, approve/reject modals)
- Resource Management (table, approval modals)
- Course Management
- Academic Structure Management
- Reports Management
- Analytics (charts, graphs)
- System Settings

### 3.6 Reusable Components

- DataTable (sortable, filterable)
- ResourceCard
- Modal
- Toast notification
- Loading spinner
- Pagination
- SearchBar
- FileUpload
- StarRating
- StatCard
- Chart components

## Phase 4: Documentation & Testing

### 4.1 API Documentation

- Swagger/OpenAPI setup
- Document all endpoints

### 4.2 Testing

- Auth flow testing
- CRUD operations
- File upload/download
- Permission testing

## Development Order (Execution Phases)

### Phase 1: Foundation (Week 1)

1. Database schema creation
2. Express server setup with middleware
3. Database connection and initialization

### Phase 2: Core Backend (Week 2)

1. Auth system (register, login, JWT)
2. User management APIs
3. Resource upload and management
4. File handling and validation

### Phase 3: Extended Backend (Week 3)

1. Bookmarks, downloads, ratings
2. Reports system
3. Notifications system
4. Admin analytics
5. Course management

### Phase 4: Frontend Core (Week 4)

1. Vite + React setup with Tailwind
2. Auth pages (login, register)
3. Context API setup
4. API service layer
5. Student dashboard with resource filtering
6. Resource upload form

### Phase 5: Frontend Extended (Week 5)

1. Student pages (bookmarks, downloads, profile)
2. Admin dashboard with charts
3. User management UI
4. Resource management UI
5. Course and academic structure UI

### Phase 6: Polish & Docs (Week 6)

1. Landing page
2. Swagger documentation
3. Responsive design testing
4. Performance optimization
5. Final testing and bug fixes
