<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->string('teamName')->after('id');
            $table->boolean('needsAccommodation')->default(false)->after('category');

            // Contact cluster for participants
            for ($i = 1; $i <= 4; $i++) {
                $table->string("participant{$i}")->nullable()->after('needsAccommodation');
                $table->string("email{$i}")->nullable()->after("participant{$i}");
                $table->string("phone{$i}", 20)->nullable()->after("email{$i}");
            }
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('teamName');
            $table->dropColumn('needsAccommodation');

            for ($i = 1; $i <= 4; $i++) {
                $table->dropColumn("participant{$i}");
                $table->dropColumn("email{$i}");
                $table->dropColumn("phone{$i}");
            }
        });
    }
};
