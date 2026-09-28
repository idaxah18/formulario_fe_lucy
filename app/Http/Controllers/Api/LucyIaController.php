<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Lucy\LucyIaChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class LucyIaController extends Controller
{
    public function __construct(private readonly LucyIaChatService $ia) {}

    public function profiles(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'profiles' => array_keys($this->ia->profiles()),
            'llm' => (bool) config('lucy_ia.api_key'),
        ]);
    }

    public function bootstrap(Request $request): JsonResponse
    {
        $data = $request->validate([
            'profile' => 'required|string|in:dental,hogar,vial,agendar,reagendar,router,proteccion',
        ]);

        try {
            return response()->json([
                'ok' => true,
                'profile' => $data['profile'],
                'llm' => (bool) config('lucy_ia.api_key'),
                'welcome' => $this->welcomeFor($data['profile']),
            ]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function message(Request $request): JsonResponse
    {
        $data = $request->validate([
            'profile' => 'required|string|in:dental,hogar,vial,agendar,reagendar,router,proteccion',
            'message' => 'required|string|max:4000',
            'history' => 'nullable|array',
            'history.*.role' => 'required_with:history|string|in:user,assistant',
            'history.*.content' => 'required_with:history|string|max:8000',
            'context' => 'nullable|array',
        ]);

        try {
            $result = $this->ia->reply(
                $data['profile'],
                $data['message'],
                $data['history'] ?? [],
                $data['context'] ?? [],
            );

            return response()->json(['ok' => true, ...$result]);
        } catch (Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 502);
        }
    }

    private function welcomeFor(string $profile): string
    {
        return match ($profile) {
            'dental' => 'Hola, soy Lucy 🦷. ¿Quieres agendar o reagendar una cita dental? Cuéntame en una frase.',
            'hogar' => 'Hola, soy Lucy 🏡. ¿Qué servicio necesitas en tu hogar?',
            'vial' => 'Hola, soy Lucy 🚗. ¿En qué puedo ayudarte con tu vehículo?',
            'agendar' => 'Hola, soy Lucy. Te ayudo a **agendar** cita médica o dental.',
            'reagendar' => 'Hola, soy Lucy. Te ayudo a **reagendar** tu cita.',
            'proteccion' => 'Cuéntame qué producto de protección consultas o qué situación viviste, y te indico los documentos que necesitas.',
            default => 'Hola, soy Lucy. ¿En qué puedo ayudarte hoy?',
        };
    }
}
