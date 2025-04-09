<?php

namespace App\Services;

use App\Models\Curriculum;
use App\Models\Specialization;
use App\Models\Category;
use App\Models\Course;
use MathPHP\Algebra\Matrix;
use MathPHP\Algebra\Vector;

/**
 * Kurzusokat optimalizáló szolgáltatás Branch and Bound algoritmussal.
 * 
 * @property Curriculum $curriculum A kiválasztott tanterv az adatbázisból.
 * @property int $maxCreditsPerSemester Maximum kredit ami felvehető félévenként.
 * @property array $allCourses A tantervhez tartozó összes kurzus course->id => course fomában.
 * @property array $courseCategories Az tárolja milyen kurzushoz milyen kategoria tartozik course->id => category->id[] fromában.
 * @property array $allCoursePreRequisites El tárolja az összes előkövetelmény->kurzus kapcsolatot.
 */
class CourseOptimizationBnBService
{
    private $curriculum;
    private $allCourses = [];
    private $courseCategories = [];
    private $maxCreditsPerSemester = 30;
    private $allCoursePreRequisites = [];
    private $relevantCategories;
    private $relevantCategoryIds = [];
    private $relevantCourses = [];
    private $bestSolution = null;
    private $bestSolutionCost = PHP_INT_MAX;
    private $nodesToExplore = 0;
    private $nodesExplored = 0;
    private $considerRecommendedSemester = false;
    private $startWithFall = true;
    
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
        
        // Végig megyek a tanterven hogy kiszedjem belőle az összes kurzust kategoriát és követelményt
        foreach ($curriculum->specializations as $specialization) {
            foreach ($specialization->categories as $category) {
                foreach ($category->courses as $course) {
                    //Elmentem a követelményeket
                    if($course->prerequisites()->pluck('prerequisite_course_id')->toArray()[0] !== null){
                        $this->allCoursePreRequisites[$course->id] = $course->prerequisites()->pluck('prerequisite_course_id')->toArray();
                    } else {
                        // Üres előkövetelmény lista, ha nincs
                        $this->allCoursePreRequisites[$course->id] = [];
                    }
                                        
                    //Elmentem a kurzusokat
                    $this->allCourses[$course->id] = $course;
                    
                    //Elmentem melyik kurzushoz melyik kategóriára tartozik
                    if (!isset($this->courseCategories[$course->id])) {
                        $this->courseCategories[$course->id] = [];
                    }
                    $this->courseCategories[$course->id][] = $category->id;
                }
            }
        }
    }

    /**
     * Ez Generálja az optimális tantervet Branch and Bound algoritmussal.
     * 
     * @param array<int,int> $selectedSpecializationIds A kiválasztot specializációk id-jai.
     * @param bool $startWithFall Azt adja meg milyen szezonban kezdödik a kurzus optimalizáció őssz (true) vagy tavasz (false)
     * @param bool $considerRecommendedSemester Figyelembe veszi-e az ajánlott féléveket
     * @param array $history Előzőleg teljesített kurzusok listája
     * @return array Az optimalizált tanulási tervet adja vissza.
     */
    public function generateOptimalPlan(array $selectedSpecializationIds, bool $startWithFall = true, bool $considerRecommendedSemester = false, array $history = []): array
    {
        $this->startWithFall = $startWithFall;
        $this->considerRecommendedSemester = $considerRecommendedSemester;
        $this->bestSolution = null;
        $this->bestSolutionCost = PHP_INT_MAX;
        $this->nodesToExplore = 0;
        $this->nodesExplored = 0;
        
        // Minden tantervnek van egy kötelező specializációja ha ezt nem választoták ki akkor hozzáadom a listához
        foreach($this->curriculum->specializations as $sp){
            if($sp->required && !in_array($sp->id, $selectedSpecializationIds)){
                $selectedSpecializationIds[] = $sp->id;
            }
        }
 
        /**
         * @var object Specialization[] $selectedSpecializations ez tárolja az összes kiválasztott specializációt
         */
        $selectedSpecializations = $this->curriculum->specializations->whereIn('id', $selectedSpecializationIds);
        
        /**
         * @var object $relevantCategories ez tárolja az összes kategóriát ami a kiválaszotott specializációkhoz tartozik
         */
        $this->relevantCategories = collect();

        foreach ($selectedSpecializations as $specialization) {
            $this->relevantCategories = $this->relevantCategories->merge($specialization->categories);
        }
        
        /**
         * @var array $relevantCategoryIds ez tárolja az összes releváns kategóriák id-ját
         */
        $this->relevantCategoryIds = $this->relevantCategories->pluck('id')->toArray();

        /**
         * @var array<int,int> $categoryMinCredits ez tárolja az összes releváns kategóriához a minimum kreditértéket.
         */
        $categoryMinCredits = [];
        foreach ($this->relevantCategoryIds as $categoryId) {
            $category = $this->relevantCategories->firstWhere('id', $categoryId);
            $categoryMinCredits[$categoryId] = $category->min;
        }
    
        /**
         * @var array<int,Course> $relevantCourses ez tárolja az összes releváns kurzusokat
         */
        $this->relevantCourses = [];
        
        // értéket adok a releváns kurzusoknak
        foreach ($this->allCourses as $courseId => $course) {
            // kihagyja a azokat a kurzusokat amik nem fontosak
            if (!isset($this->courseCategories[$courseId])) {
                continue;
            }
            /**
             * @var array<int,int> $courseCategories ez tárolja azokat a kategoria id-ket amik kurzushoz tartoznak és relevánsak
             */
            $courseCategories = array_intersect($this->courseCategories[$courseId], $this->relevantCategoryIds);
            
            if (empty($courseCategories)) {
                continue;
            }
            
            // Hozzáadom őket a releváns kurzusokhoz
            $this->relevantCourses[$courseId] = [
                'id' => $course->id,
                'name' => $course->name,
                'kredit' => $course->kredit,
                'recommendedSemester' => $course->recommendedSemester,
                'sezon' => $course->sezon,
                'categories' => $courseCategories,
                'prerequisites' => isset($this->allCoursePreRequisites[$courseId]) ? $this->allCoursePreRequisites[$courseId] : []
            ];
        }
        
        // Értéket adok a kurzusoknak ami alapján sorba rendezem őket a heurisztikus kereséshez
        foreach ($this->relevantCourses as $courseId => &$course) {
            $credits = $course['kredit'];
            $categoryCount = count($course['categories']);
            
            // Efficiency: kredit * kategoriák száma
            $course['efficiency'] = ($credits * $categoryCount);
        }
        
        // Rendezés hatékonyság szerint csökkenő sorrendben
        uasort($this->relevantCourses, function($a, $b) {
            return $b['efficiency'] - $a['efficiency'];
        });
        
        // Inicializáljuk az állapotot
        $initialState = [
            'selectedCourses' => [], // Kiválasztott kurzusok
            'completedCourses' => [], // Teljesített kurzusok
            'categoryCredits' => array_fill_keys($this->relevantCategoryIds, 0), // Kategóriánkénti megszerzett kreditek
            'semester' => 1, // Aktuális félév
            'isFallSemester' => $startWithFall, // Őszi félév-e
            'semesterCredits' => 0, // Félévben felvett kreditek
            'semesterCourses' => [], // Félévben felvett kurzusok
            'plan' => [], // Teljes tanterv
            'depth' => 0, // Fa mélység (debug)
        ];
        
        // Ha felhasználó diák akkor végig megyek az elözményein és hozzá adam az tanulási tervhez
        if (!empty($history)) {
            foreach ($history as $key => $semester) {
                $tc = 0;
                $cs = [];
                
                foreach ($semester['courses'] as $courseId) {
                    $temp = $this->allCourses[$courseId];
                    $categories = $this->courseCategories[$courseId] ?? [];
                    
                    foreach ($categories as $categoryId) {
                        if (isset($initialState['categoryCredits'][$categoryId])) {
                            $initialState['categoryCredits'][$categoryId] += $temp->kredit;
                        }
                    }
                    
                    $initialState['completedCourses'][] = $courseId;
                    $initialState['selectedCourses'][] = $courseId;
                    
                    $cs[] = ['id' => $temp->id, 'name' => $temp->name, 'kredit' => $temp->kredit];
                    $tc += $temp->kredit;
                }
                
                $initialState['plan'][] = [
                    'is_fall' => $semester['is_fall'],
                    'courses' => $cs,
                    'total_credits' => $tc,
                ];
                
                $initialState['isFallSemester'] = !$semester['is_fall'];
                $initialState['semester'] = $key + 1;
            }
        }
        
        // Branch and Bound algoritmus futtatása
        $this->branchAndBound($initialState);
        
        // Ha nem találtunk megoldást
        if ($this->bestSolution === null) {
            return ["Nincs megoldás"];
        }
        
        // Formázzuk a kimenetet a megfelelő formátumra
        $studyPlan = $this->formatSolution($this->bestSolution);
        $studyPlan['nodes_explored'] = $this->nodesExplored;
        
        return $studyPlan;
    }
    
    /**
     * Branch and Bound algoritmus implementáció
     * 
     * @param array $state Az aktuális állapot
     * @return void
     */
    private function branchAndBound($state)
    {
        $this->nodesExplored++;
        
        // Ha minden kategória teljesítve van, új megoldást találtunk
        if ($this->isSolution($state)) {
            $cost = count($state['selectedCourses']);
            if ($cost < $this->bestSolutionCost) {
                $this->bestSolution = $state;
                $this->bestSolutionCost = $cost;
            }
            return;
        }
        
        // Bounding: Ha ez az útvonal nem lehet jobb, mint a legjobb eddigi, nem folytatjuk
        $lowerBound = $this->calculateLowerBound($state);
        if ($lowerBound >= $this->bestSolutionCost) {
            return;
        }
        
        // Megkeressük a következő félév kurzusait
        $availableCourses = $this->getAvailableCourses($state);
        
        // Ha nincs több elérhető kurzus, lépünk a következő félévre
        if (empty($availableCourses)) {
            $newState = $this->moveToNextSemester($state);
            $this->branchAndBound($newState);
            return;
        }
        
        // Branching: Eldöntjük, hogy vegyünk-e fel egy kurzust vagy sem
        foreach ($availableCourses as $courseId => $course) {
            // Ha nem férne be a félévbe, átugrjuk
            if ($state['semesterCredits'] + $course['kredit'] > $this->maxCreditsPerSemester) {
                continue;
            }
            
            // Vegyük fel a kurzust
            $newState = $this->takeCourse($state, $courseId, $course);
            $this->branchAndBound($newState);
            
            // Ne vegyük fel a kurzust (csak ha van értelme, azaz nem kötelező minden kurzus felvétele)
            // Ez egy pruning lépés, csak akkor ne vegyük fel, ha van értelme
            if (!$this->isMandatoryCourse($courseId, $state)) {
                // Itt nem csinálunk semmit, egyszerűen folytatjuk a következő kurzussal
            }
        }
        
        // Ha nem tudtunk több kurzust felvenni ebben a félévben, lépünk a következőre
        $newState = $this->moveToNextSemester($state);
        $this->branchAndBound($newState);
    }
    
    /**
     * Ellenőrzi, hogy egy adott állapot megoldás-e (minden kategória teljesítve)
     * 
     * @param array $state Az ellenőrizendő állapot
     * @return bool Igaz, ha minden kategória teljesítve van
     */
    private function isSolution($state)
    {
        foreach ($this->relevantCategoryIds as $categoryId) {
            $category = $this->relevantCategories->firstWhere('id', $categoryId);
            if ($state['categoryCredits'][$categoryId] < $category->min) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Kiszámítja az alsó korlátot (lower bound) az adott állapotból
     * Ez határozza meg a minimális számú kurzust, amit még fel kell venni
     * 
     * @param array $state Az aktuális állapot
     * @return int Az alsó korlát értéke
     */
    private function calculateLowerBound($state)
    {
        $currentSize = count($state['selectedCourses']);
        $missingCredits = [];
        
        // Kiszámoljuk, hogy mennyi kredit hiányzik még kategóriánként
        foreach ($this->relevantCategoryIds as $categoryId) {
            $category = $this->relevantCategories->firstWhere('id', $categoryId);
            $missing = max(0, $category->min - $state['categoryCredits'][$categoryId]);
            if ($missing > 0) {
                $missingCredits[$categoryId] = $missing;
            }
        }
        
        // Ha nincs hiányzó kredit, akkor a jelenlegi méret az alsó korlát
        if (empty($missingCredits)) {
            return $currentSize;
        }
        
        // Optimista becslés: Vesszük a leghatékonyabb kurzusokat a hiányzó kreditek teljesítésére
        $remainingCourses = array_diff_key($this->relevantCourses, array_flip($state['selectedCourses']));
        $estimatedAdditionalCourses = 0;
        
        // Greedy becslés: vesszük a legnagyobb hatékonyságú kurzusokat
        uasort($remainingCourses, function($a, $b) {
            return $b['efficiency'] - $a['efficiency'];
        });
        
        $tempMissingCredits = $missingCredits;
        foreach ($remainingCourses as $courseId => $course) {
            $useful = false;
            foreach ($course['categories'] as $categoryId) {
                if (isset($tempMissingCredits[$categoryId]) && $tempMissingCredits[$categoryId] > 0) {
                    $tempMissingCredits[$categoryId] = max(0, $tempMissingCredits[$categoryId] - $course['kredit']);
                    $useful = true;
                }
            }
            
            if ($useful) {
                $estimatedAdditionalCourses++;
                // Ha minden kategória teljesítve lenne, kilépünk
                if (array_sum($tempMissingCredits) == 0) {
                    break;
                }
            }
        }
        
        return $currentSize + $estimatedAdditionalCourses;
    }
    
    /**
     * Visszaadja az aktuális félévben elérhető kurzusokat
     * 
     * @param array $state Az aktuális állapot
     * @return array Az elérhető kurzusok listája
     */
    private function getAvailableCourses($state)
    {
        $availableCourses = [];
        $seasonFilter = $state['isFallSemester'] ? 1 : 0; // 1=őszi, 0=tavaszi
        
        foreach ($this->relevantCourses as $courseId => $course) {
            // Ha már kiválasztottuk, kihagyjuk
            if (in_array($courseId, $state['selectedCourses'])) {
                continue;
            }
            
            // Szezon ellenőrzése
            if ($course['sezon'] !== null && $course['sezon'] !== $seasonFilter) {
                continue;
            }
            
            // Ajánlott félév ellenőrzése
            if ($this->considerRecommendedSemester && $state['semester'] < $course['recommendedSemester']) {
                continue;
            }
            
            // Előkövetelmények ellenőrzése
            $prerequisitesMet = true;
            foreach ($course['prerequisites'] as $prerequisiteId) {
                if (!in_array($prerequisiteId, $state['completedCourses'])) {
                    $prerequisitesMet = false;
                    break;
                }
            }
            
            if (!$prerequisitesMet) {
                continue;
            }
            
            // Ha van relevanciája a kurzusnak (van még nem teljesített kategória)
            $stillRelevant = false;
            foreach ($course['categories'] as $categoryId) {
                $category = $this->relevantCategories->firstWhere('id', $categoryId);
                if ($state['categoryCredits'][$categoryId] < $category->min) {
                    $stillRelevant = true;
                    break;
                }
            }
            
            if (!$stillRelevant) {
                continue;
            }
            
            // Ha minden feltételnek megfelel, elérhető a kurzus
            $availableCourses[$courseId] = $course;
        }
        
        return $availableCourses;
    }
    
    /**
     * Új állapotot hoz létre a kurzus felvételével
     * 
     * @param array $state Az aktuális állapot
     * @param int $courseId A felveendő kurzus azonosítója
     * @param array $course A kurzus adatai
     * @return array Az új állapot
     */
    private function takeCourse($state, $courseId, $course)
    {
        $newState = $state;
        
        // Hozzáadjuk a kurzust a kiválasztottakhoz és teljesítettekhez
        $newState['selectedCourses'][] = $courseId;
        $newState['completedCourses'][] = $courseId;
        
        // Frissítjük a kategória krediteket
        foreach ($course['categories'] as $categoryId) {
            $newState['categoryCredits'][$categoryId] += $course['kredit'];
        }
        
        // Frissítjük a félév adatait
        $newState['semesterCredits'] += $course['kredit'];
        $newState['semesterCourses'][] = [
            'id' => $courseId,
            'name' => $course['name'],
            'kredit' => $course['kredit']
        ];
        
        // Hozzáadjuk a tantervhez, ha ez az első kurzus a félévben
        if (!isset($newState['plan'][$newState['semester']])) {
            $newState['plan'][$newState['semester']] = [
                'is_fall' => $newState['isFallSemester'],
                'courses' => [],
                'total_credits' => 0
            ];
        }
        
        // Frissítjük a tantervet
        $newState['plan'][$newState['semester']]['courses'][] = [
            'id' => $courseId,
            'name' => $course['name'],
            'kredit' => $course['kredit']
        ];
        $newState['plan'][$newState['semester']]['total_credits'] += $course['kredit'];
        
        // Növeljük a fa mélységét (debug)
        $newState['depth']++;
        
        return $newState;
    }
    
    /**
     * Ellenőrzi, hogy egy kurzus kötelező-e az optimális megoldáshoz
     * (Ez egy heurisztika, nem garantálja a kötelezőséget)
     * 
     * @param int $courseId A kurzus azonosítója
     * @param array $state Az aktuális állapot
     * @return bool Igaz, ha a kurzus kötelezőnek tűnik
     */
    private function isMandatoryCourse($courseId, $state)
    {
        $course = $this->relevantCourses[$courseId];
        
        foreach ($course['categories'] as $categoryId) {
            $category = $this->relevantCategories->firstWhere('id', $categoryId);
            $missingCredits = $category->min - $state['categoryCredits'][$categoryId];
            
            if ($missingCredits > 0) {
                // Megnézzük, van-e más elérhető kurzus ehhez a kategóriához
                $otherOptions = false;
                foreach ($this->relevantCourses as $otherId => $otherCourse) {
                    if ($otherId == $courseId || in_array($otherId, $state['selectedCourses'])) {
                        continue;
                    }
                    
                    if (in_array($categoryId, $otherCourse['categories'])) {
                        $otherOptions = true;
                        break;
                    }
                }
                
                // Ha nincs más lehetőség és szükség van kreditre, akkor kötelező
                if (!$otherOptions && $missingCredits > 0) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Átlép a következő félévre
     * 
     * @param array $state Az aktuális állapot
     * @return array Az új állapot a következő félévben
     */
    private function moveToNextSemester($state)
    {
        $newState = $state;
        $newState['semester']++;
        $newState['isFallSemester'] = !$state['isFallSemester'];
        $newState['semesterCredits'] = 0;
        $newState['semesterCourses'] = [];
        return $newState;
    }
    
    /**
     * A megoldást a kívánt formára alakítja
     * 
     * @param array $solution A nyers megoldás
     * @return array A formázott megoldás
     */
    private function formatSolution($solution)
    {
        $studyPlan = $solution['plan'];
        
        // Ellenőrizzük, hogy minden kategória teljesült-e
        $categoriesCompleted = [];
        foreach ($this->relevantCategoryIds as $categoryId) {
            $category = $this->relevantCategories->firstWhere('id', $categoryId);
            $categoriesCompleted[$categoryId] = $solution['categoryCredits'][$categoryId] >= $category->min;
        }
        
        $allCategoriesCompleted = !in_array(false, $categoriesCompleted, true);
        
        if (!$allCategoriesCompleted) {
            $incompleteCategoryIds = array_keys(array_filter($categoriesCompleted, function($completed) {
                return !$completed;
            }));
            
            $incompleteCategories = [];
            foreach ($incompleteCategoryIds as $categoryId) {
                $category = $this->relevantCategories->firstWhere('id', $categoryId);
                foreach ($this->curriculum->specializations as $specialization) {
                    if ($specialization->categories->contains('id', $category->id)) {
                        $incompleteCategories[] = [
                            'category_id' => $categoryId,
                            'category_name' => $category->name,
                            'specialization_name' => $specialization->name,
                            'min_required' => $category->min,
                            'credits_earned' => $solution['categoryCredits'][$categoryId],
                            'credits_missing' => $category->min - $solution['categoryCredits'][$categoryId]
                        ];
                        break;
                    }
                }
            }
            
            $studyPlan['incomplete_categories'] = $incompleteCategories;
        }
        
        $totalCredits = 0;
        $totalCourses = 0;
        
        foreach ($studyPlan as $semesterNum => $semester) {
            if (is_array($semester) && isset($semester['total_credits'])) {
                $formattedSemesters[] = $semester; // Add the semester to the new array
                $totalCredits += $semester['total_credits'];
                $totalCourses += count($semester['courses']);
            }
        }
        $studyPlan = []; // Clear the old study plan
        $studyPlan['semesters'] = $formattedSemesters; 
        $studyPlan['total_credits'] = $totalCredits;
        $studyPlan['total_courses'] = $totalCourses;
        $studyPlan['total_semesters'] = count($studyPlan['semesters']);
        $studyPlan['all_requirements_met'] = $allCategoriesCompleted;
        
        return $studyPlan;
    }
    
/**
 * Get credits breakdown by category and specialization.
 *
 * @param array $studyPlan The optimized study plan.
 * @return array An analysis of how each category is fulfilled, grouped by specialization.
 */
public function getCreditsBreakdown(array $studyPlan): array
{
    $categoryCredits = [];
    $courses = [];

    foreach ($studyPlan['semesters'] as $semester) {
        if (is_array($semester) && isset($semester['courses'])) {
            foreach ($semester['courses'] as $course) {
                $courses[] = $course;
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

            $categoryCredits[$categoryId] += $course['kredit'];
        }
    }

    $result = [];
    foreach ($this->curriculum->specializations as $index => $specialization) {
        $result[$index] = [
            'specialization_name' => $specialization->name,
            'categories' => [],
            'is_completed' => true, 
            'credits_earned' => 0,
            'max' => 0,
            'min' => $specialization->min
        ];

        foreach ($specialization->categories as $category) {
            $creditsEarned = $categoryCredits[$category->id] ?? 0; 

            $result[$index]['categories'][] = [
                'category_name' => $category->name,
                'min' => $category->min,
                'max' => $category->max,
                'credits_earned' => $creditsEarned,
                'is_completed' => $creditsEarned >= $category->min,
            ];
            $result[$index]['max'] += $category->max;
            $result[$index]['credits_earned'] += $creditsEarned;
            
            if ($creditsEarned < $category->min) {
                $result[$index]['is_completed'] = false;
            }
        }
    }

    return $result;
}

}