<?php

use App\Models\User;

test('public sign-up is disabled', function () {
    $this->get('/register')->assertNotFound();

    $this->post('/register', [
        'name' => 'Intrus',
        'email' => 'intrus@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();

    expect(User::count())->toBe(0);
});
