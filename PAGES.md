# PAGES.md — Which role can open which page

This document lists every page (route) in the HCL SATHEE web app and what each role can do on it. For a description of every button see [MANAGEMENT.md](MANAGEMENT.md); for the full feature guide see [README.md](README.md).

**Roles**

| Role | Stored as | Scope |
|---|---|---|
| Admin | `ADMIN` | Every centre |
| HCL Partner | `HCL PARTNER` | Own centre only |
| Sathee Mitra | `SATHEE MITRA` (includes Sathee Vishist, a Mitra with the Vishist flag) | Own centre only |

**Legend**

| Mark | Meaning |
|---|---|
| ✔ Full | Page is available and the role can read and change data on it |
| 👁 View | Page is available but read-only |
| ◐ Partial | Page is available, some actions are role-specific (see notes) |
| — | Not available. The route redirects away, or the sidebar never shows it |

---

## 1. Page access matrix

### 1.1 Public and pre-login screens

| Screen | Route | Admin | Partner | Mitra | Notes |
|---|---|:--:|:--:|:--:|---|
| Login | any path while signed out | ✔ | ✔ | ✔ | Name + email + password, "Remember me", link to *Forgot password* |
| Create password (invite link) | `/create-password?token=…` | ✔ | ✔ | ✔ | Works signed in or out; link valid 24 h, only while the account has no password |
| Forgot password (3 steps) | `/forgot-password` | ✔ | ✔ | ✔ | Email → 6-digit code → new password |

### 1.2 Entry and portal selection (after login)

| Screen | Route | Admin | Partner | Mitra | Notes |
|---|---|:--:|:--:|:--:|---|
| Home selector | `/` | ✔ | ✔ | ✔ | Cards: *HCL SATHEE* and *SATHEE*. Only Admins also see custom dashboards and the "Add new dashboard" card |
| State portal selector | `/portals` | ◐ | ◐ | ◐ | Everyone sees all centre cards, but a Partner/Mitra can open **only their own centre** (others show "Restricted"). Only Admins see Add / Rename / Delete centre |
| Other Centres overview | `/centres` | ✔ | — | — | Non-admins are redirected to `/` |

### 1.3 Admin portal (routes start at `/`)

| Page | Route | Admin | Partner | Mitra |
|---|---|:--:|:--:|:--:|
| Dashboard | `/dashboard` | ✔ | — | — |
| Attendance Record | `/attendance` | ✔ | — | — |
| Leave Requests | `/leave-requests` (opened from Attendance Record) | ✔ | — | — |
| Progress and Analytics | `/analytics` | ✔ | — | — |
| Users & Roles | `/users` | ✔ | — | — |
| Students | `/students` | ✔ | — | — |
| Announcements | `/announcements` | ✔ | — | — |
| Queries | `/queries` | ✔ | — | — |
| Kendra Report | `/report` | ✔ | — | — |

### 1.4 Partner portal (routes start with `/partner`)

| Page | Route | Admin | Partner | Mitra |
|---|---|:--:|:--:|:--:|
| Dashboard | `/partner/dashboard` | — | 👁 View | — |
| Attendance Record | `/partner/attendance` | — | 👁 View | — |
| Progress and Analytics | `/partner/analytics` | — | 👁 View | — |
| Students | `/partner/students` | — | 👁 View | — |
| Announcements | `/partner/announcements` | — | 👁 View | — |
| Query and Support | `/partner/support` | — | ✔ Full | — |
| My Profile | `/partner/profile` | — | ✔ Full | — |

### 1.5 Sathee Mitra portal (routes start with `/mitra`)

| Page | Route | Admin | Partner | Mitra |
|---|---|:--:|:--:|:--:|
| Dashboard | `/mitra/dashboard` | — | — | ◐ Partial |
| Attendance Record | `/mitra/attendance` | — | — | ✔ Full |
| Progress and Analytics | `/mitra/analytics` | — | — | 👁 View |
| Students | `/mitra/students` | — | — | ◐ Partial |
| Test Marks | `/mitra/test-marks` | — | — | ✔ Full |
| Announcements | `/mitra/announcements` | — | — | 👁 View |
| My Profile | `/mitra/profile` | — | — | ✔ Full |

Anything else (`*`) redirects to `/`.

---

## 2. Sidebar menu per role

| # | Admin | Partner | Mitra |
|---|---|---|---|
| 1 | Dashboard | Dashboard | Dashboard |
| 2 | Attendance Record | Attendance Record | Attendance Record |
| 3 | Progress and Analytics | Progress and Analytics | Progress and Analytics |
| 4 | Users & Roles | Students | Students |
| 5 | Students | Announcements | Test Marks |
| 6 | Announcements | Query and Support | Announcements |
| 7 | Queries | My Profile | My Profile |
| 8 | Kendra Report | | |

Header: every role shows *"\<portal\> PORTAL"*, the role label and **Logout**. Only Admins additionally get an **Other Centres** button.

---

## 3. What each role can do on each page

### 3.1 Dashboard

| Widget / action | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| Notification Yes/No banner | ✔ | ✔ | ✔ |
| Welcome banner | ✔ | ✔ | ✔ |
| Students by Course chart | ✔ | ✔ | ✔ |
| Attendance pie (Daily / Weekly / Monthly) | ✔ | ✔ | ✔ |
| Batch Exam Progress bars | ✔ | ✔ | ✔ |
| Quick Actions (navigate) | Add Students, View Attendance, View Timetable, View Schedule | View Students, View Attendance, View Timetable, View Schedule | Add Students, View Attendance, View Timetable, View Schedule |
| View timetable / schedule | ✔ | 👁 | ✔ |
| Upload / replace / remove timetable | ✔ | — | ✔ (own centre) |
| Upload / add month / delete month / export schedule | ✔ | — (export hidden) | ✔ (own centre) |

### 3.2 Attendance Record

| Action | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| Student attendance, Daily / Weekly / Monthly | ✔ | 👁 | ✔ |
| Choose centre in the filter | ✔ | — (fixed to own centre) | — (fixed) |
| Export table (XLSX / SVG) | ✔ (student view) | — | ✔ (student view) |
| Sathee Mitra attendance table | ✔ | shown as an option but returns no rows for Partners | own row via "My Attendance" |
| Approve a Mitra's day (within 24 h of arrival) | ✔ | — | — |
| Sathee Vishist attendance (availability view) | ✔ (Daily) | option shown, no data | ✔ (Daily) |
| Take class attendance (Present/Absent + photo) | — (API only) | — | ✔ |
| Mark own arrival / departure with camera | — | — | ✔ (today only) |
| Log a Vishist mentor's session, approve it | — | — | ✔ |
| Apply for leave, see MyRequests | — | — | ✔ |
| Review leave requests (Approve / Reject) | ✔ (Leave Requests page) | — | — |

### 3.3 Progress and Analytics

| Tab / action | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| Students tab (Overall + Individual, graphs) | ✔ | ✔ | ✔ |
| Mentors tab: overview | ✔ | ✔ | — (tab hidden) |
| Mentors tab: set Vishist available days | ✔ | — (chips disabled) | — |
| Mentor details modal: view | ✔ | ✔ | — |
| Mentor details modal: edit days and phone | ✔ | — | — |
| Utilities (equipment) table | ✔ | 👁 | 👁 |
| Add Equipment | ✔ | — | — |

### 3.4 Users & Roles (Admin only)

| Action | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| View user list and role tabs | ✔ | — | — |
| Add user (any of the three roles) | ✔ | — | — |
| Resend invite | ✔ | — | — |
| Delete user | ✔ | — | — |

### 3.5 Students

| Action | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| List, search, filter by course, sort, paginate | ✔ | ✔ | ✔ |
| Open student details and View Analytics | ✔ | ✔ (read-only) | ✔ (read-only) |
| Add student | ✔ | — | ✔ |
| Import students (file or Google Sheet) | ✔ | — | ✔ |
| Edit student details (details modal) | ✔ | — | — (read-only modal) |
| Delete student | ✔ | — | ✔ (own centre) |

### 3.6 Test Marks (Mitra page)

| Action | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| Open the Test Marks page | — (no page; the API allows it) | — | ✔ |
| Create test, delete test, enter marks, attach answer sheet | — | — | ✔ |
| See resulting marks in analytics / details / report | ✔ | ✔ | ✔ |

### 3.7 Announcements

| Action | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| Read announcements | all centres | targeted at own centre | targeted at own centre |
| Search, filter by category, sort, open attachment | ✔ | ✔ | ✔ |
| Create, edit, delete, attach file | ✔ | — | — |

### 3.8 Support

| Page | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| Queries (all queries, reply) | ✔ | — | — |
| Query and Support (submit a query, see own queries and replies) | — | ✔ | — |

### 3.9 Kendra Report and Profile

| Page | Admin | Partner | Mitra |
|---|:--:|:--:|:--:|
| Kendra Report (on-screen + PDF export) | ✔ | — | — |
| My Profile (edit own name, email, phone) | — | ✔ | ✔ (also shows Available Days, Vishist flag, other Vishist mentors) |

---

## 4. How access is enforced

1. **Login required.** With no valid token, every path shows the login screen (except `/create-password` and `/forgot-password`). Any `401` from the API clears the session and returns to login.
2. **Route guards (`Client/src/App.jsx`).**
   - Admin routes need an Admin role **and** a selected portal; otherwise → `/portals`.
   - Partner routes need the Partner role, a selected portal and access to that centre; otherwise → `/portals`.
   - Mitra routes need the Mitra role, a selected portal and access to that centre; otherwise → `/portals`.
   - `/centres` needs Admin; otherwise → `/`.
   - Opening another role's URL sends the user to `/portals`.
3. **Centre access.** A Partner or Mitra can select only the portal whose name matches their own centre (`canAccessPortal`); centre names are compared with a canonical key so `HCL RAJATHAN` and `HCL RAJASTHAN` match.
4. **API guards (`Server/src/Middleware/auth.js`).** The server re-checks the role on every request and filters Partner/Mitra data to their own centre, regardless of what the UI shows. See the endpoint table in [README.md §14](README.md#14-rest-api-reference).

### Notes and known gaps

- `/leave-requests` is opened from the Attendance page and is **not** covered by the client-side Admin route guard. A non-admin who types the URL would see an error state, because the API rejects the request with `403`.
- The Partner attendance page offers *Sathee Mitra* and *Sathee Vishist* role options, but never loads Mitra records, so they show empty results.
- Admins have no *Test Marks* or *My Profile* page in the UI. Marks are viewed through Analytics, Students and the Kendra Report.
- Mitras have no Support page in the UI, although the API accepts support queries from any signed-in user.
