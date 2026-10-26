<?php

/*
 * Production front controller for hosting where the domain must point to
 * public_html. The Laravel app lives in a sibling folder outside the web root;
 * the deploy workflow replaces __APP_DIR__ with that folder's name.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$appPath = __DIR__.'/../__APP_DIR__';

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $appPath.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require $appPath.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $appPath.'/bootstrap/app.php';

// public_path() must resolve to this folder (logo in emails and PDFs, Vite manifest).
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
