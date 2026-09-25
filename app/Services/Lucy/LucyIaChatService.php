<?php

namespace App\Services\Lucy;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class LucyIaChatService
{
    /** @return array<string, string> */
    public function profiles(): array
    {
        return [
            'dental' => $this->loadPrompt('dental'),
            'hogar' => $this->loadPrompt('hogar'),
            'vial' => $this->loadPrompt('vial'),
            'agendar' => $this->loadPrompt('agendar'),
            'reagendar' => $this->loadPrompt('reagendar'),
            'router' => $this->loadPrompt('router'),
        ];
    }

    public function systemPrompt(string $profile): string
    {
        $profiles = $this->profiles();
        if (! isset($profiles[$profile])) {
            throw new RuntimeException("Perfil IA desconocido: {$profile}");
        }

        return $profiles[$profile];
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     * @param  array<string, mixed>  $context
     */
    public function reply(string $profile, string $userMessage, array $history, array $context = []): array
    {
        $userMessage = trim($userMessage);
        if ($userMessage === '') {
            throw new RuntimeException('Mensaje vacío.');
        }

        $system = $this->systemPrompt($profile);
        if (! empty($context['nombre'])) {
            $system .= "\n\nNombre del usuario: {$context['nombre']}.";
        }
        if (! empty($context['cedula'])) {
            $system .= "\nCédula: {$context['cedula']}.";
        }

        if ($this->llmConfigured()) {
            $text = $this->llmReply($system, $history, $userMessage);

            return [
                'mode' => 'llm',
                'text' => $text,
            ];
        }

        return [
            'mode' => 'guided',
            'text' => $this->guidedReply($profile, $userMessage, $context),
        ];
    }

    private function llmConfigured(): bool
    {
        return config('lucy_ia.enabled')
            && (bool) config('lucy_ia.api_key');
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     */
    private function llmReply(string $system, array $history, string $userMessage): string
    {
        $messages = [['role' => 'system', 'content' => $system]];
        $max = (int) config('lucy_ia.max_history', 12);
        $slice = array_slice($history, -$max);
        foreach ($slice as $row) {
            if (! isset($row['role'], $row['content'])) {
                continue;
            }
            $messages[] = [
                'role' => $row['role'] === 'assistant' ? 'assistant' : 'user',
                'content' => (string) $row['content'],
            ];
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $base = config('lucy_ia.base_url');
        $response = Http::acceptJson()
            ->withToken((string) config('lucy_ia.api_key'))
            ->timeout((int) config('lucy_ia.timeout', 60))
            ->post("{$base}/chat/completions", [
                'model' => config('lucy_ia.model'),
                'temperature' => 0.4,
                'messages' => $messages,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('IA no disponible: '.$response->body());
        }

        $json = $response->json();
        $text = $json['choices'][0]['message']['content'] ?? null;
        if (! is_string($text) || trim($text) === '') {
            throw new RuntimeException('Respuesta IA vacía.');
        }

        return trim($text);
    }

    /** @param  array<string, mixed>  $context */
    private function guidedReply(string $profile, string $userMessage, array $context): string
    {
        $lower = mb_strtolower($userMessage);
        if (preg_match('/\b(salir|menú|menu|cancelar|volver)\b/u', $lower)) {
            return 'Entendido. Usa **Menú principal** o **Usar menú guiado** para continuar con el formulario clásico, o **Volver a WhatsApp** para cerrar la webview.';
        }

        $hints = match ($profile) {
            'dental' => 'Puedo ayudarte a agendar o reagendar cita dental. Indica si es para ti o un beneficiario, y tu ciudad.',
            'hogar' => 'Cuéntame qué problema tienes en casa (plomería, electricidad, cerrajería…) y si es urgente o programado.',
            'vial' => 'Describe tu situación vial (grúa, batería, llanta, etc.) y comparte referencia de ubicación si puedes.',
            'agendar', 'reagendar' => '¿La cita es médica o dental? ¿Agendar o reagendar? Indica especialidad si es médica.',
            default => 'Soy Lucy en modo asistido (sin LLM en servidor). Elige un flujo en el menú o activa LUCY_IA_API_KEY.',
        };

        return "Gracias por tu mensaje.\n\n{$hints}\n\n_Si necesitas el agente completo como en WhatsApp, cierra la webview y continúa con Lucy en el chat._";
    }

    private function loadPrompt(string $name): string
    {
        $path = resource_path("prompts/lucy-ia/{$name}.txt");
        if (! is_file($path)) {
            return "Eres Lucy, asesora GEA Ecuador. Perfil: {$name}. Responde en español, tono cercano.";
        }

        return trim((string) file_get_contents($path));
    }
}
