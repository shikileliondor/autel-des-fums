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
        Schema::create('visuals', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('image_path');
            $table->string('thumb_path');
            // SHA-256 of the removal code kept on the author's device.
            $table->string('token_hash', 64);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visuals');
    }
};
