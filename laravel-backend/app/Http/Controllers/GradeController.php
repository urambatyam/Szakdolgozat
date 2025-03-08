<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Grade;
use MathPHP\Statistics\Average;
use MathPHP\Statistics\Descriptive;
use MathPHP\Statistics\Regression;
use MathPHP\Statistics\Distribution;

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
        ]);

        $values['year'] = date("Y");
        $values['sezon'] = (date("n") >= 9) ? true:false;

        $grade = $request->user()->grades()->create($values);

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
        $query = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        });
        
        if ($request->has('filter')) {
            $query->where('user_code', 'like', '%' . $request->filter . '%');
        }
        
        if ($request->has('year') && $request->has('sezon')) {
            $query->where('year', $request->year)
                  ->where('sezon', $request->sezon);
        }
        
        $sortField = $request->input('sort_field', 'user_code');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);
        
        $perPage = $request->input('per_page', 10);
        $gardeData = $query->paginate($perPage);
        
        $semesters = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })
        ->select('year', 'sezon')
        ->distinct()
        ->get()
        ->map(function($item) {
            return [
                'year' => $item->year,
                'sezon' => $item->sezon
            ];
        });
        
        return ['grades' => $gardeData, 'semesters' => $semesters];
    }
    
    public function getAllGradesOFStudent(Request $request, String $studentCode)
    {
        $query = Grade::whereHas('user', function ($query) use ($studentCode) {
            $query->where('code', $studentCode);
        });

        if ($request->has('filter')) {
            $query->whereHas('course', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->filter . '%');
            });
        }

        if ($request->has('year') && $request->has('sezon')) {
            $query->where('year', $request->year)
                ->where('sezon', $request->sezon);
        }

        $query->orderBy('year', 'asc');
        $query->orderBy('sezon', 'asc');

        $perPage = $request->input('per_page', 10);
        $gardeData = $query->paginate($perPage);

        $gardeData->getCollection()->transform(function ($grade) {
            $grade->course_name = $grade->course->name;
            return $grade;
        });

        $semesters = Grade::whereHas('user', function ($query) use ($studentCode) {
            $query->where('code', $studentCode);
        })
            ->select('year', 'sezon')
            ->distinct()
            ->get()
            ->map(function ($item) {
                return (object) [ // Itt alakítjuk objektummá a tömböt.
                    'year' => $item->year,
                    'sezon' => $item->sezon,
                    'current' => false,
                ];
            });

        $nowY = date("Y");
        $nowS = date("n") >= 9 ? true : false;
        $currentInSemester = false;

        foreach ($semesters as $semester) {
            if ($semester->year == $nowY && $semester->sezon == $nowS) {
                $semester->current = true;
                $currentInSemester = true;
                break;
            }
        }
        if (!$currentInSemester) {
            $semesters->push((object) [ 
                'year' => $nowY,
                'sezon' => $nowS,
                'current' => true,
            ]);
        }

        $semesters = $semesters->sortBy([['year', 'desc'], ['sezon', 'desc']])->values();

        return ['grades' => $gardeData, 'semesters' => $semesters];
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Grade $grade)
    {
        $values = $request->validate([
            'grade' => 'nullable|integer|min:1|max:5',
        ]);

        $grade->update($values);

        return $grade;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Grade $grade)
    {
        $grade->delete();

        return ['message' => 'A jegy törölve lett!'];
    }
    


    public function statisticAbaoutCourse(int $course_id)
    {
        $data = Grade::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->get();
        
        $gradesWithOuthNull = $data->pluck('grade')->filter(function($item){
            return $item !== null;
        })->values()->all();

        function completionRate(object $grades){
            $result = [
                "completed" => 0,
                "failed" =>0,
                "absent" => 0
            ];
            foreach($grades as $item){
                switch($item->grade){
                    case 1:
                        $result['failed']++;
                        break;
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                        $result['completed']++;
                        break;
                    default:
                        $result['absent']++;
                        break;
                    }
            }
            return $result;
        }

        $completionRate = completionRate($data);
        $mean = Average::mean($gradesWithOuthNull);
        $st = Descriptive::standardDeviation($gradesWithOuthNull);
        $allGradesFrequency = Distribution::frequency($gradesWithOuthNull);

        $semesters = [];
        foreach($data as $d){
            $key = $d['year'].'-'.($d['sezon'] ? 1:0);
            if(!isset($semesters[$key])){
                $semesters[$key] = [
                    'grades' => [],
                ];
            }
            $semesters[$key]['grades'][] = $d['grade'];
        }

        foreach($semesters as $s_key => $s){
            $currentSemesterGrades = $data->where('year',substr($s_key, 0, 4))->where('sezon',substr($s_key, -1))->values();
            $semesters[$s_key]["completionStats"] = completionRate($currentSemesterGrades);

            $gradesWONULL = collect($semesters[$s_key]["grades"])->filter(function($item){
                return $item !== null;
            })->values()->all();

            $semesters[$s_key]["grade"] = $gradesWONULL;
            $semesters[$s_key]["gradeDistribution"] = Distribution::frequency($semesters[$s_key]["grade"]);
            $semesters[$s_key]["meam"] = Average::mean($semesters[$s_key]["grade"]);
            $semesters[$s_key]["standardDeviation"] = Descriptive::standardDeviation($semesters[$s_key]["grade"]);
            $semesters[$s_key]["quartiles"] = Descriptive::quartiles($gradesWONULL);
            unset($semesters[$s_key]['grades']);
        }
        ksort($semesters);
        $semesterAverages = [];
        $index = 1;
        foreach ($semesters as $semesterData) {
            $semesterAverages[] = [$index, $semesterData["meam"]];
            $index++; 
        }

        if(count($semesterAverages) > 2){
            $regression = new Regression\Linear($semesterAverages);
            $semesterRegression = $regression->getParameters();
        }else{
            $semesterRegression = ['m' => 0, 'b' => 0];
        }

        $statisic = (object)[
            "meam" => $mean,
            "standardDeviation" => $st,
            "gradeDistribution" => $allGradesFrequency,
            "completionStats" => $completionRate,
            "Allgrade" => $gradesWithOuthNull,
            "quartiles"=> Descriptive::quartiles($gradesWithOuthNull),
            "m" => $semesterRegression['m'],
            "b" => $semesterRegression['b'],
            "semesters" => $semesters,
        ];

        return $statisic;
    }


    public function statisticAbaoutAll()
    {
        return ['message' => 'Statisztika'];
    }


}
