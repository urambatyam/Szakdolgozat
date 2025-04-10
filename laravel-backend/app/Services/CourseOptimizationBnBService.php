<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Curriculum;
use Illuminate\Support\Collection;

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
    private ?Collection $relevantCategories = null;
    private array $relevantCategoryIds = [];
    private array $relevantCourses = [];
    private array $positiveCourseIds = []; 
    private ?array $bestSolution = null; 
    private int $bestSolutionCost = PHP_INT_MAX;
    private int $nodesExplored = 0;
    private bool $considerRecommendedSemester = false;
    private bool $startWithFall = true;
    private int $maxIterations = 1000000;
    private int $timeLimit = 59;
    private float $startTime;

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
     * Ellenőrzi, hogy a megadott feltételekkel egyáltalán lehetséges-e megoldás.
     * 
     * @param array $positiveCoursesToTake A pozitív kurzusok adatai
     * @param array $negativeIds A negatív kurzusok azonosítói
     * @return array [bool $possible, string $errorMessage]
     */
    private function isProblemSolvable(array $positiveCoursesToTake, array $negativeIds): array
    {
        // 1. Ellenőrzés: Pozitív kurzus ne legyen a negatív listában
        foreach (array_keys($positiveCoursesToTake) as $positiveCourseId) {
            if (in_array($positiveCourseId, $negativeIds)) {
                return [false, "Konfliktus: A(z) {$this->allCourses[$positiveCourseId]->name} kötelező kurzus szerepel a tiltólistán is."];
            }
        }
        
        // 2. Ellenőrzés: Pozitív kurzus előkövetelménye ne legyen a negatív listában
        foreach ($positiveCoursesToTake as $courseId => $courseData) {
            if (!isset($courseData['prerequisites'])) continue;
            
            foreach ($courseData['prerequisites'] as $prerequisiteId) {
                if (in_array($prerequisiteId, $negativeIds)) {
                    $courseName = $this->allCourses[$courseId]->name ?? "Ismeretlen";
                    $prereqName = $this->allCourses[$prerequisiteId]->name ?? "Ismeretlen";
                    return [false, "Konfliktus: A(z) {$courseName} kötelező kurzus előkövetelménye ({$prereqName}) szerepel a tiltólistán."];
                }
            }
        }
        
        // 3. Ellenőrzés: kategória követelmények teljesíthetősége
        $availableCreditsPerCategory = [];
        foreach ($this->relevantCategoryIds as $categoryId) {
            $availableCreditsPerCategory[$categoryId] = 0;
        }
        
        // Számoljuk össze a releváns és nem tiltott kurzusok kreditjeit kategóriánként
        foreach ($this->allCourses as $courseId => $course) {
            if (in_array($courseId, $negativeIds)) continue;
            
            if (isset($this->courseCategories[$courseId])) {
                foreach ($this->courseCategories[$courseId] as $categoryId) {
                    if (isset($availableCreditsPerCategory[$categoryId])) {
                        $availableCreditsPerCategory[$categoryId] += $course->kredit;
                    }
                }
            }
        }
        
        // Ellenőrizzük, hogy minden kategóriában van-e elég kredit a minimumhoz
        foreach ($this->relevantCategoryIds as $categoryId) {
            $category = $this->relevantCategories->firstWhere('id', $categoryId);
            if (!$category) continue;
            
            if ($availableCreditsPerCategory[$categoryId] < $category->min) {
                $categoryName = $category->name ?? "Ismeretlen";
                return [false, "A(z) {$categoryName} kategória követelményei nem teljesíthetők a megadott feltételekkel. (Minimum: {$category->min}, Elérhető: {$availableCreditsPerCategory[$categoryId]})"];
            }
        }
        
        // 4. Ellenőrzés: pozitív kurzusok közötti előkövetelmény-lánc vizsgálata
        $prerequisiteGraph = [];
        $visited = [];
        $stack = [];
        
        // Gráf építése
        foreach ($positiveCoursesToTake as $courseId => $courseData) {
            if (!isset($prerequisiteGraph[$courseId])) {
                $prerequisiteGraph[$courseId] = [];
            }
            
            if (isset($courseData['prerequisites'])) {
                foreach ($courseData['prerequisites'] as $prereqId) {
                    if (!isset($prerequisiteGraph[$prereqId])) {
                        $prerequisiteGraph[$prereqId] = [];
                    }
                    $prerequisiteGraph[$prereqId][] = $courseId;
                }
            }
        }
        
        // Körkörös függőségek keresése (kör a gráfban)
        foreach (array_keys($positiveCoursesToTake) as $courseId) {
            if (isset($prerequisiteGraph[$courseId])) {
                $visited = [];
                $stack = [];
                if ($this->hasCycle($courseId, $prerequisiteGraph, $visited, $stack)) {
                    return [false, "Körkörös függőség észlelhető a kötelező kurzusok között."];
                }
            }
        }
        
        return [true, ""];
    }

    /**
     * Ellenőrzi, hogy van-e kör a gráfban (körkörös függőség).
     */
    private function hasCycle($node, $graph, &$visited, &$stack): bool
    {
        if (!isset($visited[$node])) {
            $visited[$node] = true;
            $stack[$node] = true;
            
            if (isset($graph[$node])) {
                foreach ($graph[$node] as $neighbor) {
                    if (!isset($visited[$neighbor]) && $this->hasCycle($neighbor, $graph, $visited, $stack)) {
                        return true;
                    } else if (isset($stack[$neighbor])) {
                        return true;
                    }
                }
            }
        }
        
        unset($stack[$node]);
        return false;
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
     * @param array $nagativIds = [], Az elkerülendő kurzusok ID-jai.
     * @param array $pozitivCoursesData = [] A kötelezően felveendő kurzusok adatai.     
     * @return array Az optimalizált tanulási tervet adja vissza.
     */
    public function generateOptimalPlan(array $selectedSpecializationIds, bool $startWithFall = true, bool $considerRecommendedSemester = false, array $history = [], array $nagativIds = [], array $pozitivCoursesData = []): array
    {
        
        $this->startTime = microtime(true);
        $this->startWithFall = $startWithFall;
        $this->considerRecommendedSemester = $considerRecommendedSemester;
        $this->bestSolution = null;
        $this->bestSolutionCost = PHP_INT_MAX;
        $this->nodesExplored = 0;
        //$this->positiveCourseIds = [];

        // Kötelező specializáció hozzáadása
        foreach($this->curriculum->specializations as $sp){
            if($sp->required && !in_array($sp->id, $selectedSpecializationIds)){
                $selectedSpecializationIds[] = $sp->id;
            }
        }
        /**
         * @var array $selectedSpecializations A kiválasztott specializációk tömbje.
         */
        $selectedSpecializations = $this->curriculum->specializations->whereIn('id', $selectedSpecializationIds);

        $this->relevantCategories = collect();
        foreach ($selectedSpecializations as $specialization) {
            $this->relevantCategories = $this->relevantCategories->merge($specialization->categories);
        }
        $this->relevantCategories = $this->relevantCategories->unique('id');
        $this->relevantCategoryIds = $this->relevantCategories->pluck('id')->toArray();

        // A negativ kurzusokra épülő kurzusokat beleteszem a negativba
        $processedNegativeIds = []; 
        $queue = $nagativIds; 
        $allNegativeIds = $nagativIds;

        while (!empty($queue)) {
            $currentCourseId = array_shift($queue); 

            if (in_array($currentCourseId, $processedNegativeIds)) {
                continue; 
            }
            $processedNegativeIds[] = $currentCourseId; 

            
            $courseModel = $this->allCourses[$currentCourseId];
            if ($courseModel) {
                $dependentCourseIds = $courseModel->isPrerequisiteFor()->pluck('course_id')->toArray();

                foreach ($dependentCourseIds as $dependentId) {
                    if (!in_array($dependentId, $allNegativeIds)) {
                        $allNegativeIds[] = $dependentId; 
                        $queue[] = $dependentId;         
                    }
                }
            }
        }
        $nagativIds = array_unique($allNegativeIds); 

        // Releváns kurzusok összegyűjtése és negatívak kiszürése
        $this->relevantCourses = [];
        foreach ($this->allCourses as $courseId => $course) {
            if (!isset($this->courseCategories[$courseId])) continue;
            /**
             * @var array $courseRelevantCategories A kurzushoz tartozó releváns kategóriák tömbje.
            */
            $courseRelevantCategories = array_intersect($this->courseCategories[$courseId], $this->relevantCategoryIds);
            if (empty($courseRelevantCategories)) continue;
            if (in_array($courseId, $nagativIds)) continue; 
            /**
             * @var array $prerequisites A kurzushoz tartozó előzmények tömbje.
            */
            $prerequisites = $this->allCoursePreRequisites[$courseId] ?? [];
            /**
             * @var array $efficiency A kurzushoz számolt heurisztika.
            */
            $efficiency = ($course->kredit * count($courseRelevantCategories));
            $this->relevantCourses[$courseId] = [
                'id' => $course->id, 'name' => $course->name, 'kredit' => $course->kredit,
                'recommendedSemester' => $course->recommendedSemester, 'sezon' => $course->sezon,
                'categories' => $courseRelevantCategories, 'prerequisites' => $prerequisites,
                'efficiency' => $efficiency
            ];
        }

        // A pozitv kurzusok kiválasztása
        $positiveCoursesToTake = []; 
        foreach ($pozitivCoursesData as $courseId => $courseData) {
             if (isset($this->allCourses[$courseId]) && !in_array($courseId, $nagativIds)) {
                 $courseData['prerequisites'] = $this->allCoursePreRequisites[$courseId] ?? [];
                 $courseData['categories'] = $this->courseCategories[$courseId] ?? [];
                 $courseData['efficiency'] = $courseData['efficiency'] ?? ($courseData['kredit'] * count($courseData['categories']));
                 $positiveCoursesToTake[$courseId] = $courseData;
                 unset($this->relevantCourses[$courseId]); 
             }
        }
        $this->positiveCourseIds = array_keys($positiveCoursesToTake); 

        // Rendezés hát ha gyorsitja
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
        [$solvable, $errorMessage] = $this->isProblemSolvable($positiveCoursesToTake, $nagativIds);
        if (!$solvable) {
            return [
                'semesters' => [], 
                'total_credits' => 0, 
                'total_courses' => 0,
                'total_semesters' => 0, 
                'all_requirements_met' => false,
                'warnings' => [$errorMessage],
                'nodes_explored' => 0,
            ];
        }
        // Branch and Bound futtatása
        $this->branchAndBound($initialState, $positiveCoursesToTake);

        // Eredmény visszaadása
        if ($this->bestSolution === null) {
            $reason = "Unknown reason";
            if ($this->nodesExplored >= $this->maxIterations) {
                $reason = "Maximum iterations exceeded";
            } elseif (microtime(true) - $this->startTime >= $this->timeLimit) {
                $reason = "Time limit exceeded";
            }
            
            return [
                'semesters' => [], 
                'total_credits' => 0, 
                'total_courses' => 0,
                'total_semesters' => 0, 
                'all_requirements_met' => false,
                'warnings' => ["No valid curriculum found with the given conditions. ($reason)"],
                'nodes_explored' => $this->nodesExplored,
            ];
        }

        $studyPlan = $this->formatSolution($this->bestSolution, $positiveCoursesToTake);
        $studyPlan['nodes_explored'] = $this->nodesExplored;
        return $studyPlan;
    }
    private function hashState(array $state): string
    {
        return md5(
            implode(',', $state['selectedCourses']) . '|' . 
            $state['semester'] . '|' . 
            ($state['isFallSemester'] ? '1' : '0')
        );
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
        $stateHash = $this->hashState($state);
        static $visitedStates = [];
        if (isset($visitedStates[$stateHash])) {
            return;
        }
        $visitedStates[$stateHash] = true;
        $this->nodesExplored++;
    
        // Check iteration and time limits
        if ($this->nodesExplored > $this->maxIterations) {
            return; // Exceeded max iterations, stop searching
        }
        
        if (microtime(true) - $this->startTime > $this->timeLimit) {
            return; // Exceeded time limit, stop searching
        }

        // 1. Megoldás ellenőrzése
        if ($this->isSolution($state)) {
            $cost = count($state['selectedCourses']); 
            if ($cost < $this->bestSolutionCost) {
                $this->bestSolution = $state;
                $this->bestSolutionCost = $cost;
            }
            return; 
        }

        // 2. Bounding 
        $lowerBound = $this->calculateLowerBound($state, $positiveCoursesToTake);
        if ($lowerBound >= $this->bestSolutionCost) {
            return; 
        }

        // 3. Elérhető kurzusok lekérdezése a félévre
        $availableCourses = $this->getAvailableCourses($state);

        // 4. Elágazás (Branching)
        $movedToNextSemester = false;

        if ($state['semesterCredits'] < $this->maxCreditsPerSemester) {
            foreach ($availableCourses as $courseId => $course) {
                if ($state['semesterCredits'] + $course['kredit'] <= $this->maxCreditsPerSemester) {
                    $newStateTake = $this->takeCourse($state, $courseId, $course);
                    $this->branchAndBound($newStateTake, $positiveCoursesToTake);
                }
            }
        }

        // Ha a félév tele van, vagy a fenti ciklus lefutott 
        // Lépjünk a következő félévre.
        if (!$movedToNextSemester) {
             $newStateNextSem = $this->moveToNextSemester($state);
             // Biztonsági limit a félévszámra
             if ($newStateNextSem['semester'] <= 20) {
                 $this->branchAndBound($newStateNextSem, $positiveCoursesToTake);
                 $movedToNextSemester = true;
             }
        }
    }

    /**
     * Ellenőrzi, hogy egy adott állapot megoldás-e.
     * @param array $state Az aktuális állapot
     * @return bool Megoldás?
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
     * @param array $state Az aktuális állapot
     * @param array $positiveCoursesToTake A pozitív kurzusok adatai
     * @return int Az alsó korlát
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

        // Megbecslem hogy ebből az álapotból még hány kurzust kell felvenem hogy össze tudja hadonlitani az alós korlátal vágáshoz.
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

        // hozzáadom a becslés hez a hiányzó pozitivakat
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
     * @param array $state Az aktuális állapot
     * @return array Az elérhető kurzusok
     */
    private function getAvailableCourses(array $state): array
    {
        $availableCourses = [];
        $seasonFilter = $state['isFallSemester'] ? 1 : 0;

        $candidateCourseIds = array_merge(
            array_keys(array_diff_key($this->relevantCourses, array_flip($state['selectedCourses']))),
            array_diff($this->positiveCourseIds, $state['selectedCourses'])
        );
        $candidateCourseIds = array_unique($candidateCourseIds);


        foreach ($candidateCourseIds as $courseId) {
            if (!isset($this->allCourses[$courseId])) continue;
            $courseModel = $this->allCourses[$courseId];
            $courseData = [
                'id' => $courseId, 'name' => $courseModel->name, 'kredit' => $courseModel->kredit,
                'recommendedSemester' => $courseModel->recommendedSemester, 'sezon' => $courseModel->sezon,
                'categories' => $this->courseCategories[$courseId] ?? [],
                'prerequisites' => $this->allCoursePreRequisites[$courseId] ?? [],
            ];

            // feltételek

            // 1. Szezon ellenőrzése
            if ($courseData['sezon'] !== null && $courseData['sezon'] !== $seasonFilter) {
                continue;
            }

            // 2. Ajánlott félév ellenőrzése ha kell
            if ($this->considerRecommendedSemester && $state['semester'] < $courseData['recommendedSemester']) {
                continue;
            }

            // 3. Előkövetelmények ellenőrzése
            if (!$this->checkPrerequisites($courseId, $state['completedCourses'])) {
                continue;
            }

            // 4. Relevancia ellenőrzése (csak ha nem pozitív kurzus) 
            // Mert ha egy releváns kategoria teljeül a csak abba számitó kurzusok már többé nem rellevánsok
            if (!in_array($courseId, $this->positiveCourseIds)) {
                $stillRelevant = false; 
                if (isset($courseData['categories']) && is_array($courseData['categories'])) { 
                    foreach ($courseData['categories'] as $categoryId) {
                        if (in_array($categoryId, $this->relevantCategoryIds)) {
                            $category = $this->relevantCategories->firstWhere('id', $categoryId);
                            if ($category && (!isset($state['categoryCredits'][$categoryId]) || $state['categoryCredits'][$categoryId] < $category->min)) {
                                $stillRelevant = true; 
                                break; 
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

        return $availableCourses;
    }

    /**
     * Új állapotot hoz létre a kurzus felvételével.
     * 
     * @param array $state Az aktuális állapot
     * @param int $courseId A felvett kurzus azonosítója
     * @param array $course A felvett kurzus
     * @return array Az új állapot
     */
    private function takeCourse(array $state, int $courseId, array $course): array
    {
        $newState = $state;
        if (!in_array($courseId, $newState['selectedCourses'])) { $newState['selectedCourses'][] = $courseId; }
        if (!in_array($courseId, $newState['completedCourses'])) { $newState['completedCourses'][] = $courseId; }

        if (isset($course['categories']) && is_array($course['categories'])) { 
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
     * @param array $state Az aktuális állapot
     * @return array Az új állapot
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
     * @return array A formázott megoldás
     */
    private function formatSolution(array $solution): array
    {
        $formattedSemesters = []; 
        $currentIsFall = $this->startWithFall;
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
       
        $studyPlan = [
            'semesters' => $formattedSemesters, 
            'total_credits' => 0, 
            'total_courses' => 0, 
            'total_semesters' => count($formattedSemesters), 
            'all_requirements_met' => true
        ];

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
     * 
     * @param array $course luzus
     * @param array &$categoryCredits kategória kreditek tömbje
     * @return void
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
     * Ellenőrzi az előkövetelményeket.
     * @param int $courseId A vizsgált kurzus azonosítója
     * @param array $completedCourses A teljesített kurzusok azonosítóinak tömbje
     * @return bool Az előkövetelmények ellenőrzése sikeres-e?
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

    /**
     * Teszt/Analizis
     * @param $studyPlan a megolsás
     * @return array Egész tanterves kimutás arról hogy a optimum menyit számitott belle az egyes félévekbe.
     */
    public function getCreditsBreakdown(array $studyPlan): array
    {
        $categoryCredits = [];
        $courses = [];

        if (!isset($studyPlan['semesters']) || !is_array($studyPlan['semesters'])) {
             return [];
        }


        foreach ($studyPlan['semesters'] as $semester) {
            if (is_array($semester) && isset($semester['courses'])) {
                foreach ($semester['courses'] as $course) {
                    if(is_array($course) && isset($course['id']) && isset($course['kredit'])){
                        $courses[] = $course;
                    }
                }
            }
        }

        foreach ($courses as $course) {
            $courseId = $course['id'];

            if (!isset($this->courseCategories[$courseId])) {
                continue; 
            }

            foreach ($this->courseCategories[$courseId] as $categoryId) {
                if (!isset($categoryCredits[$categoryId])) {
                    $categoryCredits[$categoryId] = 0;
                }
                if(is_numeric($course['kredit'])){
                    $categoryCredits[$categoryId] += $course['kredit'];
                }
            }
        }

        $result = [];
        if(!isset($this->curriculum->specializations) || !is_iterable($this->curriculum->specializations)){
            return []; 
        }

        foreach ($this->curriculum->specializations as $index => $specialization) {
            if(!is_object($specialization) || !isset($specialization->name) || !isset($specialization->min)){
                 continue;
            }

            $result[$index] = [
                'specialization_name' => $specialization->name,
                'categories' => [],
                'is_completed' => true,
                'credits_earned' => 0,
                'max' => 0, 
                'min' => $specialization->min
            ];

            if(!isset($specialization->categories) || !is_iterable($specialization->categories)){
                 continue; 
            }


            foreach ($specialization->categories as $category) {
                 if(!is_object($category) || !isset($category->id) || !isset($category->name) || !isset($category->min)){
                     continue;
                 }

                $creditsEarned = $categoryCredits[$category->id] ?? 0;

                $result[$index]['categories'][] = [
                    'category_name' => $category->name,
                    'min' => $category->min,
                    'max' => $category->max ?? 0, 
                    'credits_earned' => $creditsEarned,
                    'is_completed' => $creditsEarned >= $category->min,
                ];

                $result[$index]['max'] += $category->max ?? 0;
                $result[$index]['credits_earned'] += $creditsEarned;

                if ($creditsEarned < $category->min) {
                    $result[$index]['is_completed'] = false;
                }
            }
        }

        return $result;
    }
}
