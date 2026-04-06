<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->integer('isAccepted')->default(0)->after('status');
            $table->renameColumn('college', 'institution');
            $table->renameColumn('admin_notes', 'adminNotes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('isAccepted');
            $table->renameColumn('institution', 'college');
            $table->renameColumn('adminNotes', 'admin_notes');
        });
    }
};
