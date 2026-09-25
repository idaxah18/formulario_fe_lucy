<?php

namespace App\Services\Jelou;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Jelou Pay (planes y enlaces de pago). */
class JelouPayClient
{
    public function configured(): bool
    {
        return (bool) config('services.jelou.pay.bearer')
            && (bool) config('services.jelou.pay.app_id');
    }

    public function listPlans(): array
    {
        $this->assertConfigured();

        $appId = config('services.jelou.pay.app_id');
        $base = rtrim((string) config('services.jelou.pay.base_url'), '/');

        $response = Http::acceptJson()
            ->withToken((string) config('services.jelou.pay.bearer'))
            ->timeout(45)
            ->get("{$base}/apps/{$appId}/plans");

        if (! $response->successful()) {
            throw new RuntimeException('No se pudieron listar planes Pay: '.$response->body());
        }

        return $response->json() ?? [];
    }

    public function resolvePlan(string $product): array
    {
        $planId = (int) config("services.jelou.pay.plans.{$product}");
        if (! $planId) {
            throw new RuntimeException("Producto Pay desconocido: {$product}");
        }

        $payload = $this->listPlans();
        $items = $payload['data'] ?? $payload;
        if (! is_array($items)) {
            throw new RuntimeException('Respuesta de planes inválida.');
        }

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            if ((int) ($item['id'] ?? 0) === $planId) {
                return $item;
            }
        }

        throw new RuntimeException("Plan Pay {$planId} no encontrado para {$product}.");
    }

    /**
     * Crea enlace de suscripción (equivalente tool «Jelou Pay: Pago con link»).
     *
     * @param  array<string, mixed>  $customer
     */
    public function createSubscriptionLink(string $product, array $customer): array
    {
        $this->assertConfigured();

        $plan = $this->resolvePlan($product);
        $price = (float) ($plan['price'] ?? 0);
        $tax = (float) config('services.jelou.pay.tax_percent', 15);
        $amount = round($price * (1 + $tax / 100), 2);

        $appId = config('services.jelou.pay.app_id');
        $base = rtrim((string) config('services.jelou.pay.base_url'), '/');
        $gatewayId = config('services.jelou.pay.gateway_id');

        $body = [
            'type' => 'suscription',
            'ttl' => 24,
            'bot_id' => config('services.jelou.pay.bot_id'),
            'email' => $customer['email'] ?? '',
            'names' => $customer['names'] ?? '',
            'surname' => $customer['surname'] ?? '',
            'legal_id' => $customer['legal_id'] ?? '',
            'legal_id_type' => 'ci',
            'country' => 'EC',
            'plan_id' => (string) ($plan['id'] ?? ''),
            'amount' => (string) $amount,
            'reference_id' => $customer['legal_id'] ?? '',
            'gateway_id' => $gatewayId,
            'tax_percentage' => (string) $tax,
            'should_apply_tax' => true,
            'collect_email' => false,
            'collect_address' => false,
            'invoice_status' => 'not_submitted',
        ];

        if (! $gatewayId) {
            unset($body['gateway_id']);
        }

        $response = Http::acceptJson()
            ->withToken((string) config('services.jelou.pay.bearer'))
            ->timeout(60)
            ->post("{$base}/apps/{$appId}/payment-links", $body);

        if (! $response->successful()) {
            throw new RuntimeException('No se pudo crear el enlace de pago: '.$response->body());
        }

        $json = $response->json() ?? [];

        return [
            'plan' => [
                'id' => $plan['id'] ?? null,
                'name' => $plan['name'] ?? $product,
                'price_base' => $price,
                'price_with_tax' => $amount,
            ],
            'link' => $json['data'] ?? $json,
        ];
    }

    private function assertConfigured(): void
    {
        if (! $this->configured()) {
            throw new RuntimeException('JELOU_PAY_BEARER / JELOU_PAY_APP_ID no configurados.');
        }
    }
}
