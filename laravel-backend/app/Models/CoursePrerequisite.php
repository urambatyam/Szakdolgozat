<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CoursePrerequisite extends Model
{
    /** @use HasFactory<\Database\Factories\CourseFactory> */
    use HasFactory;

    protected $fillable = [
        'course_id', 
        'prerequisite_course_id', 
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function prerequisite()
    {
        return $this->belongsTo(Course::class, 'prerequisite_course_id');
    }
}
