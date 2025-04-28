<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\User;
use App\Models\CoursePrerequisite;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log; 

class GradeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = User::where('role', 'student')->get(); 
        if ($students->isEmpty()) {
            return;
        }

        foreach($students as $student){ 
            $coursesForStudent = []; 
            $completedCourseIds = []; 
            $curriculum = $student->curriculum; 
            if($curriculum){
                $curriculum->load(['specializations.categories.courses']);
                foreach($curriculum->specializations as $specialization){
                    foreach($specialization->categories as $category){
                        foreach($category->courses as $course){
                            $coursesForStudent[$course->id] = $course;
                        }
                    }
                }
                if (empty($coursesForStudent)) {
                     continue; 
                }
            }
            $shuffledCourseIds = array_keys($coursesForStudent);
            shuffle($shuffledCourseIds);
            $gradesCreatedCount = 0; 
            foreach($shuffledCourseIds as $courseId){
                if ($gradesCreatedCount >= 20) {
                    break; 
                }
                $course = $coursesForStudent[$courseId];
                $prerequisiteIds = CoursePrerequisite::where('course_id', $course->id)
                    ->whereNotNull('prerequisite_course_id') 
                    ->pluck('prerequisite_course_id')
                    ->all();
                if(in_array($course->id, $completedCourseIds)){
                    continue;
                }
                $prerequisitesMet = true;
                if (!empty($prerequisiteIds)) {
                    $missingPrerequisites = array_diff($prerequisiteIds, $completedCourseIds);
                    if (!empty($missingPrerequisites)) {
                        $prerequisitesMet = false;
                    }
                }
                if ($prerequisitesMet) {
                    try {
                        Grade::factory()->create([
                            'user_code' => $student->code, 
                            'course_id' => $course->id,
                            'sezon' => $course->sezon ?? fake()->boolean(), 
                        ]);
                        $completedCourseIds[] = $course->id; 
                        $gradesCreatedCount++; 
                    } catch (\Exception $e) {
                        Log::error("Hiba a jegy létrehozásakor (Diák: {$student->code}, Kurzus: {$course->id}): " . $e->getMessage());
                    }
                }
            }
        }
    }
}
