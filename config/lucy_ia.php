<?php

return [
    'enabled' => (bool) env('LUCY_IA_ENABLED', true),
    'api_key' => env('LUCY_IA_API_KEY'),
    'base_url' => rtrim((string) env('LUCY_IA_BASE_URL', 'https://api.openai.com/v1'), '/'),
    'model' => env('LUCY_IA_MODEL', 'gpt-4o-mini'),
    /** Modelo por perfil (paridad Jelou AI_TASK). Ej. protección WF 29787 → openai/gpt-4.1 */
    'profile_models' => [
        'proteccion' => env('LUCY_IA_MODEL_PROTECCION', 'gpt-4.1'),
    ],
    'timeout' => (int) env('LUCY_IA_TIMEOUT', 60),
    'max_history' => (int) env('LUCY_IA_MAX_HISTORY', 12),
];
