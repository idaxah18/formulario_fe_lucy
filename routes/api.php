<?php

use App\Http\Controllers\Api\AseguradoraAsapController;
use App\Http\Controllers\Api\GeaToolsController;
use App\Http\Controllers\Api\IntegrationsController;
use App\Http\Controllers\Api\JelouDatumController;
use App\Http\Controllers\Api\JelouPayController;
use App\Http\Controllers\Api\LucyIaController;
use App\Http\Controllers\Api\OmniaxDentalController;
use App\Http\Controllers\Api\OmniaxGeaController;
use App\Http\Controllers\Api\OmniaxMedicoController;
use App\Http\Controllers\Api\ProyectosAutomaticoController;
use App\Support\Integrations\IntegrationRegistry;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'ok' => true,
        'service' => 'lucy-webview',
        'core_ready' => IntegrationRegistry::coreReady(),
    ]);
});

Route::get('/v1/integrations/status', [IntegrationsController::class, 'status']);

Route::prefix('v1/jelou/datum')->group(function () {
    // Flujos del chat: el controlador devuelve simulated:true si falta JELOU_API_TOKEN (ver PHASE3_TEST.md).
    Route::get('/venta/lead', [JelouDatumController::class, 'ventaLead']);
    Route::post('/venta/contrato', [JelouDatumController::class, 'ventaMarcarContrato']);
    Route::post('/derivacion', [JelouDatumController::class, 'derivacionLead']);
    Route::post('/ia-router/terms', [JelouDatumController::class, 'iaRouterTerms']);

    Route::middleware('integration:jelou_datum')->group(function () {
        Route::get('/{tableKey}/rows', [JelouDatumController::class, 'queryRows']);
        Route::post('/{tableKey}/rows', [JelouDatumController::class, 'createRow']);
        Route::patch('/{tableKey}/rows/{rowId}', [JelouDatumController::class, 'patchRow']);
    });
});

Route::middleware('integration:jelou_pay')->prefix('v1/jelou/pay')->group(function () {
    Route::get('/plans', [JelouPayController::class, 'plans']);
    Route::post('/checkout-link', [JelouPayController::class, 'checkoutLink']);
});

Route::prefix('v1/lucy/ia')->group(function () {
    Route::get('/profiles', [LucyIaController::class, 'profiles']);
    Route::post('/bootstrap', [LucyIaController::class, 'bootstrap']);
    Route::post('/message', [LucyIaController::class, 'message']);
});

Route::middleware('integration:omniax')->prefix('v1/aseguradora')->group(function () {
    Route::post('/consulta-placa-vial', [AseguradoraAsapController::class, 'consultaPlacaVial']);
    Route::post('/consulta-placa-siniestro', [AseguradoraAsapController::class, 'consultaPlacaSiniestro']);
    Route::get('/provincias', [AseguradoraAsapController::class, 'provincias']);
    Route::get('/provincias/{idProvincia}/ciudades', [AseguradoraAsapController::class, 'ciudadesPorProvincia']);
    Route::get('/parentesco', [AseguradoraAsapController::class, 'parentesco']);
    Route::post('/inspeccion/buscar-aseguradora', [AseguradoraAsapController::class, 'inspeccionBuscarAseguradora']);
    Route::post('/siniestro/colision', [AseguradoraAsapController::class, 'reporteColision']);
    Route::post('/siniestro/robo-total', [AseguradoraAsapController::class, 'reporteRoboTotal']);
    Route::post('/siniestro/robo-parcial', [AseguradoraAsapController::class, 'reporteRoboParcial']);
});

Route::prefix('v1/gea/tools')->group(function () {
    Route::post('/validacion-cedula', [GeaToolsController::class, 'validacionCedula']);
    Route::middleware('integration:lopdp')->post('/aceptacion-lopdp', [GeaToolsController::class, 'aceptacionLopdp']);
    Route::middleware('integration:omniax')->group(function () {
        Route::post('/asistencia-en-curso', [GeaToolsController::class, 'asistenciaEnCurso']);
        Route::post('/notificar-cabina', [GeaToolsController::class, 'notificarCabina']);
        Route::get('/menu-proveedor/asistencias/{idAsistencia}', [GeaToolsController::class, 'menuProveedorValida']);
        Route::post('/asistencia-reagendar', [GeaToolsController::class, 'asistenciaReagendar']);
    });
});

Route::middleware('integration:omniax')->prefix('v1/omniax/medico')->group(function () {
    Route::post('/asistencias/en-proceso', [OmniaxMedicoController::class, 'asistenciasEnProceso']);
    Route::get('/especialidades', [OmniaxMedicoController::class, 'especialidades']);
    Route::post('/aplica-asignacion', [OmniaxMedicoController::class, 'aplicaAsignacion']);
    Route::post('/establecimientos', [OmniaxMedicoController::class, 'establecimientos']);
    Route::get('/zonas-por-ciudad', [OmniaxMedicoController::class, 'zonasPorCiudad']);
    Route::post('/disponibilidad-dias', [OmniaxMedicoController::class, 'disponibilidadDias']);
    Route::post('/disponibilidad-horas', [OmniaxMedicoController::class, 'disponibilidadHoras']);
    Route::post('/asistencias', [OmniaxMedicoController::class, 'crearAsistencia']);
    Route::post('/asistencias/reagendar', [OmniaxMedicoController::class, 'reagendarAsistencia']);
});

Route::middleware('integration:omniax')->prefix('v1/omniax/gea')->group(function () {
    Route::put('/asistencias/{idAsistencia}/ubicacion', [OmniaxGeaController::class, 'actualizarUbicacion']);
    Route::get('/cuestionarios/asistencias/{idAsistencia}', [OmniaxGeaController::class, 'cuestionario']);
    Route::post('/cuestionarios/calificar', [OmniaxGeaController::class, 'calificarCuestionario']);
    Route::post('/asistencias/{idAsistencia}/termino', [OmniaxGeaController::class, 'respuestaTermino']);
    Route::post('/asistencias/{idAsistencia}/contacto', [OmniaxGeaController::class, 'respuestaContacto']);
    Route::post('/asistencias/gea', [OmniaxGeaController::class, 'crearAsistenciaGea']);
    Route::post('/asistencias/listado', [OmniaxGeaController::class, 'listadoChatbotTelefono']);
    Route::post('/asistencias/en-proceso-remitente', [OmniaxGeaController::class, 'asistenciasEnProcesoRemitente']);
    Route::put('/asistencias/{idAsistencia}/cancelar', [OmniaxGeaController::class, 'cancelarAsistencia']);
    Route::post('/asistencias/{idAsistencia}/reenviar-evaluacion', [OmniaxGeaController::class, 'reenviarEvaluacion']);
    Route::post('/asistencias/{idAsistencia}/evaluacion-confirmada', [OmniaxGeaController::class, 'evaluacionConfirmada']);
});

Route::middleware('integration:omniax')->prefix('v1/gea/proyectos-automatico')->group(function () {
    Route::post('/afiliacion', [ProyectosAutomaticoController::class, 'afiliacion']);
    Route::post('/vehiculo-afiliacion', [ProyectosAutomaticoController::class, 'vehiculoAfiliacion']);
    Route::post('/cobertura', [ProyectosAutomaticoController::class, 'cobertura']);
    Route::post('/validacion-combustible', [ProyectosAutomaticoController::class, 'validacionCombustible']);
    Route::post('/validacion-coordenadas', [ProyectosAutomaticoController::class, 'validacionCoordenadas']);
    Route::post('/ubicacion', [ProyectosAutomaticoController::class, 'ubicacion']);
    Route::post('/asistencia', [ProyectosAutomaticoController::class, 'asistencia']);
});

Route::middleware('integration:omniax')->prefix('v1/omniax/dental')->group(function () {
    Route::post('/asistencias/en-proceso', [OmniaxDentalController::class, 'asistenciasEnProceso']);
    Route::post('/aplica-asignacion', [OmniaxDentalController::class, 'aplicaAsignacion']);
    Route::post('/establecimientos', [OmniaxDentalController::class, 'establecimientos']);
    Route::get('/zonas-por-ciudad', [OmniaxDentalController::class, 'zonasPorCiudad']);
    Route::post('/disponibilidad-dias', [OmniaxDentalController::class, 'disponibilidadDias']);
    Route::post('/disponibilidad-horas', [OmniaxDentalController::class, 'disponibilidadHoras']);
    Route::post('/asistencias', [OmniaxDentalController::class, 'crearAsistencia']);
    Route::post('/asistencias/reagendar', [OmniaxDentalController::class, 'reagendarAsistencia']);
});
