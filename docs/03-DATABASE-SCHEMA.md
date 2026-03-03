# Database Schema Design (ERD)
# NotedPro Kolaborasi

---

## 1. Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────────┐
│      users       │       │   model_has_roles    │
├──────────────────┤       ├──────────────────────┤
│ id (PK)          │──┐    │ role_id (FK)         │
│ name             │  │    │ model_type           │
│ email (UNIQUE)   │  ├───>│ model_id (FK→users)  │
│ password         │  │    └──────────┬───────────┘
│ avatar           │  │               │
│ phone            │  │    ┌──────────┴───────────┐
│ position         │  │    │       roles           │
│ department       │  │    ├──────────────────────┤
│ is_active        │  │    │ id (PK)              │
│ timestamps       │  │    │ name                 │
│ soft_deletes     │  │    │ guard_name           │
└────────┬─────────┘  │    └──────────────────────┘
         │            │
         │            │    ┌──────────────────────┐
         │            │    │    permissions        │
         │            │    ├──────────────────────┤
         │            │    │ id (PK)              │
         │            │    │ name                 │
         │            │    │ guard_name           │
         │            │    └──────────────────────┘
         │
         │  ┌───────────────────────────────────────┐
         │  │             meetings                   │
         │  ├───────────────────────────────────────┤
         ├─>│ id (PK)                               │
         │  │ title                                  │
         │  │ description                            │
         │  │ meeting_date (DATETIME)                │
         │  │ location                               │
         │  │ created_by (FK→users)                  │
         │  │ status ENUM(draft,in_progress,completed)│
         │  │ timestamps                             │
         │  │ soft_deletes                           │
         │  └───────────┬───────────────────────────┘
         │              │
         │              │  ┌────────────────────────┐
         │              │  │  meeting_participants   │
         │              │  ├────────────────────────┤
         │              ├─>│ id (PK)                │
         │              │  │ meeting_id (FK)        │
         ├─────────────>│  │ user_id (FK)           │
         │              │  │ role ENUM(host,noter,   │
         │              │  │   participant)          │
         │              │  │ timestamps             │
         │              │  └────────────────────────┘
         │              │
         │              │  ┌────────────────────────┐
         │              │  │    meeting_notes        │
         │              │  ├────────────────────────┤
         │              ├─>│ id (PK)                │
         │              │  │ meeting_id (FK)        │
         │              │  │ content (LONGTEXT/JSON) │
         │              │  │ content_html (LONGTEXT) │
         │              │  │ version (INT)          │
         ├─────────────>│  │ created_by (FK→users)  │
         │              │  │ timestamps             │
         │              │  └───────────┬────────────┘
         │              │              │
         │              │              │
         │              │  ┌───────────┴────────────────────────┐
         │              │  │        follow_up_items              │
         │              │  ├────────────────────────────────────┤
         │              ├─>│ id (PK)                            │
         │              │  │ meeting_id (FK)                    │
         │              │  │ meeting_note_id (FK)               │
         │              │  │ highlighted_text (TEXT)             │
         │              │  │ highlight_start (INT)               │
         │              │  │ highlight_end (INT)                 │
         │              │  │ highlight_color (VARCHAR)           │
         │              │  │ title (VARCHAR)                     │
         │              │  │ description (TEXT)                  │
         │              │  │ priority ENUM(low,medium,high,urgent)│
         │              │  │ status ENUM(open,assigned,done)     │
         ├─────────────>│  │ created_by (FK→users)              │
         │              │  │ timestamps                         │
         │              │  │ soft_deletes                       │
         │              │  └───────────┬────────────────────────┘
         │                             │
         │                             │
         │              ┌──────────────┴────────────────────────┐
         │              │            tasks                       │
         │              ├───────────────────────────────────────┤
         │              │ id (PK)                               │
         │              │ follow_up_item_id (FK)                │
         ├─────────────>│ assigned_to (FK→users)                │
         ├─────────────>│ assigned_by (FK→users)                │
         │              │ title (VARCHAR)                        │
         │              │ description (TEXT)                     │
         │              │ status ENUM(todo,in_progress,          │
         │              │        review,done)                    │
         │              │ priority ENUM(low,medium,high,urgent)  │
         │              │ deadline (DATE)                        │
         │              │ completed_at (DATETIME, nullable)      │
         │              │ timestamps                             │
         │              │ soft_deletes                           │
         │              └───────────┬───────────────────────────┘
         │                          │
         │           ┌──────────────┤
         │           │              │
         │           ▼              ▼
         │  ┌────────────────┐  ┌────────────────────┐
         │  │ task_comments   │  │  task_activities    │
         │  ├────────────────┤  ├────────────────────┤
         │  │ id (PK)        │  │ id (PK)            │
         │  │ task_id (FK)   │  │ task_id (FK)       │
         ├─>│ user_id (FK)   │  │ user_id (FK)       │
         │  │ content (TEXT)  │  │ action (VARCHAR)   │
         │  │ timestamps     │  │ old_value (TEXT)    │
         │  └────────────────┘  │ new_value (TEXT)    │
         │                      │ timestamps         │
         │                      └────────────────────┘
         │
         │  ┌──────────────────────────────────────┐
         │  │          notifications                │
         │  ├──────────────────────────────────────┤
         └─>│ id (PK, UUID)                        │
            │ type (VARCHAR)                        │
            │ notifiable_type (VARCHAR)             │
            │ notifiable_id (FK→users)              │
            │ data (JSON)                           │
            │ read_at (DATETIME, nullable)          │
            │ timestamps                            │
            └──────────────────────────────────────┘
```

---

## 2. Table Definitions (Migration-Ready)

### 2.1 `users` (extends Laravel default)
```sql
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password        VARCHAR(255) NOT NULL,
    avatar          VARCHAR(255) NULL,
    phone           VARCHAR(20) NULL,
    position        VARCHAR(100) NULL,
    department      VARCHAR(100) NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    remember_token  VARCHAR(100) NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    deleted_at      TIMESTAMP NULL
);
```

### 2.2 `meetings`
```sql
CREATE TABLE meetings (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT NULL,
    meeting_date    DATETIME NOT NULL,
    location        VARCHAR(255) NULL,
    created_by      BIGINT UNSIGNED NOT NULL,
    status          ENUM('draft', 'in_progress', 'completed') DEFAULT 'draft',
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    deleted_at      TIMESTAMP NULL,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_meetings_status (status),
    INDEX idx_meetings_date (meeting_date),
    INDEX idx_meetings_created_by (created_by)
);
```

### 2.3 `meeting_participants`
```sql
CREATE TABLE meeting_participants (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    meeting_id      BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    role            ENUM('host', 'noter', 'participant') DEFAULT 'participant',
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (meeting_id, user_id)
);
```

### 2.4 `meeting_notes`
```sql
CREATE TABLE meeting_notes (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    meeting_id      BIGINT UNSIGNED NOT NULL,
    content         JSON NOT NULL COMMENT 'Tiptap JSON document',
    content_html    LONGTEXT NULL COMMENT 'Rendered HTML for search/display',
    version         INT UNSIGNED DEFAULT 1,
    created_by      BIGINT UNSIGNED NOT NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notes_meeting (meeting_id)
);
```

### 2.5 `follow_up_items`
```sql
CREATE TABLE follow_up_items (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    meeting_id      BIGINT UNSIGNED NOT NULL,
    meeting_note_id BIGINT UNSIGNED NOT NULL,
    highlighted_text TEXT NOT NULL COMMENT 'Teks yang diblok user',
    highlight_start INT UNSIGNED NULL COMMENT 'Posisi awal highlight di document',
    highlight_end   INT UNSIGNED NULL COMMENT 'Posisi akhir highlight di document',
    highlight_color VARCHAR(20) DEFAULT '#FEF08A' COMMENT 'Warna highlight',
    title           VARCHAR(255) NOT NULL,
    description     TEXT NULL,
    priority        ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status          ENUM('open', 'assigned', 'done') DEFAULT 'open',
    created_by      BIGINT UNSIGNED NOT NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    deleted_at      TIMESTAMP NULL,

    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_note_id) REFERENCES meeting_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_followup_meeting (meeting_id),
    INDEX idx_followup_status (status),
    INDEX idx_followup_priority (priority)
);
```

### 2.6 `tasks`
```sql
CREATE TABLE tasks (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    follow_up_item_id   BIGINT UNSIGNED NOT NULL,
    assigned_to         BIGINT UNSIGNED NOT NULL,
    assigned_by         BIGINT UNSIGNED NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NULL,
    status              ENUM('todo', 'in_progress', 'review', 'done') DEFAULT 'todo',
    priority            ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    deadline            DATE NOT NULL,
    completed_at        DATETIME NULL,
    created_at          TIMESTAMP NULL,
    updated_at          TIMESTAMP NULL,
    deleted_at          TIMESTAMP NULL,

    FOREIGN KEY (follow_up_item_id) REFERENCES follow_up_items(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tasks_assignee (assigned_to),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_deadline (deadline),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_status_deadline (status, deadline)
);
```

### 2.7 `task_comments`
```sql
CREATE TABLE task_comments (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id     BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,

    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comments_task (task_id)
);
```

### 2.8 `task_activities`
```sql
CREATE TABLE task_activities (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id     BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED NOT NULL,
    action      VARCHAR(50) NOT NULL COMMENT 'created, status_changed, reassigned, etc.',
    old_value   TEXT NULL,
    new_value   TEXT NULL,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,

    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_activities_task (task_id)
);
```

### 2.9 `notifications` (Laravel default)
```sql
CREATE TABLE notifications (
    id              CHAR(36) PRIMARY KEY,
    type            VARCHAR(255) NOT NULL,
    notifiable_type VARCHAR(255) NOT NULL,
    notifiable_id   BIGINT UNSIGNED NOT NULL,
    data            JSON NOT NULL,
    read_at         TIMESTAMP NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    INDEX idx_notifications_notifiable (notifiable_type, notifiable_id)
);
```

---

## 3. Relationships Summary

| Parent | Child | Relationship | Type |
|--------|-------|-------------|------|
| users | meetings | User creates many meetings | 1:N |
| users | meeting_participants | User participates in many meetings | M:N (pivot) |
| meetings | meeting_participants | Meeting has many participants | 1:N |
| meetings | meeting_notes | Meeting has one/many notes | 1:N |
| meeting_notes | follow_up_items | Note has many follow-up items | 1:N |
| follow_up_items | tasks | Follow-up item has many tasks | 1:N |
| users | tasks (assigned_to) | User has many assigned tasks | 1:N |
| users | tasks (assigned_by) | User assigns many tasks | 1:N |
| tasks | task_comments | Task has many comments | 1:N |
| tasks | task_activities | Task has many activities | 1:N |
| users | notifications | User has many notifications | 1:N (polymorphic) |

---

## 4. Indexes Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| meetings | `idx_meetings_status` | Filter by status |
| meetings | `idx_meetings_date` | Sort/filter by date |
| tasks | `idx_tasks_assignee` | Dashboard: tasks per user |
| tasks | `idx_tasks_status` | Dashboard: filter by status |
| tasks | `idx_tasks_deadline` | Dashboard: overdue detection |
| tasks | `idx_tasks_status_deadline` | Composite: status + deadline query |
| follow_up_items | `idx_followup_meeting` | Get follow-ups per meeting |
