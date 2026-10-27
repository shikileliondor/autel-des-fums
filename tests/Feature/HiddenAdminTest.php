<?php

use Inertia\Testing\AssertableInertia as Assert;

test('the admin sign-in lives at /morel', function () {
    expect(route('login', absolute: false))->toBe('/morel');

    $this->get('/morel')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/login'));
});

test('/login no longer exists and shows the 404 page', function () {
    $this->get('/login')
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page->component('not-found'));
});

test('any unknown address shows the site 404 page', function () {
    $this->get('/une-page-qui-n-existe-pas')
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page->component('not-found'));
});

test('json requests keep a plain 404', function () {
    $this->getJson('/une-page-qui-n-existe-pas')->assertNotFound()->assertJsonStructure(['message']);
});
