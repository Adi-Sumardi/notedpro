<?php

namespace Database\Seeders;

use App\Models\FollowUpItem;
use App\Models\Meeting;
use App\Models\MeetingNote;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create users
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@notedpro.com',
            'password' => Hash::make('password'),
            'position' => 'System Administrator',
            'department' => 'IT',
        ]);
        $superAdmin->assignRole('super-admin');

        $admin = User::create([
            'name' => 'Adi Manager',
            'email' => 'admin@notedpro.com',
            'password' => Hash::make('password'),
            'position' => 'Project Manager',
            'department' => 'Management',
        ]);
        $admin->assignRole('admin');

        $noter = User::create([
            'name' => 'Sari Notulis',
            'email' => 'noter@notedpro.com',
            'password' => Hash::make('password'),
            'position' => 'Secretary',
            'department' => 'Admin',
        ]);
        $noter->assignRole('noter');

        $staff1 = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@notedpro.com',
            'password' => Hash::make('password'),
            'position' => 'Staff Finance',
            'department' => 'Finance',
        ]);
        $staff1->assignRole('staff');

        $staff2 = User::create([
            'name' => 'Dewi Lestari',
            'email' => 'dewi@notedpro.com',
            'password' => Hash::make('password'),
            'position' => 'Staff Marketing',
            'department' => 'Marketing',
        ]);
        $staff2->assignRole('staff');

        $staff3 = User::create([
            'name' => 'Andi Pratama',
            'email' => 'andi@notedpro.com',
            'password' => Hash::make('password'),
            'position' => 'Staff IT',
            'department' => 'IT',
        ]);
        $staff3->assignRole('staff');

        $kabag = User::create([
            'name' => 'Rizky Kabag',
            'email' => 'kabag@notedpro.com',
            'password' => Hash::make('password'),
            'position' => 'Kepala Bagian',
            'department' => 'Management',
        ]);
        $kabag->assignRole('kabag');

        $sdm = User::create([
            'name' => 'Maya SDM',
            'email' => 'sdm@notedpro.com',
            'password' => Hash::make('password'),
            'position' => 'Staff SDM',
            'department' => 'SDM',
        ]);
        $sdm->assignRole('sdm');

        // Create meetings
        $meeting1 = Meeting::create([
            'title' => 'Weekly Standup Sprint 10',
            'description' => 'Review progress sprint 10 dan planning sprint 11',
            'meeting_date' => now()->subDays(2),
            'location' => 'Ruang Meeting Lantai 3',
            'created_by' => $admin->id,
            'status' => 'completed',
        ]);

        $meeting1->participants()->attach([
            $admin->id => ['role' => 'host'],
            $noter->id => ['role' => 'noter'],
            $staff1->id => ['role' => 'participant'],
            $staff2->id => ['role' => 'participant'],
            $staff3->id => ['role' => 'participant'],
        ]);

        $meeting2 = Meeting::create([
            'title' => 'Budget Review Q1 2026',
            'description' => 'Review budget Q1 dan planning Q2',
            'meeting_date' => now()->subDay(),
            'location' => 'Ruang Direksi',
            'created_by' => $admin->id,
            'status' => 'completed',
        ]);

        $meeting2->participants()->attach([
            $admin->id => ['role' => 'host'],
            $noter->id => ['role' => 'noter'],
            $staff1->id => ['role' => 'participant'],
        ]);

        // Meeting Notes
        $note1 = MeetingNote::create([
            'meeting_id' => $meeting1->id,
            'content' => json_decode('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Rapat dimulai pukul 09:00. Pak Adi membuka rapat dengan review progress sprint 10."}]},{"type":"paragraph","content":[{"type":"text","text":"Tim development sudah menyelesaikan 80% fitur yang direncanakan. Sisa 20% perlu diselesaikan minggu depan."}]},{"type":"paragraph","content":[{"type":"text","text":"Budget untuk infrastruktur cloud perlu direvisi karena ada penambahan server untuk staging environment."}]},{"type":"paragraph","content":[{"type":"text","text":"Tim marketing perlu menyiapkan materi promosi untuk launching produk bulan depan."}]},{"type":"paragraph","content":[{"type":"text","text":"Andi dari tim IT akan melakukan security audit sebelum deployment ke production."}]}]}', true),
            'content_html' => '<p>Rapat dimulai pukul 09:00. Pak Adi membuka rapat dengan review progress sprint 10.</p><p>Tim development sudah menyelesaikan 80% fitur yang direncanakan. Sisa 20% perlu diselesaikan minggu depan.</p><p>Budget untuk infrastruktur cloud perlu direvisi karena ada penambahan server untuk staging environment.</p><p>Tim marketing perlu menyiapkan materi promosi untuk launching produk bulan depan.</p><p>Andi dari tim IT akan melakukan security audit sebelum deployment ke production.</p>',
            'version' => 1,
            'created_by' => $noter->id,
        ]);

        // Follow-up items
        $followUp1 = FollowUpItem::create([
            'meeting_id' => $meeting1->id,
            'meeting_note_id' => $note1->id,
            'highlighted_text' => 'Budget untuk infrastruktur cloud perlu direvisi karena ada penambahan server untuk staging environment',
            'highlight_start' => 200,
            'highlight_end' => 300,
            'title' => 'Revisi Budget Infrastruktur Cloud',
            'description' => 'Revisi budget cloud karena penambahan server staging',
            'priority' => 'high',
            'status' => 'assigned',
            'created_by' => $noter->id,
        ]);

        $followUp2 = FollowUpItem::create([
            'meeting_id' => $meeting1->id,
            'meeting_note_id' => $note1->id,
            'highlighted_text' => 'Tim marketing perlu menyiapkan materi promosi untuk launching produk bulan depan',
            'highlight_start' => 310,
            'highlight_end' => 395,
            'title' => 'Siapkan Materi Promosi Launching',
            'description' => 'Materi promosi untuk launching produk bulan depan',
            'priority' => 'medium',
            'status' => 'assigned',
            'created_by' => $noter->id,
        ]);

        $followUp3 = FollowUpItem::create([
            'meeting_id' => $meeting1->id,
            'meeting_note_id' => $note1->id,
            'highlighted_text' => 'Andi dari tim IT akan melakukan security audit sebelum deployment ke production',
            'highlight_start' => 400,
            'highlight_end' => 478,
            'title' => 'Security Audit Pre-Deployment',
            'description' => 'Lakukan security audit sebelum deploy ke production',
            'priority' => 'urgent',
            'status' => 'assigned',
            'created_by' => $noter->id,
        ]);

        // Tasks
        $task1 = Task::create([
            'follow_up_item_id' => $followUp1->id,
            'assigned_to' => $staff1->id,
            'assigned_by' => $admin->id,
            'title' => 'Revisi Budget Infrastruktur Cloud',
            'description' => 'Buat revisi budget untuk penambahan server staging environment',
            'status' => 'in_progress',
            'priority' => 'high',
            'deadline' => now()->addDays(3),
        ]);

        $task2 = Task::create([
            'follow_up_item_id' => $followUp2->id,
            'assigned_to' => $staff2->id,
            'assigned_by' => $admin->id,
            'title' => 'Siapkan Materi Promosi Launching',
            'description' => 'Desain materi promosi untuk launching produk',
            'status' => 'todo',
            'priority' => 'medium',
            'deadline' => now()->addDays(7),
        ]);

        $task3 = Task::create([
            'follow_up_item_id' => $followUp3->id,
            'assigned_to' => $staff3->id,
            'assigned_by' => $admin->id,
            'title' => 'Security Audit Pre-Deployment',
            'description' => 'Lakukan penetration testing dan security review',
            'status' => 'in_progress',
            'priority' => 'urgent',
            'deadline' => now()->addDays(2),
        ]);

        // Create an overdue task for demo
        $followUp4 = FollowUpItem::create([
            'meeting_id' => $meeting2->id,
            'meeting_note_id' => $note1->id,
            'highlighted_text' => 'Laporan keuangan Q1 harus segera diselesaikan',
            'highlight_start' => 0,
            'highlight_end' => 50,
            'title' => 'Selesaikan Laporan Keuangan Q1',
            'priority' => 'high',
            'status' => 'assigned',
            'created_by' => $noter->id,
        ]);

        Task::create([
            'follow_up_item_id' => $followUp4->id,
            'assigned_to' => $staff1->id,
            'assigned_by' => $admin->id,
            'title' => 'Selesaikan Laporan Keuangan Q1',
            'description' => 'Laporan harus mencakup semua pengeluaran dan pemasukan Q1',
            'status' => 'in_progress',
            'priority' => 'high',
            'deadline' => now()->subDay(), // overdue
        ]);

        // Task activities
        TaskActivity::create([
            'task_id' => $task1->id,
            'user_id' => $staff1->id,
            'action' => 'status_changed',
            'old_value' => 'todo',
            'new_value' => 'in_progress',
        ]);

        TaskActivity::create([
            'task_id' => $task3->id,
            'user_id' => $staff3->id,
            'action' => 'status_changed',
            'old_value' => 'todo',
            'new_value' => 'in_progress',
        ]);

        // Task comments
        TaskComment::create([
            'task_id' => $task1->id,
            'user_id' => $staff1->id,
            'content' => 'Sudah mulai kalkulasi ulang, estimasi selesai besok siang.',
        ]);

        TaskComment::create([
            'task_id' => $task3->id,
            'user_id' => $staff3->id,
            'content' => 'Sedang running OWASP ZAP scan, hasilnya akan saya share setelah selesai.',
        ]);
    }
}
