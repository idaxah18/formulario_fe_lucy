<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Jelou\JelouPayClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class JelouPayController extends Controller
{
    public function __construct(private readonly JelouPayClient $pay) {}

    public function plans(): JsonResponse
    {
        if (! $this->pay->configured()) {
            return response()->json(['ok' => false, 'message' => 'Jelou Pay no configurado.'], 503);
        }

        try {
            return response()->json(['ok' => true, 'data' => $this->pay->listPlans()]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }

    public function checkoutLink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product' => 'required|string|in:edoctor,viaja,inmediata',
            'email' => 'nullable|email|max:120',
            'names' => 'required|string|max:80',
            'surname' => 'nullable|string|max:80',
            'legal_id' => 'required|string|max:20',
        ]);

        if (! $this->pay->configured()) {
            return response()->json([
                'ok' => false,
                'simulated' => true,
                'message' => 'Jelou Pay no configurado (JELOU_PAY_BEARER). Usa WhatsApp para completar el pago.',
            ], 503);
        }

        try {
            $result = $this->pay->createSubscriptionLink($data['product'], $data);

            return response()->json(['ok' => true, ...$result]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }
}
