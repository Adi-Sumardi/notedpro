<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExternalContactController;
use App\Http\Controllers\Api\FollowUpController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\MeetingNoteController;
use App\Http\Controllers\Api\MeetingExternalParticipantController;
use App\Http\Controllers\Api\MeetingParticipantController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TaskCommentController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkLogController;
use Illuminate\Support\Facades\Route;

// All routes require stateful session (cookie + CSRF)
// No public/token-based access

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('web');

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user'])->name('auth.user');

    // API v1
    Route::prefix('v1')->group(function () {

        // Users — list accessible to all authenticated, CRUD restricted
        Route::get('users', [UserController::class, 'index']);
        Route::apiResource('users', UserController::class)
            ->except(['index'])
            ->middleware('permission:manage-users');

        // Meetings
        Route::apiResource('meetings', MeetingController::class);
        Route::patch('meetings/{meeting}/status', [MeetingController::class, 'updateStatus']);
        Route::get('meetings/{meeting}/attachment', [MeetingController::class, 'downloadAttachment']);

        // Meeting Participants
        Route::prefix('meetings/{meeting}')->group(function () {
            Route::get('participants', [MeetingParticipantController::class, 'index']);
            Route::post('participants', [MeetingParticipantController::class, 'store']);
            Route::patch('participants/{userId}', [MeetingParticipantController::class, 'update']);
            Route::delete('participants/{userId}', [MeetingParticipantController::class, 'destroy']);
        });

        // Meeting External Participants
        Route::prefix('meetings/{meeting}')->group(function () {
            Route::post('external-participants', [MeetingExternalParticipantController::class, 'store']);
            Route::put('external-participants/{contactId}', [MeetingExternalParticipantController::class, 'update']);
            Route::delete('external-participants/{contactId}', [MeetingExternalParticipantController::class, 'destroy']);
        });

        // Meeting Notes
        Route::prefix('meetings/{meeting}')->group(function () {
            Route::get('notes', [MeetingNoteController::class, 'index']);
            Route::post('notes', [MeetingNoteController::class, 'store'])
                ->middleware('permission:create-notes');
            Route::put('notes/{note}', [MeetingNoteController::class, 'update'])
                ->middleware('permission:edit-notes');
        });

        // Follow-Up Items
        Route::get('meetings/{meeting}/follow-ups', [FollowUpController::class, 'index']);
        Route::post('meetings/{meeting}/follow-ups', [FollowUpController::class, 'store']);
        Route::put('follow-ups/{followUp}', [FollowUpController::class, 'update']);
        Route::delete('follow-ups/{followUp}', [FollowUpController::class, 'destroy']);

        // Tasks
        Route::apiResource('tasks', TaskController::class);
        Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus']);

        // Task Attachments
        Route::post('tasks/{task}/attachments', [TaskController::class, 'uploadAttachments']);
        Route::delete('task-attachments/{task_attachment}', [TaskController::class, 'deleteAttachment']);
        Route::get('task-attachments/{task_attachment}/download', [TaskController::class, 'downloadAttachment']);

        // Task Comments
        Route::get('tasks/{task}/comments', [TaskCommentController::class, 'index']);
        Route::post('tasks/{task}/comments', [TaskCommentController::class, 'store']);

        // Dashboard
        Route::get('dashboard/summary', [DashboardController::class, 'summary'])
            ->middleware('permission:view-dashboard');
        Route::get('dashboard/my-summary', [DashboardController::class, 'mySummary']);

        // Work Logs (Laporan Harian)
        Route::apiResource('work-logs', WorkLogController::class);
        Route::patch('work-logs/{work_log}/submit', [WorkLogController::class, 'submit']);
        Route::patch('work-logs/{work_log}/review', [WorkLogController::class, 'review']);
        Route::get('work-log-attachments/{attachment}/download', [WorkLogController::class, 'downloadAttachment']);

        // External Contacts
        Route::apiResource('external-contacts', ExternalContactController::class)
            ->except(['show']);

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });
});
