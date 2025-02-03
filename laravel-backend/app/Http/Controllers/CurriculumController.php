<?php

namespace App\Http\Controllers;

use App\Models\Curriculum;
use Illuminate\Http\Request;

class CurriculumController extends Controller
{


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'specializations' => 'required|array',
            'specializations.*.name' => 'required|string',
            'specializations.*.categories' => 'required|array',
            'specializations.*.categories.*.name' => 'required|string',
            'specializations.*.categories.*.courses' => 'required|array',
            'specializations.*.categories.*.courses.*' => 'required|exists:courses,name',
        ]);

        $curriculum = Curriculum::create([
            'name' => $validated['name']
        ]);

        foreach ($validated['specializations'] as $specData) {
            $specialization = $curriculum->specializations()->create([
                'name' => $specData['name']
            ]);

            foreach ($specData['categories'] as $catData) {
                $category = $specialization->categories()->create([
                    'name' => $catData['name']
                ]);
                $category->courses()->attach($catData['courses']);   
            }
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
        return response()->json([
            'curriculum' => $curriculum->load('specializations.categories.courses')
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Curriculum $curriculum)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'specializations' => 'required|array',
            'specializations.*.name' => 'required|string',
            'specializations.*.categories' => 'required|array',
            'specializations.*.categories.*.name' => 'required|string',
            'specializations.*.categories.*.courses' => 'required|array',
            'specializations.*.categories.*.courses.*' => 'required|exists:courses,name',
        ]);

        $curriculum->name = $validated['name'];
        $curriculum->save();

        $curriculum->specializations()->delete();

        foreach ($validated['specializations'] as $specData) {
            $specialization = $curriculum->specializations()->create([
                'name' => $specData['name']
            ]);

            foreach ($specData['categories'] as $catData) {
                $category = $specialization->categories()->create([
                    'name' => $catData['name']
                ]);

                // Kurzusok hozzárendelése
                $category->courses()->sync($catData['courses']);
            }
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
