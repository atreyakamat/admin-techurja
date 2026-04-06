<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create 'events' table
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description');
            $table->string('category');
            $table->string('level');
            $table->dateTime('date');
            $table->string('venue');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        // 2. Rebuild 'registrations' table to match Prisma exactly
        // We drop and recreate because the structure is significantly different from the current Laravel default
        Schema::dropIfExists('registrations');
        
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('participant2')->nullable();
            $table->string('email2')->nullable();
            $table->string('phone2')->nullable();
            $table->string('participant3')->nullable();
            $table->string('email3')->nullable();
            $table->string('phone3')->nullable();
            $table->string('participant4')->nullable();
            $table->string('email4')->nullable();
            $table->string('phone4')->nullable();
            $table->string('teamName')->nullable();
            $table->string('email');
            $table->string('phone');
            $table->string('institution');
            $table->string('eventSlug');
            $table->string('eventName');
            $table->string('transactionId')->nullable();
            $table->string('paymentScreenshot')->nullable();
            $table->string('status')->default('pending');
            $table->integer('isAccepted')->default(0);
            $table->text('adminNotes')->nullable();
            $table->boolean('needsAccommodation')->default(false);
            $table->unsignedBigInteger('eventId')->nullable();
            $table->timestamp('createdAt')->useCurrent();

            // Indexes
            $table->index('eventSlug');
            $table->index('email');
            
            // Foreign Key
            $table->foreign('eventId')->references('id')->on('events')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
        Schema::dropIfExists('events');
    }
};
