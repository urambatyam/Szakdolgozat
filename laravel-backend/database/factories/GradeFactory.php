<?php

namespace Database\Factories;

use App\Models\Grade;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Garde>
 */
class GradeFactory extends Factory
{
    protected $model = Grade::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'grade' => fake()->numberBetween(1,5),
            'year' => fake()->randomElement([2023,2024,2025]),
        ];
    }
}
