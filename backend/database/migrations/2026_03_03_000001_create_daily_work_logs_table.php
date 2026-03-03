<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_work_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('log_date');
            $table->string('status')->default('draft');
            $table->text('notes')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('review_comment')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('log_date');
            $table->index('status');
            $table->index(['user_id', 'log_date']);
            $table->index(['status', 'log_date']);
            $table->unique(['user_id', 'log_date', 'deleted_at']);
        });

        Schema::create('work_log_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_log_id')->constrained('daily_work_logs')->cascadeOnDelete();
            $table->text('description');
            $table->string('category');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->timestamps();

            $table->index('daily_work_log_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_log_items');
        Schema::dropIfExists('daily_work_logs');
    }
};
