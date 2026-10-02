# JemputAman — Sistem Verifikasi Penjemputan Anak Berbasis NFC

> SaaS multi-tenant untuk verifikasi penjemputan anak PAUD/TK: cukup tap kartu NFC di gerbang, sistem memvalidasi hak penjemput dalam **< 2 detik**, memberi tahu orang tua secara real-time, dan mencatat jejak audit lengkap.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)

---

## Tentang Proyek

**JemputAman** menggantikan proses penjemputan manual di sekolah (buku catatan, cek visual, konfirmasi WhatsApp) dengan verifikasi digital berbasis **kartu NFC fisik** yang ditap pada tablet guru piket. Sistem memvalidasi kartu terhadap **jadwal penjemputan mingguan** yang diatur orang tua, lalu menampilkan hasil verifikasi berwarna + audio:

- 🟢 **HIJAU — Terverifikasi**: penjemput sah sesuai jadwal. Foto & nama siswa/penjemput ditampilkan, kepulangan dicatat, notifikasi WhatsApp/Push terkirim ke orang tua.
- 🟡 **KUNING — Tidak Sesuai Jadwal**: kartu aktif tapi bukan jadwalnya hari ini; butuh konfirmasi/approval tambahan sebelum anak boleh pulang.
- 🔴 **MERAH — Ditolak**: kartu tidak terdaftar, nonaktif, atau hilang. Kepulangan diblokir, alarm berbunyi, alert keamanan terkirim ke admin dan orang tua.

Sistem melayani tiga lapis pengguna sekaligus: **sekolah** (admin & guru piket), **orang tua/wali** (portal & notifikasi), dan **yayasan** (dashboard konsolidasi multi-sekolah) — semuanya dengan isolasi data per tenant (`school_id`).

## Fitur Utama

| Fitur | Deskripsi |
| :--- | :--- |
| **Verifikasi NFC Gerbang** | Baca UID kartu via Web NFC API (`NDEFReader`) di tablet Chrome Android; hasil visual + audio < 2 detik |
| **Validasi Jadwal Mingguan** | Orang tua mengatur siapa yang menjemput per hari (Senin–Sabtu); sistem memberlakukan otomatis |
| **Notifikasi Real-time** | WhatsApp (gateway Fonnte) dan/atau Web Push ke orang tua berisi nama penjemput + jam persisnya |
| **Mode Darurat OTP** | Kartu lupa dibawa? OTP 6 digit dengan approval orang tua, berlaku 10 menit, tercatat di audit trail |
| **Manajemen Data & Kartu** | Admin kelola siswa, penjemput, dan status kartu NFC (Aktif/Nonaktif/Hilang) — pencabutan berlaku seketika |
| **Dashboard & Laporan** | Statistik kepulangan harian, ekspor Excel (.xlsx) & PDF, dashboard konsolidasi multi-sekolah untuk yayasan |
| **Offline-first** | Antrean IndexedDB di tablet reader — transaksi tetap tercatat saat internet putus, sinkron otomatis |
| **Foto Bukti Verifikasi** | Foto penjemputan disimpan di bucket privat Supabase Storage dan direkam pada log |
| **Multi-Tenant** | Isolasi data per sekolah dijaga berlapis: middleware backend + Row Level Security (RLS) Supabase |

## Teknologi

| Lapisan | Teknologi |
| :--- | :--- |
| **Frontend** | Vanilla JavaScript (ES Modules), Vite 5, HTML5, CSS3 (design tokens), Lucide Icons, Service Worker (PWA) |
| **Backend** | Node.js 20+, Express.js 4 (REST API, ES Modules) |
| **Database** | Supabase (PostgreSQL) + Row Level Security; fallback file JSON untuk development |
| **Storage** | Supabase Storage bucket privat (foto siswa, penjemput, bukti verifikasi) |
| **Auth** | JSON Web Token (JWT) + middleware peran (RBAC) & tenant |
| **Notifikasi** | WhatsApp gateway (Fonnte) + Web Push API |
| **Laporan** | ExcelJS (.xlsx) + PDFKit (.pdf) |
| **Testing** | Vitest (unit & contract/integration) |
| **Deployment** | Vercel — monorepo satu domain (`/api/*` → Express, sisanya → Vite) |

## Struktur Proyek

```text
jemput_aman/
├── backend/                     # REST API (Express)
│   ├── src/
│   │   ├── config/              # Env, database, Supabase client
│   │   ├── controllers/         # nfc, otp, schedule, report, management
│   │   ├── middlewares/         # auth (JWT), tenant, rateLimit, errorHandler
│   │   ├── models/              # schema, pickupLog, schedule, emergencyOtp
│   │   ├── routes/              # Definisi rute API
│   │   └── services/            # nfc, otp, whatsapp, pushNotification,
│   │                            # cardManagement, report, storage
│   ├── tests/                   # Unit & contract tests (Vitest)
│   └── data/                    # Database JSON fallback (development)
├── frontend/                    # Web app (Vite, vanilla JS)
│   └── src/
│       ├── pages/               # GateReaderPage, ParentPortalPage,
│       │                        # AdminDashboardPage, DataManagementPage,
│       │                        # FoundationDashboardPage, ScheduleConfigPage
│       ├── services/            # webNfcService, offlineQueueService
│       ├── components/          # Komponen UI bersama
│       ├── styles/              # Design tokens & tema
│       └── serviceWorker.js     # PWA / dukungan offline
├── supabase/migrations/         # Skema SQL + RLS + security hardening
├── specs/001-nfc-child-pickup/  # Spec, plan, data model, kontrak API
├── PRD.md                       # Product Requirements Document
└── vercel.json                  # Konfigurasi deploy monorepo
```

## Memulai

### Prasyarat

- **Node.js ≥ 20** dan npm
- **Akun Supabase** (untuk database & storage produksi) — lihat [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- Untuk uji verifikasi NFC nyata: **tablet/HP Android 8.1+ dengan NFC bawaan** dan **Google Chrome v89+** (Web NFC API hanya tersedia di Chrome Android, wajib HTTPS)

### 1. Clone & Install

```bash
git clone https://github.com/eka0789/jemput_aman.git
cd jemput_aman

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Konfigurasi Environment

Salin contoh environment ke folder backend, lalu sesuaikan nilainya:

```bash
cp .env.example backend/.env
```

| Variabel | Wajib | Keterangan |
| :--- | :---: | :--- |
| `PORT` | — | Port backend (default `3000`) |
| `JWT_SECRET` | ✅ | Secret panjang & acak untuk penandatanganan JWT |
| `SUPABASE_URL` | ✅* | URL proyek Supabase (`https://<project>.supabase.co`) |
| `SUPABASE_SECRET_KEY` | ✅* | Secret key — **hanya di server/Vercel**, jangan pernah ke frontend/Git |
| `SUPABASE_PUBLISHABLE_KEY` | — | Fallback development saja; tetap tunduk pada RLS |
| `SUPABASE_STORAGE_BUCKET` | — | Bucket foto (default `images`) |
| `WHATSAPP_API_URL` | — | Endpoint gateway Fonnte (`https://api.fonnte.com/send`) |
| `WHATSAPP_API_TOKEN` | — | Token perangkat dari dashboard Fonnte |
| `APP_TIME_ZONE` | — | Zona waktu operasional (default `Asia/Jakarta`) |
| `DEFAULT_SCHOOL_ID` | — | ID sekolah seed untuk development |
| `AUTH_ALLOW_DEV_MOCK` | — | `true` hanya untuk development (mock auth). **Matikan di produksi** |
| `CORS_ORIGINS` | — | Whitelist origin tambahan |

> \* Tanpa variabel Supabase, backend otomatis memakai database JSON fallback di `backend/data/database.json` — cukup untuk eksplorasi development, **bukan** untuk produksi.

### 3. Setup Database (Supabase)

Jalankan migrasi SQL di [`supabase/migrations/`](supabase/migrations/) **secara berurutan**:

1. `202607240001_initial_jemput_aman.sql` — tabel, indeks, RLS, seed demo
2. `202607270001_security_hardening.sql` — penguatan keamanan
3. `202607290001_private_photo_workflow.sql` — alur foto bucket privat

Dua cara menjalankan:

```bash
# Opsi A — Supabase CLI
supabase link --project-ref <project-ref>
supabase db push
```

```text
# Opsi B — Supabase Dashboard → SQL Editor
# Tempelkan isi tiap file migrasi satu per satu, lalu Run.
```

### 4. Jalankan Aplikasi

```bash
# Terminal 1 — backend (http://localhost:3000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Saat development, frontend otomatis mengarah ke `http://localhost:3000/api/v1`. Verifikasi backend berjalan dengan membuka:

```text
GET http://localhost:3000/api/health
```

Respons sehat: `{ "status": "HEALTHY", "database": "CONNECTED" }`.

### Endpoint API Utama

| Endpoint | Method | Fungsi |
| :--- | :--- | :--- |
| `/api/v1/pickup/verify-nfc` | POST | Verifikasi tap kartu NFC (header `Authorization: Bearer <JWT>` + `X-School-ID`) |
| `/api/v1/pickup/request-otp` | POST | Ajukan OTP darurat (lupa kartu) |
| `/api/v1/pickup/approve-otp` | POST | Approval / input kode OTP oleh orang tua |
| `/api/health` | GET | Health check (status server + koneksi database) |

Kontrak API lengkap: [`specs/001-nfc-child-pickup/contracts/nfc-verification-api.json`](specs/001-nfc-child-pickup/contracts/nfc-verification-api.json).

## Testing

```bash
cd backend
npm test                # Unit & contract tests (Vitest)
npm run test:supabase   # Verifikasi integrasi Supabase (butuh env aktif)
```

## Deployment (Vercel)

Repositori ini di-deploy sebagai **monorepo satu proyek Vercel** lewat [`vercel.json`](vercel.json): rewrite `/api/*` ke backend Express dan sisanya ke frontend Vite — frontend dan backend berbagi satu domain, tanpa perlu `VITE_API_BASE_URL`.

Langkah singkat:

1. Import repositori ke Vercel (Root Directory: root repositori, Framework Preset: *Services*).
2. Tambahkan environment variables di Project Settings: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DEFAULT_SCHOOL_ID`, `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `JWT_SECRET`.
3. Deploy, lalu cek `https://<domain>/api/health` dan pastikan `database: CONNECTED`.

Panduan detail: [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Perangkat Keras

| Komponen | Spesifikasi |
| :--- | :--- |
| **Kartu NFC** | NTAG213/215/216 (ISO/IEC 14443A Type 2), 13.56 MHz, kartu PVC standar |
| **Reader gerbang** | Tablet/HP Android 8.1+ dengan NFC bawaan, Google Chrome v89+ (disarankan tablet 8–10 inci pada stand meja piket) |
| **Reader PC admin** (opsional) | ACR122U USB untuk registrasi/tautkan kartu di kantor |

> Web NFC API **mensyaratkan HTTPS** — di produksi otomatis terpenuhi oleh Vercel; untuk jaringan lokal gunakan mkcert. Panduan lengkap: [PANDUAN_IMPLEMENTASI_NFC.md](PANDUAN_IMPLEMENTASI_NFC.md).

## Keamanan & Privasi

- **Autentikasi & RBAC** — JWT per sesi dengan middleware peran (`ADMIN`/`TEACHER`/`PARENT`/`FOUNDATION`) dan middleware tenant (`X-School-ID`).
- **Isolasi tenant berlapis** — semua tabel transaksional terikat `school_id`, dijaga middleware backend **dan** Row Level Security Supabase.
- **Secret server-only** — `JWT_SECRET`, `SUPABASE_SECRET_KEY`, dan token WhatsApp hanya ada di environment variables server/Vercel.
- **Bucket privat** — foto siswa, penjemput, dan bukti verifikasi tersimpan di Supabase Storage privat, diakses via URL terkontrol.
- **Rate limiting** — melindungi endpoint verifikasi & OTP dari penyalahgunaan.
- **Audit trail lengkap** — setiap percobaan tap (berhasil/ditolak) tercatat: timestamp (Asia/Jakarta), siswa, penjemput, metode (`NFC_TAP`/`EMERGENCY_OTP`), status, dan verifikator.
- **Pencabutan instan** — kartu dilaporkan hilang → status `LOST` → ditolak seketika di semua perangkat sekolah + alarm.

## Dokumentasi

| Dokumen | Isi |
| :--- | :--- |
| [PRD.md](PRD.md) | Product Requirements Document lengkap (kebutuhan, alur, model data, roadmap) |
| [PANDUAN_IMPLEMENTASI_NFC.md](PANDUAN_IMPLEMENTASI_NFC.md) | Panduan implementasi & operasional gerbang NFC (HTTPS, hardware, troubleshooting) |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Setup database Supabase & deployment Vercel |
| [specs/001-nfc-child-pickup/](specs/001-nfc-child-pickup/) | Spesifikasi fitur, rencana implementasi, model data, kontrak API |
| [supabase/migrations/](supabase/migrations/) | Skema fisik database (migrasi SQL) |

## Roadmap Singkat

| Fase | Fokus |
| :--- | :--- |
| **Q4 2026** | Hardening E2E (Playwright), onboarding kit, uji coba pilot 3–5 sekolah |
| **Q1 2027** | Paket langganan, payment gateway, self-service onboarding tenant |
| **Q2 2027** | Mobile native, fallback QR code, integrasi data akademik |
| **Q3 2027+** | Biometrik opsional, bus/shuttle tracking, API publik |

---

Dibangun oleh [eka0789](https://github.com/eka0789) dan tim **JemputAman**. Proyek ini proprietary — seluruh hak cipta dilindungi.
