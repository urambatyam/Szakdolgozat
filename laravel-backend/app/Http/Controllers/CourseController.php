<?php

namespace App\Http\Controllers;

use App\Models\Course;
//use Illuminate\Auth\Access\Gate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;


class CourseController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Course::all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('create', Course::class);
        $values = $request->validate([
            'name' => 'required|max:25|unique:courses,name|string',
            'kredit' => 'required|integer|min:0',
            'recommendedSemester' => 'required|integer|min:0',
            'user_code' => 'nullable|exists:users,code',  // Módosítva id-ról code-ra
            'subjectMatter' => 'nullable|string|max:255'
        ]);

        $course = $request->user()->course()->create($values);

        return $course;
    }

    /**
     * Display the specified resource.
     */
    public function show(Course $course)
    {
        return $course;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Course $course)
    {
        Gate::authorize('update', Course::class);
        $values = $request->validate([
            'name' => 'required|max:25|unique:courses,name|string',
            'kredit' => 'required|integer|min:0',
            'recommendedSemester' => 'required|integer|min:0',
            'user_code' => 'nullable|exists:users,code',  // Módosítva id-ról code-ra
            'subjectMatter' => 'nullable|string|max:255'
        ]);

        $course->update($values);

        return $course;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Course $course)
    {
        $name = $course->name;
        Gate::authorize('delete', Course::class);
        $course->delete();

        return ['message' => 'A/Az '.$name.' kurzus törölve lett!'];
    }
}
