<template>
    <section class="lucy-card space-y-5">
        <p class="text-base leading-relaxed">
            Basado en el servicio recibido, ¿qué tan probable es que recomiendes nuestra asistencia a un amigo o familiar?
            Califique del 0 al 10.
        </p>

        <div class="grid grid-cols-6 gap-2 sm:grid-cols-11">
            <button
                v-for="n in 11"
                :key="n - 1"
                type="button"
                class="rounded-lg border px-2 py-2 text-sm font-solution font-bold transition"
                :class="
                    score === n - 1
                        ? 'border-lucy-blue bg-lucy-blue text-white'
                        : 'border-slate-200 bg-white text-lucy-indigo'
                "
                @click="score = n - 1"
            >
                {{ n - 1 }}
            </button>
        </div>

        <LucyInput
            id="comment"
            v-model="comment"
            label="Comentario (opcional)"
            placeholder="Cuéntanos tu experiencia"
        />

        <LucyButton
            :disabled="score === null"
            @click="submitted = true"
        >
            Enviar encuesta
        </LucyButton>

        <p
            v-if="submitted"
            class="text-sm font-medium text-lucy-green"
        >
            Gracias por tu respuesta. (Integración API pendiente.)
        </p>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import LucyButton from '@/components/ui/LucyButton.vue';
import LucyInput from '@/components/ui/LucyInput.vue';

const score = ref(null);
const comment = ref('');
const submitted = ref(false);
</script>
