<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Grade;

class GradeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Grade::all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $values = $request->validate([
            'course_name' => 'required|max:25|exists:courses,name|string',
            'grade' => 'required|integer|min:0|max:5',
        ]);

        $grade = $request->user()->grade()->create($values);

        return $grade;
    }

    /**
     * Display the specified resource.
     */
    public function show(Grade $garde)
    {
        return $garde;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Grade $garde)
    {
        $values = $request->validate([
            'grade' => 'required|integer|min:0|max:5',
        ]);

        $garde->update($values);

        return $garde;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Grade $garde)
    {
        $garde->delete();

        return ['message' => 'A jegy törölve lett!'];
    }

    public function statisticAbaoutCourse(String $course_name)
    {
        return ['message' => 'Statisztika a kurzusról'];
    }

    public function statisticAbaoutAll()
    {
        return ['message' => 'Statisztika'];
    }


}
