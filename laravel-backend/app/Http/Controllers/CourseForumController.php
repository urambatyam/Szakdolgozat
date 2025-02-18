<?php

namespace App\Http\Controllers;

use App\Models\CourseForum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CourseForumController extends Controller
{

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $values = $request->validate([
            'course_id' => 'required|max:25|exists:courses,id|integer',
            'message' => 'required|max:255'
        ]);

        $forum = $request->user()->forums()->create($values);
        
        return $forum;
    }

    /**
     * Display the specified resource.
     */
    public function show(int $course_id)
    {
        return CourseForum::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->get();
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CourseForum $courseForum)
    {
        $id = $courseForum->id;
        Gate::authorize('delete', CourseForum::class);

        $courseForum->delete();

        return ['message' => 'A/Az '.$id.' kurzus bejegyzés törölve lett!'];
    }
}
