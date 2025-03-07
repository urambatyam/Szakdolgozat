<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
//use Illuminate\Auth\Access\Gate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Http\Resources\CourseResource;
use App\Models\SubjectMatter;
use Illuminate\Support\Facades\DB;
use Exception;


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
     * Display a listing of the resource.
     */
    public function getAllCoursesNames()
    {
        return Course::select('id','name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('create',Course::class);
        $values = $request->validate([
            'name' => 'required|max:25|string',
            'kredit' => 'required|integer|min:0',
            'recommendedSemester' => 'required|integer|min:0',
            'user_code' => 'nullable|exists:users,code',  
            'subjectMatter' => 'nullable|string|max:255',
            'sezon' => 'nullable|boolean',
        ]);

        try {
            $course = DB::transaction(function () use ($request, $values) {
                $course = $request->user()->course()->create($values);
            
                if ($course) {
                    SubjectMatter::create([
                        'course_id' => $course->id,
                    ]);
                }
    
                return $course;
            });
    
            return response()->json([
                'message' => 'Course created successfully',
                'course' => $course
            ], 201); 
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to create course',
                'error' => $e->getMessage()
            ], 500); 
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Course $course)
    {
        return $course;
    }

    public function getAllCoursesOFUser(Request $request, String $user_code)
    {
        Gate::authorize('getAllCoursesOFUser', Course::class);
        
        $query = Course::query();
        
        // Filtering
        if ($request->has('filter')) {
            $query->where('name', 'like', '%' . $request->filter . '%');
        }
        
        // Sorting
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);
        
        $perPage = $request->input('per_page', 10);
        
        $user = User::where('code', $user_code)->first();
        
        if ($user->role === 'admin') {
            $result =  Course::orderBy($sortField, $sortDirection)
                ->when($request->has('filter'), function($q) use ($request) {
                    return $q->where('name', 'like', '%' . $request->filter . '%');
                })
                ->paginate($perPage);
        } else {
            $result =  Course::whereHas('user', function ($query) use ($user_code) {
                $query->where('code', $user_code);
            })
            ->when($request->has('filter'), function($q) use ($request) {
                return $q->where('name', 'like', '%' . $request->filter . '%');
            })
            ->orderBy($sortField, $sortDirection)
            ->paginate($perPage);
        }
        return CourseResource::collection($result);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Course $course)
    {
        Gate::authorize('update',Course::class);
        $values = $request->validate([
            'name' => 'required|max:25|string',
            'kredit' => 'required|integer|min:0',
            'recommendedSemester' => 'required|integer|min:0',
            'user_code' => 'nullable|exists:users,code',  
            'subjectMatter' => 'nullable|string|max:255',
            'sezon' => 'nullable|boolean',
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
        Gate::authorize('delete',Course::class);
        $course->delete();

        return ['message' => 'A/Az '.$name.' kurzus törölve lett!'];
    }
}
