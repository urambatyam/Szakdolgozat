<?php

namespace App\Http\Controllers;

use App\Models\Curriculum;
use App\Models\Course;
use Illuminate\Http\Request;
use App\Rules\CustomCurriculumValidation;

class CurriculumController extends Controller
{
    public function index(){
        return Curriculum::all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'specializations' => 'array',
            'specializations.*.name' => 'string',
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
     * Display the specified resource.
     */
    public function show(Curriculum $curriculum)
    {
        return response()->json(
            $curriculum->load('specializations.categories.courses')
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Curriculum $curriculum)
    {
        $validated = $request->validate([
            'id' => 'required|exists:curricula,id|integer',
            'name' => 'required|string',
            'specializations' => 'array',
            'specializations.*.id' => 'exists:specializations,id|integer',
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
     * Remove the specified resource from storage.
     */
    public function destroy(Curriculum $curriculum)
    {
        $id = $curriculum->id;

        $curriculum->delete();

        return ['message' => 'A/Az '.$id.' tanterv törölve lett!'];
    }
}
