<?php

namespace App\Services;

use App\Models\Curriculum;
use Illuminate\Support\Collection;

/**
 * Kurzusokat optimalizáló szolgáltatás (Greedy).
 * // ... (property leírások maradnak) ...
 */
class CourseOptimizationService
{
    // ... (property definíciók és konstruktor maradnak változatlanok) ...
    private Curriculum $curriculum;
    private array $allCourses = [];
    private array $courseCategories = [];
    private int $maxCreditsPerSemester = 30;
    private array $allCoursePreRequisites = [];
    private ?Collection $relevantCategories = null;

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
     * Generálja az optimális tantervet a mohó algoritmus alapján.
     * (Módosított logika: nincs várakozás, utófeldolgozás a hiányzó pozitívaknak)
     * // ... (paraméter leírások maradnak) ...
     */
    public function generateOptimalPlan(
        array $selectedSpecializationIds,
        bool $startWithFall = true,
        bool $considerRecommendedSemester = false,
        array $history = [],
        array $nagativIds = [],
        array $pozitivCoursesData = []
    ): array {
        // --- Inicializálás (változatlan) ---
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
             if (isset($this->allCourses[$courseId]) && !in_array($courseId, $nagativIds)) { // Elég ha létezik és nincs tiltva
                 $courseData['prerequisites'] = $this->allCoursePreRequisites[$courseId] ?? [];
                 $courseData['categories'] = $this->courseCategories[$courseId] ?? [];
                 $courseData['efficiency'] = $courseData['efficiency'] ?? ($courseData['kredit'] * count($courseData['categories']));
                 $positiveCoursesToTake[$courseId] = $courseData;
                 unset($relevantCourses[$courseId]);
             }
        }

        $studyPlan = ['semesters' => [], 'warnings' => []];
        $completedCourses = [];
        $categoryCredits = array_fill_keys($relevantCategoryIds, 0);
        $categoriesCompleted = array_fill_keys($relevantCategoryIds, false);
        $currentSemester = 1;
        $isFallSemester = $startWithFall;
        $availableCourses = $relevantCourses;
        $positiveCoursesTaken = [];
        $maxTotalSemesters = 20; // Biztonsági limit

        // Előzmények feldolgozása (változatlan)
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
            $currentSemester = $lastHistorySemesterIndex + 2;
        }


        // --- Fő ciklus (NINCS VÁRAKOZÁS) ---
        while ($currentSemester <= $maxTotalSemesters) {
            // Leállási feltételek:
            $allDone = !in_array(false, $categoriesCompleted, true);
            // Itt már csak az $availableCourses-t nézzük, a pozitívakat külön kezeljük, ha kimaradtak
            $noMoreNormalCourses = empty($availableCourses);

            // Ha minden kész, vagy nincs több normál kurzus ÉS minden pozitív fel van véve, akkor kész.
            $allPositiveTaken = empty(array_diff(array_keys($positiveCoursesToTake), $positiveCoursesTaken));
            if ($allDone || ($noMoreNormalCourses && $allPositiveTaken)) {
                break;
            }
            // Ha nincs több normál, de van még pozitív, akkor is kilépünk a fő ciklusból, az utófeldolgozás jön.
            if ($noMoreNormalCourses && !$allPositiveTaken) {
                break;
            }

            // Aktuális félév inicializálása
            $currentSemesterPlan = ['is_fall' => $isFallSemester, 'courses' => [], 'total_credits' => 0];
            $creditsThisSemester = 0;
            $coursesAddedThisSemesterIds = [];
            $courseAdded = false;
            $seasonFilter = $isFallSemester ? 1 : 0;

            // 1. Pozitív kurzusok ellenőrzése és FELVÉTELE, HA LEHET
            uasort($positiveCoursesToTake, function($a, $b) { // Opcionális rendezés
                return ($a['recommendedSemester'] ?? PHP_INT_MAX) <=> ($b['recommendedSemester'] ?? PHP_INT_MAX);
            });

            foreach ($positiveCoursesToTake as $courseId => $course) {
                if (in_array($courseId, $positiveCoursesTaken) || in_array($courseId, $coursesAddedThisSemesterIds)) {
                    continue;
                }

                // Ellenőrzések: Prereqs, Season, CreditLimit, RecommendedSemester
                $prereqsMet = $this->checkPrerequisites($courseId, $completedCourses);
                $seasonOk = ($course['sezon'] === null || $course['sezon'] === $seasonFilter);
                $creditLimitOk = ($creditsThisSemester + $course['kredit'] <= $this->maxCreditsPerSemester);
                // Ajánlott félév: CSAK AKKOR vehető fel, ha nem kell figyelni VAGY elértük/meghaladtuk
                $recommendedOk = !$considerRecommendedSemester || $currentSemester >= $course['recommendedSemester'];

                // Ha MINDEN feltétel teljesül, felvesszük
                if ($prereqsMet && $seasonOk && $creditLimitOk && $recommendedOk) {
                    $currentSemesterPlan['courses'][] = ['id' => $courseId, 'name' => $course['name'], 'kredit' => $course['kredit']];
                    $creditsThisSemester += $course['kredit'];
                    $coursesAddedThisSemesterIds[] = $courseId;
                    if (!in_array($courseId, $completedCourses)) { $completedCourses[] = $courseId; }
                    if (!in_array($courseId, $positiveCoursesTaken)) { $positiveCoursesTaken[] = $courseId; }
                    if ($this->relevantCategories) { $this->updateCategoryCredits($course, $categoryCredits, $categoriesCompleted, $this->relevantCategories); }
                    $courseAdded = true;
                    unset($availableCourses[$courseId]); // Ha esetleg a normálban is benne volt

                    if ($creditsThisSemester >= $this->maxCreditsPerSemester) {
                        goto end_main_loop_semester_selection; // Ugrás a félév lezárásához
                    }
                }
                // Ha nem teljesül valamelyik feltétel (pl. ajánlott félév), NEM CSINÁLUNK SEMMIT, megyünk tovább
            }

            // 2. Normál (mohó) kurzusok hozzáadása (ha van hely)
            $semesterAvailableCourses = [];
            foreach ($availableCourses as $courseId => $course) {
                if (!in_array($courseId, $coursesAddedThisSemesterIds) && ($course['sezon'] === null || $course['sezon'] === $seasonFilter)) {
                    $semesterAvailableCourses[$courseId] = $course;
                }
            }
            uasort($semesterAvailableCourses, function($a, $b) {
                return ($b['efficiency'] ?? 0) <=> ($a['efficiency'] ?? 0);
            });

            foreach ($semesterAvailableCourses as $courseId => $course) {
                $prereqsMet = $this->checkPrerequisites($courseId, $completedCourses);
                $creditLimitOk = ($creditsThisSemester + $course['kredit'] <= $this->maxCreditsPerSemester);
                $recommendedOk = !$considerRecommendedSemester || $currentSemester >= $course['recommendedSemester'];

                if ($prereqsMet && $creditLimitOk && $recommendedOk) {
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
                        unset($availableCourses[$courseId]); // Fontos: kivesszük a továbbiakból

                        if ($creditsThisSemester >= $this->maxCreditsPerSemester) {
                            break; // Félév megtelt
                        }
                    } else {
                         unset($availableCourses[$courseId]); // Már nem releváns
                    }
                }
            } // end foreach normal courses

            end_main_loop_semester_selection:

            // Félév lezárása és hozzáadása a tervhez (csak ha vettünk fel kurzust)
            if ($courseAdded) {
                 $currentSemesterPlan['total_credits'] = $creditsThisSemester;
                 $studyPlan['semesters'][] = $currentSemesterPlan;
            }
            // Ha nem vettünk fel kurzust, NEM adunk hozzá üres félévet a fő ciklusban

            // Következő félévre lépés (akkor is, ha nem vettünk fel semmit)
            $currentSemester++;
            $isFallSemester = !$isFallSemester;

        } // end while (fő ciklus)

        // --- Utófeldolgozás: Hiányzó pozitív kurzusok kezelése ---
        $pendingPositiveIds = array_diff(array_keys($positiveCoursesToTake), $positiveCoursesTaken);
        $emptySemesterCount = 0; // Külön számláló az utófeldolgozáshoz
        $maxEmptySemesters = 5; // Adjunk kicsit több teret itt

        while (!empty($pendingPositiveIds) && $currentSemester <= $maxTotalSemesters) {
            $currentSemesterPlan = ['is_fall' => $isFallSemester, 'courses' => [], 'total_credits' => 0];
            $creditsThisSemester = 0;
            $coursesAddedThisSemesterIds = []; // Csak az ebben a ciklusban hozzáadottak
            $courseAddedInPostLoop = false;
            $seasonFilter = $isFallSemester ? 1 : 0;

            // Csak a hiányzó pozitívakat próbáljuk felvenni
            foreach ($pendingPositiveIds as $courseId) {
                // Biztonsági ellenőrzés, hogy létezik-e még a kurzus adat
                if (!isset($positiveCoursesToTake[$courseId])) continue;
                $course = $positiveCoursesToTake[$courseId];

                // Ellenőrzések: Prereqs, Season, CreditLimit, RecommendedSemester
                $prereqsMet = $this->checkPrerequisites($courseId, $completedCourses);
                $seasonOk = ($course['sezon'] === null || $course['sezon'] === $seasonFilter);
                $creditLimitOk = ($creditsThisSemester + $course['kredit'] <= $this->maxCreditsPerSemester);
                // Ajánlott félév: MOST MÁR fel kell tudni venni, ha minden más oké
                $recommendedOk = !$considerRecommendedSemester || $currentSemester >= $course['recommendedSemester'];

                if ($prereqsMet && $seasonOk && $creditLimitOk && $recommendedOk) {
                    $currentSemesterPlan['courses'][] = ['id' => $courseId, 'name' => $course['name'], 'kredit' => $course['kredit']];
                    $creditsThisSemester += $course['kredit'];
                    $coursesAddedThisSemesterIds[] = $courseId; // Hozzáadva ebben a ciklusban
                    if (!in_array($courseId, $completedCourses)) { $completedCourses[] = $courseId; }
                    // Nem kell a positiveCoursesTaken-hez adni, mert a pendingPositiveIds-ből vesszük ki
                    if ($this->relevantCategories) { $this->updateCategoryCredits($course, $categoryCredits, $categoriesCompleted, $this->relevantCategories); }
                    $courseAddedInPostLoop = true;

                    // Töröljük a pending listából
                    $pendingPositiveIds = array_diff($pendingPositiveIds, [$courseId]);

                    if ($creditsThisSemester >= $this->maxCreditsPerSemester) {
                        break; // Félév megtelt ebben az utó-ciklusban
                    }
                }
            } // end foreach pending positives

            // Félév hozzáadása, HA vettünk fel kurzust, VAGY ha még mindig vannak pending kurzusok (azaz üres félévet adunk hozzá, hogy tovább lépjünk)
            if ($courseAddedInPostLoop || !empty($pendingPositiveIds)) {
                 $currentSemesterPlan['total_credits'] = $creditsThisSemester;
                 $studyPlan['semesters'][] = $currentSemesterPlan;
                 $emptySemesterCount = 0; // Reset, ha hozzáadtunk (akár üreset is, de van még teendő)
            }

            // Ha nem adtunk hozzá kurzust ÉS már nincs több pending, akkor kész az utófeldolgozás is
            if (!$courseAddedInPostLoop && empty($pendingPositiveIds)) {
                 break;
            }

            // Ha nem adtunk hozzá kurzust, de még VAN pending (pl. ajánlott félév miatt), növeljük az üres számlálót
            if (!$courseAddedInPostLoop && !empty($pendingPositiveIds)) {
                $emptySemesterCount++;
                if ($emptySemesterCount >= $maxEmptySemesters) {
                    $studyPlan['warnings'][] = "Az utófeldolgozás elakadt, túl sok ({$emptySemesterCount}) egymást követő üres félév volt a hiányzó pozitív kurzusok miatt.";
                    break; // Megállunk
                }
            }


            // Következő félévre lépés
            $currentSemester++;
            $isFallSemester = !$isFallSemester;

            // Újra lekérdezzük a biztonság kedvéért (bár a cikluson belül is töröltük)
            // $pendingPositiveIds = array_diff(array_keys($positiveCoursesToTake), $positiveCoursesTaken); // Ez hibás, a $positiveCoursesTaken nem frissül itt
            // A $pendingPositiveIds változót használjuk, amit a cikluson belül módosítunk.

        } // end while (utófeldolgozás)


        // --- Eredmény formázása (változatlan) ---
        $allCategoriesCompleted = !in_array(false, $categoriesCompleted, true);

        if (!$allCategoriesCompleted) {
            // ... (incomplete categories logika marad) ...
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
             if (!empty($incompleteCategories)) { $studyPlan['incomplete_categories'] = $incompleteCategories; }
             if (!isset($studyPlan['warnings']) || !in_array("Nem sikerült minden követelményt teljesíteni a megadott korlátok között.", $studyPlan['warnings'])) {
                $studyPlan['warnings'][] = "Nem sikerült minden követelményt teljesíteni a megadott korlátok között.";
             }
        }

        // Ellenőrzés, hogy minden pozitív kurzust sikerült-e felvenni (az utófeldolgozás után)
        // Most már a $pendingPositiveIds alapján ellenőrzünk
        if (!empty($pendingPositiveIds)) {
            $studyPlan['warnings'][] = "Nem sikerült minden megkövetelt (pozitív) kurzust beilleszteni a tervbe (utófeldolgozás után sem).";
            $missedPositiveCourses = [];
            foreach($pendingPositiveIds as $id) {
                $name = $positiveCoursesToTake[$id]['name'] ?? ($this->allCourses[$id]->name ?? "Ismeretlen kurzus (ID: {$id})");
                $missedPositiveCourses[] = $name;
            }
            $studyPlan['missed_positive_courses'] = $missedPositiveCourses;
        }

        // Összesítések (változatlan)
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
        $studyPlan['all_requirements_met'] = $allCategoriesCompleted && empty($pendingPositiveIds); // Akkor teljesült minden, ha a kategóriák OK ÉS nincs hiányzó pozitív

        if ($currentSemester > $maxTotalSemesters && !$studyPlan['all_requirements_met']) {
             $studyPlan['warnings'][] = "Az algoritmus elérte a maximális félévszámot ({$maxTotalSemesters}) anélkül, hogy minden követelmény teljesült volna.";
        }
        if (empty($studyPlan['warnings'])) { unset($studyPlan['warnings']); }

        return $studyPlan;
    }

    // --- Segédfüggvények (checkPrerequisites, updateCategoryCredits, getCreditsBreakdown) változatlanok ---
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
