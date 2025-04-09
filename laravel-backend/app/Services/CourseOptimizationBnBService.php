<?php

namespace App\Services;

use App\Models\Curriculum;
// use App\Models\Specialization; // Nincs közvetlenül használva
// use App\Models\Category; // Nincs közvetlenül használva
// use App\Models\Course; // Nincs közvetlenül használva
use Illuminate\Support\Collection; // Szükséges a collect() és a Collection típushoz

/**
 * Kurzusokat optimalizáló szolgáltatás Branch and Bound algoritmussal.
 *
 * @property Curriculum $curriculum A kiválasztott tanterv az adatbázisból.
 * @property int $maxCreditsPerSemester Maximum kredit ami felvehető félévenként.
 * @property array $allCourses A tantervhez tartozó összes kurzus course->id => course model fomában.
 * @property array $courseCategories Az tárolja milyen kurzushoz milyen kategoria tartozik course->id => category->id[] fromában.
 * @property array $allCoursePreRequisites El tárolja az összes előkövetelmény->kurzus kapcsolatot course->id => prerequisite_course_id[].
 * @property ?Collection $relevantCategories A kiválasztott specializációkhoz tartozó releváns kategóriák kollekciója.
 * @property array $relevantCategoryIds A releváns kategóriák ID-jai.
 * @property array $relevantCourses A releváns kurzusok adatai (negatívak nélkül, pozitívak nélkül).
 * @property array $positiveCourseIds A kötelezően felveendő (pozitív) kurzusok ID-jai.
 * @property array|null $bestSolution A legjobb talált megoldás állapota.
 * @property int $bestSolutionCost A legjobb talált megoldás költsége (pl. kurzusok száma).
 * @property int $nodesExplored A bejárt csomópontok száma (debug).
 * @property bool $considerRecommendedSemester Figyelembe vegye-e az ajánlott félévet.
 * @property bool $startWithFall Kezdés őszi (true) vagy tavaszi (false) félévvel.
 */
class CourseOptimizationBnBService
{
    private Curriculum $curriculum;
    private array $allCourses = [];
    private array $courseCategories = [];
    private int $maxCreditsPerSemester = 30;
    private array $allCoursePreRequisites = [];
    private ?Collection $relevantCategories = null; // Collection típus
    private array $relevantCategoryIds = [];
    private array $relevantCourses = [];
    private array $positiveCourseIds = []; // ÚJ property a pozitív ID-k tárolására
    private ?array $bestSolution = null; // array|null típus
    private int $bestSolutionCost = PHP_INT_MAX;
    private int $nodesExplored = 0;
    private bool $considerRecommendedSemester = false;
    private bool $startWithFall = true;

    /**
     * Ez konstruktor ami inicializálja az osztályt
     *
     * @param Curriculum $curriculum A tanterv minden adatával.
     * @param int $maxCreditsPerSemester Maximum kredit ami felvehető félévenként.
     * @return void
     */
    public function __construct(Curriculum $curriculum, int $maxCreditsPerSemester = 30)
    {
        $this->curriculum = $curriculum;
        $this->maxCreditsPerSemester = $maxCreditsPerSemester;

        // Adatok összegyűjtése a konstruktorban
        foreach ($curriculum->specializations as $specialization) {
            foreach ($specialization->categories as $category) {
                foreach ($category->courses as $course) {
                    if (!isset($this->allCourses[$course->id])) {
                        $this->allCourses[$course->id] = $course;
                        $prereqs = $course->prerequisites()->pluck('prerequisite_course_id')->filter()->toArray();
                        $this->allCoursePreRequisites[$course->id] = $prereqs;
                    }
                    if (!isset($this->courseCategories[$course->id])) {
                        $this->courseCategories[$course->id] = [];
                    }
                    if (!in_array($category->id, $this->courseCategories[$course->id])) {
                        $this->courseCategories[$course->id][] = $category->id;
                    }
                }
            }
        }
    }

    /**
     * Ez Generálja az optimális tantervet Branch and Bound algoritmussal.
     *
     * @param array<int> $selectedSpecializationIds A kiválasztot specializációk id-jai.
     * @param bool $startWithFall Azt adja meg milyen szezonban kezdödik a kurzus optimalizáció őssz (true) vagy tavasz (false)
     * @param bool $considerRecommendedSemester Figyelembe veszi-e az ajánlott féléveket
     * @param array $history Előzőleg teljesített kurzusok listája (félévek szerint csoportosítva).
     * @param array<int> $nagativIds A kihagyandó kurzusok ID-jai.
     * @param array<int, array> $pozitivCoursesData A kötelezően felveendő kurzusok adatai (ID => adat tömb).
     * @return array Az optimalizált tanulási tervet adja vissza.
     */
    public function generateOptimalPlan(array $selectedSpecializationIds, bool $startWithFall = true, bool $considerRecommendedSemester = false, array $history = [], array $nagativIds = [], array $pozitivCoursesData = []): array
    {
        // Osztályszintű property-k beállítása/resetelése
        $this->startWithFall = $startWithFall;
        $this->considerRecommendedSemester = $considerRecommendedSemester;
        $this->bestSolution = null;
        $this->bestSolutionCost = PHP_INT_MAX;
        $this->nodesExplored = 0;
        $this->positiveCourseIds = [];

        // Kötelező specializációk hozzáadása
        foreach($this->curriculum->specializations as $sp){
            if($sp->required && !in_array($sp->id, $selectedSpecializationIds)){
                $selectedSpecializationIds[] = $sp->id;
            }
        }
        $selectedSpecializations = $this->curriculum->specializations->whereIn('id', $selectedSpecializationIds);

        // Releváns kategóriák és ID-k összegyűjtése
        $this->relevantCategories = collect();
        foreach ($selectedSpecializations as $specialization) {
            $this->relevantCategories = $this->relevantCategories->merge($specialization->categories);
        }
        $this->relevantCategories = $this->relevantCategories->unique('id');
        $this->relevantCategoryIds = $this->relevantCategories->pluck('id')->toArray();

        // Releváns kurzusok összegyűjtése és SZŰRÉSE (negatívak)
        $this->relevantCourses = [];
        foreach ($this->allCourses as $courseId => $course) {
            if (!isset($this->courseCategories[$courseId])) continue;
            $courseRelevantCategories = array_intersect($this->courseCategories[$courseId], $this->relevantCategoryIds);
            if (empty($courseRelevantCategories)) continue;
            if (in_array($courseId, $nagativIds)) continue; // NEGATÍV SZŰRÉS

            $prerequisites = $this->allCoursePreRequisites[$courseId] ?? [];
            $efficiency = ($course->kredit * count($courseRelevantCategories));
            $this->relevantCourses[$courseId] = [
                'id' => $course->id, 'name' => $course->name, 'kredit' => $course->kredit,
                'recommendedSemester' => $course->recommendedSemester, 'sezon' => $course->sezon,
                'categories' => $courseRelevantCategories, 'prerequisites' => $prerequisites,
                'efficiency' => $efficiency
            ];
        }

        // POZITÍV KURZUSOK ELKÜLÖNÍTÉSE
        $positiveCoursesToTake = []; // Adatokkal, lokális változó
        foreach ($pozitivCoursesData as $courseId => $courseData) {
             if (isset($this->allCourses[$courseId]) && !in_array($courseId, $nagativIds)) {
                 $courseData['prerequisites'] = $this->allCoursePreRequisites[$courseId] ?? [];
                 $courseData['categories'] = $this->courseCategories[$courseId] ?? [];
                 $courseData['efficiency'] = $courseData['efficiency'] ?? ($courseData['kredit'] * count($courseData['categories']));
                 $positiveCoursesToTake[$courseId] = $courseData;
                 unset($this->relevantCourses[$courseId]); // Kivesszük a normál listából
             }
        }
        $this->positiveCourseIds = array_keys($positiveCoursesToTake); // ID-k eltárolása

        // Rendezés (opcionális, a BnB elvileg nem függ tőle, de segíthet)
        uasort($this->relevantCourses, function($a, $b) {
            return ($b['efficiency'] ?? 0) <=> ($a['efficiency'] ?? 0);
        });

        // Kezdeti állapot
        $initialState = [
            'selectedCourses' => [], 'completedCourses' => [],
            'categoryCredits' => array_fill_keys($this->relevantCategoryIds, 0),
            'semester' => 1, 'isFallSemester' => $this->startWithFall,
            'semesterCredits' => 0, 'semesterCourses' => [], 'plan' => [],
        ];

        // Előzmények feldolgozása
        if (!empty($history)) {
            $lastHistorySemesterIndex = -1;
            foreach ($history as $semesterIndex => $semesterData) {
                 $lastHistorySemesterIndex = $semesterIndex;
                 $semesterCourses = [];
                 $semesterCredits = 0;
                 foreach ($semesterData['courses'] as $courseId) {
                     if (isset($this->allCourses[$courseId])) {
                         $courseModel = $this->allCourses[$courseId];
                         $semesterCourses[] = ['id' => $courseModel->id, 'name' => $courseModel->name, 'kredit' => $courseModel->kredit];
                         $semesterCredits += $courseModel->kredit;
                         if (isset($this->courseCategories[$courseId])) {
                             $courseDataForUpdate = ['kredit' => $courseModel->kredit, 'categories' => $this->courseCategories[$courseId]];
                             if ($this->relevantCategories) { $this->updateCategoryCredits($courseDataForUpdate, $initialState['categoryCredits']); }
                         }
                         if (!in_array($courseId, $initialState['completedCourses'])) { $initialState['completedCourses'][] = $courseId; }
                         if (!in_array($courseId, $initialState['selectedCourses'])) { $initialState['selectedCourses'][] = $courseId; }
                         unset($this->relevantCourses[$courseId]);
                         unset($positiveCoursesToTake[$courseId]);
                     }
                 }
                 $initialState['plan'][] = ['is_fall' => $semesterData['is_fall'], 'courses' => $semesterCourses, 'total_credits' => $semesterCredits];
                 $initialState['isFallSemester'] = !$semesterData['is_fall'];
            }
            $initialState['semester'] = $lastHistorySemesterIndex + 2;
        }

        // Branch and Bound futtatása
        $this->branchAndBound($initialState, $positiveCoursesToTake);

        // Eredmény visszaadása
        if ($this->bestSolution === null) {
            return [
                'semesters' => [], 'total_credits' => 0, 'total_courses' => 0,
                'total_semesters' => 0, 'all_requirements_met' => false,
                'warnings' => ['Nem található érvényes tanterv a megadott feltételekkel.'],
                'nodes_explored' => $this->nodesExplored,
            ];
        }

        $studyPlan = $this->formatSolution($this->bestSolution, $positiveCoursesToTake);
        $studyPlan['nodes_explored'] = $this->nodesExplored;
        return $studyPlan;
    }

    /**
     * Branch and Bound algoritmus rekurzív implementációja
     *
     * @param array $state Az aktuális állapot
     * @param array $positiveCoursesToTake A még felveendő pozitív kurzusok adatai (lower boundhoz kellhet)
     * @return void
     */
    private function branchAndBound(array $state, array $positiveCoursesToTake): void
    {
        $this->nodesExplored++;

        // 1. Megoldás ellenőrzése
        if ($this->isSolution($state)) {
            $cost = count($state['selectedCourses']); // Költség: kurzusok száma
            if ($cost < $this->bestSolutionCost) {
                $this->bestSolution = $state;
                $this->bestSolutionCost = $cost;
            }
            return; // Megállás ezen az ágon
        }

        // 2. Bounding
        $lowerBound = $this->calculateLowerBound($state, $positiveCoursesToTake);
        if ($lowerBound >= $this->bestSolutionCost) {
            return; // Levágás
        }

        // 3. Elérhető kurzusok lekérdezése az AKTUÁLIS félévre
        // Fontos: A getAvailableCourses már helyesen szűr szezonra, ajánlott félévre és előkövetelményre!
        $availableCourses = $this->getAvailableCourses($state);

        // 4. Elágazás (Branching)
        $movedToNextSemester = false;

        // Próbáljunk kurzusokat felvenni az aktuális félévbe, ha még nincs tele
        if ($state['semesterCredits'] < $this->maxCreditsPerSemester) {
            foreach ($availableCourses as $courseId => $course) {
                // Ág 1: Vegyük fel a kurzust (HA befér)
                if ($state['semesterCredits'] + $course['kredit'] <= $this->maxCreditsPerSemester) {
                    $newStateTake = $this->takeCourse($state, $courseId, $course);
                    // Rekurzív hívás az új állapottal (több kurzussal/kredittel ugyanabban a félévben)
                    $this->branchAndBound($newStateTake, $positiveCoursesToTake);
                }
                // A "ne vegyük fel" ágat implicit módon a ciklus folytatása
                // és a félév végi továbblépés kezeli.
            }
        }

        // Ha a félév tele van, VAGY a fenti ciklus lefutott (azaz minden lehetséges
        // kurzust megpróbáltunk felvenni ebbe a félévbe az adott állapotból):
        // Lépjünk a következő félévre.
        if (!$movedToNextSemester) {
             $newStateNextSem = $this->moveToNextSemester($state);
             // Biztonsági limit a félévszámra
             if ($newStateNextSem['semester'] <= 20) { // Vagy más limit
                 $this->branchAndBound($newStateNextSem, $positiveCoursesToTake);
                 $movedToNextSemester = true;
             }
        }
    }

    /**
     * Ellenőrzi, hogy egy adott állapot megoldás-e.
     */
    private function isSolution(array $state): bool
    {
        // Kategória követelmények
        foreach ($this->relevantCategoryIds as $categoryId) {
            $category = $this->relevantCategories->firstWhere('id', $categoryId);
            if (!$category || !isset($state['categoryCredits'][$categoryId]) || $state['categoryCredits'][$categoryId] < $category->min) {
                return false;
            }
        }
        // Pozitív kurzusok
        foreach ($this->positiveCourseIds as $positiveCourseId) {
            if (!in_array($positiveCourseId, $state['selectedCourses'])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Kiszámítja az alsó korlátot (lower bound).
     */
    private function calculateLowerBound(array $state, array $positiveCoursesToTake): int
    {
        $currentCost = count($state['selectedCourses']);
        $missingPositiveCourseIds = array_diff($this->positiveCourseIds, $state['selectedCourses']);
        $missingPositiveCoursesCount = count($missingPositiveCourseIds);

        if ($currentCost + $missingPositiveCoursesCount >= $this->bestSolutionCost) {
             return PHP_INT_MAX;
        }

        $missingCredits = [];
        foreach ($this->relevantCategoryIds as $categoryId) {
            $category = $this->relevantCategories->firstWhere('id', $categoryId);
            if ($category) {
                $missing = max(0, $category->min - ($state['categoryCredits'][$categoryId] ?? 0));
                if ($missing > 0) { $missingCredits[$categoryId] = $missing; }
            }
        }

        if (empty($missingCredits) && $missingPositiveCoursesCount === 0) {
            return $currentCost;
        }

        // Kreditpótlás becslése
        $remainingRelevantCourses = array_diff_key($this->relevantCourses, array_flip($state['selectedCourses']));
        $remainingPositiveCoursesData = array_intersect_key($positiveCoursesToTake, array_flip($missingPositiveCourseIds));
        $remainingCourses = $remainingRelevantCourses + $remainingPositiveCoursesData;
        uasort($remainingCourses, function($a, $b) {
            return ($b['efficiency'] ?? 0) <=> ($a['efficiency'] ?? 0);
        });

        $tempMissingCredits = $missingCredits;
        $coursesUsedForCreditEstimate = [];
        $estimatedAdditionalForCredits = 0;

        foreach ($remainingCourses as $courseId => $course) {
            if (empty($tempMissingCredits)) break;
            $useful = false;
            if (!isset($course['categories']) || !is_array($course['categories'])) continue; // Biztonsági ellenőrzés
            foreach ($course['categories'] as $categoryId) {
                if (isset($tempMissingCredits[$categoryId]) && $tempMissingCredits[$categoryId] > 0) {
                    $tempMissingCredits[$categoryId] = max(0, $tempMissingCredits[$categoryId] - $course['kredit']);
                    $useful = true;
                    if ($tempMissingCredits[$categoryId] === 0) { unset($tempMissingCredits[$categoryId]); }
                }
            }
            if ($useful) {
                $estimatedAdditionalForCredits++;
                $coursesUsedForCreditEstimate[] = $courseId;
            }
        }

        // Kombinált becslés
        $missingPositiveNotInCreditEstimate = 0;
         foreach ($missingPositiveCourseIds as $positiveCourseId) {
             if (!in_array($positiveCourseId, $coursesUsedForCreditEstimate)) {
                 $missingPositiveNotInCreditEstimate++;
             }
         }
        $totalEstimatedAdditional = $estimatedAdditionalForCredits + $missingPositiveNotInCreditEstimate;
        return $currentCost + $totalEstimatedAdditional;
    }

    /**
     * Visszaadja az aktuális félévben elérhető kurzusokat.
     * JAVÍTVA: checkPrerequisites hívás hozzáadva.
     */
    private function getAvailableCourses(array $state): array
    {
        $availableCourses = [];
        $seasonFilter = $state['isFallSemester'] ? 1 : 0;

        // Potenciális jelöltek: még nem kiválasztott releváns ÉS pozitív kurzusok
        $candidateCourseIds = array_merge(
            array_keys(array_diff_key($this->relevantCourses, array_flip($state['selectedCourses']))),
            array_diff($this->positiveCourseIds, $state['selectedCourses'])
        );
        $candidateCourseIds = array_unique($candidateCourseIds);


        foreach ($candidateCourseIds as $courseId) {
            // Kurzus adatainak lekérése
            if (!isset($this->allCourses[$courseId])) continue;
            $courseModel = $this->allCourses[$courseId];
            $courseData = [
                'id' => $courseId, 'name' => $courseModel->name, 'kredit' => $courseModel->kredit,
                'recommendedSemester' => $courseModel->recommendedSemester, 'sezon' => $courseModel->sezon,
                'categories' => $this->courseCategories[$courseId] ?? [],
                'prerequisites' => $this->allCoursePreRequisites[$courseId] ?? [],
            ];

      


            // --- SZŰRÉSI FELTÉTELEK ---

            // 1. Szezon ellenőrzése
            if ($courseData['sezon'] !== null && $courseData['sezon'] !== $seasonFilter) {
                continue;
            }

            // 2. Ajánlott félév ellenőrzése
            if ($this->considerRecommendedSemester && $state['semester'] < $courseData['recommendedSemester']) {
                continue;
            }

            // 3. Előkövetelmények ellenőrzése
            if (!$this->checkPrerequisites($courseId, $state['completedCourses'])) {
                continue;
            }

            // 4. Relevancia ellenőrzése (csak ha nem pozitív kurzus)
            if (!in_array($courseId, $this->positiveCourseIds)) {
                $stillRelevant = false; // Alapértelmezetten nem releváns
                if (isset($courseData['categories']) && is_array($courseData['categories'])) { // Ellenőrizzük, hogy vannak-e kategóriái
                    foreach ($courseData['categories'] as $categoryId) {
                        // Csak releváns kategóriákat nézünk
                        if (in_array($categoryId, $this->relevantCategoryIds)) {
                            $category = $this->relevantCategories->firstWhere('id', $categoryId);
                            // Ha a kategória létezik és még nincs teljesítve az adott állapotban
                            if ($category && (!isset($state['categoryCredits'][$categoryId]) || $state['categoryCredits'][$categoryId] < $category->min)) {
                                $stillRelevant = true; // Elég egy releváns, nem teljesített kategória
                                break; // Nincs szükség tovább vizsgálni a kategóriákat
                            }
                        }
                    }
                }

                if (!$stillRelevant) {
                    continue;
                }
            }

            $availableCourses[$courseId] = $courseData;
        }

        // Rendezés (opcionális)
        uasort($availableCourses, function($a, $b) {
            return ($a['recommendedSemester'] ?? PHP_INT_MAX) <=> ($b['recommendedSemester'] ?? PHP_INT_MAX);
        });

        return $availableCourses;
    }

    /**
     * Új állapotot hoz létre a kurzus felvételével.
     */
    private function takeCourse(array $state, int $courseId, array $course): array
    {
        $newState = $state;
        if (!in_array($courseId, $newState['selectedCourses'])) { $newState['selectedCourses'][] = $courseId; }
        if (!in_array($courseId, $newState['completedCourses'])) { $newState['completedCourses'][] = $courseId; }

        if (isset($course['categories']) && is_array($course['categories'])) { // Ellenőrzés
            foreach ($course['categories'] as $categoryId) {
                if (isset($newState['categoryCredits'][$categoryId])) {
                    $newState['categoryCredits'][$categoryId] += $course['kredit'];
                }
            }
        }

        $newState['semesterCredits'] += $course['kredit'];
        $newState['semesterCourses'][] = ['id' => $courseId, 'name' => $course['name'], 'kredit' => $course['kredit']];
        return $newState;
    }

    /**
     * Átlép a következő félévre.
     */
    private function moveToNextSemester(array $state): array
    {
        $newState = $state;
        $currentSemesterNum = $newState['semester'];
        if (!empty($newState['semesterCourses'])) {
            $newState['plan'][] = [
                'semester_num' => $currentSemesterNum,
                'is_fall' => $newState['isFallSemester'],
                'courses' => $newState['semesterCourses'],
                'total_credits' => $newState['semesterCredits']
            ];
        }
        $newState['semester']++;
        $newState['isFallSemester'] = !$state['isFallSemester'];
        $newState['semesterCredits'] = 0;
        $newState['semesterCourses'] = [];

        return $newState;
    }

    /**
     * A megoldást a kívánt formára alakítja, üres félévekkel kiegészítve.
     *
     * @param array $solution A nyers legjobb megoldás állapota
     * @param array $positiveCoursesToTake A pozitív kurzusok adatai (warningokhoz)
     * @return array A formázott megoldás
     */
    private function formatSolution(array $solution, array $positiveCoursesToTake): array
    {
        $formattedSemesters = []; // Ez lesz a végső, 0-indexelt tömb
        $lastProcessedSemesterNum = 0; // Az utolsó feldolgozott félév sorszáma
        $currentIsFall = $this->startWithFall; // Az 1. félév szezonja
        if(isset($solution['semesterCourses'])){
            $solution['plan'][] = [
                'semester_num' => $solution['semester'],
                'is_fall' => $solution['isFallSemester'],
                'courses' => $solution['semesterCourses'],
                'total_credits' => $solution['semesterCredits']
            ];
        }
        for($i = 1 ; $i <=  $solution['semester']; $i++ ){
            $exist = null;
            foreach ($solution['plan'] as $item) {
                if ($item['semester_num'] === $i) {
                    $exist = $item;
                    break;
                }
            }
            
            if($exist !== null){
                $formattedSemesters[] = [
                    "is_fall" => $exist['is_fall'],
                    "courses" => $exist['courses'],
                    "total_credits" => $exist['total_credits'],
                ];
                $currentIsFall = !$currentIsFall;
            }else{
                $formattedSemesters[] =  [
                    "is_fall" => $currentIsFall,
                    "courses" => [],
                    "total_credits" => 0,
                ];
                $currentIsFall = !$currentIsFall;
            }
        }
       




        // --- Eredmény formázása (többi része változatlan) ---
        $studyPlan = [
            'semesters' => $formattedSemesters, // A helyesen felépített tömb
            'total_credits' => 0, // Újraszámoljuk
            'total_courses' => 0, // Újraszámoljuk
            'total_semesters' => count($formattedSemesters), // A végső tömb mérete
            'all_requirements_met' => true // Később számoljuk
        ];

        // Újraszámoljuk a krediteket és kurzusokat a formázott terv alapján
        $totalCredits = 0;
        $totalCourses = 0;
        foreach ($studyPlan['semesters'] as $semester) {
            if (is_array($semester) && isset($semester['total_credits'])) {
                $totalCredits += $semester['total_credits'];
                $totalCourses += count($semester['courses']);
            }
        }
        $studyPlan['total_credits'] = $totalCredits;
        $studyPlan['total_courses'] = $totalCourses;

   
        return $studyPlan;
    }

    /**
     * Segédfüggvény a kategória kreditek frissítéséhez (history feldolgozáshoz).
     */
    private function updateCategoryCredits(array $course, array &$categoryCredits): void
    {
        if (!isset($course['categories']) || !is_array($course['categories'])) { return; }
        foreach ($course['categories'] as $categoryId) {
            if (isset($categoryCredits[$categoryId])) {
                $categoryCredits[$categoryId] += $course['kredit'];
            }
        }
    }

    /**
     * Get credits breakdown by category and specialization.
     */
    public function getCreditsBreakdown(array $studyPlan): array
    {
        // Feltételezve, hogy ez a függvény helyes és változatlan
        $categoryCredits = [];
        $coursesInPlan = [];
        if (!isset($studyPlan['semesters']) || !is_array($studyPlan['semesters'])) { return []; }
        foreach ($studyPlan['semesters'] as $semester) {
            if (is_array($semester) && isset($semester['courses']) && is_array($semester['courses'])) {
                foreach ($semester['courses'] as $course) {
                    if(is_array($course) && isset($course['id']) && isset($course['kredit'])){
                         if (!isset($coursesInPlan[$course['id']])) { $coursesInPlan[$course['id']] = $course['kredit']; }
                    }
                }
            }
        }
        foreach ($coursesInPlan as $courseId => $kredit) {
            if (!isset($this->courseCategories[$courseId])) { continue; }
            foreach ($this->courseCategories[$courseId] as $categoryId) {
                 if (!isset($categoryCredits[$categoryId])) { $categoryCredits[$categoryId] = 0; }
                 if (is_numeric($kredit)) { $categoryCredits[$categoryId] += $kredit; }
            }
        }
        $result = [];
        $relevantSpecializationIds = $this->relevantCategories ? $this->relevantCategories->pluck('specialization_id')->unique()->toArray() : [];
        if(!isset($this->curriculum->specializations) || !is_iterable($this->curriculum->specializations)){ return []; }
        foreach ($this->curriculum->specializations as $specialization) {
            if(!is_object($specialization) || !isset($specialization->name) || !isset($specialization->min)){ continue; }
            $isRelevantOrRequired = $specialization->required || in_array($specialization->id, $relevantSpecializationIds);
            if (!$isRelevantOrRequired) { continue; }
            $specResult = [
                'specialization_name' => $specialization->name, 'categories' => [],
                'is_completed' => true, 'credits_earned' => 0,
                'min' => $specialization->min, 'required' => $specialization->required
            ];
            $totalSpecCreditsEarned = 0;
            if(!isset($specialization->categories) || !is_iterable($specialization->categories)){
                 if (!$specialization->required) continue;
            } else {
                foreach ($specialization->categories as $category) {
                    if(!is_object($category) || !isset($category->id) || !isset($category->name) || !isset($category->min)){ continue; }
                    $isRelevantCategory = $this->relevantCategories && $this->relevantCategories->contains('id', $category->id);
                    $creditsEarned = $categoryCredits[$category->id] ?? 0;
                    $isCategoryCompleted = $creditsEarned >= $category->min;
                    $specResult['categories'][] = [
                        'category_name' => $category->name, 'min' => $category->min,
                        'max' => $category->max ?? 0, 'credits_earned' => $creditsEarned,
                        'is_completed' => $isCategoryCompleted,
                    ];
                    if ($isRelevantCategory) { $totalSpecCreditsEarned += $creditsEarned; }
                    if ($isRelevantCategory && !$isCategoryCompleted) { $specResult['is_completed'] = false; }
                }
            }
             if ($totalSpecCreditsEarned < $specialization->min) { $specResult['is_completed'] = false; }
             $specResult['credits_earned'] = $totalSpecCreditsEarned;
            $result[] = $specResult;
        }
        return $result;
    }

    /**
     * Ellenőrzi az előkövetelményeket.
     */
    private function checkPrerequisites(int $courseId, array $completedCourses): bool
    {
        if (!isset($this->allCoursePreRequisites[$courseId]) || empty($this->allCoursePreRequisites[$courseId])) {
            return true;
        }
        foreach ($this->allCoursePreRequisites[$courseId] as $prerequisiteId) {
            if (!in_array($prerequisiteId, $completedCourses)) {
                return false;
            }
        }
        return true;
    }

    // isMandatoryCourse függvény eltávolítva, mivel nem használtuk.

}
