<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseForum extends Model
{
    /** @use HasFactory<\Database\Factories\CourseForumFactory> */
    use HasFactory;



    protected $fillable = [
        'message',
        'user_code',
        'course_name'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_code', 'code');
    }
    public function course()
    {
        return $this->belongsTo(Course::class, 'course_name', 'name');
    }
}
