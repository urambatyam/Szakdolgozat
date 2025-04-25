<?php

namespace App\Http\Controllers;

use App\Models\SubjectMatter;
use App\Models\Course;
use Illuminate\Http\Request;

class SubjectMatterController extends Controller
{

    /**
     * Display the specified resource.
     */
    public function getSubjectMatterOfCourse(int $courseId)
    {
        return SubjectMatter::whereHas('course', function ($query) use ($courseId) {
            $query->where('id', $courseId);
        })->firstOrFail();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $values = $request->validate([
            'id' => 'required|exists:subject_matters,id|integer',
            'course_id' => 'required|exists:courses,id|integer',
            'topic' => 'nullable|string|max:255',
            'goal' => 'nullable|string|max:255',
            'requirements' => 'nullable|string|max:255',
        ]);
        $subjectMatter = SubjectMatter::find($values['id']);
        $subjectMatter->update($values);

        return $subjectMatter;
    }
}
