<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use App\Models\Curriculum;
use App\Services\CourseOptimizationBnBService;
use App\Services\CourseOptimizationService;
use Illuminate\Support\Facades\Auth;
use MathPHP\Statistics\Average;
use MathPHP\Statistics\Descriptive;
use MathPHP\Statistics\Regression;
use MathPHP\Statistics\Distribution;
use App\Models\Grade;

class CalculusController extends Controller
{
    public function optimalizeByBnB(Request $request){
        $history = [];
   
        $values = $request->validate([
            'curriculum_id' => 'required|exists:curricula,id',
            'creditLimit' => 'required|integer|min:1',
            'selectedSpecializationIds' => 'required|array',
            'considerRecommendations' => 'required|boolean',
            'negativIds' => 'array',
            'pozitivIds' => 'array',
        ]);
        $startWith = now()->month >= 9 ? true : false;
        $pozitivCoursesData = [];
        foreach ($values['pozitivIds'] as $pId) {
            $course = Course::find($pId);
            if ($course) { // Ellenőrizzük, hogy létezik-e a kurzus
                $courseCategories = $course->categories()->pluck('category_id')->toArray();
                $allCoursePreRequisites = $course->prerequisites()->pluck('prerequisite_course_id')->toArray();
                $pozitivCoursesData[$pId] = [ // Közvetlenül a cél tömbbe tesszük, ID-val indexelve
                    'id' => $course->id,
                    'name' => $course->name,
                    'kredit' => $course->kredit,
                    'recommendedSemester' => $course->recommendedSemester,
                    'sezon' => $course->sezon,
                    'categories' => $courseCategories,
                    // Adjunk hozzá egy 'efficiency'-t is, ha később hasznos lehet
                    'efficiency' => ($course->kredit * count($courseCategories)),
                    // Adjunk hozzá előkövetelményeket is
                    'prerequisites' => $allCoursePreRequisites
                ];
            }
        }

        $curriculum = Curriculum::find($values['curriculum_id']);
        $curriculum->load('specializations.categories.courses');
        $optimizer = new CourseOptimizationBnBService($curriculum, $values['creditLimit']);
        if(Auth::check() && Auth::user()->role == 'student'){
            /** @var User $student */
            $student = Auth::user();
            $allgrade = $student->grades()->where('grade','!=',1)->orderby('year','asc')->orderby('sezon','desc')->select('grade','sezon','year','course_id')->get();
            $history = $this->makeHistory($allgrade);
            $optimizedPlan = $optimizer->generateOptimalPlan(
                $values['selectedSpecializationIds'],
                true,
                $values['considerRecommendations'],
                $history,
                $values['negativIds'],
                $pozitivCoursesData,
            );
            
        }else{
            $optimizedPlan = $optimizer->generateOptimalPlan(
                $values['selectedSpecializationIds'],
                true,
                $values['considerRecommendations'],
                [],
                $values['negativIds'],
                $pozitivCoursesData,
            );
        }
        $creditsBreakdown = $optimizer->getCreditsBreakdown($optimizedPlan);
        return [
            "optimizedPlan" => $optimizedPlan,
            "creditsBreakdown" => $creditsBreakdown,
            
            ];
    }

    public function optimalizeByGreedy(Request $request){
        $startWith = now()->month >= 9 ? true : false;
        $pozitivCoursesData = [];
        $history = [];
        $values = $request->validate([
            'curriculum_id' => 'required|exists:curricula,id',
            'creditLimit' => 'required|integer|min:1',
            'selectedSpecializationIds' => 'required|array',
            'considerRecommendations' => 'required|boolean',
            'negativIds' => 'array',
            'pozitivIds' => 'array',
        ]);
        $nagativ = $values['negativIds'];
        $pozitiv = $values['pozitivIds'];
        
        foreach ($pozitiv as $pId) {
            $course = Course::find($pId);
            if ($course) { // Ellenőrizzük, hogy létezik-e a kurzus
                $courseCategories = $course->categories()->pluck('category_id')->toArray();
                $allCoursePreRequisites = $course->prerequisites()->pluck('prerequisite_course_id')->toArray();
                $pozitivCoursesData[$pId] = [ // Közvetlenül a cél tömbbe tesszük, ID-val indexelve
                    'id' => $course->id,
                    'name' => $course->name,
                    'kredit' => $course->kredit,
                    'recommendedSemester' => $course->recommendedSemester,
                    'sezon' => $course->sezon,
                    'categories' => $courseCategories,
                    // Adjunk hozzá egy 'efficiency'-t is, ha később hasznos lehet
                    'efficiency' => ($course->kredit * count($courseCategories)),
                    // Adjunk hozzá előkövetelményeket is
                    'prerequisites' => $allCoursePreRequisites
                ];
            }
        }



        // Tanterv betöltése a kapcsolatokkal együtt
        $curriculum = Curriculum::find($values['curriculum_id']); 
        $curriculum->load('specializations.categories.courses');
        
        // Service példányosítása, 30 kredittel/félév
        $optimizer = new CourseOptimizationService($curriculum, $values['creditLimit']);
        
        // Tanterv generálása, kezdés ősszel
        if(Auth::check() && Auth::user()->role == 'student'){
            /** @var User $student */
            $student = Auth::user();
            $allgrade = $student->grades()->where('grade','!=',1)->orderby('year','asc')->orderby('sezon','desc')->select('grade','sezon','year','course_id')->get();
            $history = $this->makeHistory($allgrade);
            $studyPlan = $optimizer->generateOptimalPlan(
                $values['selectedSpecializationIds'],
                true,
                $values['considerRecommendations'],
                $history,
                $nagativ,
                $pozitivCoursesData,
            );
        }else{
            $studyPlan = $optimizer->generateOptimalPlan(
                $values['selectedSpecializationIds'],
                true,
                $values['considerRecommendations'], 
                [],
                $nagativ,
                $pozitivCoursesData,
            );
        }
   
        $creditsBreakdown = $optimizer->getCreditsBreakdown($studyPlan);
        return [
            "optimizedPlan" => $studyPlan,
            "creditsBreakdown" => $creditsBreakdown,
            ]; 
    }

    private function makeHistory($allgrade): array
    {
        $history = [];
        if (empty($allgrade)) {
            return $history;
        }

        $currentYear = now()->year;
        $currentSemester = now()->month >= 9 ? true : false; // true for fall, false for spring
        $lastSemester = (object) ["s" => -1, "y" => -1, "f" => 1]; // s: semester index, y: year, f: fall (1) or spring (0)
        $hasCurrentSemesterGrades = false;

        // First, process existing grades to build the initial history
        foreach ($allgrade as $grade) {
            if ($grade->year > $lastSemester->y) {
                $lastSemester->y = $grade->year;
                $lastSemester->f = $grade->sezon;
                $lastSemester->s++;
            } elseif ($grade->sezon < $lastSemester->f) {
                $lastSemester->f = $grade->sezon;
                $lastSemester->s++;
            }
            if ($grade->year == $currentYear && $grade->sezon == $currentSemester) {
                $hasCurrentSemesterGrades = true;
            }

            $history[$lastSemester->s]['is_fall'] = $lastSemester->f ? true : false;
            $history[$lastSemester->s]['year'] = $grade->year;
            $history[$lastSemester->s]['courses'][] = $grade->course_id;
        }

        // Determine the last recorded semester
        $lastRecordedYear = $lastSemester->y;
        $lastRecordedSemesterIsFall = $lastSemester->f;

        // Add empty semesters if there are gaps
        while (true) {
            // Move to the next semester
            $lastSemester->s++;
            $lastRecordedSemesterIsFall = !$lastRecordedSemesterIsFall;
            if (!$lastRecordedSemesterIsFall) {
                $lastRecordedYear++;
            }

            // Check if we've reached the current semester
            if ($lastRecordedYear == $currentYear && $lastRecordedSemesterIsFall == $currentSemester) {
                if ($hasCurrentSemesterGrades) {
                    $history[$lastSemester->s]['is_fall'] = $lastRecordedSemesterIsFall;
                    $history[$lastSemester->s]['courses'] = [];
                }
                break;
            }

            // Check if we've gone past the current semester
            if ($lastRecordedYear > $currentYear || ($lastRecordedYear == $currentYear && $lastRecordedSemesterIsFall > $currentSemester)) {
                break;
            }

            // Add an empty semester to the history
            $history[$lastSemester->s]['is_fall'] = $lastRecordedSemesterIsFall;
            $history[$lastSemester->s]['courses'] = [];
        }

        return $history;
    }



    public function coursecompletionRate(int $course_id){
        $grades = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->get();
      
        $result = [
            "completed" => 0,
            "failed" =>0,
            "absent" => 0
        ];
        foreach($grades as $item){
            switch($item->grade){
                case 1:
                    $result['failed']++;
                    break;
                case 2:
                case 3:
                case 4:
                case 5:
                    $result['completed']++;
                    break;
                default:
                    $result['absent']++;
                    break;
            }
        }
        return $result;
    }

    public function courseDistribution(int $course_id){
        $data = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->where('grade','!=', null)->select('grade','year','sezon')->get();
        $grades = $data->pluck('grade')->values()->all();
        $semesters = [];
        foreach($data as $d){
            $key = $d['year'].'-'.($d['sezon'] ? 1:2);
            if(!isset($semesters[$key])){
                $semesters[$key] = [
                    'grades' => [],
                ];
            }
            $semesters[$key]['grades'][] = $d['grade'];
        }
        foreach($semesters as $key => $grade){
            $semesters[$key]['distribution'] = Distribution::frequency($grade['grades']);
            unset($semesters[$key]['grades']);
        }
        $result = [
            "distribution" => Distribution::frequency($grades),
            "semesters" => $semesters
        ];

        return response()->json(
            $result,200
         );
    }

    public function courseLinearRegression(int $course_id){
        $data = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->get();
        $semesters = [];
        foreach($data as $d){
            $key = $d['year'].'-'.($d['sezon'] ? 1:2);
            if(!isset($semesters[$key])){
                $semesters[$key] = [
                    'grades' => [],
                ];
            }
            $semesters[$key]['grades'][] = $d['grade'];
        }
        ksort($semesters);
        $semesterAverages = [];
        $index = 1;
        foreach ($semesters as $key => $grade) {
            $mean = Average::mean($semesters[$key]["grades"]);
            $semesterAverages[] = [$index, $mean];
            $index++; 
        }

        if(count($semesterAverages) > 2){
            $regression = new Regression\Linear($semesterAverages);
            $semesterRegression = $regression->getParameters();
        }else{
            $semesterRegression = ['m' => 0, 'b' => 0];
        }
        return $semesterRegression;
    }

    public function statisticAbaoutCourse(int $course_id)
    {
        $data = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->get();
        
        $gradesWithOuthNull = $data->pluck('grade')->filter(function($item){
            return $item !== null;
        })->values()->all();

        
        $mean = Average::mean($gradesWithOuthNull);
        $st = Descriptive::standardDeviation($gradesWithOuthNull);
        $allGradesFrequency = Distribution::frequency($gradesWithOuthNull);

        $semesters = [];
        foreach($data as $d){
            $key = $d['year'].'-'.($d['sezon'] ? 1:2);
            if(!isset($semesters[$key])){
                $semesters[$key] = [
                    'grades' => [],
                ];
            }
            $semesters[$key]['grades'][] = $d['grade'];
        }

        foreach($semesters as $s_key => $s){
            $currentSemesterGrades = $data->where('year',substr($s_key, 0, 4))->where('sezon',substr($s_key, -1))->values();

            $gradesWONULL = collect($semesters[$s_key]["grades"])->filter(function($item){
                return $item !== null;
            })->values()->all();

            $semesters[$s_key]["grade"] = $gradesWONULL;
            $semesters[$s_key]["gradeDistribution"] = Distribution::frequency($semesters[$s_key]["grade"]);
            $semesters[$s_key]["meam"] = Average::mean($semesters[$s_key]["grade"]);
            $semesters[$s_key]["standardDeviation"] = Descriptive::standardDeviation($semesters[$s_key]["grade"]);
            $semesters[$s_key]["quartiles"] = Descriptive::quartiles($gradesWONULL);
            unset($semesters[$s_key]['grades']);
        }
        ksort($semesters);
        $semesterAverages = [];
        $index = 1;
        foreach ($semesters as $semesterData) {
            $semesterAverages[] = [$index, $semesterData["meam"]];
            $index++; 
        }

        if(count($semesterAverages) > 2){
            $regression = new Regression\Linear($semesterAverages);
            $semesterRegression = $regression->getParameters();
        }else{
            $semesterRegression = ['m' => 0, 'b' => 0];
        }

        $statisic = (object)[
            "meam" => $mean,
            "standardDeviation" => $st,
            "gradeDistribution" => $allGradesFrequency,
            "Allgrade" => $gradesWithOuthNull,
            "quartiles"=> Descriptive::quartiles($gradesWithOuthNull),
            "m" => $semesterRegression['m'],
            "b" => $semesterRegression['b'],
            "semesters" => $semesters,
        ];

        return $statisic;
    }

    public function statisticToStudentCompletedCredits()
    {
        if(Auth::check() && Auth::user()->role == 'student'){
            /** @var User $student */
            $student = Auth::user();
            $curriculumId = $student->curriculum_id;
            $curriculum = Curriculum::with('specializations.categories.courses')->findOrFail($curriculumId);
            $studentGrades = $student->grades()->where('grade','!=',1)->pluck('course_id')->all();
            $result = ["name" => $curriculum->name, "specializations" => []];
            foreach($curriculum->specializations as $specialization){
                $Sname = $specialization->name;
                $Smin = $specialization->min;
                $result["specializations"][$Sname] = ["min" => $Smin, "completed" => 0, "categories" => []];
                foreach($specialization->categories as $category){
                    $Cname = $category->name;
                    $Cmin = $category->min;
                    $result["specializations"][$Sname]["categories"][$Cname] = ["min" => $Cmin, "completed" => 0];
                    foreach($category->courses as $course){
                        if(in_array($course->id, $studentGrades)){
                            $result["specializations"][$Sname]["categories"][$Cname]["completed"]++;
                        }
                    }
                    $result["specializations"][$Sname]["completed"] += $result["specializations"][$Sname]["categories"][$Cname]["completed"];
                }
            }
            return response()->json(
               $result,200
            );
        }
        return response()->json(
            "Nem diák vagy nincs bejelentkezve!", 403
        );
    }

    public function statisticAbaoutStudentLinearisRegressio(){
        if(Auth::check() && Auth::user()->role == 'student'){
            /** @var User $student */
            $student = Auth::user();
            $code = $student->code;
            $semesterAverages = $this->KKI($code);
            $pairs = [];
            $index = 1;
            foreach ($semesterAverages as $semester => $mean) {
                $pairs[] = [$index, $mean];
                $index++; 
            }
            if(count($semesterAverages) > 2){
                $regression = new Regression\Linear($pairs);
                $semesterRegression = $regression->getParameters();
            }else{
                $semesterRegression = ['m' => 0, 'b' => 0];
            }
            $result = ["m" => $semesterRegression['m'], "b" => $semesterRegression['b']];
            return response()->json(
               $result,200
            );
        }
        return response()->json(
            "Nem diák vagy nincs bejelentkezve!", 403
        );
    }

    public function statisticAbaoutStudentTAN()
    {
        if (Auth::check() && Auth::user()->role == 'student') {
            /** @var User $student */
            $student = Auth::user();
            $code = $student->code;
            return response()->json($this->KKI($code), 200);
        }
        return response()->json("Nem diák vagy nincs bejelentkezve!", 403);
    }

    public function statisticAllTAN(){
        if(Auth::check()){
            return response()->json($this->KKI(Null), 200);
        }
        return response()->json(
            "Nem diák vagy nincs bejelentkezve!", 403
        );
    }

    private function KKI($code){
        if($code){
            $grades  = Grade::whereHas('user', function ($query) use ($code) {
                $query->where('code', $code);
            })->get();
        }else{
            $grades = Grade::all();
        }
        $semesterToKKI = [];
        $creditsum = [];
        foreach ($grades as $grade) {
            $semester = $grade->year . '/' . ($grade->sezon ? 1 : 2);
            if (!isset($semesterToKKI[$semester])) {
                $semesterToKKI[$semester] = [];
                $creditsum[$semester] = 0;
            }
            $creditsum[$semester] += $grade->course->kredit;
            if($grade->grade != null){
                $semesterToKKI[$semester][] = $grade->grade * $grade->course->kredit;
            }  
        }

        foreach ($semesterToKKI as $semester => $grades){
            $semesterToKKI[$semester] = array_sum($grades) / $creditsum[$semester];
        }
        ksort($semesterToKKI);
        return $semesterToKKI;
    }
}
