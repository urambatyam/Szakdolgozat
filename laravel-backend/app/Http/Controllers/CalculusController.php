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
                $startWith,
                $values['considerRecommendations'],
                $history,
                $values['negativIds'],
                $pozitivCoursesData,
            );
            
        }else{
            $optimizedPlan = $optimizer->generateOptimalPlan(
                $values['selectedSpecializationIds'],
                $startWith,
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
            if ($course) { 
                $courseCategories = $course->categories()->pluck('category_id')->toArray();
                $allCoursePreRequisites = $course->prerequisites()->pluck('prerequisite_course_id')->toArray();
                $pozitivCoursesData[$pId] = [ 
                    'id' => $course->id,
                    'name' => $course->name,
                    'kredit' => $course->kredit,
                    'recommendedSemester' => $course->recommendedSemester,
                    'sezon' => $course->sezon,
                    'categories' => $courseCategories,
                    'efficiency' => ($course->kredit * count($courseCategories)),
                    'prerequisites' => $allCoursePreRequisites
                ];
            }
        }

        $curriculum = Curriculum::find($values['curriculum_id']); 
        $curriculum->load('specializations.categories.courses');
        
        $optimizer = new CourseOptimizationService($curriculum, $values['creditLimit']);
        
        if(Auth::check() && Auth::user()->role == 'student'){
            /** @var User $student */
            $student = Auth::user();
            $allgrade = $student->grades()->where('grade','!=',1)->orderby('year','asc')->orderby('sezon','desc')->select('grade','sezon','year','course_id')->get();
            $history = $this->makeHistory($allgrade);
            $studyPlan = $optimizer->generateOptimalPlan(
                $values['selectedSpecializationIds'],
                $startWith,
                $values['considerRecommendations'],
                $history,
                $nagativ,
                $pozitivCoursesData,
            );
        }else{
            $studyPlan = $optimizer->generateOptimalPlan(
                $values['selectedSpecializationIds'],
                $startWith,
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

    private function makeHistory($allgrade): array{
        $history = [];
        if (empty($allgrade)) {
            return $history;
        }
        $currentYear = now()->year;
        $currentSemester = now()->month >= 9 ? true : false; 
        $lastSemester = (object) ["s" => -1, "y" => -1, "f" => 1]; 
        $hasCurrentSemesterGrades = false;
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
        $lastRecordedYear = $lastSemester->y;
        $lastRecordedSemesterIsFall = $lastSemester->f;
        while (true) {
            $lastSemester->s++;
            $lastRecordedSemesterIsFall = !$lastRecordedSemesterIsFall;
            if (!$lastRecordedSemesterIsFall) {
                $lastRecordedYear++;
            }
            if ($lastRecordedYear == $currentYear && $lastRecordedSemesterIsFall == $currentSemester) {
                if ($hasCurrentSemesterGrades) {
                    $history[$lastSemester->s]['is_fall'] = $lastRecordedSemesterIsFall;
                    $history[$lastSemester->s]['courses'] = [];
                }
                break;
            }
            if ($lastRecordedYear > $currentYear || ($lastRecordedYear == $currentYear && $lastRecordedSemesterIsFall > $currentSemester)) {
                break;
            }
            $history[$lastSemester->s]['is_fall'] = $lastRecordedSemesterIsFall;
            $history[$lastSemester->s]['courses'] = [];
        }
        return $history;
    }

    public function courseBoxplot(int $course_id){
        $grades = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })
        ->where('grade','!=', null)
        ->select('grade', 'year', 'sezon')
        ->orderBy('year', 'asc')
        ->orderBy('sezon', 'desc')
        ->get();
        $semesters = [];
        foreach($grades as $grade){
            $key = $grade['year'].' '.($grade['sezon'] ? true:false);
            $semesters[$key][] = $grade['grade'];
        }

        $result = [
            "semesters" => $semesters,
        ];
        return response()->json(
            $result,200
         );
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
        $grades = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->where('grade','!=', null)->pluck('grade')->toArray();

    
        $result = [
            "frequency" => Distribution::frequency($grades),
            "mean" => Average::mean($grades),
            "std" => Descriptive::standardDeviation($grades, false),
            "totalCount" => count($grades),
        ];

        return response()->json(
            $result,200
         );
    }

    public function courseGradeRate(int $course_id){
        $data = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->where('grade','!=', null)->pluck('grade')->toArray();
        $result = [
            "frequency" => Distribution::frequency($data),
        ];
        return response()->json(
            $result,200
         );
    }

    public function courseLinearRegression(int $course_id){
        $data = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->where('grade','!=', 'null')->select('grade','year','sezon')->orderBy('year','asc')->orderBy('sezon','desc')->get();
        $semesters = [];
        $labels = [];
        foreach($data as $d){
            $key = $d['year'].'-'.($d['sezon'] ? 1:0);
            if(!isset($semesters[$key])){
                $labels[] = $key;
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
            $semesterRegression['pairs'] = $semesterAverages;
            $semesterRegression['label'] = $labels;
        }else{
            $semesterRegression = ['m' => 0, 'b' => 0 , 'pairs' => [] ,'label' => []];
        }
        return $semesterRegression;
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
            $kki = $this->KKI($code);
            $semesterAverages = $kki['data'];
            $pairs = [];
            $index = 1;
            foreach ($semesterAverages as $semester => $mean) {
                $pairs[] = [$index, $mean];
                $index++; 
            }
            if(count($semesterAverages) > 2){
                $regression = new Regression\Linear($pairs);
                $semesterRegression = $regression->getParameters();
                $semesterRegression['pairs'] = $semesterAverages;
                $semesterRegression['label'] = $kki['label'];
            }else{
                $semesterRegression = ['m' => 0, 'b' => 0, 'pairs' => [] ,'label' => []];
            }
            $result = ["m" => $semesterRegression['m'], "b" => $semesterRegression['b'], 'pairs' => $semesterRegression['pairs'] ,'label' => $semesterRegression['label'] ];
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
    public function statisticStudentProgress(){
        if(Auth::check() && Auth::user()->role == 'student'){
            /** @var User $student */
            $student = Auth::user();
            $curriculumId = $student->curriculum_id; // Közvetlenül az ID lekérése

            // Hibaellenőrzés: Van-e a diáknak tanterve?
            if (!$curriculumId) {
                return response()->json(['message' => 'A diákhoz nincs tanterv rendelve.'], 404);
            }

            // Tanterv betöltése a szükséges kapcsolatokkal
            $curriculum = Curriculum::with([
                'specializations' => function ($query) {
                    $query->with(['categories' => function ($query) {
                        $query->with('courses:id,kredit'); // Csak az ID-t és kreditet töltjük be a kurzusokból
                    }]);
                }
            ])->find($curriculumId); // findOrFail helyett find, hogy tudjunk null-t ellenőrizni

            // Hibaellenőrzés: Létezik-e a tanterv?
            if (!$curriculum) {
                return response()->json(['message' => 'A tanterv nem található.'], 404);
            }

            // Teljesített kurzusok ID-jainak lekérése (jegy nem 1 és nem null)
            $completedCourseIds = $student->grades()
                                        ->whereNotNull('grade')
                                        ->where('grade', '!=', 1)
                                        ->pluck('course_id')
                                        ->all(); // Tömbként kapjuk meg az ID-kat

            // Eredmény struktúra inicializálása
            $result = [
                "curriculum_name" => $curriculum->name,
                "specializations" => []
            ];

            // Végigmegyünk a tanterv specializációin
            foreach($curriculum->specializations as $specialization){
                $specializationTotalCompletedCredits = 0; // Számláló a specializáció teljesített kreditjeihez
                $categoriesData = []; // Tömb a kategóriák adatainak tárolására

                // Végigmegyünk a specializáció kategóriáin
                foreach($specialization->categories as $category){
                    $categoryCompletedCredits = 0; // Számláló a kategória teljesített kreditjeihez

                    // Végigmegyünk a kategória kurzusain
                    foreach($category->courses as $course){
                        // Ellenőrizzük, hogy a diák teljesítette-e ezt a kurzust
                        if(in_array($course->id, $completedCourseIds)){
                            $categoryCompletedCredits += $course->kredit; // Hozzáadjuk a kurzus kreditjét
                        }
                    }

                    // Hozzáadjuk a kategória adatait a tömbhöz
                    $categoriesData[] = [
                        "category_name" => $category->name,
                        "required_credits" => $category->min,
                        "completed_credits" => $categoryCompletedCredits
                        // Opcionálisan: "max_credits" => $category->max
                    ];

                    // Hozzáadjuk a kategória teljesített kreditjeit a specializáció összesítettjéhez
                    $specializationTotalCompletedCredits += $categoryCompletedCredits;
                }

                // Hozzáadjuk a specializáció adatait a végeredményhez
                $result["specializations"][] = [
                    "specialization_name" => $specialization->name,
                    "is_completed" => $specializationTotalCompletedCredits >= $specialization->min,
                    "required_credits" => $specialization->min,
                    "completed_credits" => $specializationTotalCompletedCredits,
                    "categories" => $categoriesData
                ];
            }

            // Visszaadjuk az eredményt JSON formátumban
            return response()->json($result, 200);
        }

        // Ha nem diák vagy nincs bejelentkezve
        return response()->json(
            ["message" => "Nem diák vagy nincs bejelentkezve!"], 403
        );
    }

    private function KKI($code){
        $query = Grade::query(); // Kezdjük egy üres query builderrel

        if($code){
            $query->whereHas('user', function ($q) use ($code) {
                $q->where('code', $code);
            });
        }

        // Töltsük be a 'course' kapcsolatot, de csak a kreditet kérjük le
        $grades = $query->with('course:id,kredit')
                        ->orderBy('year','asc')
                        ->orderBy('sezon','desc')
                        ->get();

        // ... a többi kód változatlan ...

        $label = [];
        $semesterToKKI = [];
        $creditsum = [];
        $semesterIndexMap = []; // Segédtömb a szemeszterek és indexek összerendeléséhez

        foreach ($grades as $grade) {
            // Ellenőrzés, hogy a kurzus betöltődött-e (lehet null, ha valamiért nincs meg)
            if (!$grade->course) {
                continue; // Kihagyjuk ezt a jegyet, ha nincs hozzá kurzus
            }

            $semester = $grade->year . ' ' . ($grade->sezon ? 1 : 0); // Olvashatóbb címke

            // Ha ez egy új szemeszter
            if (!isset($semesterIndexMap[$semester])) {
                $label[] = $semester; // Hozzáadjuk a címkét
                $currentSemesterIndex = count($label) -1; // Az új index
                $semesterIndexMap[$semester] = $currentSemesterIndex; // Elmentjük az indexet
                $semesterToKKI[$currentSemesterIndex] = []; // Inicializáljuk a jegyek tömbjét
                $creditsum[$currentSemesterIndex] = 0; // Inicializáljuk a kreditösszeget
            } else {
                $currentSemesterIndex = $semesterIndexMap[$semester]; // Lekérjük a meglévő indexet
            }

            // Most már a $currentSemesterIndex-et használjuk mindenhol
            $creditsum[$currentSemesterIndex] += $grade->course->kredit; // Itt már a betöltött kurzus kreditjét használjuk

            if($grade->grade != null){
                // Itt is a betöltött kurzus kreditjét használjuk
                $semesterToKKI[$currentSemesterIndex][] = $grade->grade * $grade->course->kredit;
            }
        }

        $finalData = [];
        foreach ($semesterToKKI as $index => $weightedGrades){
            // Ellenőrizzük, hogy a kreditösszeg nem nulla-e, mielőtt osztanánk
            if ($creditsum[$index] > 0) {
                $finalData[$index] = array_sum($weightedGrades) / $creditsum[$index];
            } else {
                $finalData[$index] = 0; // Vagy null, vagy valamilyen alapértelmezett érték
            }
        }

        // A data kulcs alatt a finalData tömböt adjuk vissza, ami már a számolt átlagokat tartalmazza
        // és az indexelése konzisztens a label tömb indexelésével (0-tól indul)
        return [
            "label" => $label,
            "data" => $finalData // array_values, hogy biztosan 0-tól indexelt tömb legyen
        ];
    }

}
