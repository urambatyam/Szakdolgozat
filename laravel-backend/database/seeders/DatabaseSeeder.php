<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use App\Models\Course;
use App\Models\Grade;
use App\Models\CourseForum;
use App\Models\Curriculum;
use App\Models\Specialization;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teachers = User::factory()->count(4)->create(['role' => 'teacher']);
        $students = User::factory()->count(10)->create(['role' => 'student']);
    
        $courses = Course::factory()->count(20)->create([
            'user_code' => $teachers->random()->code
        ]);
    
        Grade::factory()->count(50)->create([
            'user_code' => $students->random()->code,
            'course_name' => $courses->random()->name
        ]);

        CourseForum::factory()->count(20)->create([
            'user_code' => User::inRandomOrder()->first()->code,
            'course_name' => $courses->random()->name
        ]);

        $curriculum = Curriculum::factory()->create();

        $specializations = Specialization::factory()->count(2)->create([
            'curriculum_id' => $curriculum->id
        ]);

        $categories = collect();
        foreach ($specializations as $specialization) {
            $categories = $categories->merge(Category::factory(2)->create([
                'specialization_id' => $specialization->id
            ]));
        }

        foreach ($categories as $category) {
            $category->courses()->attach(
                $courses->random(rand(2, 5))->pluck('name')->toArray()
            );
        }
 
    }
}
