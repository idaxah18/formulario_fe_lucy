<template>
    <section class="lucy-card space-y-5">
        <p class="text-base leading-relaxed">
            Por favor envíame el número de la placa de tu vehículo o moto.
        </p>

        <LucyInput
            id="plate"
            v-model="plate"
            label="Placa"
            placeholder="GYE1234"
            hint="Ejemplo: GYE1234 para vehículos / GA001A para motos"
            :error="error"
            autocomplete="off"
            inputmode="text"
            @keyup.enter="submit"
        />

        <LucyButton @click="submit">
            Continuar
        </LucyButton>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import LucyButton from '@/components/ui/LucyButton.vue';
import LucyInput from '@/components/ui/LucyInput.vue';

const router = useRouter();
const plate = ref('');
const error = ref('');

const platePattern = /^(?:[A-Z]{3}\d{3,4}|[A-Z]{2}\d{3}[A-Z])$/i;

function submit() {
    const value = plate.value.trim().toUpperCase();
    if (!platePattern.test(value)) {
        error.value =
            'No he podido ingresar tu solicitud. Por favor ayúdame con la información solicitada.';
        return;
    }
    error.value = '';
    router.push({ name: 'aseguradora-ubicacion', query: { placa: value } });
}
</script>
