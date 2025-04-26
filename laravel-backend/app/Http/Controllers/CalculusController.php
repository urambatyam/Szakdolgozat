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
use App\Models\User; 
use Illuminate\Http\JsonResponse; 
use Illuminate\Validation\ValidationException; 
use Exception; 

/**
 * Ez a kontroller felelős a kurzusoptimalizálási algoritmusok futtatásáért
 * (Branch and Bound, Greedy) és különböző statisztikai számítások elvégzéséért
 * kurzusokhoz és hallgatókhoz kapcsolódóan.
 */
class CalculusController extends Controller
{
    /**
     * Optimális tantervtervet generál a Branch and Bound algoritmus segítségével.
     * Figyelembe veszi a tantervet, kreditlimitet, választott specializációkat,
     * ajánlásokat, teljesített tárgyakat (ha a felhasználó diák),
     * és a felhasználó által megadott preferenciákat (pozitív/negatív kurzusok).
     *
     * @param Request $request A HTTP kérés, amely tartalmazza a szükséges paramétereket
     * @return array Tartalmazza az optimalizált tantervtervet, és a kreditek félévenkénti bontását.
     * @throws ValidationException Ha a bemeneti adatok validálása sikertelen.
     */
    public function optimalizeByBnB(Request $request): array
    {
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

    /**
     * Optimális tantervtervet generál a mohó (Greedy) algoritmus segítségével.
     * Figyelembe veszi a tantervet, kreditlimitet, választott specializációkat,
     * ajánlásokat, teljesített tárgyakat (ha a felhasználó diák),
     * és a felhasználó által megadott preferenciákat (pozitív/negatív kurzusok).
     *
     * @param Request $request A HTTP kérés, amely tartalmazza a szükséges paramétereket
     * @return array Tartalmazza az optimalizált tantervtervet,és a kreditek félévenkénti bontását.
     * @throws ValidationException Ha a bemeneti adatok validálása sikertelen.
     */
    public function optimalizeByGreedy(Request $request): array
    {
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

    /**
     * @private
     * Létrehoz egy "history" tömböt a hallgató korábbi jegyei alapján,
     * amely tartalmazza a teljesített kurzusokat félévenkénti bontásban,
     * beleértve az üres féléveket is a jelenlegi félévig.
     *
     * @param \Illuminate\Database\Eloquent\Collection $allgrade A hallgató jegyeinek gyűjteménye.
     * @return array A félévenkénti előzményeket tartalmazó tömb.
     */
    private function makeHistory($allgrade): array
    {
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

    /**
     * Lekérdezi egy adott kurzus jegyeit félévenkénti bontásban boxplot diagramhoz.
     * Csak a nem null jegyeket veszi figyelembe.
     *
     * @param int $course_id A kurzus azonosítója.
     * @return JsonResponse A félévenként csoportosított jegyeket tartalmazó JSON válasz.
     */
    public function courseBoxplot(int $course_id): JsonResponse
    {
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
            $key = $grade['year'].' '.($grade['sezon'] ? 1:0); 
            $semesters[$key][] = $grade['grade'];
        }

        $result = [
            "semesters" => $semesters,
        ];
        return response()->json(
            $result,200
         );
    }

    /**
     * Kiszámítja egy adott kurzus teljesítési arányait (teljesített, bukott, nem jelent meg).
     *
     * @param int $course_id A kurzus azonosítója.
     * @return array Az arányokat tartalmazó tömb ('completed', 'failed', 'absent').
     */
    public function coursecompletionRate(int $course_id): array
    {
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

    /**
     * Kiszámítja egy adott kurzus jegyeinek eloszlását és alapvető statisztikáit.
     * Csak a nem null jegyeket veszi figyelembe.
     *
     * @param int $course_id A kurzus azonosítója.
     * @return JsonResponse A statisztikákat tartalmazó JSON válasz ('frequency', 'mean', 'std', 'totalCount').
     */
    public function courseDistribution(int $course_id): JsonResponse
    {
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

    /**
     * Lekérdezi egy adott kurzus jegyeinek gyakoriságát.
     * Csak a nem null jegyeket veszi figyelembe.
     *
     * @param int $course_id A kurzus azonosítója.
     * @return JsonResponse A jegyek gyakoriságát tartalmazó JSON válasz ('frequency').
     */
    public function courseGradeRate(int $course_id): JsonResponse
    {
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

    /**
     * Kiszámítja egy adott kurzus félévenkénti átlagaira illesztett lineáris regresszió paramétereit.
     * Csak a nem null jegyeket veszi figyelembe. Legalább 3 félévnyi adat szükséges a számításhoz.
     *
     * @param int $course_id A kurzus azonosítója.
     * @return array A regressziós paramétereket ('m', 'b'), az adatpárokat ('pairs')
     *               és a félév címkéket ('label') tartalmazó tömb.
     *               Ha nincs elég adat, null értékeket és üres tömböket ad vissza.
     */
    public function courseLinearRegression(int $course_id): array
    {
        $data = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->where('grade','!=', null)->select('grade','year','sezon')->orderBy('year','asc')->orderBy('sezon','desc')->get();
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

    /**
     * Lekérdezi a bejelentkezett hallgató teljesített kreditjeit specializációnként és kategóriánként.
     * Csak a sikeresen teljesített (jegy nem 1) tárgyakat veszi figyelembe.
     *
     * @return JsonResponse A kreditadatokat tartalmazó JSON válasz, vagy hibaüzenet.
     */
    public function statisticToStudentCompletedCredits(): JsonResponse
    {
        if(Auth::check() && Auth::user()->role == 'student'){
            /** @var User $student */
            $student = Auth::user();
            $curriculumId = $student->curriculum_id;
            $curriculum = Curriculum::with('specializations.categories.courses')->find($curriculumId);
            if (!$curriculum) {
                 return response()->json(['message' => 'A tanterv nem található.'], 404);
            }
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
            ["message" => "Nem diák vagy nincs bejelentkezve!"], 403
        );
    }

    /**
     * Kiszámítja a bejelentkezett hallgató tanulmányi átlagaira illesztett lineáris regresszió paramétereit.
     * A KKI (kumulált kreditindex) számítást használja alapul.
     * Legalább 3 félévnyi adat szükséges a számításhoz.
     *
     * @return JsonResponse A regressziós paramétereket ('m', 'b'), az adatpárokat ('pairs')
     *                    és a félév címkéket ('label') tartalmazó JSON válasz, vagy hibaüzenet.
     */
    public function statisticAbaoutStudentLinearisRegressio(): JsonResponse
    {
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
            ["message" => "Nem diák vagy nincs bejelentkezve!"], 403
        );
    }

    /**
     * Lekérdezi a bejelentkezett hallgató tanulmányi átlagának (TAN) alakulását félévenként.
     * A KKI (kumulált kreditindex) számítást használja alapul.
     *
     * @return JsonResponse A KKI adatokat ('label', 'data') tartalmazó JSON válasz, vagy hibaüzenet.
     */
    public function statisticAbaoutStudentTAN(): JsonResponse
    {
        if (Auth::check() && Auth::user()->role == 'student') {
            /** @var User $student */
            $student = Auth::user();
            $code = $student->code;
            return response()->json($this->KKI($code), 200);
        }
        return response()->json(["message" => "Nem diák vagy nincs bejelentkezve!"], 403);
    }

    /**
     * Lekérdezi az összesített tanulmányi átlag (összes hallgató) alakulását félévenként.
     * A KKI (kumulált kreditindex) számítást használja alapul (hallgatói kód nélkül).
     * Csak bejelentkezett felhasználó érheti el.
     *
     * @return JsonResponse A KKI adatokat ('label', 'data') tartalmazó JSON válasz, vagy hibaüzenet.
     */
    public function statisticAllTAN(): JsonResponse
    {
        if(Auth::check()){
            return response()->json($this->KKI(Null), 200);
        }
        return response()->json(
            ["message" => "Nincs bejelentkezve!"], 403
        );
    }

    /**
     * Lekérdezi a bejelentkezett hallgató tanulmányi haladását specializációnként és kategóriánként.
     * Összehasonlítja a teljesített krediteket a szükséges kreditekkel.
     *
     * @return JsonResponse A részletes haladási adatokat tartalmazó JSON válasz, vagy hibaüzenet.
     * @throws Exception Ha a tanterv vagy a kapcsolatok betöltése során hiba történik.
     */
    public function statisticStudentProgress(): JsonResponse
    {
        if(Auth::check() && Auth::user()->role == 'student'){
            /** @var User $student */
            $student = Auth::user();
            $curriculumId = $student->curriculum_id;
            if (!$curriculumId) {
                return response()->json(['message' => 'A diákhoz nincs tanterv rendelve.'], 404);
            }
            try {
                $curriculum = Curriculum::with([
                    'specializations' => function ($query) {
                        $query->with(['categories' => function ($query) {
                            $query->with('courses:id,kredit');
                        }]);
                    }
                ])->find($curriculumId);

                if (!$curriculum) {
                    return response()->json(['message' => 'A tanterv nem található.'], 404);
                }
                $completedCourseIds = $student->grades()
                                            ->whereNotNull('grade')
                                            ->where('grade', '!=', 1)
                                            ->pluck('course_id')
                                            ->all();

                $result = [
                    "curriculum_name" => $curriculum->name,
                    "specializations" => []
                ];

                foreach($curriculum->specializations as $specialization){
                    $specializationTotalCompletedCredits = 0;
                    $categoriesData = [];

                    foreach($specialization->categories as $category){
                        $categoryCompletedCredits = 0;

                        foreach($category->courses as $course){
                            if(in_array($course->id, $completedCourseIds)){
                                $categoryCompletedCredits += $course->kredit;
                            }
                        }
                        $categoriesData[] = [
                            "category_name" => $category->name,
                            "required_credits" => $category->min,
                            "completed_credits" => $categoryCompletedCredits
                        ];

                        $specializationTotalCompletedCredits += $categoryCompletedCredits;
                    }
                    $result["specializations"][] = [
                        "specialization_name" => $specialization->name,
                        "is_completed" => $specializationTotalCompletedCredits >= $specialization->min,
                        "required_credits" => $specialization->min,
                        "completed_credits" => $specializationTotalCompletedCredits,
                        "categories" => $categoriesData
                    ];
                }
                return response()->json($result, 200);
            } catch (Exception $e) {
                 return response()->json(['message' => 'Hiba történt a haladási adatok lekérdezése közben.'], 500);
            }
        }
        return response()->json(
            ["message" => "Nem diák vagy nincs bejelentkezve!"], 403
        );
    }

    /**
     * @private
     * Kiszámítja a kumulált kreditindexet (KKI) félévenként egy adott hallgatóhoz,
     * vagy az összes hallgatóhoz, ha a kód `null`.
     *
     * @param string|null $code A hallgató kódja, vagy `null` az összes hallgatóhoz.
     * @return array Tartalmazza a félév címkéket ('label') és a hozzájuk tartozó KKI értékeket ('data').
     */
    private function KKI(?string $code): array
    {
        $query = Grade::query();
        if($code){
            $query->whereHas('user', function ($q) use ($code) {
                $q->where('code', $code);
            });
        }
        $grades = $query->with('course:id,kredit')
                        ->orderBy('year','asc')
                        ->orderBy('sezon','desc')
                        ->get();

        $label = [];
        $semesterToKKI = [];
        $creditsum = [];
        $semesterIndexMap = [];

        foreach ($grades as $grade) {
            if (!$grade->course) {
                continue;
            }

            $semester = $grade->year . ' ' . ($grade->sezon ? 1 : 0);

            if (!isset($semesterIndexMap[$semester])) {
                $label[] = $semester;
                $currentSemesterIndex = count($label) -1;
                $semesterIndexMap[$semester] = $currentSemesterIndex;
                $semesterToKKI[$currentSemesterIndex] = [];
                $creditsum[$currentSemesterIndex] = 0;
            } else {
                $currentSemesterIndex = $semesterIndexMap[$semester];
            }

            $creditsum[$currentSemesterIndex] += $grade->course->kredit;

            if($grade->grade != null){
                $semesterToKKI[$currentSemesterIndex][] = $grade->grade * $grade->course->kredit;
            }
        }

        $finalData = [];
        foreach ($semesterToKKI as $index => $weightedGrades){
            if ($creditsum[$index] > 0) {
                $finalData[$index] = array_sum($weightedGrades) / $creditsum[$index];
            } else {
                $finalData[$index] = 0;
            }
        }
        return [
            "label" => $label,
            "data" => $finalData
        ];
    }

}
