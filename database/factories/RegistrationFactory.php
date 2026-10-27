<?php

namespace Database\Factories;

use App\Models\Registration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Registration>
 */
class RegistrationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'gender' => fake()->randomElement(Registration::GENDERS),
            'phone' => '+225'.fake()->unique()->numerify('07########'),
            'email' => fake()->optional()->safeEmail(),
            'church' => fake()->optional()->company(),
            'church_group' => Registration::GROUP_GUEST,
            'role' => fake()->optional()->randomElement(['Choriste', 'Diacre', 'Intercesseur', 'Fidèle']),
        ];
    }
}
