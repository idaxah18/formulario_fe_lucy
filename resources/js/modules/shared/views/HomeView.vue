<template>
    <section class="lucy-card space-y-4">
        <p class="font-tagline text-sm text-slate-600">
            Webview Lucy Ecuador — scaffold listo para pantallas del flujo ASAP / aseguradora.
        </p>
        <ul class="space-y-2 text-sm">
            <li>
                <RouterLink
                    class="font-solution font-bold text-lucy-blue underline"
                    :to="{ name: 'aseguradora-placa' }"
                >
                    Demo: ingreso de placa
                </RouterLink>
            </li>
            <li>
                <RouterLink
                    class="font-solution font-bold text-lucy-blue underline"
                    :to="{ name: 'aseguradora-ubicacion' }"
                >
                    Demo: compartir ubicación
                </RouterLink>
            </li>
            <li>
                <RouterLink
                    class="font-solution font-bold text-lucy-blue underline"
                    :to="{ name: 'encuesta-nps' }"
                >
                    Demo: encuesta NPS
                </RouterLink>
            </li>
        </ul>
    </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
