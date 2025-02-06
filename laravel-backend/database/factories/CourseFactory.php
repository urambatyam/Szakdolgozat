<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(2), 
            'kredit'=> fake()->numberBetween(0,5), 
            'recommendedSemester'=> fake()->numberBetween(0,6), 
            'subjectMatter'=> fake()->paragraph()
        ];
    }
}
