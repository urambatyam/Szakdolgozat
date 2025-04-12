<?php

namespace App\Services;

use App\Models\Curriculum;
use Illuminate\Support\Collection;

/**
 * Kurzusok optimalizálása mohó algoritmus alapján.
 *
 * @property int $timeLimit idő limit másdopercben
 * @property float $startTime kezdés ideje
 */
class CourseOptimizationService
{
    private Curriculum $curriculum;
    private array $allCourses = [];
    private array $courseCategories = [];
    private int $maxCreditsPerSemester = 30;
    private array $allCoursePreRequisites = [];
    private ?Collection $relevantCategories = null;
    private int $timeLimit = 59;
    private float $startTime;

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
     * Ellenőrzi, hogy a tanterv optimalizációs probléma megoldható-e.
     *
     * @param array $positiveCoursesToTake A kötelezően felveendő kurzusok
     * @param array $negativeIds A tiltott kurzusok azonosítói
     * @return array [bool $solvable, string $errorMessage]
     */
    private function isProblemSolvable(array $positiveCoursesToTake, array $negativeIds): array
    {
        // 1. Ellenőrizzük, hogy van-e átfedés a pozitív és negatív kurzusok között
        $conflictingCourses = array_intersect(array_keys($positiveCoursesToTake), $negativeIds);
        if (!empty($conflictingCourses)) {
            $conflictNames = [];
            foreach ($conflictingCourses as $courseId) {
                $name = $positiveCoursesToTake[$courseId]['name'] ?? ($this->allCourses[$courseId]->name ?? "ID: {$courseId}");
                $conflictNames[] = $name;
            }
            return [
                false,
                "Konfliktus: egyes kurzusok egyszerre kötelezőek és tiltottak is (" . implode(', ', $conflictNames) . ")."
            ];
        }

        // 2. Ellenőrizzük a pozitív kurzusok előfeltételeit
        foreach ($positiveCoursesToTake as $courseId => $courseData) {
            $prerequisites = $this->allCoursePreRequisites[$courseId] ?? [];
            
            // Kizárt előfeltételek keresése
            $blockedPrereqs = array_intersect($prerequisites, $negativeIds);
            if (!empty($blockedPrereqs)) {
                $courseName = $courseData['name'] ?? ($this->allCourses[$courseId]->name ?? "ID: {$courseId}");
                $blockedPrereqNames = [];
                foreach ($blockedPrereqs as $prereqId) {
                    $prereqName = isset($this->allCourses[$prereqId]) ? $this->allCourses[$prereqId]->name : "ID: {$prereqId}";
                    $blockedPrereqNames[] = $prereqName;
                }
                return [
                    false,
                    "A(z) '{$courseName}' kurzust fel kell venni, de annak előfeltételei (" . implode(', ', $blockedPrereqNames) . ") tiltva vannak."
                ];
            }
        }
        return [true, ""];
    }


    /**
     * Generálja az optimális tantervet a mohó algoritmus alapján.
     * 
     * 
     */
    public function generateOptimalPlan(
        array $selectedSpecializationIds,
        bool $startWithFall = true,
        bool $considerRecommendedSemester = false,
        array $history = [],
        array $nagativIds = [],
        array $pozitivCoursesData = []
    ): array {
        $this->startTime = microtime(true);
        foreach ($this->curriculum->specializations as $sp) {
            if ($sp->required && !in_array($sp->id, $selectedSpecializationIds)) {
                $selectedSpecializationIds[] = $sp->id;
            }
        }
        $selectedSpecializations = $this->curriculum->specializations->whereIn('id', $selectedSpecializationIds);
        $this->relevantCategories = collect();
        foreach ($selectedSpecializations as $specialization) {
            $this->relevantCategories = $this->relevantCategories->merge($specialization->categories);
        }
        $this->relevantCategories = $this->relevantCategories->unique('id');
        $relevantCategoryIds = $this->relevantCategories->pluck('id')->toArray();

        $relevantCourses = [];
        foreach ($this->allCourses as $courseId => $course) {
            if (!isset($this->courseCategories[$courseId])) continue;
            $courseRelevantCategories = array_intersect($this->courseCategories[$courseId], $relevantCategoryIds);
            if (empty($courseRelevantCategories)) continue;
            if (in_array($courseId, $nagativIds)) continue;
            $prerequisites = $this->allCoursePreRequisites[$courseId] ?? [];
            $relevantCourses[$courseId] = [
                'id' => $course->id, 'name' => $course->name, 'kredit' => $course->kredit,
                'recommendedSemester' => $course->recommendedSemester, 'sezon' => $course->sezon,
                'categories' => $courseRelevantCategories, 'prerequisites' => $prerequisites,
                'efficiency' => ($course->kredit * count($courseRelevantCategories))
            ];
        }

        $positiveCoursesToTake = [];
        foreach ($pozitivCoursesData as $courseId => $courseData) {
             if (isset($this->allCourses[$courseId]) && !in_array($courseId, $nagativIds)) { 
                 $courseData['prerequisites'] = $this->allCoursePreRequisites[$courseId] ?? [];
                 $courseData['categories'] = $this->courseCategories[$courseId] ?? [];
                 $courseData['efficiency'] = $courseData['efficiency'] ?? ($courseData['kredit'] * count($courseData['categories']));
                 $positiveCoursesToTake[$courseId] = $courseData;
                 unset($relevantCourses[$courseId]);
             }
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
            ];
        }

        $studyPlan = ['semesters' => [], 'warnings' => []];
        $completedCourses = [];
        $categoryCredits = array_fill_keys($relevantCategoryIds, 0);
        $categoriesCompleted = array_fill_keys($relevantCategoryIds, false);
        $currentSemester = 1;
        $isFallSemester = $startWithFall;
        $availableCourses = $relevantCourses;
        $positiveCoursesTaken = [];
        $emptySemesterCount = 0;
        $timeLimitReached = false;

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
                         if (!in_array($courseId, $completedCourses)) { $completedCourses[] = $courseId; }
                         if (isset($this->courseCategories[$courseId])) {
                             $courseDataForUpdate = ['kredit' => $courseModel->kredit, 'categories' => $this->courseCategories[$courseId]];
                             if ($this->relevantCategories) { $this->updateCategoryCredits($courseDataForUpdate, $categoryCredits, $categoriesCompleted, $this->relevantCategories); }
                         }
                         unset($availableCourses[$courseId]);
                         if (isset($positiveCoursesToTake[$courseId])) {
                             if (!in_array($courseId, $positiveCoursesTaken)) { $positiveCoursesTaken[] = $courseId; }
                         }
                     }
                 }
                 $studyPlan['semesters'][] = ['is_fall' => $semesterData['is_fall'], 'courses' => $semesterCourses, 'total_credits' => $semesterCredits];
                 $isFallSemester = !$semesterData['is_fall'];
            }
            $currentSemester = $lastHistorySemesterIndex + 1;
        }


        while (true) {
            if (microtime(true) - $this->startTime > $this->timeLimit) {
                $timeLimitReached = true;
                $studyPlan['warnings'][] = "Az algoritmus elérte az időkorlátot ({$this->timeLimit}s) a tervezés közben.";
                break; 
            }

            if ($emptySemesterCount >= 2) {
                $studyPlan['warnings'][] = "Az algoritmus megállt, mert 2 egymást követő félévben nem sikerült kurzust felvenni.\n";
                break;
            }

            $allCategoriesDone = !in_array(false, $categoriesCompleted, true);
            $remainingPositiveIds = array_diff(array_keys($positiveCoursesToTake), $positiveCoursesTaken);
            $allPositiveDone = empty($remainingPositiveIds);
  
            if ($allCategoriesDone && $allPositiveDone) {
                break; 
            }

            $currentSemesterPlan = ['is_fall' => $isFallSemester, 'courses' => [], 'total_credits' => 0];
            $creditsThisSemester = 0;
            $coursesAddedThisSemesterIds = [];
            $courseAdded = false;
            $seasonFilter = $isFallSemester ? 1 : 0;

            // 1. Pozitív kurzusok ellenőrzése és felvétele ha lehet
            foreach ($positiveCoursesToTake as $courseId => $course) {
                if (in_array($courseId, $positiveCoursesTaken) || in_array($courseId, $coursesAddedThisSemesterIds)) {
                    continue;
                }

                // Ellenőrzöm:
                // A pozitiv kurzus előfeltétele teljesült
                $prereqsOK = $this->checkPrerequisites($courseId, $completedCourses);
                // A pozitiv kurzus jó sezonban van
                $seasonOk = ($course['sezon'] === null || $course['sezon'] === $seasonFilter);
                // ha felveszem a kurzust limiten belül vagyunk
                $creditLimitOk = ($creditsThisSemester + $course['kredit'] <= $this->maxCreditsPerSemester);
                // Ajánlott félév feltétel
                $recommendedOk = !$considerRecommendedSemester || $currentSemester >= $course['recommendedSemester'];

                // Ha jó felvesszük
                if ($prereqsOK && $seasonOk && $creditLimitOk && $recommendedOk) {
                    $currentSemesterPlan['courses'][] = ['id' => $courseId, 'name' => $course['name'], 'kredit' => $course['kredit']];
                    $creditsThisSemester += $course['kredit'];
                    $coursesAddedThisSemesterIds[] = $courseId;
                    if (!in_array($courseId, $completedCourses)) { $completedCourses[] = $courseId; }
                    if (!in_array($courseId, $positiveCoursesTaken)) { $positiveCoursesTaken[] = $courseId; }
                    if ($this->relevantCategories) { $this->updateCategoryCredits($course, $categoryCredits, $categoriesCompleted, $this->relevantCategories); }
                    $courseAdded = true;
                    unset($availableCourses[$courseId]);
                }
            }


            // Mohó algoritmus
            $semesterAvailableCourses = [];
            foreach ($availableCourses as $courseId => $course) {
                if (!in_array($courseId, $coursesAddedThisSemesterIds) && ($course['sezon'] === null || $course['sezon'] === $seasonFilter)) {
                    $semesterAvailableCourses[$courseId] = $course;
                }
            }
            //rendzem heuresztika szerint
            uasort($semesterAvailableCourses, function($a, $b) {
                return ($b['efficiency'] ?? 0) <=> ($a['efficiency'] ?? 0);
            });

            foreach ($semesterAvailableCourses as $courseId => $course) {
                if ($creditsThisSemester >= $this->maxCreditsPerSemester) {
                    break; 
                }
                //előfeltétel teljesül
                $prereqsOK = $this->checkPrerequisites($courseId, $completedCourses);
                // a félévenkénti minimum kredit
                $creditLimitOk = ($creditsThisSemester + $course['kredit'] <= $this->maxCreditsPerSemester);
                // Ajánlott félév feltétel
                $recommendedOk = !$considerRecommendedSemester || $currentSemester >= $course['recommendedSemester'];

                if ($prereqsOK && $creditLimitOk && $recommendedOk) {
                    $stillRelevant = false;
                    foreach ($course['categories'] as $categoryId) {
                        if (isset($categoriesCompleted[$categoryId]) && !$categoriesCompleted[$categoryId]) {
                            $stillRelevant = true; break;
                        }
                    }

                    if ($stillRelevant) {
                        $currentSemesterPlan['courses'][] = ['id' => $courseId, 'name' => $course['name'], 'kredit' => $course['kredit']];
                        $creditsThisSemester += $course['kredit'];
                        $coursesAddedThisSemesterIds[] = $courseId;
                        if (!in_array($courseId, $completedCourses)) { $completedCourses[] = $courseId; }
                        if ($this->relevantCategories) { $this->updateCategoryCredits($course, $categoryCredits, $categoriesCompleted, $this->relevantCategories); }
                        $courseAdded = true;
                        unset($availableCourses[$courseId]); 
                    } else {
                         unset($availableCourses[$courseId]); 
                    }
                }
            }
            $currentSemesterPlan['total_credits'] = $creditsThisSemester;
            $studyPlan['semesters'][] = $currentSemesterPlan;
            // Üres félév számláló frissítése
            if ($courseAdded) {
                $emptySemesterCount = 0;
            } else {
                $shouldWait = true;

                if ($considerRecommendedSemester) {
                    $isWaitingForFutureRecommended = false;
                    $remainingPositiveIdsToCheck = array_diff(array_keys($positiveCoursesToTake), $positiveCoursesTaken);
                    foreach ($remainingPositiveIdsToCheck as $courseId) {
                        if (isset($positiveCoursesToTake[$courseId]) && $positiveCoursesToTake[$courseId]['recommendedSemester'] > $currentSemester) {
                            $isWaitingForFutureRecommended = true;
                            break;
                        }
                    }
                    if (!$isWaitingForFutureRecommended) {
                        foreach ($availableCourses as $courseId => $course) {
                            if ($course['recommendedSemester'] > $currentSemester) {
                                $isWaitingForFutureRecommended = true;
                                break;
                            }
                        }
                    }
                    if ($isWaitingForFutureRecommended) {
                        $shouldWait = false;
                    }
                }
                if ($shouldWait) {
                    $emptySemesterCount++;
                }
            }

            // Következő félévre lépés (akkor is, ha nem vettünk fel semmit)
            $currentSemester++;
            $isFallSemester = !$isFallSemester;

        }

        $finalRemainingPositiveIds = array_diff(array_keys($positiveCoursesToTake), $positiveCoursesTaken);
        $allCategoriesCompleted = !in_array(false, $categoriesCompleted, true);

        if (!$allCategoriesCompleted) {
             $incompleteCategoryIds = array_keys(array_filter($categoriesCompleted, function($completed) { return !$completed; }));
             $incompleteCategories = [];
             if ($this->relevantCategories) {
                 foreach ($incompleteCategoryIds as $categoryId) {
                     $category = $this->relevantCategories->firstWhere('id', $categoryId);
                     if(!$category) continue;
                     $specialization = $selectedSpecializations->first(function($spec) use ($category) { return $spec->categories->contains('id', $category->id); });
                     $incompleteCategories[] = [
                         'category_id' => $categoryId, 'category_name' => $category->name,
                         'specialization_name' => $specialization ? $specialization->name : 'Ismeretlen',
                         'min_required' => $category->min, 'credits_earned' => $categoryCredits[$categoryId] ?? 0,
                         'credits_missing' => max(0, $category->min - ($categoryCredits[$categoryId] ?? 0))
                     ];
                 }
             }
             if (!isset($studyPlan['warnings']) || !in_array("Nem sikerült minden követelményt teljesíteni a megadott korlátok között.", $studyPlan['warnings'])) {
                $text = 'Nem sikerült ezeket a kategóriákat teljesíteni a megadott korlátok között: ';
                foreach($incompleteCategories as $incompleted){
                    $text = $text."Specializáció neve: ".$incompleted['specialization_name'].", kategoria neve: ".$incompleted['category_name'].", hiányzó kredit: ".$incompleted['credits_missing']."\n";
                }
                $studyPlan['warnings'][] = $text;
             }
        }

        // Ellenőrzés, hogy minden pozitív kurzust sikerült-e felvenni
        if (!empty($finalRemainingPositiveIds)) {
            
            $missedPositiveCourses = [];
            foreach($finalRemainingPositiveIds as $id) {
                $name = $positiveCoursesToTake[$id]['name'] ?? ($this->allCourses[$id]->name ?? "Ismeretlen kurzus (ID: {$id})");
                $missedPositiveCourses[] = $name;
            }
            foreach($missedPositiveCourses as $missed){
                $text = "Nem sikerült ezeket a (pozitív) kurzusokat beilleszteni a tervbe. (";
                $text = $text.$missed." ";
            }
            $text = $text.")\n";
            $studyPlan['warnings'][] = $text;
        }

        // Összesítések 
        $totalCredits = 0;
        $totalCourses = 0;
        foreach ($studyPlan['semesters'] as $semester) {
            if (is_array($semester) && isset($semester['total_credits']) && isset($semester['courses'])) {
                $totalCredits += $semester['total_credits'];
                $totalCourses += count($semester['courses']);
            }
        }
        $studyPlan['total_credits'] = $totalCredits;
        $studyPlan['total_courses'] = $totalCourses;
        $studyPlan['total_semesters'] = count($studyPlan['semesters']);
        $studyPlan['all_requirements_met'] = $allCategoriesCompleted && empty($finalRemainingPositiveIds); 
        
        if (empty($studyPlan['warnings'])) { unset($studyPlan['warnings']); }

        return $studyPlan;
    }

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

    private function updateCategoryCredits(array $course, array &$categoryCredits, array &$categoriesCompleted, Collection $relevantCategories): void
    {
        if (!isset($course['categories']) || !is_array($course['categories'])) {
            return;
        }
        foreach ($course['categories'] as $categoryId) {
            if (isset($categoryCredits[$categoryId])) {
                 $categoryCredits[$categoryId] += $course['kredit'];
                 if (!$categoriesCompleted[$categoryId]) {
                     $category = $relevantCategories->firstWhere('id', $categoryId);
                     if ($category && $categoryCredits[$categoryId] >= $category->min) {
                         $categoriesCompleted[$categoryId] = true;
                     }
                 }
            }
        }
    }

    public function getCreditsBreakdown(array $studyPlan): array
    {
        // A felhasználó által preferált verzió (feltételezve, hogy visszaállította)
        $categoryCredits = [];
        $courses = [];

        // Ellenőrizzük, hogy a studyPlan tartalmazza-e a 'semesters' kulcsot és az tömb-e
        if (!isset($studyPlan['semesters']) || !is_array($studyPlan['semesters'])) {
            // Kezeljük le az esetet, pl. üres tömb visszaadása vagy hiba jelzése
             return []; // Vagy egy specifikusabb hiba struktúra
        }


        foreach ($studyPlan['semesters'] as $semester) {
            if (is_array($semester) && isset($semester['courses'])) {
                foreach ($semester['courses'] as $course) {
                    // Biztonsági ellenőrzés, hogy a $course tömb és tartalmazza a szükséges kulcsokat
                    if(is_array($course) && isset($course['id']) && isset($course['kredit'])){
                        $courses[] = $course;
                    }
                }
            }
        }

        foreach ($courses as $course) {
            $courseId = $course['id'];

            // Ellenőrizzük, hogy létezik-e a kurzushoz kategória információ
            if (!isset($this->courseCategories[$courseId])) {
                continue; // Ha nincs, kihagyjuk
            }

            foreach ($this->courseCategories[$courseId] as $categoryId) {
                if (!isset($categoryCredits[$categoryId])) {
                    $categoryCredits[$categoryId] = 0;
                }
                // Biztonsági ellenőrzés, hogy a kredit numerikus érték
                if(is_numeric($course['kredit'])){
                    $categoryCredits[$categoryId] += $course['kredit'];
                }
            }
        }

        $result = [];
        // Ellenőrizzük, hogy a $this->curriculum->specializations létezik és iterálható-e
        if(!isset($this->curriculum->specializations) || !is_iterable($this->curriculum->specializations)){
            return []; // Vagy hiba jelzése
        }

        foreach ($this->curriculum->specializations as $index => $specialization) {
            // Biztonsági ellenőrzés, hogy $specialization objektum és vannak tulajdonságai
            if(!is_object($specialization) || !isset($specialization->name) || !isset($specialization->min)){
                 continue;
            }

            $result[$index] = [
                'specialization_name' => $specialization->name,
                'categories' => [],
                'is_completed' => true,
                'credits_earned' => 0,
                'max' => 0, // Ezt a mezőt lehet, hogy a Controller tölti fel, itt inicializáljuk
                'min' => $specialization->min
            ];

            // Ellenőrizzük, hogy a $specialization->categories létezik és iterálható-e
            if(!isset($specialization->categories) || !is_iterable($specialization->categories)){
                 continue; // Kihagyjuk ezt a specializációt, ha nincsenek kategóriái
            }


            foreach ($specialization->categories as $category) {
                 // Biztonsági ellenőrzés, hogy $category objektum és vannak tulajdonságai
                 if(!is_object($category) || !isset($category->id) || !isset($category->name) || !isset($category->min)){
                     continue;
                 }

                $creditsEarned = $categoryCredits[$category->id] ?? 0;

                $result[$index]['categories'][] = [
                    'category_name' => $category->name,
                    'min' => $category->min,
                    'max' => $category->max ?? 0, // Használjunk null coalescing operátort, ha a max nem mindig létezik
                    'credits_earned' => $creditsEarned,
                    'is_completed' => $creditsEarned >= $category->min,
                ];

                // Biztonsági ellenőrzés a max értékre
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
