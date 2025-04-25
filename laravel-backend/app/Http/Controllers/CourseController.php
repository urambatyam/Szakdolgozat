<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
//use Illuminate\Auth\Access\Gate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Http\Resources\CourseResource;
use App\Models\CoursePrerequisite;
use App\Models\SubjectMatter;
use Illuminate\Support\Facades\DB;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;

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
            'name' => 'required|max:20|string',
            'kredit' => 'required|integer|min:0',
            'recommendedSemester' => 'required|integer|min:0',
            'user_code' => 'nullable|exists:users,code',  
            'subjectMatter' => 'nullable|string|max:255',
            'sezon' => 'nullable|boolean',
            'prerequisites' => 'nullable'
        ]);

        try {
            $course = DB::transaction(function () use ($request, $values) {
                $course = $request->user()->course()->create($values);
            
                if ($course) {
                    SubjectMatter::create([
                        'course_id' => $course->id,
                    ]);
                  
                    if ($request->prerequisites ) {
                        $prerequisites = $request->prerequisites;
                        foreach ($prerequisites as $prerequisite) {
                            CoursePrerequisite::create([
                                'course_id' => $course->id,
                                'prerequisite_course_id' => $prerequisite
                            ]);
                        }
                    }else{
                        CoursePrerequisite::create([
                            'course_id' => $course->id,
                        ]);
                    }
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
        $user = User::where('code', $user_code)->firstOrFail();
        $filter = $request->input('filter');
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $perPage = $request->input('per_page', 10);
    
        $query = Course::with(['prerequisites.prerequisite:id,name']);
        if ($filter) {
            $query->where('name', 'like', '%' . $filter . '%');
        }
        $query->orderBy($sortField, $sortDirection);
    
        if ($user->role !== 'admin') {
            $query->whereHas('user', function ($q) use ($user_code) {
                $q->where('code', $user_code);
            });
        }
    
        $paginatedResult = $query->paginate($perPage);
    
        $items = collect($paginatedResult->items())->map(function ($course) {
            
            $prerequisites = $course->prerequisites
                ->filter(fn($prerequisiteRelation) => $prerequisiteRelation->prerequisite !== null)
                ->map(fn($prerequisiteRelation) => [
                    'id' => $prerequisiteRelation->prerequisite->id,
                    'name' => $prerequisiteRelation->prerequisite->name,
                ])
                ->values();
            
            $course->pre = $prerequisites->isEmpty() ? [] : $prerequisites;
            $course->makeHidden('prerequisites');
            return $course;
        })->toArray();
        
        $newPaginator = new LengthAwarePaginator(
            $items,
            $paginatedResult->total(),
            $paginatedResult->perPage(),
            $paginatedResult->currentPage(),
            ['path' => request()->url(), 'query' => request()->query()]
        );
    
        return $newPaginator;
    }
    

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Course $course)
    {
        Gate::authorize('update',Course::class);
        $values = $request->validate([
            'name' => 'required|max:20|string',
            'kredit' => 'required|integer|min:0',
            'recommendedSemester' => 'required|integer|min:0',
            'user_code' => 'nullable|exists:users,code',  
            'subjectMatter' => 'nullable|string|max:255',
            'sezon' => 'nullable|boolean',
            'prerequisites' => 'nullable'
        ]);

        if ($request->prerequisites ) {
            CoursePrerequisite::where('course_id', $course->id)->delete();
            $prerequisites = $request->prerequisites;
            foreach ($prerequisites as $prerequisite) {
                CoursePrerequisite::create([
                    'course_id' => $course->id,
                    'prerequisite_course_id' => $prerequisite
                ]);
            }
        }

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
