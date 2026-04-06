<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            // Add isAccepted (integer, default 0)
            if (!Schema::hasColumn('registrations', 'isAccepted')) {
                $table->integer('isAccepted')->default(0)->after('status');
            }
            
            // Rename college to institution
            if (Schema::hasColumn('registrations', 'college')) {
                $table->renameColumn('college', 'institution');
            }

            // Rename admin_notes to adminNotes
            if (Schema::hasColumn('registrations', 'admin_notes')) {
                $table->renameColumn('admin_notes', 'adminNotes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            if (Schema::hasColumn('registrations', 'isAccepted')) {
                $table->dropColumn('isAccepted');
            }
            if (Schema::hasColumn('registrations', 'institution')) {
                $table->renameColumn('institution', 'college');
            }
            if (Schema::hasColumn('registrations', 'adminNotes')) {
                $table->renameColumn('adminNotes', 'admin_notes');
            }
        });
    }
};
