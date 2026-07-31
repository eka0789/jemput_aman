-- Jalankan secara manual hanya pada instalasi yang masih memakai data contoh bawaan.
-- Periksa kembali ID di bawah dan buat backup sebelum eksekusi.
begin;

delete from public.weekly_schedules
where id in ('sch-1', 'sch-2', 'sch-3', 'sch-4', 'sch-5');

delete from public.authorizations
where id in ('auth-1', 'auth-2', 'auth-3');

delete from public.emergency_otps
where student_id in ('1111', '1112');

delete from public.pickup_logs
where student_id in ('1111', '1112')
   or nfc_card_id in ('card-001', 'card-002', 'card-lost');

delete from public.nfc_cards
where id in ('card-001', 'card-002', 'card-lost');

delete from public.pickup_persons
where id in ('2222', '2223');

delete from public.students
where id in ('1111', '1112');

delete from public.app_users
where id = 'usr-parent-1';

commit;
