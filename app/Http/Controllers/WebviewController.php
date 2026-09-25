<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class WebviewController extends Controller
{
    public function index(): View
    {
        return view('app', [
            'appName' => config('app.name'),
        ]);
    }
}
