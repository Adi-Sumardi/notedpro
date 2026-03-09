<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'manage-users',
            'manage-roles',
            'view-all-meetings',
            'create-meeting',
            'edit-meeting',
            'delete-meeting',
            'create-notes',
            'edit-notes',
            'create-followup',
            'assign-task',
            'view-all-tasks',
            'view-own-tasks',
            'update-task-status',
            'verify-task',
            'view-team-tasks',
            'view-dashboard',
            'view-personal-dashboard',
            'view-hr-report',
            'view-all-work-logs',
            'create-work-log',
            'view-own-work-log',
            'view-team-work-log',
            'review-work-log',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Super Admin — gets all permissions via Gate::before
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);

        // Admin
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions([
            'view-all-meetings',
            'create-meeting',
            'edit-meeting',
            'delete-meeting',
            'create-notes',
            'edit-notes',
            'create-followup',
            'assign-task',
            'view-all-tasks',
            'view-own-tasks',
            'update-task-status',
            'verify-task',
            'view-dashboard',
            'view-personal-dashboard',
            'view-team-work-log',
            'review-work-log',
        ]);

        // Kabag (Kepala Bagian) — verifies team tasks, reviews work logs
        $kabag = Role::firstOrCreate(['name' => 'kabag']);
        $kabag->syncPermissions([
            'view-own-tasks',
            'view-team-tasks',
            'update-task-status',
            'verify-task',
            'view-personal-dashboard',
            'create-work-log',
            'view-own-work-log',
            'view-team-work-log',
            'review-work-log',
        ]);

        // SDM (HR) — monitors all employee performance
        $sdm = Role::firstOrCreate(['name' => 'sdm']);
        $sdm->syncPermissions([
            'view-own-tasks',
            'update-task-status',
            'view-all-tasks',
            'view-all-work-logs',
            'view-dashboard',
            'view-personal-dashboard',
            'view-hr-report',
            'create-work-log',
            'view-own-work-log',
        ]);

        // Manager
        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->syncPermissions([
            'create-work-log',
            'view-own-work-log',
            'view-team-work-log',
            'review-work-log',
            'view-own-tasks',
            'update-task-status',
            'view-personal-dashboard',
        ]);

        // Noter
        $noter = Role::firstOrCreate(['name' => 'noter']);
        $noter->syncPermissions([
            'create-meeting',
            'edit-meeting',
            'create-notes',
            'edit-notes',
            'create-followup',
            'view-own-tasks',
            'view-personal-dashboard',
        ]);

        // Staff
        $staff = Role::firstOrCreate(['name' => 'staff']);
        $staff->syncPermissions([
            'view-own-tasks',
            'update-task-status',
            'view-personal-dashboard',
            'create-work-log',
            'view-own-work-log',
        ]);
    }
}
