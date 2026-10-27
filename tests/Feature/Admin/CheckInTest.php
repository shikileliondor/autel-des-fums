<?php

use App\Models\Registration;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['event.admin_emails' => ['admin@example.com']]);
    $this->admin = User::factory()->create(['email' => 'admin@example.com']);
});

test('only admins can open the check-in page', function () {
    $user = User::factory()->create(['email' => 'someone@example.com']);

    $this->actingAs($user)
        ->get(route('check-in.show', $user->currentTeam))
        ->assertForbidden();

    $this->actingAs($user)
        ->postJson(route('check-in.store', $user->currentTeam), ['reference' => 'ADP-ABC123'])
        ->assertForbidden();
});

test('the check-in page shows how many people are present', function () {
    Registration::factory()->count(2)->create();
    Registration::factory()->create(['checked_in_at' => now()]);

    $this->actingAs($this->admin)
        ->get(route('check-in.show', $this->admin->currentTeam))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/check-in')
            ->where('present', 1)
            ->where('total', 3));
});

test('scanning a code marks the registrant present', function () {
    $registration = Registration::factory()->create();

    $this->actingAs($this->admin)
        ->postJson(route('check-in.store', $this->admin->currentTeam), ['reference' => $registration->reference])
        ->assertOk()
        ->assertJson([
            'status' => 'ok',
            'registration' => ['reference' => $registration->reference],
            'present' => 1,
        ]);

    expect($registration->fresh()->checked_in_at)->not->toBeNull();
});

test('a second scan says the person is already in and keeps the first time', function () {
    $registration = Registration::factory()->create(['checked_in_at' => now()->subHour()]);
    $firstScan = $registration->checked_in_at->toDateTimeString();

    $this->actingAs($this->admin)
        ->postJson(route('check-in.store', $this->admin->currentTeam), ['reference' => $registration->reference])
        ->assertOk()
        ->assertJson(['status' => 'already']);

    expect($registration->fresh()->checked_in_at->toDateTimeString())->toBe($firstScan);
});

test('a code typed in lowercase is recognised', function () {
    $registration = Registration::factory()->create();

    $this->actingAs($this->admin)
        ->postJson(route('check-in.store', $this->admin->currentTeam), ['reference' => strtolower($registration->reference)])
        ->assertJson(['status' => 'ok']);
});

test('an unknown code is reported without error', function (?string $reference) {
    $this->actingAs($this->admin)
        ->postJson(route('check-in.store', $this->admin->currentTeam), ['reference' => $reference])
        ->assertOk()
        ->assertExactJson(['status' => 'unknown']);
})->with(['ADP-ZZZZZZ', 'https://example.com', null]);

test('the registrant page url from the pdf qr code is recognised', function () {
    $registration = Registration::factory()->create();

    $this->actingAs($this->admin)
        ->postJson(route('check-in.store', $this->admin->currentTeam), ['reference' => route('registration.show', $registration)])
        ->assertJson(['status' => 'ok']);
});
