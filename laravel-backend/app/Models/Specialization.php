<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Specialization extends Model
{
    use HasFactory;
    protected $fillable = ['name','curriculum_id','min'];

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }
}
