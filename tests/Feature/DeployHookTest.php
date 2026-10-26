<?php

use Illuminate\Support\Facades\Artisan;

test('the deploy hook is disabled when no token is configured', function () {
    config(['services.deploy.token' => null]);

    $this->post(route('deploy-hook'), [], ['X-Deploy-Token' => ''])->assertNotFound();
});

test('the deploy hook rejects a wrong token', function () {
    config(['services.deploy.token' => 'secret-token']);

    $this->post(route('deploy-hook'), [], ['X-Deploy-Token' => 'wrong'])->assertNotFound();
});

test('the deploy hook migrates and caches with the right token', function () {
    config(['services.deploy.token' => 'secret-token']);

    Artisan::shouldReceive('call')->once()->with('migrate', ['--force' => true]);
    Artisan::shouldReceive('call')->once()->with('optimize');
    Artisan::shouldReceive('output')->twice()->andReturn("ok\n");

    $this->post(route('deploy-hook'), [], ['X-Deploy-Token' => 'secret-token'])
        ->assertOk()
        ->assertSee('ok');
});
