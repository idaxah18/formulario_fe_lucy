<?php

namespace App\Http\Middleware;

use App\Support\Integrations\IntegrationRegistry;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIntegrationConfigured
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string $integration): Response
    {
        IntegrationRegistry::assertConfigured($integration);

        return $next($request);
    }
}
