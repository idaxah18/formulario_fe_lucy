<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Throwable;

/** Reenvía el cierre de webview al gateway Jelou (evita CORS desde el browser). */
class JelouWebviewCallbackController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'executionId' => 'required|string|max:128',
            'success' => 'required|boolean',
            'data' => 'nullable|array',
        ]);

        $url = (string) config(
            'services.jelou.webview_callback_url',
            'https://workflows.jelou.ai/v1/webview/callback',
        );
        // gateway.jelou.ai exige API key; el callback público de un WebView es workflows.jelou.ai.
        if (str_contains($url, 'gateway.jelou.ai')) {
            $url = 'https://workflows.jelou.ai/v1/webview/callback';
        }

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout(20)
                ->post($url, [
                    'executionId' => $payload['executionId'],
                    'success' => $payload['success'],
                    'data' => $payload['data'] ?? (object) [],
                ]);

            $body = $response->json();
            if (! is_array($body)) {
                $body = ['raw' => $response->body()];
            }

            if (! $response->successful()) {
                return response()->json([
                    'ok' => false,
                    'status' => $response->status(),
                    'message' => $body['message'] ?? 'Jelou webview callback rechazado.',
                    'data' => $body,
                ], 502);
            }

            return response()->json(['ok' => true, 'data' => $body]);
        } catch (Throwable $e) {
            return response()->json([
                'ok' => false,
                'message' => $e->getMessage(),
            ], 502);
        }
    }
}
