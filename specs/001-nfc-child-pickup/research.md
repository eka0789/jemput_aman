# Research: JemputAman - Sistem Verifikasi Penjemputan Anak PAUD/TK Berbasis Kartu NFC

## Architectural & Technical Decisions

### 1. NFC Reading & Offline Queueing Strategy (Gate Reader)

- **Decision**: Web NFC API (`NDEFReader`) on Android Chrome for hardware scanning, with IndexedDB-backed Service Worker offline queue for local verification during internet outages.
- **Rationale**: Web NFC API allows web applications on supported mobile/tablet devices to read NDEF messages and card serial numbers (UIDs) directly without installing native APKs. Using IndexedDB allows local caching of today's authorized student-pickup mappings for instantaneous (<500ms) offline verification, syncing queued audit logs once connection returns.
- **Alternatives Considered**:
  - *Native Android App (Java/Kotlin)*: Higher installation friction for schools; requires APK maintenance. Web NFC provides sufficient hardware access for MVP.
  - *External USB HID NFC Reader*: Requires OTG cable setup; Web NFC on integrated tablet NFC sensor is cleaner and more mobile for duty teachers at the gate.

---

### 2. Multi-Tenant Architecture & Data Isolation

- **Decision**: Single-database, Discriminator-column multi-tenancy (`school_id` / `tenant_id`) enforced via middleware and database Row-Level Security (RLS) or repository-level tenant scoping.
- **Rationale**: Optimal cost efficiency for B2B SaaS targeting tier-2 city schools with scalable onboarding. Avoids provisioning separate database instances per school while strictly isolating school operational data.
- **Alternatives Considered**:
  - *Database-per-tenant*: High infrastructure overhead and complex migrations for early-stage B2B SaaS.
  - *Schema-per-tenant*: Moderate complexity, but migrations across hundreds of schemas become cumbersome compared to single-schema tenant isolation.

---

### 3. Real-Time Notification & Alert Dispatch Pipeline

- **Decision**: Dual-channel notification system: Web Push API (Service Worker notifications for browser/mobile app) + WhatsApp API Gateway (e.g., Baileys / Fonnte / Wablas) for instant messaging alerts.
- **Rationale**: WhatsApp is ubiquitous among Indonesian parents. Web Push provides zero-cost immediate alerts when parents have the web app open or installed as a PWA, while WhatsApp ensures 99%+ deliverability even when the app is backgrounded.
- **Alternatives Considered**:
  - *SMS Gateway*: High per-message operational cost, low engagement compared to WhatsApp in Indonesia.
  - *Email*: Poor real-time visibility for urgent pickup alerts at school dismissal time.

---

### 4. Emergency OTP & Temporary Approval Mechanism

- **Decision**: Time-based 6-digit OTP generated via secure server API, valid for 10 minutes, delivered to Parent's app/WhatsApp with an in-app "Approve Pickup" button.
- **Rationale**: Simple 1-tap parent approval flow or 6-digit OTP code input on duty teacher's reader tablet ensures safe pickup even if physical NFC card is forgotten.
- **Alternatives Considered**:
  - *Phone Call Verification*: Manual and leaves no digital audit trail.
  - *QR Code*: Requires parent to generate/send QR code image, which can be shared unsafely via messaging apps.

---

### 5. Report Generation Engine (Excel & PDF Export)

- **Decision**: Hybrid approach: Server-side streaming report generator for multi-month bulk data (Excel via ExcelJS, PDF via PDFKit/Puppeteer), with client-side fast preview export via SheetJS.
- **Rationale**: Ensures fast response times (<2s) for daily reports while handling multi-school foundation reports reliably without memory bottlenecks.
- **Alternatives Considered**:
  - *Client-side canvas print*: Inconsistent PDF rendering across different tablet browsers.
