<?php

/**
 * Laravel entry point for shared hosting (Hostinger).
 * This file sits in public_html/ and points to the Laravel app directory.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Path to the Laravel backend
$backendPath = dirname(__DIR__) . '/app/backend';

// Maintenance mode check
if (file_exists($maintenance = $backendPath . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader
require $backendPath . '/vendor/autoload.php';

// Bootstrap Laravel and handle the request
/** @var Application $app */
$app = require_once $backendPath . '/bootstrap/app.php';

// Override public path so asset/storage URLs resolve correctly
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
