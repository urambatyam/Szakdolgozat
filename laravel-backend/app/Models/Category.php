<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;
    protected $fillable = ['name','specialization_id'];

    public function specialization(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'category_course');
    }
}
