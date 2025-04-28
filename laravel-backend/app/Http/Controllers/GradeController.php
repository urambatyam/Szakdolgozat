<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Grade;
use App\Models\Course;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail; 
use App\Mail\UpdateGrade;      
use Illuminate\Support\Facades\Log;
use App\Models\User; 
/**
 * A jegyekkel és kurzusfelvételekkel kapcsolatos műveleteket kezelő kontroller.
 * Felelős a jegyek listázásáért, új kurzusfelvétel (jegy létrehozása null értékkel) validálásáért és rögzítéséért,
 * jegyek frissítéséért és törléséért.
 */
class GradeController extends Controller
{
    /**
     * Vissza adja az összes jegyet.
     */
    public function index()
    {
        return Grade::all();
    }

    /**
     * Létrehoza a jegyet, úgy hogy ellenőrzi a kurzus felvétel feltételeit(Tejesítette az előzményeket, megfelelő szezon van, diák).
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse A létrehozott jegyet tartalmazó JSON válasz.
     * @throws ValidationException Ha a validálás sikertelen.
     */
    public function store(Request $request): JsonResponse
    {
        if (!Auth::check() || Auth::user()->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Csak bejelentkezett diákok vehetnek fel kurzusokat.',
                'reason' => 'auth_student_required'
            ], 403); 
        }
        /** @var User $student */
        $student = Auth::user();

        $values = $request->validate([
            'course_id' => 'required|integer|exists:courses,id',
        ]);

        $courseId = $values['course_id'];
        $course = Course::with('prerequisites')->findOrFail($courseId);
        $isAutumnSemester = (int)date("n") >= 9;
        $courseSeason = $course->sezon; 
        $canApplyBasedOnSeason = false;

        if ($courseSeason === null) {
            $canApplyBasedOnSeason = true; 
        } elseif ($courseSeason === true && $isAutumnSemester) {
            $canApplyBasedOnSeason = true; 
        } elseif ($courseSeason === false && !$isAutumnSemester) {
            $canApplyBasedOnSeason = true; 
        }

        if (!$canApplyBasedOnSeason) {
            return response()->json([
                'success' => false,
                'message' => 'A kurzus ebben a félévben nem vehető fel.',
                'reason' => 'invalid_season'
            ], 400); 
        }

        $alreadyApplied = Grade::where('user_code', $student->code)
                               ->where('course_id', $courseId)
                               ->exists();

        if ($alreadyApplied) {
            return response()->json([
                'success' => false,
                'message' => 'Ezt a kurzust már felvetted.',
                'reason' => 'already_applied'
            ], 400); 
        }

        $prerequisiteIds = $course->prerequisites()
                                  ->whereNotNull('prerequisite_course_id') 
                                  ->pluck('prerequisite_course_id')
                                  ->all();

        if (!empty($prerequisiteIds)) {
            $completedCourseIds = $student->grades()
                                          ->whereNotNull('grade') 
                                          ->where('grade', '!=', 1) 
                                          ->pluck('course_id')
                                          ->all();

            $missingPrerequisites = array_diff($prerequisiteIds, $completedCourseIds);

            if (!empty($missingPrerequisites)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nem teljesítetted a kurzus összes előkövetelményét.',
                    'reason' => 'prerequisites_not_met',
                    'missing_ids' => array_values($missingPrerequisites)
                ], 400); 
            }
        }

        try {
            $student->grades()->create([
                'course_id' => $courseId,
                'sezon' => $isAutumnSemester,
                'grade' => null 
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sikeresen jelentkeztél a kurzusra.'
            ], 201); 

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Hiba történt a kurzus felvétele közben.'.$e->getMessage(),
                'reason' => 'creation_failed'
            ], 500); 
        }
    }

    /**
     * Lekér egy jegyet id alapján.
     * @param Grade $grade A lekérdezett jegy.
     * @return JsonResponse A lekérdezett jegyet tartalmazó JSON válasz.
     */
    public function show(Grade $garde)
    {
        return $garde;
    }
    /**
     * Lekéri az összes jegyet ami egy kurzus hoz tartozik.
     * @param Request $request A bejövő HTTP kérés.
     * @param int $course_id A kurzus azonosítója.
     */
    public function getAllGradesInCourse(Request $request, int $course_id)
    {
        $query = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        });
        
        if ($request->has('filter')) {
            $query->where('user_code', 'like', '%' . $request->filter . '%');
        }
        
        if ($request->has('year') && $request->has('sezon')) {
            $query->where('year', $request->year)
                  ->where('sezon', $request->sezon);
        }
        
        $sortField = $request->input('sort_field', 'user_code');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);
        
        $perPage = $request->input('per_page', 10);
        $gardeData = $query->paginate($perPage);
        
        $semesters = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })
        ->select('year', 'sezon')
        ->distinct()
        ->get()
        ->map(function($item) {
            return [
                'year' => $item->year,
                'sezon' => $item->sezon
            ];
        });
        
        return ['grades' => $gardeData, 'semesters' => $semesters];
    }
    /**
     * Lekéri az összes jegyet ami egy diákhoz tartozik.
     * @param Request $request A bejövő HTTP kérés.
     * @param String $studentCode A diák azonosítója.
     */
    public function getAllGradesOFStudent(Request $request, String $studentCode)
    {
        $query = Grade::whereHas('user', function ($query) use ($studentCode) {
            $query->where('code', $studentCode);
        });

        if ($request->has('filter')) {
            $query->whereHas('course', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->filter . '%');
            });
        }

        if ($request->has('year') && $request->has('sezon')) {
            $query->where('year', $request->year)
                ->where('sezon', $request->sezon);
        }

        $query->orderBy('year', 'asc');
        $query->orderBy('sezon', 'asc');

        $perPage = $request->input('per_page', 10);
        $gardeData = $query->paginate($perPage);

        $gardeData->getCollection()->transform(function ($grade) {
            $grade->course_name = $grade->course->name;
            return $grade;
        });

        $semesters = Grade::whereHas('user', function ($query) use ($studentCode) {
            $query->where('code', $studentCode);
        })
            ->select('year', 'sezon')
            ->distinct()
            ->get()
            ->map(function ($item) {
                return (object) [
                    'year' => $item->year,
                    'sezon' => $item->sezon,
                    'current' => false,
                ];
            });

        $nowY = date("Y");
        $nowS = date("n") >= 9 ? true : false;
        $currentInSemester = false;

        foreach ($semesters as $semester) {
            if ($semester->year == $nowY && $semester->sezon == $nowS) {
                $semester->current = true;
                $currentInSemester = true;
                break;
            }
        }
        if (!$currentInSemester) {
            $semesters->push((object) [ 
                'year' => $nowY,
                'sezon' => $nowS,
                'current' => true,
            ]);
        }

        $semesters = $semesters->sortBy([['year', 'desc'], ['sezon', 'desc']])->values();

        return ['grades' => $gardeData, 'semesters' => $semesters];
    }

    /**
     * Firisiti a jegyek értékét.
     * @param Request $request A bejövő HTTP kérés.
     * @param Grade $grade A frissítendő jegy.
     */
    public function update(Request $request, Grade $grade)
    {
        $values = $request->validate([
            'grade' => 'nullable|integer|min:1|max:5',
        ]);

        $grade->update($values);
        $user = User::find($grade->user_code);
        $courseName = Course::find($grade->course_id)->name;
        $adminEmail = "salt90502@gmail.com";
        try {
            Mail::to($user->email)->send(new UpdateGrade($values['grade'], $courseName));
            if ($adminEmail) {
                 Mail::to($adminEmail)->send(new UpdateGrade($values['grade'], $courseName));
            }
        } catch (\Exception $e) {
            Log::error('email küldése a jegy frissítésénél sikertelen: ' . $user->email . ' Hiba: ' . $e->getMessage());
             return response()->json([
                 'message' => 'Jegy frissítésve, de az értesítő email küldése sikertelen!',
                 'user' => $user
             ], 201); 
        }

        return $grade;
    }

    /**
     * Törli a jegykeket.
     * @param Grade $grade A törlendő jegy.
     */
    public function destroy(Grade $grade)
    {
        $grade->delete();

        return ['message' => 'A jegy törölve lett!'];
    }
}