<?php

namespace Database\Factories;

use App\Models\Visual;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Visual>
 */
class VisualFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = Str::uuid()->toString();

        return [
            'first_name' => fake()->optional()->firstName(),
            'image_path' => "visuels/{$name}.jpg",
            'thumb_path' => "visuels/{$name}-petit.jpg",
            'token_hash' => Visual::hashToken('secret'),
        ];
    }
}
