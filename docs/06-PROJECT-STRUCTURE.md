# Project Structure & Tech Stack Guide
# NotedPro Kolaborasi

---

## 1. Monorepo Structure

```
notedpro-kolaborasi/
├── docs/                          # Documentation (BRD, Architecture, etc.)
│
├── backend/                       # Laravel 12 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/
│   │   │   │       ├── AuthController.php
│   │   │   │       ├── MeetingController.php
│   │   │   │       ├── MeetingNoteController.php
│   │   │   │       ├── FollowUpController.php
│   │   │   │       ├── TaskController.php
│   │   │   │       ├── DashboardController.php
│   │   │   │       ├── NotificationController.php
│   │   │   │       └── UserController.php
│   │   │   ├── Middleware/
│   │   │   │   └── EnsureUserIsActive.php
│   │   │   ├── Requests/
│   │   │   │   ├── Meeting/
│   │   │   │   │   ├── StoreMeetingRequest.php
│   │   │   │   │   └── UpdateMeetingRequest.php
│   │   │   │   ├── FollowUp/
│   │   │   │   │   └── StoreFollowUpRequest.php
│   │   │   │   └── Task/
│   │   │   │       ├── StoreTaskRequest.php
│   │   │   │       └── UpdateTaskStatusRequest.php
│   │   │   └── Resources/
│   │   │       ├── MeetingResource.php
│   │   │       ├── MeetingNoteResource.php
│   │   │       ├── FollowUpResource.php
│   │   │       ├── TaskResource.php
│   │   │       └── UserResource.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Meeting.php
│   │   │   ├── MeetingParticipant.php
│   │   │   ├── MeetingNote.php
│   │   │   ├── FollowUpItem.php
│   │   │   ├── Task.php
│   │   │   ├── TaskComment.php
│   │   │   └── TaskActivity.php
│   │   ├── Policies/
│   │   │   ├── MeetingPolicy.php
│   │   │   ├── FollowUpPolicy.php
│   │   │   └── TaskPolicy.php
│   │   ├── Services/
│   │   │   ├── MeetingService.php
│   │   │   ├── FollowUpService.php
│   │   │   ├── TaskService.php
│   │   │   └── DashboardService.php
│   │   ├── Notifications/
│   │   │   ├── TaskAssigned.php
│   │   │   ├── TaskStatusChanged.php
│   │   │   └── DeadlineApproaching.php
│   │   ├── Observers/
│   │   │   └── TaskObserver.php
│   │   └── Enums/
│   │       ├── MeetingStatus.php
│   │       ├── TaskStatus.php
│   │       ├── Priority.php
│   │       └── ParticipantRole.php
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 0001_create_users_table.php
│   │   │   ├── 0002_create_permission_tables.php
│   │   │   ├── 0003_create_meetings_table.php
│   │   │   ├── 0004_create_meeting_participants_table.php
│   │   │   ├── 0005_create_meeting_notes_table.php
│   │   │   ├── 0006_create_follow_up_items_table.php
│   │   │   ├── 0007_create_tasks_table.php
│   │   │   ├── 0008_create_task_comments_table.php
│   │   │   ├── 0009_create_task_activities_table.php
│   │   │   └── 0010_create_notifications_table.php
│   │   ├── seeders/
│   │   │   ├── DatabaseSeeder.php
│   │   │   ├── RolePermissionSeeder.php
│   │   │   └── DemoDataSeeder.php
│   │   └── factories/
│   ├── routes/
│   │   ├── api.php                # API routes
│   │   └── web.php                # Sanctum CSRF route
│   ├── config/
│   │   ├── cors.php
│   │   ├── sanctum.php
│   │   └── permission.php
│   ├── tests/
│   │   ├── Feature/
│   │   │   ├── Auth/
│   │   │   ├── Meeting/
│   │   │   ├── FollowUp/
│   │   │   ├── Task/
│   │   │   └── Dashboard/
│   │   └── Unit/
│   ├── .env.example
│   ├── composer.json
│   └── phpunit.xml
│
├── frontend/                      # Next.js 14 App
│   ├── public/
│   │   ├── icons/                 # PWA icons (192x192, 512x512)
│   │   ├── manifest.json          # PWA manifest
│   │   └── sw.js                  # Service worker
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx     # Sidebar + Header layout
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx   # Dashboard overview
│   │   │   │   ├── meetings/
│   │   │   │   │   ├── page.tsx          # Meeting list
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx      # Create meeting
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx      # Meeting detail
│   │   │   │   │       └── notes/
│   │   │   │   │           └── page.tsx  # Note editor
│   │   │   │   ├── tasks/
│   │   │   │   │   ├── page.tsx          # All tasks / Kanban
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx      # Task detail
│   │   │   │   ├── my-tasks/
│   │   │   │   │   └── page.tsx          # Personal tasks (staff)
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx          # User management
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx      # User detail
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── page.tsx           # Landing / redirect
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── MobileNav.tsx
│   │   │   │   └── NotificationBell.tsx
│   │   │   ├── meeting/
│   │   │   │   ├── MeetingForm.tsx
│   │   │   │   ├── MeetingList.tsx
│   │   │   │   ├── MeetingCard.tsx
│   │   │   │   └── ParticipantSelect.tsx
│   │   │   ├── editor/
│   │   │   │   ├── TiptapEditor.tsx        # Main editor
│   │   │   │   ├── FollowUpTooltip.tsx     # Popup saat blok teks
│   │   │   │   ├── FollowUpMark.tsx        # Custom Tiptap mark
│   │   │   │   ├── FollowUpModal.tsx       # Form buat follow-up
│   │   │   │   ├── EditorToolbar.tsx       # Toolbar editor
│   │   │   │   └── extensions/
│   │   │   │       └── follow-up.ts        # Custom Tiptap extension
│   │   │   ├── followup/
│   │   │   │   ├── FollowUpTable.tsx
│   │   │   │   ├── FollowUpItem.tsx
│   │   │   │   └── AssignTaskModal.tsx
│   │   │   ├── task/
│   │   │   │   ├── TaskTable.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   ├── TaskDetail.tsx
│   │   │   │   ├── TaskStatusBadge.tsx
│   │   │   │   ├── TaskKanban.tsx
│   │   │   │   └── TaskFilters.tsx
│   │   │   └── dashboard/
│   │   │       ├── SummaryCards.tsx
│   │   │       ├── TaskChart.tsx
│   │   │       └── OverdueAlert.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useMeetings.ts
│   │   │   ├── useFollowUps.ts
│   │   │   ├── useTasks.ts
│   │   │   ├── useDashboard.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── usePermission.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance + interceptors
│   │   │   ├── auth.ts             # Auth helpers
│   │   │   └── utils.ts            # Utility functions
│   │   │
│   │   ├── stores/
│   │   │   ├── authStore.ts        # Zustand auth store
│   │   │   ├── meetingStore.ts
│   │   │   └── notificationStore.ts
│   │   │
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── meeting.ts
│   │   │   ├── follow-up.ts
│   │   │   ├── task.ts
│   │   │   └── api.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css         # Tailwind + custom styles
│   │
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.local.example
│
└── docker-compose.yml             # Local development (optional)
```

---

## 2. Environment Configuration

### Backend `.env`
```env
APP_NAME=NotedPro
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=notedpro
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000

QUEUE_CONNECTION=database
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=NotedPro Kolaborasi
```

---

## 3. Key Package Dependencies

### Backend (`composer.json`)
```json
{
    "require": {
        "php": "^8.3",
        "laravel/framework": "^12.0",
        "laravel/sanctum": "^4.0",
        "spatie/laravel-permission": "^6.0"
    },
    "require-dev": {
        "laravel/pint": "^1.0",
        "pestphp/pest": "^3.0"
    }
}
```

### Frontend (`package.json`)
```json
{
    "dependencies": {
        "next": "^14.0",
        "react": "^18.0",
        "react-dom": "^18.0",
        "@tiptap/react": "^2.0",
        "@tiptap/starter-kit": "^2.0",
        "@tiptap/extension-highlight": "^2.0",
        "@tanstack/react-query": "^5.0",
        "zustand": "^4.0",
        "axios": "^1.0",
        "tailwindcss": "^3.0",
        "@dnd-kit/core": "^6.0",
        "lucide-react": "latest",
        "next-pwa": "^5.0",
        "date-fns": "^3.0",
        "zod": "^3.0",
        "react-hook-form": "^7.0",
        "@hookform/resolvers": "^3.0"
    },
    "devDependencies": {
        "typescript": "^5.0",
        "@types/react": "^18.0",
        "@types/node": "^20.0"
    }
}
```

---

## 4. PWA Configuration

### `manifest.json`
```json
{
    "name": "NotedPro Kolaborasi",
    "short_name": "NotedPro",
    "description": "Meeting Notes & Follow-Up Management",
    "start_url": "/dashboard",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#1e40af",
    "orientation": "any",
    "icons": [
        {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        },
        {
            "src": "/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
        }
    ]
}
```

---

## 5. Tiptap Custom Extension (Highlight-to-Follow-Up)

### Konsep Implementasi

```typescript
// extensions/follow-up.ts — Simplified concept

import { Mark } from '@tiptap/core'

export const FollowUpMark = Mark.create({
    name: 'followUp',

    addAttributes() {
        return {
            followUpId: { default: null },
            color: { default: '#FEF08A' },
        }
    },

    // Render sebagai <mark> dengan data-attribute
    renderHTML({ HTMLAttributes }) {
        return ['mark', {
            class: 'follow-up-highlight',
            style: `background-color: ${HTMLAttributes.color}`,
            'data-follow-up-id': HTMLAttributes.followUpId,
        }, 0]
    },
})
```

### Flow di Editor:
1. User seleksi teks → `editor.state.selection` captured
2. Muncul floating tooltip "Buat Follow-Up"
3. Klik → open modal, pre-fill `highlighted_text`
4. Submit → POST ke API → dapat `follow_up_id`
5. Apply `FollowUpMark` ke selection dengan `followUpId`
6. Save document (Tiptap JSON) ke API
7. Teks muncul berwarna kuning + clickable

---

## 6. Real-Time Strategy

### Phase 1: Polling (TanStack Query)
```typescript
// hooks/useTasks.ts
export function useTasks(filters) {
    return useQuery({
        queryKey: ['tasks', filters],
        queryFn: () => api.get('/tasks', { params: filters }),
        refetchInterval: 5000,  // Poll setiap 5 detik
    })
}
```

### Phase 2 (Future): WebSocket
- Laravel Reverb / Pusher
- Broadcast events: `TaskStatusUpdated`, `NewTaskAssigned`
- Frontend listen via Echo

---

## 7. Security Checklist

| Item | Implementation |
|------|---------------|
| Authentication | Sanctum cookie-based SPA auth |
| Authorization | Spatie Permission + Laravel Policies |
| Input Validation | FormRequest classes |
| CSRF | Sanctum CSRF token |
| CORS | Configured for frontend domain only |
| Rate Limiting | Laravel built-in throttle middleware |
| XSS | Tiptap sanitizes HTML, React escapes by default |
| SQL Injection | Eloquent ORM (parameterized queries) |
| Soft Delete | Meetings, Tasks, Follow-ups use soft delete |
