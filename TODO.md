# WolloShare - TODO

## Feature: Resource Categories + Chapters + Student Declared Info

### Database

- [x] Create migration SQL (category + chapter columns)
- [x] Apply migration to running MySQL

### Backend

- [x] Update `resource.service.js` upload to accept category & chapter
- [x] Update `resource.service.js` queries to return category & chapter
- [x] Update `resource.controller.js` to pass category & chapter
- [x] Update `resource.routes.js` validation for category
- [x] Update `auth.service.js`/`auth.routes.js` register to require declared academic info
- [x] Update constants.js with RESOURCE_CATEGORIES

### Frontend

- [ ] Update `UploadResource.jsx` - add category selector + chapter input
- [x] Update `admin/Resources.jsx` - add category to upload/edit, display category & chapter
- [x] Update `student/Dashboard.jsx` - category filter tabs (All / Course Material / Assignment / Past Exam) with backend category query param
- [x] Update `admin/Users.jsx` - highlight student declared info in review modal
- [x] Update `Register.jsx` - make declared academic fields required

### Verify

- [x] Rebuild client
- [x] Test backend endpoints
- [x] Verify server health

## Feature: Admin Resource Department & Category Filters

### Backend

- [x] Update `resource.service.js` `getAllResources()` to accept `category` filter (`AND r.category = ?`)
- [x] Update `resource.controller.js` `getAll()` to pass `category` from query
- [x] Update `resource.routes.js` `/all` route to validate `departmentId` & `category` query params

### Frontend

- [x] Update `admin/Resources.jsx` - department buttons row (All + each department)
- [x] Clicking a department filters resources to that department only (server-side via `departmentId`)
- [x] Category buttons appear when a department is selected (All / Course Material / Assignment / Past Exam)
- [x] Category filter passed to `getAll()` API call
- [x] Upload button pre-fills the currently selected department so admin can upload for that department easily

### Verify

- [x] Backend modules load OK
- [x] Client production build passes
- [x] Server restarted with new code

## Feature: Remove Email Requirement (Login with Student ID)

### Database

- [x] Create migration SQL (make users.email nullable)
- [x] Apply migration to running MySQL

### Backend

- [x] Update `auth.service.js` register() - no longer requires email, INSERT uses NULL
- [x] Update `auth.service.js` login() - accepts identifier (student ID or email)
- [x] Update `auth.controller.js` - destructures identifier
- [x] Update `auth.routes.js` - validation uses identifier

### Frontend

- [x] Update `AuthContext.jsx` - login() passes identifier
- [x] Update `Login.jsx` - uses "Student ID" field
- [x] Update `Register.jsx` - email field removed

### Verify

- [x] Backend modules load OK
- [x] Client production build passes
- [x] Server restarted with new code
- [x] Dashboard resource grouping (Course Material / Assignment / Past Exam)

## Feature: Verification State Machine + Resource Access Protection

### Backend

- [x] `verifyStudent()` rejects without clearing declared academic info (preserves for resubmission approval)
- [x] `requireVerifiedStudent` middleware re-validates status from DB (blocks stale-token bypass)
- [x] Protected `GET /resources/:id` and `GET /resources/:id/file` with `requireVerifiedStudent`
- [x] Rejected students blocked from login and all resource-access APIs

### Frontend

- [x] `Profile.jsx` - rejection status card with reason (hides academic info display in a non-verified state)
- [x] `Dashboard.jsx` - rejection banner + stale-token rejection handling

### Verify

- [x] `server/verify.test.js` - integration test (31 assertions, all passing)
  - Pending login blocked
  - Approve -> active + dashboard access
  - Reject -> status/account updated, declared info preserved, login blocked
  - Stale token blocked from dashboard/getById/file
  - Re-approve -> restored academic info + dashboard access
- [x] Server restarted with new code
