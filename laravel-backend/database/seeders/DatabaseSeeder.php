<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use App\Models\Course;
use App\Models\Grade;
use App\Models\CourseForum;
use App\Models\Curriculum;
use App\Models\Specialization;
use App\Models\SubjectMatter;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $curriculum = Curriculum::factory()->create();

        $admin = User::factory()->create(['role' => 'admin']);
        $teachers = User::factory()->count(4)->create(['role' => 'teacher']);
        $students = User::factory()->count(10)->create(['role' => 'student', 'curriculum_id' => $curriculum->id]);
    
        $courses = Course::factory()->count(20)->create([
            'user_code' => $teachers->random()->code
        ]);
        foreach($courses as $course){
            SubjectMatter::factory()->create([
                'course_id' => $course->id
            ]);
        }

        

        foreach($students as $student){
            $randomCurese = $courses->random();
            $randomCureseSemester = $randomCurese->sezon;
            if($randomCureseSemester === null){
                $randomCureseSemester = rand(0,1);
            }
            Grade::factory()->count(10)->create([
                'user_code' => $student->code,
                'course_id' => $randomCurese->id,
                'sezon' => $randomCureseSemester,
            ]);
        }
 

        CourseForum::factory()->count(20)->create([
            'user_code' => User::inRandomOrder()->first()->code,
            'course_id' => $courses->random()->id
        ]);

        

        $specializations = Specialization::factory()->count(2)->create([
            'curriculum_id' => $curriculum->id
        ]);

        $categories = collect();
        
        foreach ($specializations as $specialization) {
            $categories = $categories->merge(Category::factory(2)->create([
                'specialization_id' => $specialization->id,
            ]));
        }
        foreach ($categories as $category) {
            $c = $courses->random(rand(2, 5));
            $category->max = $c->sum('kredit');
            $category->min =  $category->max - rand(0,$category->max);
            $category->save(); 
            $category->courses()->attach(
                $c->pluck('id')->toArray() 
            );
        }    
        
        foreach ($specializations as $specialization) {
            foreach($categories as $category){
                if($specialization->id === $category->specialization_id){
                    $specialization->min += $category->min;
                }
            }
            $specialization->save();
        }
 
    }
}
