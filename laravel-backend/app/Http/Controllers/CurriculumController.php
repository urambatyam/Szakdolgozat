<?php

namespace App\Http\Controllers;

use App\Models\Curriculum;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * A tanterveket kezelő kontroller.
 */
class CurriculumController extends Controller
{
    /**
     * Lekéri az összes tantervet. vagy ha diák akkor csak a hozzá tartozót.
     * @return JsonResponse A lekérdezett tanterveket tartalmazó JSON válasz.
     */
    public function index(){
        if(Auth::check() && Auth::user()->role === 'student'){
            /** @var User $student */
            $student = Auth::user();

            return Curriculum::find($student->curriculum_id);
        }
        return Curriculum::all();
    }

    /**
     * Létrehoz egy új tantervet a hozzá tartozó specializációkkal, kategoriákkal, és kategoria-kurzus kapcsolatokkal.
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse A létrehozott tantervet tartalmazó JSON válasz.
     * @throws ValidationException Ha a validálás sikertelen.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'specializations' => 'array',
            'specializations.*.name' => 'string',
            'specializations.*.required' => 'boolean',
            'specializations.*.categories' => 'array',
            'specializations.*.categories.*.name' => 'string',
            'specializations.*.categories.*.min' => 'integer|min:0',
            'specializations.*.categories.*.courses' => 'array',
            'specializations.*.categories.*.courses.*.id' => 'exists:courses,id|integer',
        ]);


        $curriculum = Curriculum::create([
            'name' => $validated['name']
        ]);

        foreach( $validated['specializations'] as $specData){
            $specialization = $curriculum->specializations()->create([
                'name' => $specData['name'],
                'required' => $specData['required'],
                'min' => 0,
            ]);
            $sepcMin = 0;

            foreach ($specData['categories'] as $catData) {
                $category = $specialization->categories()->create([
                    'name' => $catData['name'],
                    'min' => $catData['min'],
                    'max' => 0
                ]);
                $sumCourseKerdit = 0;
                foreach($catData['courses'] as $cData){
                    $course = Course::find($cData['id']);
                    $sumCourseKerdit += $course->kredit;
                    $category->courses()->attach($cData['id']);
                }
                $category->max = $sumCourseKerdit;
                $category->save();
                $sepcMin +=  $category->min;
            }
            $specialization->min = $sepcMin;
            $specialization->save();
        }
        return response()->json([
            'message' => 'Curriculum created successfully',
            'curriculum' => $curriculum->load('specializations.categories.courses')
        ], 201);
    }

    /**
     * Lekér egy tantervet a hozzá kapcsolodó specializációk, kategoriák és kurzusokkal együtt.
     * @param Curriculum $curriculum A lekérdezett tanterv.
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse A lekérdezett tantervet tartalmazó JSON válasz.
     */
    public function show(Request $request, Curriculum $curriculum)
    {
        $courseIdFilter = $request->query('course_id_filter') ? (int)$request->query('course_id_filter') : null;

        $curriculum->load(['specializations.categories.courses' => function ($query) use ($courseIdFilter) {
            if ($courseIdFilter !== null) {
                $query->where('courses.id', $courseIdFilter);

            }
        }]);
        if(Auth::check() && Auth::user()->role === 'student'){
            /** @var User $student */
            $student = Auth::user();

            $studentGrades = $student->grades()
                                    ->whereNotNull('grade')
                                    ->where('grade', '!=', 1)
                                    ->pluck('course_id')
                                    ->all();
            $studentApplied = $student->grades()
                                     ->whereNull('grade')
                                     ->pluck('course_id')
                                     ->all();

            $isAutumnSemester = (int)date("n") >= 9;
            foreach($curriculum->specializations as $specialization){
                foreach($specialization->categories as $category){
                    foreach($category->courses as $course){
                        $course->completed = in_array($course->id, $studentGrades);
                        $course->applied = in_array($course->id, $studentApplied);
                        $course->can = $course->sezon == null || $course->sezon == $isAutumnSemester;
                       
                    }
                }
            }
        }
        return response()->json($curriculum);
    }

    /**
     * Firiisti a tantervet. (A komplesz kapcsolatok, miatt ez azt jeleniti hogy törli a tantervet és létrehoz egy újat)
     * @param Curriculum $curriculum A tanterv.
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse A JSON válasz.
     */
    public function update(Request $request, Curriculum $curriculum)
    {
        $validated = $request->validate([
            'id' => 'required|exists:curricula,id|integer',
            'name' => 'required|string',
            'specializations' => 'array',
            'specializations.*.id' => 'exists:specializations,id|integer',
            'specializations.*.required' => 'boolean',
            'specializations.*.name' => 'string',
            'specializations.*.categories' => 'array',
            'specializations.*.categories.*.id' => 'exists:categories,id|integer',
            'specializations.*.categories.*.name' => 'string',
            'specializations.*.categories.*.min' => 'integer|min:0',
            'specializations.*.categories.*.courses' => 'array',
            'specializations.*.categories.*.courses.*.id' => 'exists:courses,id|integer',
        ]);

        $curriculum->name = $validated['name'];
        $curriculum->save();

        $curriculum->specializations()->delete();

        foreach ($validated['specializations'] as $specData) {
            $specialization = $curriculum->specializations()->create([
                'name' => $specData['name'],
                'required' => $specData['required'],
                'min' => 0
            ]);
            $sepcMin = 0;

            foreach ($specData['categories'] as $catData) {
                $category = $specialization->categories()->create([
                    'name' => $catData['name'],
                    'min' => $catData['min'],
                    'max' => 0
                ]);
                $sumCourseKerdit = 0;
                foreach($catData['courses'] as $cData){
                    $course = Course::find($cData['id']);
                    $sumCourseKerdit += $course->kredit;
                    $category->courses()->attach($cData['id']);
                }  
                $category->max = $sumCourseKerdit;
                $category->save();
                $sepcMin +=  $category->min;              
            }
            $specialization->min = $sepcMin;
            $specialization->save();
        }

        return response()->json([
            'message' => 'A tanterv sikeresen frisitve',
            'curriculum' => $curriculum->load('specializations.categories.courses')
        ]);
    }

    /**
     * Törli a tantervet.
     * @param Curriculum $curriculum A tanterv.
     * @return JsonResponse A JSON válasz.
     */
    public function destroy(Curriculum $curriculum)
    {
        $id = $curriculum->id;
        $curriculum->delete();
        return ['message' => 'A/Az '.$id.' tanterv törölve lett!'];
    }
}
