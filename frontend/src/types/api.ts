export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  is_active: boolean;
  roles?: string[];
  permissions?: string[];
  created_at: string;
}

export interface ExternalContact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  position: string | null;
  role?: string;
}

export interface Meeting {
  id: number;
  title: string;
  description: string | null;
  meeting_date: string;
  location: string | null;
  location_type: "offline" | "online";
  meeting_link: string | null;
  meeting_passcode: string | null;
  organizer: string | null;
  status: MeetingStatus;
  status_label: string;
  created_by: User;
  participants: (User & { pivot?: { role: string } })[];
  external_participants?: ExternalContact[];
  participants_count?: number;
  external_participants_count?: number;
  follow_ups_count?: number;
  latest_note?: MeetingNote;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingStatus = "draft" | "in_progress" | "completed";

export interface MeetingNote {
  id: number;
  meeting_id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any; // Tiptap JSON
  content_html: string | null;
  version: number;
  created_by: User;
  follow_up_items?: FollowUpItem[];
  created_at: string;
  updated_at: string;
}

export interface FollowUpItem {
  id: number;
  meeting_id: number;
  meeting_note_id: number;
  highlighted_text: string;
  highlight_start: number | null;
  highlight_end: number | null;
  highlight_color: string;
  title: string;
  description: string | null;
  priority: Priority;
  priority_label: string;
  status: FollowUpStatus;
  status_label: string;
  created_by: User;
  tasks?: Task[];
  meeting?: Meeting;
  created_at: string;
}

export type FollowUpStatus = "open" | "assigned" | "done";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  status_label: string;
  priority: Priority;
  priority_label: string;
  deadline: string;
  is_overdue: boolean;
  assigned_to: User;
  assigned_by: User;
  follow_up_item?: FollowUpItem;
  meeting?: Meeting;
  comments?: TaskComment[];
  activities?: TaskActivity[];
  completed_at: string | null;
  created_at: string;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface TaskComment {
  id: number;
  user: User;
  content: string;
  created_at: string;
}

export interface TaskActivity {
  id: number;
  user: User;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface DashboardSummary {
  total_tasks: number;
  by_status: Record<TaskStatus, number>;
  overdue: number;
  due_this_week: number;
  completion_rate: number;
  by_priority?: Record<Priority, number>;
}

// === Work Logs (Laporan Harian) ===

export type WorkLogStatus = "draft" | "submitted" | "approved" | "rejected";

export type WorkCategory =
  | "meeting"
  | "development"
  | "administrative"
  | "research"
  | "communication"
  | "other";

export interface DailyWorkLog {
  id: number;
  log_date: string;
  status: WorkLogStatus;
  status_label: string;
  notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  user: User;
  reviewer: User | null;
  items: WorkLogItem[];
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkLogItem {
  id: number;
  description: string;
  category: WorkCategory;
  category_label: string;
  start_time: string;
  end_time: string;
  progress: number;
}

export interface Notification {
  id: string;
  type: string;
  data: {
    type: string;
    title: string;
    task_id?: number;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
}
