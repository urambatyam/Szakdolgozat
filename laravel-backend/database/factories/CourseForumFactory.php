<?php

namespace Database\Factories;


use App\Models\CourseForum;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseForum>
 */
class CourseForumFactory extends Factory
{
    protected $model = CourseForum::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message' => fake()->paragraph(),
        ];
    }
}
