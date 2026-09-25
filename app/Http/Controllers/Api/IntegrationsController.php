<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Integrations\IntegrationRegistry;
use Illuminate\Http\JsonResponse;

class IntegrationsController extends Controller
{
    /** Estado de credenciales (.env) — sin exponer valores. */
    public function status(): JsonResponse
    {
        $report = IntegrationRegistry::statusReport();

        return response()->json([
            'ok' => IntegrationRegistry::coreReady(),
            'service' => 'lucy-webview',
            'core_ready' => IntegrationRegistry::coreReady(),
            'integrations' => $report,
        ]);
    }
}
