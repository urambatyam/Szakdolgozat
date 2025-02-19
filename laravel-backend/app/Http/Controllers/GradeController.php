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
            'course_id' => 'required|max:25|exists:courses,id',
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

    public function getAllGradesInCourse(Request $request, int $course_id)
    {
        $query = Grade::query();
        // Sorting
        $sortField = $request->input('sort_field', 'user_code');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);
                
        $perPage = $request->input('per_page', 10);

        return Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })
        ->when($request->has('filter'), function($q) use ($request) {
            return $q->where('user_code', 'like', '%' . $request->filter . '%');
        })
        ->orderBy($sortField, $sortDirection)
        ->paginate($perPage);
    }
    
    public function getAllGradesOFStudent(String $studentCode)
    {
        return Grade::whereHas('user', function ($query) use ($studentCode) {
            $query->where('code', $studentCode);
        })->get();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Grade $garde)
    {
        $values = $request->validate([
            'grade' => 'required|integer|min:1|max:5',
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
    

    public function statisticAbaoutCourse(int $course_id)
    {
        return ['message' => 'Statisztika a kurzusról'];
    }

    public function statisticAbaoutAll()
    {
        return ['message' => 'Statisztika'];
    }


}
