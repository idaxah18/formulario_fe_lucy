<template>
    <section class="lucy-card space-y-5">
        <p class="text-base leading-relaxed">
            Por favor compártenos tu ubicación actual para que podamos enviarte nuestra ayuda al punto exacto donde te encuentras.
        </p>

        <div
            v-if="coords"
            class="rounded-xl bg-slate-100 p-4 text-sm"
        >
            <p class="font-solution font-bold text-lucy-indigo">Ubicación registrada</p>
            <p class="mt-1 text-slate-600">
                Lat: {{ coords.latitude.toFixed(5) }}, Lng: {{ coords.longitude.toFixed(5) }}
            </p>
        </div>

        <p
            v-if="geoError"
            class="text-sm font-medium text-lucy-burgundy"
        >
            {{ geoError }}
        </p>

        <LucyButton
            :disabled="loading"
            @click="requestLocation"
        >
            {{ loading ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual' }}
        </LucyButton>

        <LucyButton
            v-if="coords"
            variant="secondary"
            @click="goSurvey"
        >
            Continuar
        </LucyButton>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LucyButton from '@/components/ui/LucyButton.vue';

const route = useRoute();
const router = useRouter();
const coords = ref(null);
const loading = ref(false);
const geoError = ref('');

function requestLocation() {
    geoError.value = '';
    if (!navigator.geolocation) {
        geoError.value = 'Tu dispositivo no soporta geolocalización.';
        return;
    }
    loading.value = true;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            coords.value = pos.coords;
            loading.value = false;
        },
        () => {
            loading.value = false;
            geoError.value = 'No pudimos obtener tu ubicación. Revisa los permisos del navegador.';
        },
        { enableHighAccuracy: true, timeout: 15000 },
    );
}

function goSurvey() {
    router.push({
        name: 'encuesta-nps',
        query: { placa: route.query.placa },
    });
}
</script>
