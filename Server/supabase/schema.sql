-- ============================================================================
-- HCL Sathee — Supabase (Postgres) schema
--
-- Run this once against the Supabase project's SQL editor (or via `psql`)
-- BEFORE pointing the server at SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
-- Mirrors the 16 Firestore collections the app used to read/write; the
-- Node model layer under Server/src/Models maps every column back to the
-- exact same camelCase JSON shape the Client already expects, so no
-- frontend changes are required.
--
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

-- Auto-maintain `updated_at` on every UPDATE, for every table below that has
-- the column — the Node model layer no longer sets it by hand on each write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------- centres
create table if not exists centres (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  created_at   timestamptz not null default now(),
  created_by   bigint
);

-- ---------------------------------------------------------------- users
create table if not exists users (
  id                 bigint generated always as identity primary key,
  name               text,
  email              text not null unique,
  phone              text unique,
  password           text,
  role               text not null,
  centre             text,
  is_vishist         boolean,               -- null for non-Mitra roles; true/false for SATHEE MITRA
  available_days     text[] not null default '{}',
  fcm_tokens         text[] not null default '{}',
  otp_hash           text,
  otp_expires_at     timestamptz,
  otp_attempts       integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_users_centre on users (centre);
create index if not exists idx_users_role on users (role);

-- ---------------------------------------------------------------- students
create table if not exists students (
  id              bigint generated always as identity primary key,
  student_id      text,
  enrollment_no   text,
  name            text,
  gender          text,
  email           text,
  phone           text,
  centre          text,
  course          text,
  category        text,
  address         text,
  parents         jsonb not null default '{}'::jsonb,
  subjects        text[] not null default '{}',
  marks           jsonb not null default '{}'::jsonb,
  attendance      jsonb not null default '{}'::jsonb,
  qualifications  jsonb not null default '{}'::jsonb,
  avatar_color    text,
  initials        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_students_centre on students (centre);
create index if not exists idx_students_email on students (email);
create index if not exists idx_students_course on students (course);

-- ---------------------------------------------------------------- tests
create table if not exists tests (
  id           bigint generated always as identity primary key,
  name         text,
  course       text not null,
  centre       text,
  centre_key   text,
  test_number  integer,
  test_date    date,
  created_by   bigint,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_tests_course_centre on tests (course, centre_key);

-- ---------------------------------------------------------------- test_subject_marks
create table if not exists test_subject_marks (
  id                  bigint generated always as identity primary key,
  test_id             bigint not null references tests (id) on delete cascade,
  test_type           text not null default 'performance',
  student_id          bigint not null,
  course              text,
  centre              text,
  subject             text not null,
  marks_obtained      numeric not null default 0,
  total_marks         numeric not null default 0,
  subject_percentage  numeric,
  answer_sheet_url    text,
  answer_sheet_path   text,
  source              text not null default 'manual',
  verified_by_mitra   boolean not null default false,
  entered_by          bigint,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (test_id, student_id, test_type, subject)
);
create index if not exists idx_marks_student on test_subject_marks (student_id);
create index if not exists idx_marks_course on test_subject_marks (course);

-- ---------------------------------------------------------------- daily_subject_attendances
create table if not exists daily_subject_attendances (
  id           bigint generated always as identity primary key,
  student_id   bigint not null,
  name         text,
  centre       text,
  course       text,
  subject      text not null,
  topic        text,
  date         date not null,
  time         text not null default '',
  status       text not null default 'absent',
  photo_url    text,
  photo_path   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (student_id, subject, date, time)
);
create index if not exists idx_daily_attendance_date on daily_subject_attendances (date);
create index if not exists idx_daily_attendance_student on daily_subject_attendances (student_id);

-- ---------------------------------------------------------------- subject_attendances (aggregate rollup per student+subject)
create table if not exists subject_attendances (
  id                              bigint generated always as identity primary key,
  student_id                      bigint not null,
  subject                         text not null,
  daily_attendance_percentage     numeric not null default 0,
  weekly_attendance_percentage    numeric not null default 0,
  monthly_attendance_percentage   numeric not null default 0,
  percentage                      numeric not null default 0,
  total_classes                   integer not null default 0,
  classes_attended                integer not null default 0,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  unique (student_id, subject)
);

-- ---------------------------------------------------------------- subject_performances
create table if not exists subject_performances (
  id           bigint generated always as identity primary key,
  student_id   bigint not null,
  subject      text not null,
  marks        numeric,
  max_marks    numeric not null default 100,
  grade        text,
  remarks      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_subject_perf_student on subject_performances (student_id);

-- ---------------------------------------------------------------- mitra_attendances
create table if not exists mitra_attendances (
  id                              bigint generated always as identity primary key,
  user_id                         bigint not null,
  name                            text,
  email                           text,
  centre                          text,
  centre_id                       text,
  date                            date not null,
  arrival_photo_url               text,
  arrival_photo_path              text,
  arrival_time                    timestamptz,
  departure_photo_url             text,
  departure_photo_path            text,
  departure_time                  timestamptz,
  approved                        boolean not null default false,
  approved_by                     bigint,
  approved_at                     timestamptz,
  daily_attendance_percentage     numeric not null default 100,
  weekly_attendance_percentage    numeric not null default 100,
  monthly_attendance_percentage   numeric not null default 100,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists idx_mitra_attendance_date on mitra_attendances (date);

-- ---------------------------------------------------------------- vishist_attendances
create table if not exists vishist_attendances (
  id                bigint generated always as identity primary key,
  vishist_user_id   bigint not null,
  vishist_name      text,
  vishist_email     text,
  centre            text,
  subject           text,
  topic_taught      text,
  photo_url         text,
  photo_path        text,
  marked_by_user_id bigint,
  marked_by_name    text,
  date              date not null,
  status            text not null default 'pending',
  approved_by_user_id bigint,
  approved_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists idx_vishist_attendance_date on vishist_attendances (date);

-- ---------------------------------------------------------------- announcements
create table if not exists announcements (
  id                bigint generated always as identity primary key,
  title             text,
  description       text,
  category          text not null default 'General',
  priority          text not null default 'Medium',
  posted_by         text not null default 'Admin',
  centre            text,
  other_centres     text[],
  attachment_name   text,
  attachment_url    text,
  attachment_type   text,
  attachment_path   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------- equipments
create table if not exists equipments (
  id             bigint generated always as identity primary key,
  name           text,
  description    text,
  quantity       integer not null default 0,
  serial_number  text,
  centre         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_equipment_centre on equipments (centre);

-- ---------------------------------------------------------------- leave_requests
create table if not exists leave_requests (
  id                bigint generated always as identity primary key,
  user_id           bigint,
  name              text,
  email             text,
  centre            text,
  from_date         date,
  to_date           date,
  reason            text not null default '',
  status            text not null default 'pending',
  reviewed_by       bigint,
  reviewed_by_email text,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_leave_requests_user on leave_requests (user_id);
create index if not exists idx_leave_requests_centre on leave_requests (centre);

-- ---------------------------------------------------------------- support_queries
create table if not exists support_queries (
  id                  bigint generated always as identity primary key,
  title               text not null default 'Untitled query',
  description         text not null default '',
  status              text not null default 'Open',
  submitted_by        text not null default 'Partner User',
  submitted_by_email  text not null default '',
  submitted_by_role   text not null default 'HCL Partner',
  centre              text,
  replies             jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_support_queries_email on support_queries (submitted_by_email);

-- ---------------------------------------------------------------- schedules (keyed by canonical centre key, like Firestore doc id)
create table if not exists schedules (
  centre_key   text primary key,
  centre       text,
  rows         jsonb not null default '[]'::jsonb,
  name         text,
  last_file    text,
  month_count  integer,
  row_count    integer,
  updated_at   timestamptz not null default now(),
  updated_by   bigint
);

-- ---------------------------------------------------------------- timetables (keyed by canonical centre key, like Firestore doc id)
create table if not exists timetables (
  centre_key    text primary key,
  centre        text,
  kind          text not null check (kind in ('grid', 'svg')),
  name          text,
  title         text,
  days          jsonb,
  slots         jsonb,
  data_url      text,
  storage_path  text,
  updated_at    timestamptz not null default now(),
  updated_by    bigint
);

-- ---------------------------------------------------------------- updated_at triggers
create or replace trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();
create or replace trigger trg_students_updated_at before update on students
  for each row execute function set_updated_at();
create or replace trigger trg_tests_updated_at before update on tests
  for each row execute function set_updated_at();
create or replace trigger trg_test_subject_marks_updated_at before update on test_subject_marks
  for each row execute function set_updated_at();
create or replace trigger trg_daily_attendance_updated_at before update on daily_subject_attendances
  for each row execute function set_updated_at();
create or replace trigger trg_subject_attendances_updated_at before update on subject_attendances
  for each row execute function set_updated_at();
create or replace trigger trg_subject_performances_updated_at before update on subject_performances
  for each row execute function set_updated_at();
create or replace trigger trg_mitra_attendances_updated_at before update on mitra_attendances
  for each row execute function set_updated_at();
create or replace trigger trg_announcements_updated_at before update on announcements
  for each row execute function set_updated_at();
create or replace trigger trg_equipments_updated_at before update on equipments
  for each row execute function set_updated_at();
create or replace trigger trg_leave_requests_updated_at before update on leave_requests
  for each row execute function set_updated_at();
create or replace trigger trg_support_queries_updated_at before update on support_queries
  for each row execute function set_updated_at();

-- ============================================================================
-- Notes
-- ============================================================================
-- * Firestore's `_counters` and `_unique_user_fields` helper collections have
--   no equivalent here: `bigint generated always as identity` replaces manual
--   counters, and the `unique` constraints on users(email)/users(phone) and
--   the composite uniques above replace the manual lock-collection pattern.
-- * All tables are queried through the `service_role` key from the Node
--   server only — Row Level Security is intentionally left OFF (default deny
--   would otherwise block the service role's own access is not affected by
--   RLS, but if you ever expose these tables to anon/client-side queries,
--   enable RLS and write policies before doing so).
