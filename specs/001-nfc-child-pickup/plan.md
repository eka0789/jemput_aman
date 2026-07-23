# Implementation Plan: JemputAman - Sistem Verifikasi Penjemputan Anak PAUD/TK Berbasis Kartu NFC

**Branch**: `001-nfc-child-pickup` | **Date**: 2026-07-23 | **Spec**: [spec.md](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/spec.md)

**Input**: Feature specification from `/specs/001-nfc-child-pickup/spec.md`

## Summary

JemputAman adalah sistem B2B SaaS verifikasi penjemputan anak berbasis kartu NFC unik untuk PAUD dan TK. Guru piket melakukan tap kartu NFC penjemput pada reader tablet/HP (Web NFC API). Sistem memvalidasi hak otorisasi penjemput secara real-time (<2 detik), mengirim notifikasi instant (Push/WhatsApp) ke Orang Tua, serta memfasilitasi mode darurat OTP jika kartu tertinggal. Sistem dirancang dengan arsitektur multi-tenant terisolasi untuk melayani banyak sekolah serta pengurus yayasan.

## Technical Context

**Language/Version**: JavaScript / Node.js 20+ (ES Modules), HTML5, CSS3 (Vanilla CSS with Design Tokens & Modern Theme).

**Primary Dependencies**:
- Web NFC API (`NDEFReader`) & Service Worker IndexedDB (Reader Hardware & Offline queue)
- Express.js / Node HTTP framework (Backend REST API)
- WhatsApp Gateway API (Fonnte/Baileys) & Web Push API (Real-time Parent Alerts)
- SheetJS (`xlsx`) & PDFKit (Export Laporan Admin)

**Storage**: PostgreSQL / SQLite (Development) dengan skema isolasi Multi-Tenant (`school_id`).

**Testing**: Vitest (Unit & Integration tests), Playwright (E2E Gate Reader & Dashboard tests).

**Target Platform**: Responsive Web Application (Android Chrome 89+ dengan Web NFC API support untuk Gate Reader Tablet; Desktop/Mobile Browser untuk Dashboard Admin & Orang Tua).

**Project Type**: Full-Stack Web Application (Multi-tenant Web Service + Frontend Dashboards).

**Performance Goals**:
- Verifikasi pengetapan NFC $\le 2$ detik (latensi server ke tampilan layar reader).
- Pengiriman notifikasi real-time (Push/WhatsApp) $\le 5$ detik.
- Waktu ekspor laporan rekapitulasi sekolah $\le 5$ detik.

**Constraints**:
- Wajib berfungsi offline sementara saat koneksi internet sekolah mengalami hambatan (menggunakan antrean lokal IndexedDB).
- Antarmuka ramah pengguna (Orang Tua & Guru Piket) dengan skema warna hijau/biru teal yang menenangkan dan tepercaya.

**Scale/Scope**:
- Multi-tenant architecture mendukung puluhan hingga ratusan sekolah PAUD/TK.
- Kapasitas 100-500 siswa per sekolah dengan 1-3 penjemput terdaftar per siswa.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Status | Rationale |
| :--- | :---: | :--- |
| **I. Modular & Decoupled Architecture** | ✅ PASSED | Terpisah jelas antara modul Web NFC Reader, Core Authorization Engine, Notification Dispatcher, dan Reporting Service. |
| **II. Clean API Contracts** | ✅ PASSED | Didefinisikan pada [nfc-verification-api.json](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/contracts/nfc-verification-api.json) dan [web-nfc-event-schema.json](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/contracts/web-nfc-event-schema.json). |
| **III. Testability & Independent Scenarios** | ✅ PASSED | Seluruh skenario penjemputan (Valid NFC, Unregistered Card, Emergency OTP, Export Report) memiliki pengujian independen di [quickstart.md](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/quickstart.md). |
| **IV. Data Security & Audit Trail** | ✅ PASSED | Setiap transaksi kepulangan mencatat timestamp presisi, verifikator, metode (NFC/OTP), serta isolasi ketat `school_id`. |
| **V. Simplicity & YAGNI** | ✅ PASSED | MVP berfokus pada web app responsif dengan Web NFC API tanpa beban kompilasi native app berlebihan. |

## Project Structure

### Documentation (this feature)

```text
specs/001-nfc-child-pickup/
├── plan.md              # Implementation Plan
├── research.md          # Architectural & Tech Decisions (Phase 0)
├── data-model.md        # Entity Relationship & Data Specs (Phase 1)
├── quickstart.md        # End-to-End Validation Guide (Phase 1)
├── contracts/           # API & Hardware Schemas (Phase 1)
│   ├── nfc-verification-api.json
│   └── web-nfc-event-schema.json
└── checklists/
    └── requirements.md  # Quality Checklist
```

### Source Code Structure

```text
backend/
├── src/
│   ├── config/          # Environment & Tenant DB Config
│   ├── controllers/     # Pickup, Student, NFC, Report Controllers
│   ├── middlewares/     # Multi-tenant scoping & Auth Middlewares
│   ├── models/          # Data Models (School, Student, NFC, Log)
│   ├── services/        # NFC Validation, Notification Engine, OTP Generator
│   └── app.js           # Server Entry Point
└── tests/
    ├── unit/            # NFC logic & Schedule validation tests
    └── integration/     # API endpoint & Tenant isolation tests

frontend/
├── src/
│   ├── assets/          # Icons & Branding resources
│   ├── components/      # NFC Scanner Modal, Status Card, Report Table
│   ├── pages/           # Gate Reader, Parent Portal, Admin Dashboard
│   ├── services/        # Web NFC Service API, Push Notification Service
│   ├── styles/          # Design Tokens (Teal/Green theme) & CSS Utilities
│   └── index.html       # Web App Entrypoint
└── tests/
    └── e2e/             # Gate Tap & OTP Approval Playwright tests
```

**Structure Decision**: Web application full-stack structure (`backend/` + `frontend/`) terpisah secara rapi, memungkinkan pengembangan API service multi-tenant yang tangguh berdampingan dengan antarmuka web responsif berfitur Web NFC API.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*Tidak ada pelanggaran konstitusi. Seluruh prinsip terpenuhi secara bersih.*
