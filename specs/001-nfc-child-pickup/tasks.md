# Tasks: JemputAman - Sistem Verifikasi Penjemputan Anak PAUD/TK Berbasis Kartu NFC

**Input**: Design documents from `/specs/001-nfc-child-pickup/`

**Prerequisites**: [plan.md](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/plan.md), [spec.md](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/spec.md), [research.md](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/research.md), [data-model.md](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/data-model.md), [nfc-verification-api.json](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/contracts/nfc-verification-api.json)

**Tests**: Tests included for API contracts and key user journey verifications per project constitution.

**Organization**: Grouped by user story to enable independent implementation, testing, and delivery.

## Format: `- [x] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story identifier (US1, US2, US3, US4, US5, US6)
- Includes exact file paths for all implementation tasks

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize full-stack project structure for backend service and frontend web application

- [x] T001 Create full-stack project directory structure in `backend/` and `frontend/`
- [x] T002 Initialize backend Node.js project with dependencies in `backend/package.json`
- [x] T003 [P] Initialize frontend web app structure and assets in `frontend/package.json`
- [x] T004 [P] Configure ESLint and Prettier code formatting in `.eslintrc.json`
- [x] T005 [P] Setup environment configuration loader in `backend/src/config/env.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core multi-tenant database, authentication, layout design system, and error middleware

**⚠️ CRITICAL**: Must be complete before user story work begins

- [x] T006 Setup database connection & migration script in `backend/src/config/database.js`
- [x] T007 Create multi-tenant context middleware (`school_id` isolation) in `backend/src/middlewares/tenant.js`
- [x] T008 [P] Implement JWT authentication & Role-Based Access Control (`ADMIN`, `TEACHER`, `PARENT`, `FOUNDATION`) in `backend/src/middlewares/auth.js`
- [x] T009 [P] Create base error handling and API response wrapper in `backend/src/middlewares/errorHandler.js`
- [x] T010 Create core database models (`School`, `User`, `Student`, `PickupPerson`, `NFCCard`) in `backend/src/models/schema.js`
- [x] T011 [P] Build frontend CSS Design Tokens & Theme (Teal/Green trust palette) in `frontend/src/styles/theme.css`
- [x] T012 Build responsive navbar & role-aware page shell component in `frontend/src/components/PageShell.js`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Verifikasi Penjemputan Anak via NFC di Gerbang Sekolah (Priority: P1) 🎯 MVP

**Goal**: Enable duty teachers at school gates to tap a pickup person's NFC card on a tablet/mobile browser to instantaneously verify authorization and log the event.

**Independent Test**: Tap registered NFC card `04:A2:8B:12:FE:67:80` at gate reader; verify green "VERIFIED" response <2s and audit log creation. Tap unknown UID `99:99:99:99:99:99:99`; verify red "BLOCKED" response.

### Tests for User Story 1

- [x] T013 [P] [US1] Contract test for POST `/api/v1/pickup/verify-nfc` in `backend/tests/contract/nfc_verify.test.js`
- [x] T014 [P] [US1] Integration test for NFC verification logic in `backend/tests/integration/nfc_service.test.js`

### Implementation for User Story 1

- [x] T015 [P] [US1] Implement `PickupLog` and `StudentPickupAuthorization` models in `backend/src/models/pickupLog.js`
- [x] T016 [US1] Implement NFC Authorization Service (card UID matching & validation logic) in `backend/src/services/nfcService.js`
- [x] T017 [US1] Create NFC Verification API Controller for POST `/api/v1/pickup/verify-nfc` in `backend/src/controllers/nfcController.js`
- [x] T018 [US1] Register NFC verification route in `backend/src/routes/pickupRoutes.js`
- [x] T019 [P] [US1] Implement Web NFC API reader service (`NDEFReader` listener) in `frontend/src/services/webNfcService.js`
- [x] T020 [P] [US1] Implement IndexedDB offline queue for local tap caching in `frontend/src/services/offlineQueueService.js`
- [x] T021 [US1] Build Gate Reader Page UI (NFC scanner modal, photo comparison, status banner) in `frontend/src/pages/GateReaderPage.js`

**Checkpoint**: User Story 1 (MVP core security verification) is fully functional and testable independently

---

## Phase 4: User Story 2 - Notifikasi Real-time & Transparansi Kehadiran untuk Orang Tua (Priority: P1)

**Goal**: Automatically dispatch Push Notifications and WhatsApp messages to parents immediately when their child is verified and picked up.

**Independent Test**: Trigger a verified NFC tap for a student; verify parent receives Push/WhatsApp notification within <5s containing child's name, pickup person's name, and timestamp.

### Tests for User Story 2

- [x] T022 [P] [US2] Unit test for Notification Dispatcher Service in `backend/tests/unit/notification_service.test.js`

### Implementation for User Story 2

- [x] T023 [P] [US2] Implement WhatsApp API Gateway integration service in `backend/src/services/whatsappService.js`
- [x] T024 [P] [US2] Implement Web Push API notification service in `backend/src/services/pushNotificationService.js`
- [x] T025 [US2] Connect NFC Verification Controller to dispatch automatic notifications upon `VERIFIED` status in `backend/src/controllers/nfcController.js`
- [x] T026 [P] [US2] Build Parent Portal Feed UI (live pickup status, child activity history) in `frontend/src/pages/ParentPortalPage.js`

**Checkpoint**: User Stories 1 and 2 work seamlessly together

---

## Phase 5: User Story 3 - Pengaturan Jadwal Penjemputan Mingguan (Priority: P2)

**Goal**: Allow parents to configure weekly pickup assignments (e.g. Mon-Wed Father, Thu-Fri Driver) and enforce daily schedule constraints at gate verification.

**Independent Test**: Set Thursday schedule to Driver; tap Father's NFC card on Thursday; system displays "OUT_OF_SCHEDULE" warning requiring special confirmation.

### Tests for User Story 3

- [x] T027 [P] [US3] Unit test for Weekly Schedule authorization checking in `backend/tests/unit/schedule_service.test.js`

### Implementation for User Story 3

- [x] T028 [P] [US3] Create `WeeklyPickupSchedule` model in `backend/src/models/schedule.js`
- [x] T029 [US3] Build Schedule Management API controller & endpoints in `backend/src/controllers/scheduleController.js`
- [x] T030 [US3] Integrate schedule validation rules into `nfcService.js` in `backend/src/services/nfcService.js`
- [x] T031 [US3] Build Parent Schedule Config UI (day-by-day pickup assignment grid) in `frontend/src/pages/ScheduleConfigPage.js`

**Checkpoint**: Weekly schedule constraints active and enforced during gate tap

---

## Phase 6: User Story 4 - Mode Darurat & Approval OTP Tanpa Kartu NFC (Priority: P2)

**Goal**: Provide emergency 6-digit OTP verification fallback when a registered pickup person forgets their NFC card, requiring parent approval via app.

**Independent Test**: Request OTP for student on Gate Reader; Parent approves OTP in app; Gate Reader accepts code and logs `EMERGENCY_OTP` verification.

### Tests for User Story 4

- [x] T032 [P] [US4] Contract test for `/api/v1/pickup/request-otp` and `/approve-otp` in `backend/tests/contract/otp_api.test.js`

### Implementation for User Story 4

- [x] T033 [P] [US4] Create `EmergencyOTP` model in `backend/src/models/emergencyOtp.js`
- [x] T034 [US4] Implement OTP Generation & Approval Service (6-digit, 10 min TTL) in `backend/src/services/otpService.js`
- [x] T035 [US4] Create Emergency OTP API endpoints in `backend/src/controllers/otpController.js`
- [x] T036 [US4] Add "Lupa Kartu NFC" emergency flow UI on Gate Reader in `frontend/src/pages/GateReaderPage.js`
- [x] T037 [US4] Build Parent Emergency Approval Modal UI in `frontend/src/pages/ParentPortalPage.js`

**Checkpoint**: Emergency OTP workflow fully functional without physical NFC cards

---

## Phase 7: User Story 5 - Dashboard Admin Sekolah & Laporan Kehadiran/Penjemputan (Priority: P3)

**Goal**: Provide school admins with daily pickup analytics and exportable Excel/PDF attendance reports, plus multi-school branch views for foundations.

**Independent Test**: Filter today's pickup log on Admin Dashboard; click "Export Excel" and "Export PDF"; verify file generation with correct summary rows <5s.

### Tests for User Story 5

- [x] T038 [P] [US5] Integration test for report generation service in `backend/tests/integration/report_service.test.js`

### Implementation for User Story 5

- [x] T039 [P] [US5] Implement Excel & PDF Report Generator Service (using ExcelJS & PDFKit) in `backend/src/services/reportService.js`
- [x] T040 [US5] Create Admin Report & Analytics Controller in `backend/src/controllers/reportController.js`
- [x] T041 [US5] Build School Admin Dashboard UI (stats summary, daily log table, export buttons) in `frontend/src/pages/AdminDashboardPage.js`
- [x] T042 [US5] Build Multi-School Foundation Dashboard view for `FOUNDATION` role in `frontend/src/pages/FoundationDashboardPage.js`

**Checkpoint**: Admin and Foundation reporting fully operational

---

## Phase 8: User Story 6 - Manajemen Data Siswa, Penjemput, dan Kartu NFC (Priority: P3)

**Goal**: Allow school admins to manage student records, link authorized pickup persons, and issue or immediately deactivate lost NFC cards.

**Independent Test**: Mark NFC card `04:A2:8B:12:FE:67:80` as "LOST"; tap card at gate reader; verify instant rejection and security alert.

### Implementation for User Story 6

- [x] T043 [P] [US6] Implement Student & Pickup Person CRUD controller in `backend/src/controllers/managementController.js`
- [x] T044 [US6] Implement NFC Card Binding & Status Management Service (Issue / Revoke / Lost) in `backend/src/services/cardManagementService.js`
- [x] T045 [US6] Build Data Management UI (Student list, pickup binding, card status toggle) in `frontend/src/pages/DataManagementPage.js`

**Checkpoint**: Complete data lifecycle & instant card revocation active

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end integration testing, security audit, and documentation

- [x] T046 [P] Run end-to-end test suite matching `quickstart.md` scenarios in `frontend/tests/e2e/quickstart_e2e.test.js`
- [x] T047 Perform multi-tenant security audit (verify zero cross-tenant data leakage) in `backend/src/middlewares/tenant.js`
- [x] T048 [P] Optimize PWA Service Worker caching for offline gate reader resiliency in `frontend/src/serviceWorker.js`
- [x] T049 Final code cleanup and documentation review across `README.md` and codebase
