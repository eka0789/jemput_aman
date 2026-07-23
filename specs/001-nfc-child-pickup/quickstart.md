# Quickstart Validation Guide: JemputAman - NFC Child Pickup Verification System

This guide outlines end-to-end scenarios to validate that the **JemputAman** NFC verification system functions correctly across all primary user journeys.

---

## Prerequisites & Setup

### Environment Requirements
- Node.js 20+ runtime
- Browser with Web NFC API support (Chrome on Android 89+) or Web NFC reader emulator
- Running local API server or mock server listening on `http://localhost:3000`

### Initial Data Setup
1. Seed database with test school tenant: `TK Ceria Salatiga` (`school_id: 1001`).
2. Register test Student: `Ananda Bintang` (`student_id: 1111`).
3. Register test Pickup Person: `Budi Santoso (Ayah)` (`pickup_person_id: 2222`).
4. Bind test NFC Card UID `04:A2:8B:12:FE:67:80` to `Budi Santoso`.

---

## Validation Scenarios

### Scenario 1: Valid NFC Card Tap at Gate (P1 - Core Security Flow)

**Goal**: Verify that tapping an authorized NFC card at dismissal time returns an instant "VERIFIED" result, logs the audit event, and dispatches a notification.

1. **Step 1**: Log in to the Gate Reader App as `Duty Teacher` (`TEACHER` role).
2. **Step 2**: Open the NFC Scan interface (`/reader`).
3. **Step 3**: Tap the NFC card with UID `04:A2:8B:12:FE:67:80` (or send mock POST payload to `/api/v1/pickup/verify-nfc` per [nfc-verification-api.json](file:///C:/Users/LENOVO/jemput_aman/specs/001-nfc-child-pickup/contracts/nfc-verification-api.json)).
4. **Expected Outcome**:
   - Screen displays green "VERIFIED" banner with student & pickup person photos within <2 seconds.
   - Database creates `PickupLog` entry with status `VERIFIED`.
   - Parent receives immediate WhatsApp/Push Notification: *"Ananda Bintang telah dijemput oleh Budi Santoso (Ayah) pada 12:00 WIB"*.

---

### Scenario 2: Unregistered Card Tap Security Alert (P1 - Security Edge Case)

**Goal**: Verify that an unknown or blocked NFC card triggers an instant security alert.

1. **Step 1**: Tap an unregistered NFC card UID `99:99:99:99:99:99:99`.
2. **Expected Outcome**:
   - Screen displays red "AKSES DITOLAK" warning banner with sound/vibration alert.
   - Gate Reader blocks pickup completion.
   - Security Alert entry generated on School Admin Dashboard.
   - Parent receives urgent alert notification.

---

### Scenario 3: Emergency OTP Approval Flow (P2 - Forgot Card Fallback)

**Goal**: Verify that a registered pickup person without an NFC card can complete pickup after Parent OTP approval.

1. **Step 1**: On Gate Reader screen, select "Lupa Kartu NFC" $\rightarrow$ choose student `Ananda Bintang`.
2. **Step 2**: Click "Kirim Permintaan OTP ke Orang Tua" (`POST /api/v1/pickup/request-otp`).
3. **Step 3**: Parent opens Parent Mobile Web App, views pending pickup request, and clicks "Disetujui" (or shares 6-digit OTP code `482910`).
4. **Step 4**: Duty Teacher submits approved OTP on Gate Reader tablet.
5. **Expected Outcome**:
   - Pickup verified with method `EMERGENCY_OTP`.
   - Audit trail records parent approval timestamp.

---

### Scenario 4: Admin Dashboard Report Export (P3 - Administrative Audit)

**Goal**: Verify that School Admin can review daily attendance/pickup stats and export report files.

1. **Step 1**: Log in as School Admin (`ADMIN` role) at `/admin/reports`.
2. **Step 2**: Select date range (e.g., today's date) and click "Ekspor Excel" & "Ekspor PDF".
3. **Expected Outcome**:
   - System downloads `.xlsx` and `.pdf` summary reports within <5 seconds.
   - Report contains accurate student names, class, pickup timestamps, verifier teacher ID, and verification methods.

---

## Verification Command Cheat Sheet

```bash
# Test API Contract Endpoint (Mock Request)
curl -X POST http://localhost:3000/api/v1/pickup/verify-nfc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "X-School-ID: 1001" \
  -d '{"card_uid": "04:A2:8B:12:FE:67:80", "device_timestamp": "2026-07-23T12:00:00Z"}'
```
