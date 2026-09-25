<?php

use App\Http\Controllers\Api\OmniaxDentalController;
use App\Http\Controllers\Api\OmniaxGeaController;
use App\Http\Controllers\Api\OmniaxMedicoController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true, 'service' => 'lucy-webview']));

Route::prefix('v1/omniax/medico')->group(function () {
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

Route::prefix('v1/omniax/gea')->group(function () {
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

Route::prefix('v1/omniax/dental')->group(function () {
    Route::post('/asistencias/en-proceso', [OmniaxDentalController::class, 'asistenciasEnProceso']);
    Route::post('/aplica-asignacion', [OmniaxDentalController::class, 'aplicaAsignacion']);
    Route::post('/establecimientos', [OmniaxDentalController::class, 'establecimientos']);
    Route::get('/zonas-por-ciudad', [OmniaxDentalController::class, 'zonasPorCiudad']);
    Route::post('/disponibilidad-dias', [OmniaxDentalController::class, 'disponibilidadDias']);
    Route::post('/disponibilidad-horas', [OmniaxDentalController::class, 'disponibilidadHoras']);
    Route::post('/asistencias', [OmniaxDentalController::class, 'crearAsistencia']);
    Route::post('/asistencias/reagendar', [OmniaxDentalController::class, 'reagendarAsistencia']);
});
