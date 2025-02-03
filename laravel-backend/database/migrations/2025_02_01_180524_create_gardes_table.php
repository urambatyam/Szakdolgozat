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
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->integer('grade')->unsigned();
            $table->string('course_name');
            $table->foreign('course_name')->references('name')->on('courses')->cascadeOnDelete();
            $table->string('user_code',5);
            $table->foreign('user_code')->references('code')->on('users')->noActionOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gardes');
    }
};
