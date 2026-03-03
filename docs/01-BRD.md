# Business Requirements Document (BRD)
# NotedPro Kolaborasi — Meeting Notes & Follow-Up Management

**Versi:** 1.0
**Tanggal:** 2 Maret 2026
**Penulis:** Tim Pengembangan NotedPro

---

## 1. Executive Summary

NotedPro Kolaborasi adalah aplikasi manajemen catatan meeting berbasis web (PWA) yang memungkinkan notulis mencatat hasil rapat, menyorot bagian penting, lalu mengubahnya menjadi item follow-up yang dapat ditugaskan ke karyawan. Admin/manajer dapat memantau seluruh follow-up melalui dashboard real-time.

---

## 2. Business Objectives

| No | Objective | KPI |
|----|-----------|-----|
| 1 | Mempercepat proses pencatatan meeting | Waktu notulensi berkurang 40% |
| 2 | Memastikan follow-up tidak terlewat | 95% task di-follow-up sebelum deadline |
| 3 | Memberikan visibility pekerjaan secara real-time | Dashboard update < 5 detik |
| 4 | Aksesibilitas multi-device | Installable di mobile, tablet, laptop, PC |

---

## 3. Stakeholders

| Role | Deskripsi | Kebutuhan Utama |
|------|-----------|-----------------|
| **Super Admin** | Pemilik sistem, kelola organisasi | Full control, manage users & roles |
| **Admin/Manager** | Pemimpin rapat, assign task | Buat meeting, assign follow-up, monitor dashboard |
| **Notulis (Noter)** | Pencatat meeting | Catat meeting, highlight text, buat follow-up items |
| **Karyawan (Staff)** | Pelaksana tugas | Lihat task, update status, lapor progress |

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Login dengan email & password (Laravel Sanctum) | Must Have |
| FR-002 | Role-based access control (Spatie Permission) | Must Have |
| FR-003 | Roles: Super Admin, Admin, Noter, Staff | Must Have |
| FR-004 | User profile management | Should Have |
| FR-005 | Logout & session management | Must Have |

### 4.2 Meeting Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-010 | CRUD Meeting (judul, tanggal, peserta, agenda) | Must Have |
| FR-011 | Rich text editor untuk catatan meeting (Tiptap/BlockNote) | Must Have |
| FR-012 | Attach file/gambar ke meeting notes | Should Have |
| FR-013 | Template meeting notes | Could Have |
| FR-014 | Daftar peserta meeting (link ke user) | Must Have |
| FR-015 | Status meeting: Draft, In Progress, Completed | Must Have |

### 4.3 Highlight-to-Follow-Up (Fitur Utama)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-020 | Select/blok teks di catatan meeting | Must Have |
| FR-021 | Teks yang diblok muncul sebagai item di tabel follow-up | Must Have |
| FR-022 | Setiap item follow-up memiliki: judul, deskripsi (dari teks), deadline, assignee, priority | Must Have |
| FR-023 | Highlighted text di catatan ditandai visual (warna/badge) | Must Have |
| FR-024 | Klik highlighted text membuka detail follow-up | Should Have |
| FR-025 | Satu catatan bisa memiliki banyak follow-up items | Must Have |
| FR-026 | Follow-up item bisa diedit setelah dibuat | Must Have |

### 4.4 Task Assignment & Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-030 | Admin assign follow-up ke satu atau lebih karyawan | Must Have |
| FR-031 | Set deadline untuk setiap task | Must Have |
| FR-032 | Set priority: Low, Medium, High, Urgent | Must Have |
| FR-033 | Karyawan menerima notifikasi task baru | Must Have |
| FR-034 | Karyawan bisa update status task | Must Have |
| FR-035 | Status task: To Do, In Progress, Review, Done | Must Have |
| FR-036 | Karyawan bisa menambahkan komentar/catatan pada task | Should Have |
| FR-037 | Task history / activity log | Should Have |

### 4.5 Dashboard Live Follow-Up
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-040 | Dashboard real-time menampilkan semua follow-up | Must Have |
| FR-041 | Kolom dashboard: Task, Assignee, Deadline, Status, Priority, Meeting Asal | Must Have |
| FR-042 | Filter berdasarkan: status, assignee, deadline, priority, meeting | Must Have |
| FR-043 | Search task | Must Have |
| FR-044 | Sorting per kolom | Should Have |
| FR-045 | Kanban view (drag & drop antar status) | Could Have |
| FR-046 | Indikator visual: overdue (merah), mendekati deadline (kuning) | Must Have |
| FR-047 | Statistik ringkasan: total task, selesai, overdue, in progress | Must Have |

### 4.6 Notifications
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-050 | In-app notification untuk task baru | Must Have |
| FR-051 | Notifikasi deadline mendekat (H-1, H-3) | Should Have |
| FR-052 | Push notification (PWA) | Should Have |
| FR-053 | Email notification (opsional) | Could Have |

### 4.7 PWA
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-060 | Installable di mobile, tablet, laptop, PC | Must Have |
| FR-061 | Responsive design untuk semua ukuran layar | Must Have |
| FR-062 | Offline mode: baca catatan terakhir | Could Have |
| FR-063 | App icon & splash screen | Must Have |

---

## 5. Non-Functional Requirements

| ID | Requirement | Detail |
|----|-------------|--------|
| NFR-001 | Performance | Page load < 2 detik, dashboard refresh < 5 detik |
| NFR-002 | Security | HTTPS, CSRF protection, rate limiting, input validation |
| NFR-003 | Scalability | Mendukung hingga 500 concurrent users |
| NFR-004 | Availability | 99.5% uptime |
| NFR-005 | Browser Support | Chrome, Firefox, Safari, Edge (2 versi terakhir) |
| NFR-006 | Data Backup | Daily automated backup |

---

## 6. User Stories

### Super Admin
- Sebagai Super Admin, saya ingin mengelola user dan role agar akses terkontrol.
- Sebagai Super Admin, saya ingin melihat statistik keseluruhan sistem.

### Admin/Manager
- Sebagai Admin, saya ingin membuat meeting baru dan mengundang peserta.
- Sebagai Admin, saya ingin melihat seluruh follow-up dari semua meeting di satu dashboard.
- Sebagai Admin, saya ingin menugaskan follow-up ke karyawan dengan deadline.
- Sebagai Admin, saya ingin memonitor progress pekerjaan secara real-time.

### Notulis (Noter)
- Sebagai Noter, saya ingin mencatat meeting dengan rich text editor.
- Sebagai Noter, saya ingin memblok teks penting lalu menjadikannya item follow-up.
- Sebagai Noter, saya ingin melihat daftar follow-up yang sudah saya buat dari catatan meeting.

### Karyawan (Staff)
- Sebagai Karyawan, saya ingin melihat task yang ditugaskan ke saya di dashboard personal.
- Sebagai Karyawan, saya ingin mengupdate status pekerjaan saya.
- Sebagai Karyawan, saya ingin mendapat notifikasi ketika ada task baru.

---

## 7. Acceptance Criteria

### Highlight-to-Follow-Up
1. User memblok teks di editor → muncul popup/tooltip "Buat Follow-Up"
2. Klik → form muncul dengan teks terblok sebagai deskripsi
3. User mengisi: assignee, deadline, priority → Save
4. Item muncul di tabel follow-up bawah editor DAN di dashboard
5. Teks di editor diberi highlight warna + badge icon

### Dashboard
1. Dashboard menampilkan semua task dengan data lengkap
2. Real-time update ketika status berubah (polling/websocket)
3. Filter dan search berfungsi tanpa reload halaman
4. Overdue tasks ditandai warna merah

---

## 8. Out of Scope (Phase 1)
- Video/audio recording meeting
- AI summarization
- Calendar integration (Google Calendar, Outlook)
- Multi-organization / multi-tenant
- Fitur chat/messaging antar user
- Export ke PDF/Word (bisa ditambahkan di phase 2)

---

## 9. Timeline Estimation

| Phase | Deliverable | Durasi |
|-------|------------|--------|
| Phase 1 | Auth, Meeting CRUD, Rich Editor | Sprint 1-2 |
| Phase 2 | Highlight-to-Follow-Up, Task Assignment | Sprint 3-4 |
| Phase 3 | Dashboard, Notifications, PWA | Sprint 5-6 |
| Phase 4 | Testing, Bug Fix, Deployment | Sprint 7 |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rich text editor complexity | High | Gunakan library mature (Tiptap) |
| Real-time dashboard performance | Medium | Polling interval + optimistic UI |
| PWA compatibility issues | Medium | Progressive enhancement strategy |
| Text highlight state management | High | Custom mark system di Tiptap |
