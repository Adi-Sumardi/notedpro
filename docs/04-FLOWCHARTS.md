# Flowcharts
# NotedPro Kolaborasi

---

## 1. Application Main Flow (Overview)

```
                        ┌─────────────┐
                        │   START     │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   LOGIN     │
                        └──────┬──────┘
                               │
                    ┌──────────▼──────────┐
                    │  Check User Role    │
                    └──┬─────┬─────┬──┬──┘
                       │     │     │  │
          ┌────────────┘     │     │  └──────────────┐
          ▼                  ▼     ▼                 ▼
   ┌──────────────┐  ┌──────────┐ ┌─────────┐  ┌─────────┐
   │ Super Admin  │  │  Admin   │ │  Noter  │  │  Staff  │
   │  Dashboard   │  │Dashboard │ │Dashboard│  │Dashboard│
   └──────┬───────┘  └────┬─────┘ └────┬────┘  └────┬────┘
          │                │            │             │
          ▼                ▼            ▼             ▼
   ┌──────────────┐  ┌──────────┐ ┌─────────┐  ┌─────────┐
   │ Manage Users │  │ Create   │ │ Join    │  │ View My │
   │ Manage Roles │  │ Meeting  │ │ Meeting │  │  Tasks  │
   │ All Features │  │ Assign   │ │ Take    │  │ Update  │
   │              │  │ Tasks    │ │ Notes   │  │ Status  │
   │              │  │ Monitor  │ │ Create  │  │         │
   │              │  │ Dashboard│ │FollowUp │  │         │
   └──────────────┘  └──────────┘ └─────────┘  └─────────┘
```

---

## 2. Meeting Creation Flow

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ Admin klik           │
│ "Buat Meeting Baru" │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────┐
│ Isi Form Meeting:           │
│ - Judul                     │
│ - Deskripsi                 │
│ - Tanggal & Waktu           │
│ - Lokasi                    │
│ - Pilih Peserta             │
│ - Pilih Notulis             │
└─────────┬───────────────────┘
          │
          ▼
     ┌────────────┐
     │ Validasi   │──── Invalid ──→ Tampilkan Error
     │ Form       │                       │
     └─────┬──────┘                       │
           │ Valid                         │
           ▼                              │
    ┌──────────────┐                      │
    │ Simpan ke DB │                      │
    │ Status: Draft│                      │
    └──────┬───────┘                      │
           │                              │
           ▼                              │
    ┌──────────────────┐                  │
    │ Notifikasi ke    │                  │
    │ Peserta & Notulis│                  │
    └──────┬───────────┘                  │
           │                              │
           ▼                              │
    ┌──────────────┐                      │
    │ Redirect ke  │◄─────────────────────┘
    │ Detail Meeting│
    └──────────────┘
```

---

## 3. Meeting Notes & Highlight-to-Follow-Up Flow (CORE FEATURE)

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────────────────────┐
│ Notulis buka             │
│ Meeting Detail Page      │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Klik "Mulai Notulensi"  │
│ Meeting status →        │
│ "in_progress"            │
└─────────┬───────────────┘
          │
          ▼
┌──────────────────────────────────────────────────┐
│                RICH TEXT EDITOR (Tiptap)           │
│                                                    │
│  Notulis mengetik catatan meeting...               │
│  ┌──────────────────────────────────────────────┐  │
│  │ "Bapak Andi menjelaskan bahwa proyek X harus │  │
│  │  selesai minggu depan. Budget perlu direvisi  │  │
│  │  oleh tim finance. ██████████████████████████ │  │
│  │  ← User memblok teks ini                     │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
└─────────────────────┬────────────────────────────┘
                      │
                      │ User memblok/select teks
                      ▼
               ┌──────────────┐
               │ Muncul       │
               │ Tooltip:     │
               │ "📌 Buat     │
               │  Follow-Up"  │
               └──────┬───────┘
                      │
                      │ User klik tooltip
                      ▼
          ┌───────────────────────────┐
          │  Modal "Buat Follow-Up"   │
          │                           │
          │  Teks: [auto-filled]      │
          │  Judul: [___________]     │
          │  Priority: [dropdown]     │
          │  Deskripsi: [textarea]    │
          │                           │
          │  [Batal]  [Simpan]        │
          └───────────┬───────────────┘
                      │
                      │ Klik Simpan
                      ▼
          ┌───────────────────────────┐
          │ Simpan ke follow_up_items │
          │ + Simpan posisi highlight │
          │ + Tandai teks dengan warna│
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ Teks di editor berubah:   │
          │                           │
          │ "...Budget perlu direvisi │
          │  oleh tim finance..."     │
          │  ^^^^^^^^^^^^^^^^^^^^^^^^ │
          │  [Kuning + 📌 icon]       │
          │                           │
          │ + Item muncul di tabel    │
          │   follow-up di bawah      │
          │   editor                  │
          └───────────────────────────┘
```

---

## 4. Task Assignment Flow

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────────────────────────┐
│ Admin buka Follow-Up Table  │
│ (dari Meeting atau Dashboard)│
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Pilih follow-up item        │
│ yang belum di-assign        │
│ (Status: "open")            │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Klik "Assign Task"          │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  Modal "Assign Task"            │
│                                 │
│  Task: [auto from follow-up]    │
│  Assignee: [pilih karyawan]     │
│  Deadline: [date picker]        │
│  Priority: [dropdown]           │
│  Catatan: [textarea opsional]   │
│                                 │
│  [Batal]  [Assign]              │
└─────────────┬───────────────────┘
              │
              │ Klik Assign
              ▼
       ┌──────────────┐     ┌────────────────────┐
       │ Validasi     │──→  │ Error: Tampilkan    │
       │ - Deadline   │     │ pesan validasi      │
       │ - Assignee   │     └────────────────────┘
       └──────┬───────┘
              │ Valid
              ▼
       ┌──────────────────────┐
       │ Simpan Task ke DB    │
       │ follow_up.status →   │
       │    "assigned"         │
       │ task.status → "todo" │
       └──────┬───────────────┘
              │
              ▼
       ┌──────────────────────┐
       │ Kirim Notifikasi     │
       │ ke Karyawan:         │
       │ "Anda mendapat task  │
       │  baru: [judul]"      │
       └──────┬───────────────┘
              │
              ▼
       ┌──────────────────────┐
       │ Task muncul di:      │
       │ - Dashboard Admin    │
       │ - Dashboard Karyawan │
       └──────────────────────┘
```

---

## 5. Task Status Update Flow (Karyawan)

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌──────────────────────┐
│ Karyawan login        │
│ → Dashboard Personal │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────────────┐
│ Lihat daftar task yang       │
│ ditugaskan:                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ Task 1 - 🔴 Urgent      │ │
│ │ Deadline: 5 Mar 2026    │ │
│ │ Status: [To Do ▼]       │ │
│ ├──────────────────────────┤ │
│ │ Task 2 - 🟡 Medium      │ │
│ │ Deadline: 10 Mar 2026   │ │
│ │ Status: [In Progress ▼] │ │
│ └──────────────────────────┘ │
└─────────┬────────────────────┘
          │
          │ Karyawan ubah status
          ▼
     ┌───────────────┐
     │ Status baru?  │
     └───┬───┬───┬───┘
         │   │   │
    ┌────┘   │   └────┐
    ▼        ▼        ▼
┌────────┐┌────────┐┌──────┐
│In Prog.││Review  ││ Done │
└───┬────┘└───┬────┘└──┬───┘
    │         │        │
    └────┬────┘        │
         │             │
         ▼             ▼
  ┌──────────────┐ ┌──────────────────┐
  │ Simpan ke DB │ │ Simpan ke DB     │
  │ Log Activity │ │ Log Activity     │
  └──────┬───────┘ │ Set completed_at │
         │         └──────┬───────────┘
         │                │
         ▼                ▼
  ┌──────────────────────────────┐
  │ Notifikasi ke Admin:         │
  │ "Task [judul] status berubah │
  │  menjadi [status baru]"      │
  └──────┬───────────────────────┘
         │
         ▼
  ┌──────────────────────────┐
  │ Dashboard auto-refresh   │
  │ (polling / real-time)    │
  └──────────────────────────┘
```

---

## 6. Dashboard Live Follow-Up Flow

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌──────────────────────┐
│ Admin buka Dashboard │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────┐
│                    DASHBOARD VIEW                             │
│                                                               │
│  ┌─ Summary Cards ─────────────────────────────────────────┐  │
│  │ Total: 45 │ Done: 20 │ In Progress: 15 │ Overdue: 5   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ Filters ───────────────────────────────────────────────┐  │
│  │ Status: [All ▼] │ Assignee: [All ▼] │ Meeting: [All ▼]│  │
│  │ Priority: [All ▼] │ Date Range: [___] to [___]         │  │
│  │ Search: [_________________________] 🔍                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ Task Table ────────────────────────────────────────────┐  │
│  │ # │ Task          │Assignee│Deadline │Status │Priority │  │
│  │───┼───────────────┼────────┼─────────┼───────┼─────────│  │
│  │ 1 │ Revisi budget │ Budi   │ 5 Mar   │🔴 Todo│ Urgent  │  │
│  │ 2 │ Update report │ Sari   │ 10 Mar  │🟡 Prog│ Medium  │  │
│  │ 3 │ Review design │ Andi   │ 3 Mar   │🔴 Over│ High    │  │
│  │ 4 │ Kirim invoice │ Dewi   │ 15 Mar  │🟢 Done│ Low     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Auto-refresh setiap 5 detik (polling)                        │
│  atau real-time via WebSocket                                 │
└──────────────────────────────────────────────────────────────┘
          │
          │ Klik task row
          ▼
┌──────────────────────────┐
│ Task Detail Side Panel / │
│ Modal:                   │
│                          │
│ - Full description       │
│ - Activity timeline      │
│ - Comments               │
│ - Link ke meeting asal   │
│ - Change status          │
│ - Reassign               │
└──────────────────────────┘
```

---

## 7. Notification Flow

```
                    ┌──────────────┐
                    │  TRIGGER     │
                    │  EVENTS      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
      ┌──────────┐  ┌──────────┐  ┌──────────────┐
      │ Task     │  │ Status   │  │ Deadline     │
      │ Assigned │  │ Changed  │  │ Approaching  │
      └────┬─────┘  └────┬─────┘  └──────┬───────┘
           │              │               │
           └──────────────┼───────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │ Create           │
                │ Notification     │
                │ Record in DB     │
                └────────┬─────────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
       ┌──────────┐ ┌────────┐ ┌────────────┐
       │ In-App   │ │ Push   │ │   Email    │
       │ (Bell    │ │ (PWA   │ │ (Optional) │
       │  Icon)   │ │Service │ │            │
       │          │ │Worker) │ │            │
       └──────────┘ └────────┘ └────────────┘
```

---

## 8. PWA Installation Flow

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌──────────────────────┐
│ User akses website   │
│ via browser          │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐     ┌──────────────────────┐
│ Service Worker        │────>│ Cache static assets  │
│ registered            │     │ (HTML, CSS, JS, icons)│
└─────────┬────────────┘     └──────────────────────┘
          │
          ▼
┌──────────────────────┐
│ Browser detects       │
│ manifest.json         │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────────────┐
│ "Install NotedPro?" prompt   │
│ appears in browser           │
│                              │
│ [Install]  [Not Now]         │
└─────────┬────────────────────┘
          │ Install
          ▼
┌──────────────────────────────┐
│ App installed on device      │
│ - Home screen icon (Mobile)  │
│ - Taskbar/Dock (Desktop)     │
│ - Standalone window          │
│ - Splash screen on launch    │
└──────────────────────────────┘
```

---

## 9. Complete User Journey (End-to-End)

```
Admin                    Noter                    Staff
  │                        │                        │
  │  1. Buat Meeting       │                        │
  ├───────────────────────>│                        │
  │     + Invite peserta   │                        │
  │     + Assign noter     │                        │
  │                        │                        │
  │                        │  2. Terima notifikasi  │
  │                        │     meeting baru       │
  │                        │                        │
  │                        │  3. Mulai notulensi    │
  │                        │     di rich editor     │
  │                        │                        │
  │                        │  4. Blok teks penting  │
  │                        │     → Buat follow-up   │
  │                        │     → Buat follow-up   │
  │                        │     → Buat follow-up   │
  │                        │                        │
  │  5. Review follow-ups  │                        │
  │     dari meeting       │                        │
  │                        │                        │
  │  6. Assign task ke     │                        │
  │     karyawan + deadline│                        │
  │     ─────────────────────────────────────────> │
  │                        │                        │
  │                        │                        │  7. Terima notif
  │                        │                        │     task baru
  │                        │                        │
  │                        │                        │  8. Kerjakan task
  │                        │                        │     Update status:
  │                        │                        │     todo→in_progress
  │                        │                        │     →review→done
  │                        │                        │
  │  9. Monitor dashboard  │                        │
  │     real-time          │                        │
  │     - Lihat progress   │                        │
  │     - Cek overdue      │                        │
  │     - Filter/search    │                        │
  │                        │                        │
  └────────────────────────┴────────────────────────┘
```
