<?php

return [
    'jelou' => [
        'project_id' => env('JELOU_PROJECT_ID', '01j5661e5gaf6330435zh3bzjx'),
        'api_base_url' => env('JELOU_API_BASE_URL', 'https://api.jelou.ai'),
        'api_token' => env('JELOU_API_TOKEN'),
        /**
         * Datum v2: Bearer sk_ no autentica /v2/databases — usan HTTP Basic por cuenta Jelou.
         * venta_asistencias (1435) ≠ credenciales del tool 1942 (ver WF Venta Asistencias).
         */
        'datum_auth_profiles' => [
            'venta' => [
                'user' => env('JELOU_DATUM_VENTA_BASIC_USER'),
                'password' => env('JELOU_DATUM_VENTA_BASIC_PASSWORD'),
            ],
            'default' => [
                'user' => env('JELOU_DATUM_BASIC_USER'),
                'password' => env('JELOU_DATUM_BASIC_PASSWORD'),
            ],
        ],
        'datum_table_auth' => [
            'venta_asistencias' => 'venta',
            'inmediata' => 'default',
            'ia_router_terms' => 'default',
        ],
        'datum_tables' => [
            'venta_asistencias' => env('JELOU_DATUM_TABLE_VENTA', '1435'),
            'inmediata' => env('JELOU_DATUM_TABLE_INMEDIATA', '2254'),
            'ia_router_terms' => env('JELOU_DATUM_TABLE_IA_ROUTER', '2756'),
        ],
        'pay' => [
            'base_url' => env('JELOU_PAY_BASE_URL', 'https://payments.jelou.ai/api/v1'),
            'app_id' => env('JELOU_PAY_APP_ID', '98414565-df66-4bab-9e12-dfef65e56800'),
            'bearer' => env('JELOU_PAY_BEARER'),
            'bot_id' => env('JELOU_PAY_BOT_ID', '593958637937'),
            'gateway_id' => env('JELOU_PAY_GATEWAY_ID'),
            'tax_percent' => (float) env('JELOU_PAY_TAX_PERCENT', 15),
            'plans' => [
                'edoctor' => (int) env('JELOU_PAY_PLAN_EDOCTOR', 302),
                'viaja' => (int) env('JELOU_PAY_PLAN_VIAJA', 348),
                'inmediata' => (int) env('JELOU_PAY_PLAN_INMEDIATA', 300),
            ],
        ],
    ],

    'gea_omniax' => [
        'base_url' => env('GEA_OMNIAX_BASE_URL', 'https://api.geainternacional.com/test-ec'),
        'client_id' => env('GEA_OMNIAX_CLIENT_ID'),
        'client_secret' => env('GEA_OMNIAX_CLIENT_SECRET'),
        'id_servicio_medico' => (int) env('GEA_OMNIAX_ID_SERVICIO_MEDICO', 297),
        'id_servicio_dental' => (int) env('GEA_OMNIAX_ID_SERVICIO_DENTAL', 298),
        'telefono_default' => env('GEA_OMNIAX_TELEFONO_DEFAULT', '0999999999'),
        'plan_asistencia' => env('GEA_OMNIAX_PLAN_ASISTENCIA', 'ASISTENCIAS'),
        'timeout' => (int) env('GEA_OMNIAX_TIMEOUT', 45),
        'country_path' => env('GEA_OMNIAX_COUNTRY_PATH'),
        'lopdp_base_url' => env('GEA_LOPDP_BASE_URL', 'https://api.geainternacional.com'),
        'lopdp_api_key' => env('GEA_LOPDP_API_KEY'),
        'lopdp_app_name' => env('GEA_LOPDP_APP_NAME', 'CHATBOT_LUCY'),
        'lopdp_canal' => env('GEA_LOPDP_CANAL', 'CHATBOT'),
        'jelou_function' => [
            'url' => env('GEA_JELOU_FUNCTION_ASISTENCIAS_URL', 'https://functions.jelou.ai/gea-lucy/asistenciasEnCurso'),
            'user' => env('GEA_JELOU_FUNCTION_USER'),
            'password' => env('GEA_JELOU_FUNCTION_PASSWORD'),
        ],
    ],
];
