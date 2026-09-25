<?php

return [
    'jelou' => [
        'project_id' => env('JELOU_PROJECT_ID', '01j5661e5gaf6330435zh3bzjx'),
        'api_base_url' => env('JELOU_API_BASE_URL'),
        'api_token' => env('JELOU_API_TOKEN'),
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
    ],
];
