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
            'view-dashboard',
            'view-personal-dashboard',
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
        $admin->givePermissionTo([
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
            'view-dashboard',
            'view-personal-dashboard',
            'view-team-work-log',
            'review-work-log',
        ]);

        // Manager
        $manager = Role::firstOrCreate(['name' => 'manager']);
        $manager->givePermissionTo([
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
        $noter->givePermissionTo([
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
        $staff->givePermissionTo([
            'view-own-tasks',
            'update-task-status',
            'view-personal-dashboard',
            'create-work-log',
            'view-own-work-log',
        ]);
    }
}
