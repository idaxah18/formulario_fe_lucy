<template>
    <form
        class="chat-form-panel"
        @submit.prevent="submit"
    >
        <div class="chat-panel-title-row">
            <h2 class="chat-form-panel__headline">
                Fecha y hora de la cita
            </h2>
            <ChatBackButton
                v-if="showBack"
                variant="corner"
                :disabled="disabled"
                @click="$emit('back')"
            />
        </div>
        <p class="chat-form-panel__hint">
            Fecha <code>AAAA-MM-DD</code> (ej. 2025-01-30). Hora en 24 h <code>HH:mm</code> (ej. <code>08:30</code>, <code>14:00</code>).
        </p>

        <label class="chat-field">
            <span class="chat-field__label">Fecha</span>
            <input
                v-model="fecha"
                type="date"
                class="chat-field__input"
                :disabled="disabled"
                required
            >
        </label>

        <label class="chat-field">
            <span class="chat-field__label">Hora</span>
            <input
                v-model="hora"
                type="time"
                step="60"
                class="chat-field__input"
                :disabled="disabled"
                required
            >
        </label>

        <p
            v-if="error"
            class="chat-inline-error mt-2"
        >
            {{ error }}
        </p>

        <button
            type="submit"
            class="chat-btn chat-btn--primary"
            :disabled="disabled"
        >
            Verificar disponibilidad
        </button>
    </form>
</template>

<script setup>
import { ref } from 'vue';
import { normalizeToOmniaxHora24 } from '@/flows/lucy/omniax/omniaxHoraFormat.js';
import ChatBackButton from '@/components/chat/ChatBackButton.vue';

defineProps({
    disabled: { type: Boolean, default: false },
    showBack: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'back']);

const fecha = ref('');
const hora = ref('');
const error = ref('');

function submit() {
    error.value = '';
    const f = fecha.value.trim();
    const horaApi = normalizeToOmniaxHora24(hora.value.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) {
        error.value = 'La fecha debe tener formato 2025-01-30.';
        return;
    }
    if (!horaApi) {
        error.value = 'Hora inválida. Usa formato 08:30 (24 h).';
        return;
    }
    emit('submit', { fecha: f, hora: horaApi });
}
</script>
