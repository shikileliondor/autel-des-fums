<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;

/**
 * Runs the post-deploy commands on hosting without SSH access.
 * Called by the deploy workflow once the files are uploaded over FTP.
 */
class DeployHookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $token = (string) config('services.deploy.token');

        abort_if($token === '' || ! hash_equals($token, (string) $request->header('X-Deploy-Token')), 404);

        Artisan::call('migrate', ['--force' => true]);
        $output = Artisan::output();

        Artisan::call('optimize');
        $output .= Artisan::output();

        return response($output, 200, ['Content-Type' => 'text/plain']);
    }
}
