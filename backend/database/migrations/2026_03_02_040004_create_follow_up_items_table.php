<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follow_up_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meeting_note_id')->constrained('meeting_notes')->cascadeOnDelete();
            $table->text('highlighted_text')->comment('Teks yang diblok user');
            $table->unsignedInteger('highlight_start')->nullable()->comment('Posisi awal di document');
            $table->unsignedInteger('highlight_end')->nullable()->comment('Posisi akhir di document');
            $table->string('highlight_color', 20)->default('#FEF08A');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority')->default('medium');
            $table->string('status')->default('open');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('meeting_id');
            $table->index('status');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follow_up_items');
    }
};
