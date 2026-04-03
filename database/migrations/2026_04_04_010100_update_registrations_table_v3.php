<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $connection = config('database.default');
        
        if ($connection === 'sqlite') {
            Schema::table('registrations', function (Blueprint $table) {
                if (Schema::hasColumn('registrations', 'utr_number')) {
                    $table->renameColumn('utr_number', 'transactionId');
                }
            });
        } else {
            // MySQL: Use CHANGE COLUMN for compatibility
            if (Schema::hasColumn('registrations', 'utr_number')) {
                DB::statement("ALTER TABLE registrations CHANGE COLUMN utr_number transactionId VARCHAR(255) NULL");
            }
        }
        
        Schema::table('registrations', function (Blueprint $table) {
            if (!Schema::hasColumn('registrations', 'paymentScreenshot')) {
                $table->string('paymentScreenshot')->nullable()->after('amount');
            }
            
            $table->string('status')->default('pending')->change();
        });
    }

    public function down(): void
    {
        $connection = config('database.default');

        if ($connection === 'sqlite') {
            Schema::table('registrations', function (Blueprint $table) {
                if (Schema::hasColumn('registrations', 'transactionId')) {
                    $table->renameColumn('transactionId', 'utr_number');
                }
            });
        } else {
            if (Schema::hasColumn('registrations', 'transactionId')) {
                DB::statement("ALTER TABLE registrations CHANGE COLUMN transactionId utr_number VARCHAR(255) NULL");
            }
        }

        Schema::table('registrations', function (Blueprint $table) {
            if (Schema::hasColumn('registrations', 'paymentScreenshot')) {
                $table->dropColumn('paymentScreenshot');
            }
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending')->change();
        });
    }
};
