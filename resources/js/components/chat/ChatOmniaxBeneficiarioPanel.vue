<template>
    <form
        class="chat-form-panel"
        @submit.prevent="submit"
    >
        <div class="chat-panel-title-row">
            <h2 class="chat-form-panel__headline">
                Datos del beneficiario
            </h2>
        </div>
        <p class="chat-form-panel__hint">
            Información que Omniax requiere además del titular (cédula y nombre del afiliado ya están en el inicio del chat).
        </p>

        <label class="chat-field">
            <span class="chat-field__label">Cédula del beneficiario</span>
            <input
                v-model="identificacion"
                type="tel"
                class="chat-field__input"
                inputmode="numeric"
                maxlength="10"
                placeholder="10 dígitos"
                :disabled="disabled"
                required
            >
        </label>

        <label class="chat-field">
            <span class="chat-field__label">Nombre completo</span>
            <input
                v-model="nombre"
                type="text"
                class="chat-field__input"
                autocomplete="name"
                :disabled="disabled"
                required
            >
        </label>

        <label class="chat-field">
            <span class="chat-field__label">Edad</span>
            <input
                v-model="edad"
                type="number"
                min="0"
                max="120"
                class="chat-field__input"
                :disabled="disabled"
                required
            >
        </label>

        <label class="chat-field">
            <span class="chat-field__label">Sexo</span>
            <select
                v-model="sexo"
                class="chat-field__input"
                :disabled="disabled"
                required
            >
                <option
                    value=""
                    disabled
                >
                    Selecciona…
                </option>
                <option
                    v-for="opt in sexoOptions"
                    :key="opt.value"
                    :value="opt.value"
                >
                    {{ opt.label }}
                </option>
            </select>
        </label>

        <label class="chat-field">
            <span class="chat-field__label">Parentesco con el titular</span>
            <select
                v-model="parentesco"
                class="chat-field__input"
                :disabled="disabled"
                required
            >
                <option
                    value=""
                    disabled
                >
                    Selecciona…
                </option>
                <option
                    v-for="opt in parentescoOptions"
                    :key="opt.value"
                    :value="opt.value"
                >
                    {{ opt.label }}
                </option>
            </select>
        </label>

        <p
            v-if="error"
            class="chat-inline-error mt-2"
        >
            {{ error }}
        </p>

        <ChatDualActionButton
            :show-back="showBack"
            continue-text="Continuar"
            continue-type="submit"
            :continue-disabled="disabled"
            :back-disabled="disabled"
            @back="$emit('back')"
        />
    </form>
</template>

<script setup>
import { ref } from 'vue';
import {
    OMX_PARENTESCO_OPTIONS,
    OMX_SEXO_OPTIONS,
} from '@/flows/lucy/omniax/omniaxBeneficiarioOptions.js';
import ChatDualActionButton from '@/components/chat/ChatDualActionButton.vue';

defineProps({
    disabled: { type: Boolean, default: false },
    showBack: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'back']);

const identificacion = ref('');
const nombre = ref('');
const edad = ref('');
const sexo = ref('');
const parentesco = ref('');
const error = ref('');

const sexoOptions = OMX_SEXO_OPTIONS;
const parentescoOptions = OMX_PARENTESCO_OPTIONS;

function submit() {
    error.value = '';
    const cedula = identificacion.value.trim();
    if (!/^\d{10}$/.test(cedula)) {
        error.value = 'La cédula del beneficiario debe tener 10 dígitos.';
        return;
    }
    const nom = nombre.value.trim();
    if (nom.length < 3) {
        error.value = 'Ingresa el nombre del beneficiario.';
        return;
    }
    const ed = Number.parseInt(edad.value, 10);
    if (!Number.isFinite(ed) || ed < 0 || ed > 120) {
        error.value = 'Edad inválida.';
        return;
    }
    if (!sexo.value || !parentesco.value) {
        error.value = 'Selecciona sexo y parentesco.';
        return;
    }
    emit('submit', {
        identificacion_beneficiario: cedula,
        nombre_beneficiario: nom,
        edad_beneficiario: ed,
        sexo_beneficiario: sexo.value,
        parentesco_beneficiario: parentesco.value,
    });
}
</script>
