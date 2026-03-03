<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Master table: reusable external contacts
        Schema::create('external_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('organization')->nullable();
            $table->string('position')->nullable();
            $table->timestamps();
        });

        // Pivot table: link meetings to external contacts
        Schema::create('meeting_external_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('external_contact_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('participant');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_external_participants');
        Schema::dropIfExists('external_contacts');
    }
};
