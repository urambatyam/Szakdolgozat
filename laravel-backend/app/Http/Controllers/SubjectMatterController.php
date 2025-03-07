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
        })->get();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SubjectMatter $subjectMatter)
    {
        $values = $request->validate([
            'topic' => 'nullable|text',
            'goal' => 'nullable|text',
            'requirements' => 'nullable|text',
        ]);

        $subjectMatter->update($values);

        return $subjectMatter;
    }
}
