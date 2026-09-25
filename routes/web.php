<?php

use App\Http\Controllers\WebviewController;
use Illuminate\Support\Facades\Route;

/*
| Webview SPA: todas las rutas de UI pasan por Vue Router (history mode).
| Laravel solo entrega el shell Blade + assets.
*/
Route::get('/{any?}', [WebviewController::class, 'index'])
    ->where('any', '.*')
    ->name('webview');
