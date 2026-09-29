# Dashboard Evaluasi Series Webinar Nuclear — PLN & ECADIN

Dashboard Next.js dinamis untuk evaluasi pre-test/post-test, kehadiran, dan
feedback dari series webinar. Menambahkan Webinar 4, 5, dan seterusnya tidak
memerlukan perubahan kode — cukup unggah satu file Excel lewat wizard
**"Tambah Webinar"**.

## Daftar Isi

1. [Instalasi & Menjalankan](#instalasi--menjalankan)
2. [Build & Deploy ke Vercel](#build--deploy-ke-vercel)
3. [Cara Menambah Webinar](#cara-menambah-webinar)
4. [Koreksi Angka KPI Secara Manual](#koreksi-angka-kpi-secara-manual)
5. [Berbagi Angka ke Semua Pengunjung](#berbagi-angka-ke-semua-pengunjung)
6. [Format Excel](#format-excel)
7. [Dukungan Khusus File Webinar 3](#dukungan-khusus-file-webinar-3)
8. [Penyimpanan Lokal &amp; Bersama](#penyimpanan-lokal--bersama)
9. [Privasi](#privasi)
10. [Arsitektur](#arsitektur)
11. [Testing](#testing)
12. [Troubleshooting Import](#troubleshooting-import)
13. [Limitation](#limitation)

## Instalasi & Menjalankan

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:3000`. Saat pertama kali dijalankan (IndexedDB kosong),
dashboard otomatis diisi dengan seed data Webinar 1 & 2 hasil migrasi dari
dashboard lama (lihat [Limitation](#limitation)).

## Build & Deploy ke Vercel

```bash
pnpm build
pnpm start   # menjalankan hasil build secara lokal
```

Deploy ke Vercel: hubungkan repo ini ke sebuah Vercel Project lalu deploy —
tidak ada environment variable wajib untuk menjalankan dashboard, karena
data peserta tetap tersimpan di browser pengguna (IndexedDB), bukan di
server. `@vercel/analytics` sudah terpasang dan **tidak pernah** mengirim
data peserta — hanya page view.

Kalau Anda ingin angka yang Anda unggah/edit terlihat oleh **semua orang**
yang membuka link ini (bukan cuma browser Anda sendiri), aktifkan
penyimpanan bersama — lihat [Berbagi Angka ke Semua
Pengunjung](#berbagi-angka-ke-semua-pengunjung) di bawah. Ini opsional;
tanpa itu, dashboard tetap berjalan normal seperti sebelumnya.

## Cara Menambah Webinar

1. Klik **"Tambah Webinar"** di header.
2. **Langkah 1 — Metadata**: isi nomor, ID (otomatis `wN`, dapat diedit),
   judul, tanggal, dst. Jika file Excel punya sheet `Metadata`, field ini
   akan terisi otomatis setelah upload.
3. **Langkah 2 — Upload Excel**: seret file `.xlsx` (`.xls` juga didukung)
   atau klik untuk memilih. Semua parsing terjadi di browser Anda — tidak
   ada data yang dikirim ke server manapun.
4. **Langkah 3 — Validasi**: lihat sheet yang ditemukan, jumlah baris,
   duplikat, kolom hilang/tambahan, skor di luar rentang, dsb. Error
   memblokir lanjut; warning butuh centang konfirmasi.
5. **Langkah 4 — Preview**: metadata, KPI utama, 5-10 baris contoh peserta
   (email/NIP/HP disamarkan), distribusi unit, rata-rata pre/post.
6. **Langkah 5 — Simpan**: klik **"Tambahkan ke Dashboard"**. Jika ID webinar
   sudah ada, Anda akan diminta konfirmasi untuk mengganti data lama beserta
   ringkasan perubahannya.

Tab "Webinar #N", ringkasan Overview, grafik unit, dan feedback lintas
webinar diperbarui otomatis — tidak ada kode yang perlu disentuh.

## Koreksi Angka KPI Secara Manual

Setiap angka KPI (peserta database, registrasi, hadir Zoom valid, pre-test,
post-test, pasangan pre-post, rata-rata kenaikan, feedback, completion rate,
dst.) bisa dikoreksi manual per webinar tanpa mengedit data peserta atau kode.

1. Aktifkan **"Mode Edit"** di header.
2. Buka tab webinar yang ingin dikoreksi (#1, #2, #3, dst.) → sub-tab **Admin**.
3. Di kartu **"Koreksi Angka KPI (Override Manual)"**, isi angka pengganti pada
   kolom yang diinginkan. Kolom kosong = tetap memakai hasil hitung otomatis
   (ditampilkan sebagai placeholder abu-abu).
4. Klik **"Simpan Angka"**. Angka yang dikoreksi langsung tertandai label
   **"Manual"** dan otomatis dipakai di seluruh dashboard: kartu KPI, ringkasan
   narasi, tab Kehadiran/Pembelajaran/Feedback, halaman Overview lintas
   webinar, dan export CSV agregat — semuanya konsisten satu sama lain.
5. Klik ikon reset di sebelah satu kolom untuk mengembalikan angka itu saja ke
   hasil hitung otomatis, atau **"Kembalikan Semua ke Otomatis"** untuk
   menghapus seluruh koreksi manual pada webinar tersebut sekaligus.

Koreksi ini tersimpan per webinar (`kpiOverrides`) di IndexedDB browser yang
sama dengan data webinar lainnya.

**Catatan penting:** tanpa penyimpanan bersama (lihat bagian berikutnya),
koreksi ini hanya tersimpan di browser tempat Anda mengeditnya — pengunjung
lain yang membuka link ini masih melihat angka lama. Aktifkan [Berbagi
Angka ke Semua Pengunjung](#berbagi-angka-ke-semua-pengunjung) supaya setiap
koreksi otomatis terlihat oleh semua orang.

## Berbagi Angka ke Semua Pengunjung

Secara bawaan, setiap browser yang membuka dashboard ini punya salinan
datanya sendiri di IndexedDB — makanya webinar yang Anda unggah atau angka
yang Anda koreksi di satu perangkat tidak otomatis muncul di perangkat lain.
Fitur ini menambahkan **penyimpanan bersama** opsional: setiap kali Anda
mengunggah webinar baru atau menyimpan koreksi (metadata, angka KPI,
narasi) di Mode Edit, hasilnya otomatis dibagikan ke semua pengunjung lain.

Yang dibagikan **hanya angka hasil hitung** (KPI, narasi, distribusi unit,
daftar pertanyaan) — file Excel mentah dan data peserta (nama, email, NIP,
HP) tidak pernah ikut tersimpan di penyimpanan bersama ini, tetap 100% lokal
di perangkat yang mengunggahnya (lihat [Privasi](#privasi)).

### Cara Mengaktifkan (sekali saja, lewat dashboard Vercel)

1. Buka project ini di [vercel.com](https://vercel.com/dashboard) → tab
   **Storage** → **Create Database** → pilih **Upstash for Redis** (gratis
   untuk skala kecil seperti ini) → **Connect to Project**. Vercel otomatis
   menambahkan environment variable `KV_REST_API_URL` dan
   `KV_REST_API_TOKEN` ke project Anda.
2. Masih di tab **Settings → Environment Variables** project, tambahkan satu
   variable lagi secara manual: `PUBLISH_SECRET`, isinya bebas (contoh:
   sebuah kata sandi yang hanya Anda tahu). Ini adalah "kata sandi publish"
   yang mencegah orang lain diam-diam mengubah angka yang terlihat semua
   orang.
3. Redeploy project (Vercel akan menawarkan ini otomatis setelah Anda
   menambah environment variable, atau klik **Redeploy** manual).
4. Buka dashboard yang sudah live, klik **Mode Edit**, lalu unggah webinar
   atau ubah angka KPI apa saja. Saat pertama kali menyimpan, akan muncul
   kotak **"Sandi Publish Data"** — isi dengan nilai `PUBLISH_SECRET` yang
   Anda set di langkah 2. Setelah itu, sandi tersimpan di sesi browser Anda
   dan setiap perubahan berikutnya otomatis terbagikan tanpa perlu isi ulang.

Status penyimpanan bersama (aktif/belum diset) selalu terlihat di header
dashboard dan di halaman **Data / Admin**. Kalau belum diset, dashboard
tetap berfungsi normal — Anda hanya akan melihat catatan info bahwa
perubahan sementara ini masih lokal di browser Anda sendiri.

## Format Excel

Download template resmi dari tombol **"Download Template Excel"** pada
halaman **Data / Admin** atau langkah Upload di wizard
(`lib/excel/template-generator.ts`). Workbook `.xlsx` terdiri dari:

### Sheet `Metadata` (opsional, dua kolom `key`/`value`)

| key | Wajib? |
| --- | --- |
| `webinar_id` | ✅ |
| `webinar_number` | ✅ |
| `title` | ✅ |
| `date` | ✅ |
| `subtitle`, `theme`, `speaker`, `series_name`, `source_name`, `population`, `attendance_threshold_minutes` | opsional |

Jika sheet ini tidak ada, isi metadata secara manual di Langkah 1 wizard.

### Sheet `Participants` (wajib — atau sheet lain dengan kolom yang cocok)

Satu baris = satu peserta unik. Kolom wajib minimum:

```
Nama, Unit Kerja Final, Registrasi ECADIN?, Hadir Zoom >30m?,
Durasi Zoom Total (menit), Isi Pre-Test?, Skor Pre Final,
Isi Post-Test?, Skor Post Final, Isi Feedback?
```

Minimal salah satu identity field harus ada: `Participant Key`, `Email`,
`NIP`, atau kombinasi Nama+Unit. Kolom demografi (`Jenis Kelamin`, `Usia`,
`Pendidikan`, `Jabatan`) opsional — section grafiknya otomatis disembunyikan
jika tidak tersedia. Semua kolom lengkap ada di
`lib/excel/template-generator.ts`.

**Feedback wide-format**: kolom apa pun yang diawali `Feedback - ` otomatis
dibaca. Jika mayoritas nilainya angka 1–5, diperlakukan sebagai pertanyaan
Likert; jika teks, diperlakukan sebagai komentar terbuka. Jumlah & judul
pertanyaan boleh berbeda setiap webinar.

### Sheet `Questions` (opsional)

Kolom: `Time`, `Asker Name`, `Unit`, `Question`. Jika tidak ada, section
pertanyaan peserta disembunyikan (tidak ada data buatan).

### Sheet `Narratives` (opsional)

Kolom: `Type` (`finding`/`strength`/`improvement`/`recommendation`/
`limitation`), `Text`, `Order`. Jika tidak ada, narasi awal dibuat otomatis
dari metric (deterministik) dan dapat diedit lewat Mode Edit.

## Dukungan Khusus File Webinar 3

Parser (`lib/excel/webinar3-adapter.ts`) menerima file Webinar 3 **apa
adanya**, tanpa perlu mengubah nama sheet/kolom:

- Sheet peserta utama dideteksi dari **kombinasi header**, bukan nama sheet
  — jadi sheet `W3 Detail Skor Feedback` otomatis dikenali sebagai sheet
  peserta.
- `Duplicate Dibuang` → ditampilkan di Kualitas Data, **tidak** dihitung ke
  kalkulasi utama.
- `Unmatched PRE` → ditampilkan sebagai warning; **tidak** dipasangkan
  secara diam-diam ke peserta manapun.
- `Ringkasan Unit`, `PRE Dedup`, `POST Feedback Dedup` → ditampilkan sebagai
  cross-check di halaman Kualitas Data; distribusi unit utama tetap dihitung
  ulang dari sheet peserta.
- `Ringkasan Merge` → dibandingkan dengan hasil kalkulasi dashboard; jika
  berbeda (mis. jumlah unique pre-test termasuk unmatched vs. yang sudah
  match ke database peserta), perbedaan itu ditampilkan sebagai catatan
  info/warning, **bukan** dipaksa sama.

Seluruh 13 angka acceptance test pada task brief (450 peserta, 253
registrasi, 211 hadir valid, dst.) diverifikasi lolos end-to-end lewat
`tests/webinar3-acceptance.test.ts` terhadap file Webinar 3 asli (lihat
[Testing](#testing) — file itu sendiri tidak disertakan di repo karena
berisi email/NIP/nomor HP asli).

## Penyimpanan Lokal & Bersama

Dataset webinar yang lengkap (termasuk hasil upload Excel dan seluruh baris
peserta) tersimpan di **IndexedDB** browser/perangkat yang mengunggahnya,
lewat `IndexedDbWebinarRepository` (`lib/storage/indexeddb-repository.ts`),
di belakang interface `WebinarRepository` — sehingga nanti mudah diganti
dengan API/database sungguhan tanpa mengubah UI. Preferensi kecil (tab
terpilih, mode edit) disimpan di `localStorage`
(`lib/storage/settings.ts`).

Jika [penyimpanan bersama](#berbagi-angka-ke-semua-pengunjung) sudah
diaktifkan, setiap perubahan juga menerbitkan sebuah **ringkasan non-PII**
(metadata, `WebinarMetrics` hasil hitung/override, narasi, daftar
pertanyaan — lihat `types/published.ts` dan `lib/publish/build-snapshot.ts`)
lewat `app/api/dashboard/route.ts` ke penyimpanan Redis (`@upstash/redis`,
lihat `lib/storage/shared-store.ts`). Browser lain yang tidak punya salinan
lokal suatu webinar menampilkannya sebagai **read-only shell**
(`buildShellWebinar`) berisi angka dari ringkasan tersebut — tidak bisa
diedit di perangkat itu karena tidak ada data peserta mentahnya di sana.

Tersedia di halaman **Data / Admin**:
- Export semua data ke JSON (menampilkan konfirmasi karena berisi PII)
- Import kembali JSON
- Export agregat (tanpa PII) ke CSV
- Reset ke seed data
- Mode Print/PDF (`window.print()`, ada print stylesheet di `globals.css`)

## Privasi

- Dashboard analitik **hanya** menampilkan agregat; halaman preview/admin
  selalu menyamarkan Email, NIP, dan Nomor HP (`lib/privacy.ts`) — nama
  tetap ditampilkan karena ini dashboard internal.
- Seluruh parsing Excel & kalkulasi terjadi **di browser**. Baris peserta
  mentah (nama, email, NIP, HP) **tidak pernah** dikirim ke server manapun,
  dengan atau tanpa penyimpanan bersama aktif.
- Jika [penyimpanan bersama](#berbagi-angka-ke-semua-pengunjung) diaktifkan,
  yang terkirim ke server hanyalah angka hasil hitung (KPI, narasi,
  distribusi unit, daftar pertanyaan) — lihat `buildPublishedSnapshot` di
  `lib/publish/build-snapshot.ts` untuk daftar pasti field yang dikecualikan
  (termasuk seluruh baris audit import yang berisi data mentah).
- `@vercel/analytics` hanya merekam page view, tidak pernah menyentuh data
  peserta — tidak ada `console.log` baris peserta di kode produksi.
- Row dengan `Exclude? = Ya` dikeluarkan dari seluruh kalkulasi tapi tetap
  tersimpan di audit (`importInfo.duplicatesDiscarded`, dst.) — tidak ada
  data yang dibuang tanpa jejak.

## Arsitektur

```
types/            Webinar[]/Participant[] dinamis — tidak ada w1/w2 di tipe;
                   types/published.ts untuk ringkasan non-PII yang dibagikan
lib/analytics/     Fungsi kalkulasi murni (calculateWebinarMetrics, dst.),
                   kpi-overrides.ts untuk override manual per KPI
lib/excel/         Parser: normalizer, workbook-parser, adapter template
                   generik (deteksi sheet by header signature) + adapter
                   Webinar 3 (audit sheets) + validation + template-generator
lib/storage/       WebinarRepository interface + IndexedDB + export/import;
                   shared-store.ts (server-only, Redis) untuk data bersama
lib/publish/       build-snapshot.ts (Webinar → ringkasan non-PII & sebaliknya),
                   client.ts (fetch/publish/unpublish dari browser)
lib/migration/     Seed Webinar 1 & 2 hasil migrasi dari dashboard lama
lib/wizard/        Helper pembangunan Webinar dari hasil parse + form wizard
app/api/dashboard/ API route publik (GET) + gated by PUBLISH_SECRET (POST)
                   untuk penyimpanan bersama
components/dashboard/  UI: DashboardShell, OverviewDashboard, WebinarDashboard,
                   *Section.tsx per bagian, WebinarUploadWizard, WebinarEditor
```

Tidak ada kondisi `scope === "w1"` atau `metrics.w1` di manapun dalam core
logic — seluruh tab, grafik, dan tabel unit dibangun dari `.map()` atas
array `webinars`.

## Testing

```bash
pnpm test
```

Mencakup: normalisasi header, parsing Ya/Tidak & angka & timestamp,
pembuatan identity key, duplicate handling, kalkulasi attendance/pre-post/
paired gain/perfect score/feedback Likert, adapter template generik, dan
adapter Webinar 3 (deteksi sheet by header, unmatched PRE, exclude dari
Duplicate Dibuang).

Test acceptance Webinar 3 (13 angka dari task brief) berjalan terhadap file
asli jika tersedia secara lokal:

```bash
REAL_WEBINAR3_PATH=/path/ke/PLN_Webinar_3....xlsx pnpm test tests/webinar3-acceptance.test.ts
```

File itu sendiri sengaja **tidak** disertakan di repo (berisi PII asli);
test ini otomatis di-skip jika env var tidak diset.

## Troubleshooting Import

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| Error "Kolom wajib tidak ditemukan" | Sheet peserta tidak punya salah satu dari 10 kolom wajib minimum | Cek nama kolom persis sesuai template; kolom bisa ada di sheet manapun, bukan hanya "Participants" |
| Error "Tidak ditemukan sheet peserta" | Tidak ada sheet dengan ≥50% kolom wajib cocok | Pastikan header baris pertama sesuai template, tidak digabung sel/merged cell |
| Warning "peserta tanpa identity key" | Baris tidak punya Email/NIP/Participant Key/Unit yang valid | Lengkapi salah satu kolom identitas; baris tetap masuk dengan fallback nama saja |
| Angka pre-test dashboard beda dari sheet ringkasan sumber | Basis data berbeda (mis. termasuk/tidak termasuk unmatched) | Lihat catatan info di halaman Kualitas Data — perbedaan didokumentasikan, bukan dipaksa sama |
| NIP/HP berubah jadi angka aneh (`8.914e+06`) | Excel otomatis mengubah kolom jadi number | Parser sudah menangani ini via `parseIdentifierString`; jika masih terjadi, format kolom sebagai Text di Excel sebelum upload |

## Limitation

- **Penyimpanan bersama bersifat opsional dan hanya untuk angka agregat** —
  lihat [Berbagi Angka ke Semua Pengunjung](#berbagi-angka-ke-semua-pengunjung).
  Tanpa itu diaktifkan, semua data tersimpan lokal per-browser/perangkat;
  membuka dashboard di perangkat/browser lain tidak akan menampilkan data
  yang sama kecuali diimpor manual lewat export/import JSON. Data peserta
  mentah (nama/email/NIP/HP) tidak pernah tersinkron ke perangkat lain,
  dengan atau tanpa penyimpanan bersama — hanya angka hasil hitung.
- **Webinar 1 & 2 adalah rekonstruksi**, bukan re-upload dari file Excel asli
  (karena file spreadsheet mentahnya tidak tersedia lagi — hanya dashboard
  HTML & Next.js lama yang sudah teragregasi). `scripts/generate-legacy-seed.mjs`
  merekonstruksi data tingkat-partisipan dari agregat yang dipublikasikan
  (distribusi skor, daftar skor sempurna asli, daftar pertanyaan asli,
  komentar feedback asli, dll.) sehingga metric tetap **dihitung**, bukan
  diketik manual — tapi beberapa nilai individual (terutama nilai Likert
  per-pertanyaan) adalah hasil sintesis yang menghasilkan rata-rata identik
  dengan yang pernah dipublikasikan, bukan jawaban asli per orang. Lihat
  `importInfo.reconstructionNotes` di setiap webinar (tab Kualitas Data)
  untuk detail lengkap & perbedaan angka antar sumber lama.
- **`.xls` lama (format biner)**: didukung oleh library `xlsx`, tetapi belum
  diuji seluas `.xlsx`.
- **Tidak ada autentikasi/otorisasi** — Mode Edit adalah toggle lokal, bukan
  role-based access control; siapa pun yang memegang perangkat/browser yang
  sama dapat mengaktifkannya. `PUBLISH_SECRET` (penyimpanan bersama) adalah
  satu sandi bersama untuk mencegah publish sembarangan, bukan login
  per-pengguna — siapa pun yang tahu sandinya bisa menerbitkan perubahan.
- **Kategori feedback otomatis** memakai keyword sederhana
  (`lib/analytics/feedback.ts`) — cukup untuk gambaran cepat, tapi admin
  perlu meninjau/mengoreksi kategori yang penting.
- **Belum ada test end-to-end otomatis (CI)** untuk workflow upload di
  browser — pengujian upload/replace/delete/reload dilakukan manual dengan
  Playwright selama pengembangan (lihat ringkasan pekerjaan), belum
  diautomasi sebagai bagian dari `pnpm test`.
