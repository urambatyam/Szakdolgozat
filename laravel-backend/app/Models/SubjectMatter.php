<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectMatter extends Model
{
    /** @use HasFactory<\Database\Factories\SubjectMatterFactory> */
    use HasFactory;
    protected $fillable = [    
        'course_id',
        'topic',
        'goal',
        'requirements'
    ];
    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }
}
