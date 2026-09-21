# MANAGEMENT.md — Buttons, controls and file guide

This document has two parts:

- **Part A** explains what every button and control does, who sees it and which backend call it triggers.
- **Part B** briefly describes every file in the `HCL Sathee` folder.

Related documents: [README.md](README.md) (full project guide) and [PAGES.md](PAGES.md) (which role can open which page).

Role shorthand: **A** = Admin, **P** = HCL Partner, **M** = Sathee Mitra (including Vishist).

---

# Part A — Buttons and controls

## A1. Controls available on almost every screen

| Control | What it does | Who |
|---|---|:--:|
| Sidebar menu item | Navigates to that page (menu differs per role, see PAGES.md) | A P M |
| **Logout** (header) | Clears the session and returns to the login screen. No server call | A P M |
| **Other Centres** (header) | Opens the all-centres overview | A |
| Search box | Filters the table or list on screen as you type | A P M |
| Sort controls (Name / Date added, ascending / descending) | Re-orders the rows on screen | A P M |
| **Export** dropdown (XLSX or SVG) | Downloads the visible table. XLSX for spreadsheets, SVG as an image | A M (Partner has no export) |
| Enter key inside a form | Moves to the next field; on the last field it submits | A P M |
| Esc key | Closes most modals (not while a save is in progress) | A P M |
| Confirmation dialogs ("Delete …?") | Two-step protection before any destructive action | A M |

## A2. Login and account screens

| Control | What it does | Backend call |
|---|---|---|
| **Sign in** | Logs in with full name, email and password. Retries automatically while a sleeping server wakes up ("Waking up server…") | `POST /api/auth/login` |
| **Remember me** | Saves name, email and password in this browser so the form is prefilled next time | none (browser storage) |
| **Forgot password** link | Opens the 3-step reset flow | none |
| **Send code** (step 1) | Emails a 6-digit code (valid 10 minutes) | `POST /api/auth/forgot-password/request-otp` |
| **Verify** (step 2) | Checks the code (5 attempts max) and unlocks the reset step | `…/verify-otp` |
| **Resend in Ns** | Requests a new code after a 30-second cooldown | `…/request-otp` |
| **Use a different email** | Goes back to step 1 | none |
| **Reset password** (step 3) | Saves the new password (must meet the password rules) | `…/reset` |
| **Create password** (from the invite email) | Sets the first password for a new account. Link valid 24 h | `POST /api/auth/create-password` |

Password rules: at least 8 characters with an uppercase letter, a lowercase letter, a digit and a special character.

## A3. Home selector and portal selector

| Control | What it does | Who | Backend call |
|---|---|:--:|---|
| **HCL SATHEE** card | Opens the state-portal selector | A P M | none |
| **SATHEE** card | Opens the companion SATHEE app in a new tab (currently a placeholder address, see README §18) | A P M | none |
| **ADD NEW DASHBOARD** card | Asks for a name and an http(s) link, then adds a shortcut card. Stored only in this browser | A | none |
| ✕ on a custom dashboard card | Removes that shortcut immediately | A | none |
| Custom dashboard card | Opens its link in a new tab | A | none |
| Centre card → **Open Portal** | Enters that centre's portal and its dashboard. Cards show **Restricted** if it is not your centre | A P M | none |
| **ADD NEW CENTRE** card | Creates a new centre from a name (normalised to `HCL <NAME>`; duplicates rejected) | A | `POST /api/centres` |
| Pencil on a custom centre | Renames it. Refused while students, users or equipment belong to it | A | `PATCH /api/centres/:id` |
| Trash on a custom centre | Deletes it after a confirmation. Same "must be empty" rule. Default centres cannot be renamed or deleted | A | `DELETE /api/centres/:id` |
| **Refresh** (Other Centres) | Reloads the headcounts | A | `GET /api/centres/overview` |
| Centre card (Other Centres) | Asks "Redirect to X?", then switches portal and opens its dashboard | A | none |

## A4. Dashboard (all roles)

| Control | What it does | Who | Backend call |
|---|---|:--:|---|
| Notification **Yes / No** + **Save** | *Yes*: asks the browser for permission and subscribes this device to push. *No*: unsubscribes it | A P M | `PATCH` / `DELETE /api/users/me/push-subscription` |
| **Daily / Weekly / Monthly** toggle (attendance pie) | Changes the period of the attendance summary | A P M | `GET /api/students/performance/attendance-summary` |
| Hover on a course bar | Shows the names of students in that course | A P M | none |
| Hover on a Batch Exam Progress bar | Shows the course's average latest weekly-test percentage | A P M | none |
| **Add Students** (Quick Actions) | Jumps to the Students page | A M | none |
| **View Students** (Quick Actions) | Jumps to the Students page | P | none |
| **View Attendance** | Jumps to the Attendance page | A P M | none |
| **View Timetable** | Opens the timetable modal | A P M | `GET /api/timetables` |
| **View Schedule** | Opens the teaching-schedule modal | A P M | `GET /api/schedules` |

### Timetable modal

| Control | What it does | Who | Backend call |
|---|---|:--:|---|
| **Template** | Downloads `hcl-sathee-timetable-template.xlsx` | A M | none |
| **Upload / Replace** | Reads a `.xls`, `.xlsx`, `.csv` or `.svg` and saves it for the centre at once | A M | `PUT /api/timetables` |
| **Save / Sync to phone** | Re-sends the locally cached timetable to the server (shown when not yet synced) | A M | `PUT /api/timetables` |
| **Remove** | Deletes the centre's timetable | A M | `DELETE /api/timetables` |

### Schedule modal

| Control | What it does | Who | Backend call |
|---|---|:--:|---|
| Subject / Month filters, topic search | Narrow the rows shown | A P M | none |
| **Template** | Downloads `hcl-sathee-schedule-template.xlsx` | A M | none |
| **Add Month** (upload) | Reads `.xls/.xlsx/.csv`; rows for the months in the file replace existing rows for those months; saves automatically | A M | `PUT /api/schedules` |
| **Save / Sync to phone** | Re-sends the local copy to the server | A M | `PUT /api/schedules` |
| **Delete** | Opens a month picker; deleting the last month removes the whole schedule | A M | `PUT` or `DELETE /api/schedules` |
| **Export Schedule** | Downloads the filtered rows as XLSX or SVG | A M | none |

## A5. Attendance Record

### Filters and table (all roles)

| Control | What it does | Who |
|---|---|:--:|
| **Type** (Daily / Weekly / Monthly) | Chooses the period | A P M |
| **Centre** | Chooses which centre's data to show. Fixed to your own centre for P and M | A |
| **Role** (Student / Sathee Mitra / My Attendance / Sathee Vishist) | Chooses what to list. Mitras see *My Attendance* instead of *Sathee Mitra* | A P M |
| **Go** | Loads the table (enabled once all filters are chosen) | A P M |
| Date picker | Picks the day (Daily and Mitra views) | A P M |
| **Leave Requests** button | Opens the leave-request review page | A |

### Admin actions

| Control | What it does | Backend call |
|---|---|---|
| **Mark Attendance** (Mitra table) | Approves a Mitra's day so it counts as Present. Appears only with an arrival photo, unapproved, and within 24 h; then shows **Expired** | `PATCH /api/mitra-attendance/:userId/approve` |
| **Approve** / **Reject** (Leave Requests) | Decides a *Pending* leave request (one time only) | `PATCH /api/leave-requests/:id/status` |

### Mitra actions

| Control | What it does | Backend call |
|---|---|---|
| **Attendance ▾** menu | Switches between *My Attendance* and *Vishist Attendance* panels | none |
| **Apply Leave** | Opens the leave form: From, To, Reason (max 1000 characters) | none |
| Leave form **Submit** | Sends the request; all admins get a push notification | `POST /api/leave-requests` |
| **MyRequests** | Lists your leave requests and their status | `GET /api/leave-requests/mine` |
| Today's Classes card | Expands today's timetable column for the centre | none |
| **Course / Subject / Taught Topic / Time Slot** + **Go** | Selects which class to mark. Go with no filters lists all of today's classes | `GET /api/students/performance/daily-attendance` |
| **Present / Absent** radios | Mark one student | none |
| **P / A** in the table header | Marks every student in the class at once | none |
| **Class Photo Proof** | Attaches an optional photo (image up to 8 MB) | none |
| **Save** (class attendance) | Saves all marks (every student must be marked). The table then locks as **Saved** | `POST /api/students/performance/daily-attendance` |
| **Arrival / Departure** cards → capture | Opens the live camera. Photo is compressed, then uploaded. Today only | `POST /api/mitra-attendance/upload` |
| Camera **Capture / Retake / Cancel / Save** | Take, redo, abandon or upload the photo | none / upload above |
| Vishist panel: mentor dropdown, Subject, Topic Taught, optional photo → **Submit** | Logs a visiting mentor's session (status *pending*) | `POST /api/vishist-attendance` |
| **Approve** (Today's Vishist Attendance) | Approves a pending session | `PATCH /api/vishist-attendance/:id/approve` |

## A6. Progress and Analytics

| Control | What it does | Who | Backend call |
|---|---|:--:|---|
| **Overall / Individual** toggle | Class-level or single-student analysis | A P M | none |
| **View Graph** (per course) | Opens a chart of average % per test slot; dropdown picks Weekly / Monthly / Six-monthly | A P M | `GET /api/test-marks/test-type-progress` |
| Course → students (tick) → Test Type → **Go** | Individual view: marks per test and change between tests | A P M | none |
| **Students / Mentors** tabs | Switch tab (Mitras do not see Mentors) | A P | none |
| Weekday chips (Mon–Sun) | Toggles a Vishist mentor's available days (saved instantly) | A | `PATCH /api/users/:id` |
| Mentor name link | Opens the mentor details modal | A P | none |
| **Edit Days Available** → **Save** | Edits days and 10-digit phone in the modal | A | `PATCH /api/users/:id` |
| **Add Equipment** | Opens the form: name (≤100), description (≤250), quantity ≥ 1, serial number optional | A | `POST /api/equipments` |

## A7. Users & Roles (Admin)

| Control | What it does | Backend call |
|---|---|---|
| Role tabs (All / Admin / Sathee Mitra / HCL Partner) | Filter the table; each shows a count | none |
| **Add User** | Form: name, email, phone (10 digits), role. For Mitra: *Is Vishist?* and available days. Creates the account and emails the invite | `POST /api/users` |
| Paper-plane icon | Resends the invite (only while the user has no password) | `POST /api/users/:id/resend-invite` |
| Trash icon | Deletes the user after confirmation | `DELETE /api/users/:id` |
| Copyable **password setup link** | Shown if the invite email could not be sent, so the Admin can share it manually | none |

## A8. Students

| Control | What it does | Who | Backend call |
|---|---|:--:|---|
| Course filter, search, sort, pagination (8 per page) | Narrow and order the list | A P M | none |
| Student name | Opens the details modal | A P M | none |
| **Add Student** | Form for a new student. Student ID is generated automatically (e.g. `RJ-JU-001`) | A M | `POST /api/students` |
| **Import Data** | Opens the import dialog | A M | none |
| Import: file upload / Google Sheet link | Loads rows from `.xlsx/.xls/.csv` or a link-shared sheet | A M | `POST /api/students/import/fetch-sheet` (sheet only) |
| Import: **Download template** | Downloads `student-data-import-template.xlsx` | A M | none |
| Import: **Import** | Sends all rows (max 500); shows Imported / Failed / Total with per-row reasons | A M | `POST /api/students/import` |
| **Student Details / View Analytics** tabs | Switch between profile and analytics views | A P M | none |
| **Edit Details** → **Save** | Edits profile fields (marks and attendance are read-only) | A | `PATCH /api/students/:id` |
| Trash icon → confirm | Deletes the student (Mitras: own centre only) | A M | `DELETE /api/students/:id` |

## A9. Test Marks (Mitra)

| Control | What it does | Backend call |
|---|---|---|
| **Type** (Performance-Weekly / Pre-Mid-Monthly / Mid-Six months), **Course**, **Test**, **Student** | Select what to enter marks for | `GET /api/test-marks/tests` |
| **+ Add** | Creates a new test from a name (auto-numbered) | `POST /api/test-marks/tests` |
| Delete (on a test) → confirm | Deletes the test and all its saved marks | `DELETE /api/test-marks/tests/:id` |
| **Manual Entry** | Shows one row per subject: Marks Gained, Total Marks, live Percentage, Grand Total and Average | none |
| **Upload / Browse** (answer sheet) | Attaches a PDF, image or Word file (up to 15 MB) | none |
| **Save** | Saves all subject rows. If marks already exist, asks to confirm the override | `POST /api/test-marks` |

## A10. Announcements

| Control | What it does | Who | Backend call |
|---|---|:--:|---|
| Category filter, search, sort | Narrow and order the list | A P M | none |
| **View** | Opens full text with an Open / Download link and inline PDF/image preview | A P M | none |
| **New Announcement** | Form: title, category, priority, centres (one or more), description, optional attachment (PDF/DOC/DOCX/JPG/PNG, 10 MB). Notifies Mitras in the targeted centres | A | `POST /api/announcements` |
| **Edit** | Same form prefilled; re-attach the file if the old one has no stored copy | A | `POST /api/announcements/:id` |
| **Delete** → confirm | Removes the announcement | A | `DELETE /api/announcements/:id` |

## A11. Support

| Control | What it does | Who | Backend call |
|---|---|:--:|---|
| Query form: Title, Description → **Submit** | Sends a query; admins get push and email | P | `POST /api/support-queries` |
| Admin contact **Gmail** link | Opens a prefilled Gmail compose window | P | none |
| **Your queries** (expand) | Shows your past queries and admin replies | P | `GET /api/support-queries/mine` |
| Reply box → **Send Reply** | Replies to a query; the author gets push and email. Several replies allowed | A | `POST /api/support-queries/:id/reply` |

## A12. Kendra Report (Admin)

| Control | What it does | Backend call |
|---|---|---|
| **Weekly / Monthly** | Sets the report window (current Mon–Sun or current month) | none |
| Course chips | Choose which of the 8 courses to include (at least one) | none |
| **Go** | Builds the on-screen report | `GET /api/students`, `…/attendance-detail`, `GET /api/test-marks/course-marks` |
| **Export Report** | Opens options: include Sathee Mitra list, include Sathee Vishist list; then downloads the A4 PDF | none (built in the browser) |

## A13. My Profile (Partner, Mitra)

| Control | What it does | Backend call |
|---|---|---|
| **Edit** → **Save** | Changes name, email or phone (email and phone must stay unique; phone is 10 digits) | `PATCH /api/users/me` |

---

# Part B — File guide

Files ignored by git (secrets and generated folders such as `node_modules/`, `dist/`) are marked *(not in git)*.

## B1. Repository root

| File | Description |
|---|---|
| `README.md` | Complete project guide: setup, architecture, roles, every operation, API, deployment |
| `PAGES.md` | Which role can open which page |
| `MANAGEMENT.md` | This file: button guide and file guide |
| `.gitignore` | Files git should not track (env files, `node_modules`, `dist`, service keys, `.claude/`) |
| `.claude/` | Local Claude Code tooling folder *(ignored)* |
| `Client/` | The React web app |
| `Server/` | The Express API |

## B2. `Client/` (React + Vite web app)

### Project files

| File | Description |
|---|---|
| `package.json` / `package-lock.json` | Client dependencies and scripts (`dev`, `build`, `lint`, `preview`) |
| `vite.config.js` | Vite setup: React, Tailwind, SVG-as-component plugin; dev server on port 5173 |
| `vercel.json` | Vercel rewrite that sends every URL to `index.html` (single-page app) |
| `index.html` | HTML shell that loads `src/main.jsx` |
| `eslint.config.js` | Lint rules |
| `.gitignore` | Client-specific ignores |
| `.env`, `.env.production` | `VITE_API_URL` and `VITE_VAPID_PUBLIC_KEY` *(not in git)* |
| `public/favicon.svg` | Browser tab icon, also used as the notification icon |
| `public/push-sw.js` | Service worker that shows Web Push notifications and focuses the app on click |

### `src/` entry files

| File | Description |
|---|---|
| `main.jsx` | React entry point that mounts the app |
| `App.jsx` | Router, role guards, session state, sidebar configuration for all three roles |
| `index.css` | Tailwind import and global styles |
| `assets/HCL.svg`, `assets/sathee.svg` | Logos used on the selector and login screens |
| `config/api.js` | Works out the API base URL from `VITE_API_URL` |
| `hooks/useEscapeToClose.js` | Hook that closes a modal when Esc is pressed |
| `Data/EquipmentCatalog.js` | About 200 predefined equipment names and descriptions for the equipment picker |

### `src/Pages/` (one screen each)

| File | Description |
|---|---|
| `Auth/Authentication.jsx` | Login screen wrapper |
| `Selector/CardSelector_1.jsx` | Home selector (HCL SATHEE / SATHEE / custom dashboards) |
| `Selector/CardSelector_2.jsx` | State-portal (centre) selector, plus centre add / rename / delete for Admins |
| `Selector/OtherCentres.jsx` | Admin overview of every centre with headcounts |
| `Dashboard/AdminDashboard.jsx` | Dashboard used by all roles; takes a read-only flag |
| `Dashboard/HCLPartnerDashboard.jsx` | Partner dashboard (read-only wrapper) |
| `Dashboard/SatheeMitraDashboard.jsx` | Mitra dashboard (editable timetable and schedule) |
| `Attendance/AdminAttendance.jsx` | Attendance Record page, shared by all roles through props |
| `Attendance/HCLPartnerAttendance.jsx` | Partner wrapper (no export, centre fixed) |
| `Attendance/SM_Attendance.jsx` | Mitra wrapper (class attendance, own attendance, Vishist, leave) |
| `Attendance/AdminLeaveRequests.jsx` | Admin page to approve or reject leave requests |
| `Analytics/AdminAnalytics.jsx` | Progress and Analytics page (Students tab, Mentors tab, Utilities) |
| `Analytics/HCLPartnerAnalytics.jsx` | Partner wrapper (read-only) |
| `Analytics/SM_Analytics.jsx` | Mitra wrapper (Students tab only) |
| `User/AdminUser.jsx` | Users & Roles page |
| `Student/Student.jsx` | Students page shared by all roles |
| `Student/View.jsx` | Partner wrapper (read-only) |
| `Student/SM_Student.jsx` | Mitra wrapper (add, import, delete) |
| `TestMarks/SM_TestMarks.jsx` | Mitra Test Marks page |
| `Announcements/AdminAnnouncements.jsx` | Announcements page shared by all roles |
| `Announcements/HCLPartnerAnnouncements.jsx` | Partner wrapper (read-only) |
| `Announcements/SatheeMitraAnnouncements.jsx` | Mitra wrapper (read-only) |
| `Support/AdminQueries.jsx` | Admin page listing and replying to queries |
| `Support/QueryAndSupport.jsx` | Partner page to submit and follow queries |
| `Report/CentreReport.jsx` | Kendra Report page and PDF export trigger |
| `Schedule/Schedule.jsx` | Teaching-schedule viewer/editor shown inside a modal |
| `Profile/MyProfile.jsx` | Profile page for Partners and Mitras |

### `src/Components/`

| File | Description |
|---|---|
| `MainLayout.jsx` | Page frame: header, collapsible sidebar, mobile drawer, Logout |
| **Analytics** | |
| `Analytics/StudentsTab.jsx` | Students tab: Overall and Individual analysis with graphs |
| `Analytics/TeachersTab.jsx` | Mentors tab: 7-day attendance overview and Vishist day chips |
| `Analytics/MentorDetailsModal.jsx` | Mentor details and edit-days modal |
| `Analytics/UtilitiesSection.jsx` | Equipment table with Add Equipment |
| `Analytics/AddEquipmentModal.jsx` | Form for a new equipment item |
| `Analytics/EquipmentNameSelect.jsx` | Searchable equipment-name dropdown |
| `Analytics/AnalyticsCharts.jsx` | Bar and line chart drawing helpers |
| `Analytics/analyticsUi.js` | Colour badge helpers for attendance and performance levels |
| **Announcements** | |
| `Announcements/AnnouncementCard.jsx` | One announcement card with priority badge |
| `Announcements/AnnouncementFilters.jsx` | Search, category and sort bar |
| `Announcements/AnnouncementModals.jsx` | View modal (PDF/image preview) and delete confirmation |
| `Announcements/NewAnnouncementModal.jsx` | Create / edit announcement form |
| **Attendance** | |
| `Attendance/TabSelector.jsx` | Type / Centre / Role filters and the Go button |
| `Attendance/AttendanceToolbar.jsx` | Search box, date picker and export menu (the Leave Requests and MyRequests buttons live in `Pages/Attendance/AdminAttendance.jsx`) |
| `Attendance/AttendanceTable.jsx` | Student attendance rows with bars and status |
| `Attendance/SatheeMitraAttendance.jsx` | Mitra attendance table and approval |
| `Attendance/MyMitraAttendance.jsx` | Mitra's own arrival and departure cards |
| `Attendance/LiveCameraCapture.jsx` | Live camera modal (capture, retake, save) |
| `Attendance/ClassSubjectAttendanceTables.jsx` | Class attendance marking tables with photo proof |
| `Attendance/TodaysClassesCard.jsx` | Today's classes read from the timetable |
| `Attendance/VishistAttendanceUpload.jsx` | Log and approve Vishist sessions |
| `Attendance/ApplyLeaveModal.jsx` | Mitra leave form (From, To, Reason) |
| `Attendance/utils.js` | Percentage colour and bar-width helpers |
| **Auth** | |
| `Auth/LoginCard.jsx` | Login form with remember-me and cold-start messages |
| `Auth/CreatePassword.jsx` | Set-password page for invite links |
| `Auth/ForgetPassword.jsx` | Three-step password reset |
| `Auth/AuthBrand.jsx` | Branding panel beside the auth forms |
| `Auth/authUi.jsx` | Shared input and button styles for auth screens |
| **Dashboard** | |
| `Dashboard/WelcomeBanner.jsx` | Greeting, online indicator and clock |
| `Dashboard/NotificationSettingsBanner.jsx` | Yes/No push-notification banner |
| `Dashboard/QuickActions.jsx` | Shortcut buttons |
| `Dashboard/SectionHeader.jsx` | Section title bar |
| `Dashboard/StudentsByCourseChart.jsx` | Students-by-course bar chart |
| `Dashboard/AttendanceChart.jsx` | Present/absent pie with period toggle |
| `Dashboard/ExamProgress.jsx` | Batch exam progress bars |
| `Dashboard/TimeTable.jsx` | Timetable modal: parse, upload, sync, template |
| **Schedule** | |
| `Schedule/ScheduleTable.jsx` | Schedule rows table |
| `Schedule/FilterSelect.jsx` | Dropdown used by the schedule filters |
| `Schedule/ProgressBar.jsx` | Completion bar |
| `Schedule/StatusBadge.jsx` | Pending / In Progress / Completed pill |
| `Schedule/StatusBanner.jsx` | Summary line for the loaded schedule |
| `Schedule/EmptyState.jsx` | "No schedule yet" message with upload button |
| `Schedule/DeleteMonthPanel.jsx` | Month picker for deleting a month |
| `Schedule/scheduleData.js` | Default subjects and months, spreadsheet parsing and month merging |
| `Schedule/index.js` | Re-exports the schedule components |
| **Selector** | |
| `Selector/AddCentreModal.jsx` | Form for a new centre |
| `Selector/AddDashboardModal.jsx` | Form for a custom dashboard link |
| **Student** | |
| `Student/StudentTable.jsx` | Students table |
| `Student/StudentToolbar.jsx` | Search box, course filter and the Add Student / Import Data buttons |
| `Student/NewStudent.jsx` | Add-student form with subject rules |
| `Student/ImportStudentsModal.jsx` | Spreadsheet / Google Sheet import with preview |
| `Student/StudentDetailsModal.jsx` | Details, edit and analytics for one student |
| `Student/StudentAnalyticsPanel.jsx` | Attendance and performance summary inside the modal |
| `Student/StudentPerformanceChart.jsx` | Per-test performance chart |
| `Student/CourseBadge.jsx` | Coloured course label |
| **Test marks** | |
| `TestMarks/TestMarksUpload.jsx` | Test selection, manual marks entry and answer-sheet upload |
| **User** | |
| `User/UserTable.jsx` | Users table with Date Added column |
| `User/UserToolbar.jsx` | Search box and Add User button |
| `User/UserFilter.jsx` | Role tabs with counts |
| `User/NewUser.jsx` | Add-user form |
| **Shared** | |
| `common/ExportDropdown.jsx` | XLSX / SVG export menu |
| `common/TableSortControls.jsx` | Name / Date added sort control |
| `common/TableStatusRow.jsx` | Loading / empty row for tables |
| `common/tableSerial.jsx` | S.No column helpers |

### `src/services/` (API calls)

| File | Description |
|---|---|
| `apiClient.js` | Axios instance: base URL, 60 s timeout, adds the login token, signs out on 401 |
| `announcements.js` | List, create, update, delete announcements |
| `centres.js` | List centres, overview, create, rename, delete |
| `dailySubjectAttendance.js` | Load and save class attendance |
| `equipment.js` | List and add equipment |
| `leaveRequests.js` | Apply, list own, list all, update status |
| `mitraAttendance.js` | Load Mitra attendance and upload arrival/departure photos |
| `notifications.js` | Register and remove this browser's push subscription |
| `schedules.js` | Load, save, delete the centre schedule (with local cache) |
| `studentPerformance.js` | Load students with performance, attendance summaries and ranges |
| `students.js` | Students CRUD and import |
| `supportQueries.js` | Submit, list, reply to queries |
| `testMarks.js` | Tests, marks saving, progress and course marks |
| `timetables.js` | Load, save, delete the centre timetable (with local cache) |
| `users.js` | Users CRUD, profile, Vishist mentors |
| `vishistAttendance.js` | Load, mark and approve Vishist sessions |

### `src/utils/` (helpers)

| File | Description |
|---|---|
| `authSession.js` | Reads and writes the signed-in session in `sessionStorage` |
| `authToken.js` | Stores and decodes the login token |
| `apiRequest.js` | Login-time requests with retries for sleeping servers |
| `portalMapping.js` | Centre name matching, portal options, role checks and portal access rules |
| `centreDirectory.js` | Kendra ID, place and address of the default centres |
| `courseSubjects.js` | Courses, their subjects and selection rules |
| `studentMetrics.js` | Initials, avatar colours and student score helpers |
| `phone.js` | 10-digit phone helpers |
| `passwordPolicy.js` | Password rules and live checklist |
| `availableDays.js` | Weekday constants for Vishist availability |
| `todayClasses.js` | Extracts today's classes from a timetable |
| `tableSort.js` | Sorts table rows by name or date added |
| `exportTable.js` | Downloads tables as XLSX or SVG |
| `exportAttendance.js` | Builds the attendance export |
| `centreReportPdf.js` | Draws the Kendra Report PDF |
| `uploadTemplates.js` | Generates the downloadable Excel templates |
| `compressImage.js` | Shrinks photos before upload |
| `webPush.js` | Browser push subscription helpers |
| `customDashboards.js` | Stores custom dashboard shortcuts in the browser |

## B3. `Server/` (Express API)

### Project files

| File | Description |
|---|---|
| `package.json` / `package-lock.json` | Server dependencies and scripts (`start`, `dev`, `test`) |
| `.env` | Real secrets and settings *(not in git)* |
| `.env.example` | Template listing every variable the server needs |
| `.gitignore` | Server-specific ignores |
| `supabase/schema.sql` | Full database schema, indexes, triggers, the student-ID counter function and grants |

### `src/` core

| File | Description |
|---|---|
| `index.js` | Starts Express: security headers, CORS, rate limits, body limits, mounts every route, boots Supabase |
| `config/supabase.js` | Creates the Supabase client and shared query helpers |
| `config/storage.js` | Uploads files to Supabase Storage and returns long-lived links |
| `Middleware/auth.js` | Verifies the login token and applies role guards |
| `Middleware/rateLimits.js` | Stricter rate limit for login and password-reset routes |

### `src/Routes/` (URL → handler, with role guards)

| File | Description |
|---|---|
| `AuthRoutes.js` | Login, create password, forgot-password steps |
| `CentreRoutes.js` | Centres list, overview, create, rename, delete |
| `UserRoutes.js` | Users, own profile, push subscription, invites |
| `StudentRoutes.js` | Students CRUD and import |
| `StudentPerformanceRoutes.js` | Performance data, class attendance, attendance summaries |
| `MitraAttendanceRoutes.js` | Mitra attendance list, photo upload, approval |
| `VishistAttendanceRoutes.js` | Vishist sessions list, mark, approve |
| `LeaveRequestRoutes.js` | Leave apply, list, review |
| `TestMarksRoutes.js` | Tests, marks, progress, course marks |
| `AnnouncementRoutes.js` | Announcements CRUD with attachments |
| `EquipmentRoutes.js` | Equipment list and add |
| `ScheduleRoutes.js` | Centre schedule get, save, delete |
| `TimetableRoutes.js` | Centre timetable get, save, delete |
| `SupportQueryRoutes.js` | Queries submit, list, reply |

### `src/Controllers/` (business rules)

| File | Description |
|---|---|
| `AuthController.js` | Login, invite password, OTP reset flow |
| `CentreController.js` | Centre rules and per-centre headcounts |
| `UserController.js` | Create/edit/delete users, invites, profile, push subscriptions |
| `StudentController.js` | Student validation, ID generation, import, Google Sheet fetch |
| `StudentPerformanceController.js` | Batched performance data, class attendance saving, attendance summaries |
| `MitraAttendanceController.js` | Mitra check-in photos and approval |
| `VishistAttendanceController.js` | Vishist session logging and approval |
| `LeaveRequestController.js` | Leave rules and admin notifications |
| `TestMarksController.js` | Tests, marks upsert, progress and report data |
| `AnnouncementController.js` | Announcement targeting and push notifications |
| `EquipmentController.js` | Equipment validation |
| `ScheduleController.js` | Schedule access rules |
| `TimetableController.js` | Timetable access rules |
| `SupportQueryController.js` | Query creation, admin alerts and reply notifications |

### `src/Models/` (database access, one per table)

| File | Description |
|---|---|
| `User.js` | Users, OTP fields, push subscriptions |
| `Centre.js` | Centres, default centres, "in use" checks |
| `Student.js` | Students and paging |
| `SubjectPerformance.js` | Per-subject marks records (batched lookup) |
| `SubjectAttendance.js` | Per-subject attendance roll-up (batched lookup) |
| `DailySubjectAttendance.js` | Per-day class attendance |
| `Test.js` | Tests per course and centre |
| `TestSubjectMark.js` | Marks per test, student, type and subject |
| `MitraAttendance.js` | Mitra check-in records and 24-hour approval rule |
| `VishistAttendance.js` | Vishist session records |
| `LeaveRequest.js` | Leave requests |
| `Announcement.js` | Announcements and attachment upload |
| `Equipment.js` | Equipment items |
| `Schedule.js` | Schedules per centre |
| `Timetable.js` | Timetables per centre |
| `SupportQuery.js` | Queries and replies |

### `src/Utils/` (shared helpers)

| File | Description |
|---|---|
| `centreMatch.js` | Role checks and centre-name matching |
| `centreDirectory.js` | Kendra IDs and student-ID prefixes |
| `courseSubjects.js` | Courses, subjects and selection validation |
| `password.js` | Password hashing and policy |
| `GenerateToken.js` | Creates the 1-day login token |
| `inviteToken.js` | Creates and checks the 24-hour invite token |
| `resetToken.js` | Creates and checks the 10-minute reset token |
| `otp.js` | Generates and checks one-time codes |
| `createPasswordLink.js` | Builds the invite link |
| `sendEmail.js` | Gmail API email sending and the four email templates |
| `pushNotifications.js` | Sends Web Push notifications |
| `supportQueries.js` | Builds the support-query push message |
| `recomputeSubjectAttendance.js` | Recalculates a student's subject attendance from daily records |
| `phone.js` | 10-digit phone helpers |
| `httpResponse.js` | Standard success/error responses and error wrapper |
| `uploadConcurrency.js` | Limits simultaneous uploads |
| `firestoreHelpers.js` | Date helpers (filename is a leftover from the earlier Firebase version) |

### `scripts/` and `tests/`

| File | Description |
|---|---|
| `scripts/delete-attendance-data.js` | Old Firebase-era attendance cleanup. Does not run any more |
| `scripts/rehash-plaintext-passwords.js` | Old Firebase-era password migration. Does not run any more |
| `scripts/seed-dummy-students.js` | Old Firebase-era dummy student seeder. Does not run any more |
| `tests/mitraAttendance.test.js` | Tests for attendance percentage rules |
| `tests/supportQueries.test.js` | Tests for the support-query notification message |
| `tests/sendEmail.test.js` | Tests for email encoding, escaping and template rules |
