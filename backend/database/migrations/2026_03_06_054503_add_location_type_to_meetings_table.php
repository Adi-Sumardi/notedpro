<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->string('location_type', 10)->default('offline')->after('location');
            $table->string('meeting_link')->nullable()->after('location_type');
            $table->string('meeting_passcode')->nullable()->after('meeting_link');
        });
    }

    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropColumn(['location_type', 'meeting_link', 'meeting_passcode']);
        });
    }
};
