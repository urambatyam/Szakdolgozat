<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    /** @use HasFactory<\Database\Factories\GardeFactory> */
    use HasFactory;

    protected $fillable = [
        'grade',
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
