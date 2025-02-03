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
            'course_name' => 'required|max:25|exists:courses,name|string',
            'message' => 'required|max:255'
        ]);

        $forum = $request->user()->forums()->create($values);
        
        return $forum;
        //return $values;
    }

    /**
     * Display the specified resource.
     */
    public function show(String $course_name)
    {
        return CourseForum::where('course_name', $course_name)->get();
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
