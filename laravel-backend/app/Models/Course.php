<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    /** @use HasFactory<\Database\Factories\CourseFactory> */
    use HasFactory;

    protected $fillable = [
        'name', 
        'kredit', 
        'recommendedSemester', 
        'user_code', 
        'subjectMatter',
        'sezon'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_code', 'code');
    }
    
    public function forums()
    {
        return $this->hasMany(CourseForum::class, 'course_id', 'id');
    }

    public function grades()
    {
        return $this->hasMany(Grade::class, 'course_id', 'id');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_course');
    }
}
