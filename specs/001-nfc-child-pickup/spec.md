# Feature Specification: JemputAman - Sistem Verifikasi Penjemputan Anak PAUD/TK Berbasis Kartu NFC

**Feature Branch**: `001-nfc-child-pickup`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Nama aplikasi: JemputAman — Sistem Verifikasi Penjemputan Anak PAUD/TK berbasis Kartu NFC..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verifikasi Penjemputan Anak via NFC di Gerbang Sekolah (Priority: P1)

Sebagai Guru Piket Sekolah, saya ingin memindai kartu NFC penjemput menggunakan perangkat tablet/smartphone sekolah di jam kepulangan, agar sistem secara otomatis dan instan memverifikasi apakah penjemput tersebut sah untuk mengambil siswa tertentu.

**Why this priority**: Ini adalah inti keamanan aplikasi (core security value). Menggantikan proses manual buku catatan/WhatsApp dengan verifikasi digital instan untuk mencegah anak dijemput oleh pihak yang tidak berhak.

**Independent Test**: Dapat diuji secara mandiri dengan memindai kartu NFC terdaftar dan tidak terdaftar pada reader gerbang sekolah, lalu memastikan status verifikasi dan catatannya muncul dengan benar.

**Acceptance Scenarios**:

1. **Given** Guru Piket membuka pemindai kartu NFC dan siswa X akan dijemput, **When** Penjemput menempelkan kartu NFC sah yang terikat dengan siswa X, **Then** Sistem menampilkan status "Terverifikasi" berwarna hijau beserta foto & nama penjemput, mencatat waktu penjemputan secara otomatis, dan membuka status kepulangan siswa.
2. **Given** Guru Piket standby di menu verifikasi, **When** Seseorang menempelkan kartu NFC yang tidak terikat dengan siswa X atau kartu tidak terdaftar di sistem, **Then** Sistem menampilkan status "Ditolak / Blokir" berwarna merah dengan peringatan suara/visual, memblokir konfirmasi kepulangan, serta langsung mengirimkan alert keamanan ke Admin Sekolah dan Notifikasi Darurat ke Orang Tua murid.

---

### User Story 2 - Notifikasi Real-time & Transparansi Kehadiran untuk Orang Tua (Priority: P1)

Sebagai Orang Tua/Wali Murid, saya ingin menerima notifikasi langsung (Push Notification / WhatsApp) saat anak saya selesai dijemput di sekolah, lengkap dengan informasi siapa yang menjemput dan jam persisnya.

**Why this priority**: Memberikan ketenangan pikiran (peace of mind) kepada orang tua secara real-time dan mencegah kesalahpahaman atau kebingungan lokasi anak saat jam pulang sekolah.

**Independent Test**: Simulasi penjemputan terverifikasi pada sistem sekolah harus memicu pengiriman notifikasi instant ke nomor/akun orang tua terkait kurang dari 5 detik.

**Acceptance Scenarios**:

1. **Given** Anak telah terverifikasi dijemput oleh Penjemput A di sekolah, **When** Sistem mencatat transaksi kepulangan, **Then** Orang tua menerima notifikasi pesan singkat berisi nama anak, nama penjemput terverifikasi, serta timestamp waktu kepulangan secara real-time.

---

### User Story 3 - Pengaturan Jadwal Penjemputan Mingguan (Priority: P2)

Sebagai Orang Tua, saya ingin mengatur jadwal penjemputan mingguan (misal: Senin-Rabu dijemput Ayah, Kamis-Jumat dijemput Supir/Kakek), agar sekolah selalu mengetahui siapa penjemput sah yang berhak pada hari tertentu.

**Why this priority**: Mengakomodasi dinamika penjemputan keluarga sehari-hari tanpa perlu konfirmasi ulang manual setiap hari ke pihak sekolah.

**Independent Test**: Orang tua mengubah jadwal penjemputan untuk hari Kamis ke Supir A, kemudian dilakukan uji tap kartu Ayah pada hari Kamis dan dipastikan sistem menolak atau memberi peringatan bahwa kartu Ayah tidak sesuai jadwal hari tersebut.

**Acceptance Scenarios**:

1. **Given** Orang Tua membuka menu Penjadwalan di aplikasi, **When** Orang Tua menetapkan Penjemput A untuk hari Senin-Rabu dan Penjemput B untuk hari Kamis-Jumat, **Then** Sistem menyimpan konfigurasi dan otomatis memberlakukan aturan validasi sesuai hari kepulangan.
2. **Given** Penjemput A mencoba tap kartu NFC pada hari Kamis yang tidak dijadwalkan untuknya, **When** Guru Piket melakukan verifikasi, **Then** Sistem menampilkan peringatan "Penjemput Tidak Sesuai Jadwal Hari Ini" dan membutuhkan konfirmasi khusus/persetujuan orang tua sebelum anak diizinkan pulang.

---

### User Story 4 - Mode Darurat & Approval OTP Tanpa Kartu NFC (Priority: P2)

Sebagai Penjemput Resmi yang lupa membawa kartu NFC, saya ingin meminta Kode OTP Sementara melalui Guru Piket yang disetujui langsung oleh Orang Tua via aplikasi, agar anak tetap dapat dijemput secara aman tanpa kartu fisik.

**Why this priority**: Menangani kondisi tak terduga (kartu tertinggal/hilang) tanpa mengorbankan standar keamanan penjemputan.

**Independent Test**: Guru Piket memilih opsi "Lupa Kartu NFC", memilih nama siswa, memicu pengiriman kode approval/OTP ke ponsel Orang Tua, dan setelah Orang Tua menyetujui, Guru Piket dapat menyelesaikan proses verifikasi.

**Acceptance Scenarios**:

1. **Given** Penjemput terdaftar lupa membawa kartu NFC di sekolah, **When** Guru Piket mengajukan Verifikasi Darurat untuk siswa terkait, **Then** Orang tua menerima permintaan persetujuan instan di aplikasinya dan dapat mengonfirmasi/memberikan kode OTP singkat.
2. **Given** Orang Tua memasukkan/menyetujui kode OTP darurat di aplikasi, **When** Guru Piket menginput kode tersebut pada tablet sekolah, **Then** Sistem mengonfirmasi verifikasi darurat, mencatat metode "Verifikasi OTP", dan mengizinkan kepulangan siswa.

---

### User Story 5 - Dashboard Admin Sekolah & Laporan Kehadiran/Penjemputan (Priority: P3)

Sebagai Admin Sekolah / Pengurus Yayasan, saya ingin melihat ringkasan statistik kepulangan harian serta mengekspor laporan rekapitulasi (Excel/PDF), agar dapat digunakan untuk arsip audit internal maupun pelaporan ke Yayasan dan Dinas Pendidikan.

**Why this priority**: Memenuhi kebutuhan akuntabilitas administratif sekolah dan pelaporan resmi tingkat yayasan/dinas.

**Independent Test**: Mengakses dashboard admin, menyaring data kepulangan berdasarkan rentang tanggal dan kelas, lalu mengunduh file rekapitulasi Excel/PDF untuk memastikan seluruh data transaksi penjemputan tercetak rapi.

**Acceptance Scenarios**:

1. **Given** Admin Sekolah membuka Dashboard Laporan, **When** Admin memilih filter tanggal dan memilih opsi "Ekspor Laporan", **Then** Sistem menghasilkan file laporan format Excel dan PDF yang berisi daftar siswa, jam penjemputan, status verifikasi (NFC/OTP), serta nama penjemput.
2. **Given** Yayasan mengelola lebih dari satu cabang PAUD/TK (Multi-School), **When** Pengurus Yayasan masuk ke Dashboard Utama, **Then** Sistem menampilkan ringkasan performa dan tingkat keamanan penjemputan dari seluruh cabang sekolah yang berada di bawah yayasan tersebut.

---

### User Story 6 - Manajemen Data Siswa, Penjemput, dan Kartu NFC (Priority: P3)

Sebagai Admin Sekolah, saya ingin mendaftarkan data siswa, menghubungkan profil penjemput terdaftar, serta menautkan/menonaktifkan kartu NFC jika kartu hilang.

**Why this priority**: Memastikan data kredensial NFC selalu mutakhir dan kartu yang hilang bisa segera dicabut hak aksesnya.

**Independent Test**: Menautkan UID kartu NFC baru ke profil penjemput, memverifikasi bahwa kartu dapat digunakan, lalu menonaktifkan kartu tersebut dan memastikan kartu yang dinonaktifkan langsung ditolak oleh sistem.

**Acceptance Scenarios**:

1. **Given** Admin Sekolah menerima kartu NFC baru, **When** Admin menautkan UID kartu ke profil Penjemput X dan menyimpan data, **Then** Kartu tersebut aktif dan siap digunakan untuk verifikasi siswa terkait.
2. **Given** Orang Tua melaporkan kartu NFC hilang, **When** Admin Sekolah mengubah status kartu menjadi "Nonaktif", **Then** Sistem serta-merta menolak setiap upaya tap menggunakan kartu tersebut di seluruh perangkat sekolah.

---

### Edge Cases

- Apa yang terjadi jika koneksi internet di sekolah terputus sementara saat jam kepulangan berlangsung?
  *(Sistem menyimpan transaksi verifikasi NFC secara lokal di perangkat tablet reader dan melakukan sinkronisasi otomatis serta pengiriman notifikasi tertunda begitu koneksi internet kembali terhubung).*
- Bagaimana jika satu penjemput (misal: Supir Keluarga atau Orang Tua) bertanggung jawab menjemput lebih dari satu anak di sekolah yang sama?
  *(Sistem mendukung hubungan satu kartu NFC ke beberapa profil siswa terikat. Saat kartu di-tap, sistem menampilkan daftar seluruh siswa yang berhak dijemput oleh pemegang kartu tersebut).*
- Bagaimana jika kartu NFC yang hilang ditemukan dan di-tap oleh pihak tak dikenal?
  *(Status kartu yang sudah dinonaktifkan akan memicu alarm "Kartu Tidak Valid / Nonaktif" dan langsung merekam lokasi serta timestamp pengetapan untuk tindakan pencegahan keamanan).*

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem HARUS menyediakan mekanisme pendaftaran multi-peran yang membedakan hak akses antara Admin Sekolah/Guru Piket, Orang Tua/Wali Murid, dan Penjemput Terdaftar.
- **FR-002**: Sistem HARUS mendukung penautan unik antara UID fisik kartu NFC dengan profil penjemput terdaftar dan siswa yang berhak dijemput.
- **FR-003**: Perangkat pembaca (browser/app tablet gerbang) HARUS dapat membaca identifier kartu NFC via Web NFC API atau pemindai NFC terhubung dan memvalidasinya terhadap database otorisasi penjemputan.
- **FR-004**: Sistem HARUS menampilkan hasil verifikasi secara visual dan audio jelas dalam kurun waktu kurang dari 2 detik setelah kartu NFC di-tap (Status: Terverifikasi, Tidak Sesuai Jadwal, atau Ditolak).
- **FR-005**: Sistem HARUS memblokir kepulangan siswa dan mengirimkan notifikasi peringatan keamanan real-time jika kartu NFC tidak terdaftar atau tidak memiliki akses untuk siswa tersebut.
- **FR-006**: Sistem HARUS memicu pengiriman notifikasi kepulangan otomatis (Push Notification dan/atau pesan WhatsApp) ke ponsel Orang Tua segera setelah status verifikasi penjemputan berhasil.
- **FR-007**: Orang Tua HARUS dapat mengatur dan memperbarui jadwal penjemputan mingguan untuk setiap anak melalui antarmuka aplikasi.
- **FR-008**: Sistem HARUS menyediakan alur Verifikasi Darurat menggunakan Kode OTP sementara yang memerlukan persetujuan (approval) dari Orang Tua melalui aplikasi saat kartu NFC tidak tersedia.
- **FR-009**: Admin Sekolah HARUS dapat mengelola data siswa, orang tua, penjemput, serta mengubah status keaktifan kartu NFC (Aktif, Nonaktif, Hilang) kapan saja.
- **FR-010**: Dashboard Admin HARUS menyediakan visualisasi kehadiran/kepulangan harian dan fitur ekspor laporan ringkasan dalam format Excel (.xlsx) dan PDF (.pdf).
- **FR-011**: Sistem HARUS mendukung arsitektur multi-tenant sehingga setiap sekolah terisolasi data operasinya, serta menyediakan dashboard konsolidasi multi-sekolah untuk akun tingkat Yayasan.

### Key Entities

- **Sekolah (Tenant)**: Mengidentifikasi institusi PAUD/TK, memiliki konfigurasi operasional, daftar kelas, dan akun admin.
- **Yayasan**: Mengelompokkan beberapa tenant Sekolah di bawah satu grup manajemen/dashboard multi-sekolah.
- **Siswa**: Data murid PAUD/TK (nama, kelas, foto, ID unik, orang tua terikat).
- **Orang Tua / Wali**: Pengguna pemilik wewenang utama penjemputan siswa, mengelola jadwal dan memberikan persetujuan darurat.
- **Penjemput Terdaftar**: Individu yang diizinkan mengambil siswa (Ayah, Ibu, Supir, Kakek/Nenek, Kerabat), terikat dengan satu atau lebih kartu NFC.
- **Kartu NFC**: Entitas fisik berwujud UID unik yang memiliki status keaktifan (Aktif, Nonaktif, Pemblokiran) dan terhubung ke Penjemput Terdaftar.
- **Jadwal Penjemputan**: Aturan mingguan yang menentukan penjemput sah mana yang diizinkan pada hari tertentu untuk siswa tertentu.
- **Log Penjemputan (Audit Trail)**: Catatan riwayat transaksi kepulangan (Timestamp, Siswa, Penjemput, Metode Verifikasi: NFC/OTP, Status: Sukses/Ditolak, ID Guru Piket Verifikator).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Proses verifikasi penjemputan anak di gerbang sekolah diselesaikan dalam waktu kurang dari 3 detik per siswa dari pengetapan kartu hingga konfirmasi visual layar.
- **SC-002**: 99% notifikasi kepulangan real-time (Push/WhatsApp) diterima oleh Orang Tua dalam waktu kurang dari 5 detik setelah verifikasi di gerbang sekolah berhasil.
- **SC-003**: Mengurangi tingkat kesalahan penjemputan (salah orang/tanpa izin) hingga 0% pada sekolah yang menggunakan sistem JemputAman.
- **SC-004**: Laporan kepulangan harian dan bulanan dapat diekspor oleh Admin Sekolah dalam format Excel/PDF kurang dari 5 detik untuk rentang data 1 semester.
- **SC-005**: 95% Orang Tua dan Guru Piket memberikan penilaian kemudahan penggunaan (Usability Score) minimal 4 dari 5 pada bulan pertama implementasi.

## Assumptions

- **Konektivitas & Perangkat**: Perangkat tablet/HP yang digunakan Guru Piket di gerbang memiliki fitur NFC aktif (Android Chrome dengan Web NFC API support) dan terhubung ke jaringan internet stabil (dengan kemampuan simpan lokal jika offline singkat).
- **Format Notifikasi**: Integrasi layanan WhatsApp gateway atau Push Notification menggunakan penyedia standar B2B SaaS dengan tingkat keandalan tinggi di Indonesia.
- **Bahasa & Antarmuka**: Seluruh antarmuka aplikasi menggunakan Bahasa Indonesia dengan terminologi yang ramah untuk Pengurus Sekolah dan Orang Tua di Indonesia.
- **Desain UI/UX**: Menggunakan skema warna profesional dan menenangkan (Dominan Hijau Toska / Biru Teal dan Putih, aksen Emas/Kuning lembut) yang memancarkan rasa aman, kepercayaan, dan kebersihan visual tanpa hiasan kartun yang berlebihan.
