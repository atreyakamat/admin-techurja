<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone', 20);
            $table->string('college')->nullable();
            $table->string('event');
            $table->string('category')->nullable();
            $table->string('utr_number')->nullable()->comment('User Transaction Reference from payment screenshot');
            $table->decimal('amount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending')
                  ->comment('Payment verification status');
            $table->text('admin_notes')->nullable()
                  ->comment('Admin rejection notes, e.g. Blurry screenshot');
            $table->timestamps();

            $table->index('status');
            $table->index('event');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
