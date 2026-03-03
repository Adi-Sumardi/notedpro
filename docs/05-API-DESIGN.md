# API Design Document
# NotedPro Kolaborasi

**Base URL:** `/api/v1`
**Authentication:** Laravel Sanctum (Cookie-based SPA)
**Format:** JSON

---

## 1. Authentication

### POST `/api/login`
Login user.
```json
// Request
{
    "email": "admin@notedpro.com",
    "password": "password"
}

// Response 200
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "name": "Admin User",
            "email": "admin@notedpro.com",
            "roles": ["admin"],
            "permissions": ["create-meeting", "assign-task", ...]
        }
    }
}
```

### POST `/api/logout`
Logout user (requires auth).
```json
// Response 200
{ "success": true, "message": "Logged out successfully" }
```

### GET `/api/user`
Get authenticated user profile.

---

## 2. User Management

### GET `/api/v1/users`
List all users. **Permission:** `manage-users` atau `assign-task`
```
Query params: ?search=&role=&is_active=&per_page=15&page=1
```
```json
// Response 200
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Budi Santoso",
            "email": "budi@company.com",
            "position": "Staff Finance",
            "department": "Finance",
            "roles": ["staff"],
            "is_active": true
        }
    ],
    "meta": {
        "current_page": 1,
        "last_page": 3,
        "per_page": 15,
        "total": 42
    }
}
```

### POST `/api/v1/users`
Create user. **Permission:** `manage-users`

### GET `/api/v1/users/{id}`
Get user detail.

### PUT `/api/v1/users/{id}`
Update user. **Permission:** `manage-users`

### DELETE `/api/v1/users/{id}`
Soft delete user. **Permission:** `manage-users`

---

## 3. Meetings

### GET `/api/v1/meetings`
List meetings.
```
Query params: ?status=&created_by=&date_from=&date_to=&search=&per_page=15
```
```json
// Response 200
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "Weekly Standup Sprint 10",
            "description": "Review progress sprint 10",
            "meeting_date": "2026-03-02T09:00:00Z",
            "location": "Ruang Meeting Lantai 3",
            "status": "completed",
            "created_by": {
                "id": 1,
                "name": "Admin User"
            },
            "participants_count": 5,
            "follow_ups_count": 3,
            "created_at": "2026-03-01T10:00:00Z"
        }
    ],
    "meta": { ... }
}
```

### POST `/api/v1/meetings`
Create meeting. **Permission:** `create-meeting`
```json
// Request
{
    "title": "Weekly Standup Sprint 10",
    "description": "Review progress sprint 10",
    "meeting_date": "2026-03-02T09:00:00",
    "location": "Ruang Meeting Lantai 3",
    "participants": [
        { "user_id": 2, "role": "noter" },
        { "user_id": 3, "role": "participant" },
        { "user_id": 4, "role": "participant" }
    ]
}

// Response 201
{
    "success": true,
    "data": { ... },
    "message": "Meeting created successfully"
}
```

### GET `/api/v1/meetings/{id}`
Get meeting detail with participants & notes summary.

### PUT `/api/v1/meetings/{id}`
Update meeting. **Permission:** `edit-meeting`

### DELETE `/api/v1/meetings/{id}`
Delete meeting. **Permission:** `delete-meeting`

### PATCH `/api/v1/meetings/{id}/status`
Update meeting status.
```json
// Request
{ "status": "in_progress" }
```

---

## 4. Meeting Participants

### GET `/api/v1/meetings/{meetingId}/participants`
List participants of a meeting.

### POST `/api/v1/meetings/{meetingId}/participants`
Add participant.
```json
{ "user_id": 5, "role": "participant" }
```

### DELETE `/api/v1/meetings/{meetingId}/participants/{userId}`
Remove participant.

---

## 5. Meeting Notes

### GET `/api/v1/meetings/{meetingId}/notes`
Get notes for a meeting.
```json
// Response 200
{
    "success": true,
    "data": {
        "id": 1,
        "meeting_id": 1,
        "content": { /* Tiptap JSON document */ },
        "content_html": "<p>Bapak Andi menjelaskan...</p>",
        "version": 3,
        "created_by": { "id": 2, "name": "Noter User" },
        "follow_up_items": [
            {
                "id": 1,
                "highlighted_text": "Budget perlu direvisi oleh tim finance",
                "highlight_color": "#FEF08A",
                "title": "Revisi Budget Proyek X",
                "priority": "high",
                "status": "assigned"
            }
        ],
        "updated_at": "2026-03-02T10:30:00Z"
    }
}
```

### POST `/api/v1/meetings/{meetingId}/notes`
Create/save notes. **Permission:** `create-notes`
```json
// Request
{
    "content": { /* Tiptap JSON document */ },
    "content_html": "<p>...</p>"
}
```

### PUT `/api/v1/meetings/{meetingId}/notes/{noteId}`
Update notes. **Permission:** `edit-notes`
```json
// Request
{
    "content": { /* Tiptap JSON document */ },
    "content_html": "<p>...</p>"
}
```

---

## 6. Follow-Up Items (Core Feature)

### GET `/api/v1/meetings/{meetingId}/follow-ups`
List follow-up items for a meeting.
```json
// Response 200
{
    "success": true,
    "data": [
        {
            "id": 1,
            "meeting_id": 1,
            "highlighted_text": "Budget perlu direvisi oleh tim finance",
            "highlight_start": 145,
            "highlight_end": 185,
            "highlight_color": "#FEF08A",
            "title": "Revisi Budget Proyek X",
            "description": "Tim finance harus merevisi budget proyek X sesuai perubahan scope",
            "priority": "high",
            "status": "assigned",
            "created_by": { "id": 2, "name": "Noter" },
            "tasks": [
                {
                    "id": 1,
                    "assigned_to": { "id": 4, "name": "Budi" },
                    "status": "in_progress",
                    "deadline": "2026-03-05"
                }
            ],
            "created_at": "2026-03-02T09:30:00Z"
        }
    ]
}
```

### POST `/api/v1/meetings/{meetingId}/follow-ups`
Create follow-up from highlighted text. **Permission:** `create-followup`
```json
// Request
{
    "meeting_note_id": 1,
    "highlighted_text": "Budget perlu direvisi oleh tim finance",
    "highlight_start": 145,
    "highlight_end": 185,
    "highlight_color": "#FEF08A",
    "title": "Revisi Budget Proyek X",
    "description": "Tim finance harus merevisi budget proyek X",
    "priority": "high"
}

// Response 201
{
    "success": true,
    "data": { ... },
    "message": "Follow-up item created"
}
```

### PUT `/api/v1/follow-ups/{id}`
Update follow-up item.

### DELETE `/api/v1/follow-ups/{id}`
Delete follow-up item.

---

## 7. Tasks

### GET `/api/v1/tasks`
List all tasks (dashboard). **Permission:** `view-all-tasks` atau `view-own-tasks`
```
Query params:
  ?status=todo,in_progress,review,done
  &assigned_to=4
  &priority=high,urgent
  &deadline_from=2026-03-01
  &deadline_to=2026-03-31
  &meeting_id=1
  &search=budget
  &sort_by=deadline
  &sort_order=asc
  &per_page=20
  &page=1
  &overdue=true  (filter hanya overdue tasks)
```
```json
// Response 200
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "Revisi Budget Proyek X",
            "description": "...",
            "status": "in_progress",
            "priority": "high",
            "deadline": "2026-03-05",
            "is_overdue": false,
            "assigned_to": {
                "id": 4,
                "name": "Budi Santoso",
                "avatar": "/avatars/budi.jpg",
                "position": "Staff Finance"
            },
            "assigned_by": {
                "id": 1,
                "name": "Admin User"
            },
            "follow_up_item": {
                "id": 1,
                "highlighted_text": "Budget perlu direvisi..."
            },
            "meeting": {
                "id": 1,
                "title": "Weekly Standup Sprint 10"
            },
            "completed_at": null,
            "created_at": "2026-03-02T10:00:00Z"
        }
    ],
    "meta": { ... }
}
```

### POST `/api/v1/tasks`
Create/assign task. **Permission:** `assign-task`
```json
// Request
{
    "follow_up_item_id": 1,
    "assigned_to": 4,
    "title": "Revisi Budget Proyek X",
    "description": "Revisi sesuai scope baru yang disetujui",
    "priority": "high",
    "deadline": "2026-03-05"
}

// Response 201
{
    "success": true,
    "data": { ... },
    "message": "Task assigned to Budi Santoso"
}
```

### GET `/api/v1/tasks/{id}`
Get task detail with comments & activities.
```json
// Response 200
{
    "success": true,
    "data": {
        "id": 1,
        "title": "Revisi Budget Proyek X",
        "description": "...",
        "status": "in_progress",
        "priority": "high",
        "deadline": "2026-03-05",
        "assigned_to": { ... },
        "assigned_by": { ... },
        "follow_up_item": { ... },
        "meeting": { ... },
        "comments": [
            {
                "id": 1,
                "user": { "id": 4, "name": "Budi" },
                "content": "Sudah mulai revisi, estimasi selesai besok",
                "created_at": "2026-03-03T14:00:00Z"
            }
        ],
        "activities": [
            {
                "id": 1,
                "user": { "id": 4, "name": "Budi" },
                "action": "status_changed",
                "old_value": "todo",
                "new_value": "in_progress",
                "created_at": "2026-03-03T09:00:00Z"
            }
        ]
    }
}
```

### PATCH `/api/v1/tasks/{id}/status`
Update task status. **Permission:** `update-task-status`
```json
// Request
{ "status": "in_progress" }

// Response 200
{
    "success": true,
    "data": { ... },
    "message": "Task status updated to In Progress"
}
```

### PUT `/api/v1/tasks/{id}`
Update task details. **Permission:** `assign-task`

### DELETE `/api/v1/tasks/{id}`
Delete task. **Permission:** `assign-task`

---

## 8. Task Comments

### GET `/api/v1/tasks/{taskId}/comments`
List comments.

### POST `/api/v1/tasks/{taskId}/comments`
Add comment.
```json
// Request
{ "content": "Sudah selesai revisi, mohon di-review" }
```

---

## 9. Dashboard

### GET `/api/v1/dashboard/summary`
Get dashboard summary. **Permission:** `view-dashboard`
```json
// Response 200
{
    "success": true,
    "data": {
        "total_tasks": 45,
        "by_status": {
            "todo": 10,
            "in_progress": 15,
            "review": 8,
            "done": 12
        },
        "overdue": 5,
        "due_this_week": 8,
        "completion_rate": 26.7,
        "by_priority": {
            "urgent": 3,
            "high": 12,
            "medium": 20,
            "low": 10
        }
    }
}
```

### GET `/api/v1/dashboard/my-summary`
Get personal dashboard summary (for staff).
```json
// Response 200
{
    "success": true,
    "data": {
        "total_tasks": 8,
        "by_status": {
            "todo": 2,
            "in_progress": 3,
            "review": 1,
            "done": 2
        },
        "overdue": 1,
        "due_this_week": 3
    }
}
```

---

## 10. Notifications

### GET `/api/v1/notifications`
List user notifications.
```
Query params: ?unread_only=true&per_page=20
```
```json
// Response 200
{
    "success": true,
    "data": [
        {
            "id": "uuid-1",
            "type": "task_assigned",
            "data": {
                "title": "Task baru: Revisi Budget Proyek X",
                "task_id": 1,
                "assigned_by": "Admin User"
            },
            "read_at": null,
            "created_at": "2026-03-02T10:00:00Z"
        }
    ],
    "unread_count": 3
}
```

### PATCH `/api/v1/notifications/{id}/read`
Mark notification as read.

### PATCH `/api/v1/notifications/read-all`
Mark all notifications as read.

---

## 11. Standard Response Format

### Success Response
```json
{
    "success": true,
    "data": { ... },
    "message": "Optional success message",
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 15,
        "total": 72
    }
}
```

### Error Response
```json
{
    "success": false,
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "deadline": ["The deadline must be a future date."]
    }
}
```

### HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no content) |
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Unauthorized (forbidden) |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

---

## 12. API Route Summary

```
Auth (no prefix):
  POST   /api/login
  POST   /api/logout
  GET    /api/user

API v1 (prefix: /api/v1):
  Users:
    GET    /users
    POST   /users
    GET    /users/{id}
    PUT    /users/{id}
    DELETE /users/{id}

  Meetings:
    GET    /meetings
    POST   /meetings
    GET    /meetings/{id}
    PUT    /meetings/{id}
    DELETE /meetings/{id}
    PATCH  /meetings/{id}/status

  Participants:
    GET    /meetings/{id}/participants
    POST   /meetings/{id}/participants
    DELETE /meetings/{id}/participants/{userId}

  Notes:
    GET    /meetings/{id}/notes
    POST   /meetings/{id}/notes
    PUT    /meetings/{id}/notes/{noteId}

  Follow-Ups:
    GET    /meetings/{id}/follow-ups
    POST   /meetings/{id}/follow-ups
    PUT    /follow-ups/{id}
    DELETE /follow-ups/{id}

  Tasks:
    GET    /tasks
    POST   /tasks
    GET    /tasks/{id}
    PUT    /tasks/{id}
    DELETE /tasks/{id}
    PATCH  /tasks/{id}/status

  Task Comments:
    GET    /tasks/{id}/comments
    POST   /tasks/{id}/comments

  Dashboard:
    GET    /dashboard/summary
    GET    /dashboard/my-summary

  Notifications:
    GET    /notifications
    PATCH  /notifications/{id}/read
    PATCH  /notifications/read-all
```
