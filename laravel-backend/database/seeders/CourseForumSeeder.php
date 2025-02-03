<?php

namespace Database\Seeders;

use App\Models\CourseForum;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CourseForumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        CourseForum::factory()  
        ->count(10)
        ->create();
    }
}
