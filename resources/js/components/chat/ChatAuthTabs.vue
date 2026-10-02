<template>
    <div class="chat-auth-shell">
        <div class="chat-auth-tabs-card">
            <div
                class="chat-tabs__list"
                role="tablist"
            >
                <button
                    v-for="(tab, index) in tabs"
                    :key="tab.id"
                    type="button"
                    role="tab"
                    class="chat-tabs__trigger"
                    :class="{ 'chat-tabs__trigger--active': activeTab === index }"
                    :aria-selected="activeTab === index"
                    :disabled="index > maxTab"
                    @click="goTab(index)"
                >
                    <span
                        v-if="index < activeTab"
                        class="chat-tabs__done"
                    >✓</span>
                    {{ tab.label }}
                </button>
                <span
                    class="chat-tabs__slider"
                    :style="sliderStyle"
                />
            </div>
        </div>

        <div class="chat-auth-form-card">
            <div class="chat-tabs__panels">
                <Transition
                    :name="transitionName"
                    mode="out-in"
                >
                    <form
                        v-if="activeTab === 0"
                        key="telefono"
                        class="chat-tabs__panel"
                        @submit.prevent="submitTelefono"
                    >
                        <div class="chat-panel-title-row">
                            <div class="chat-auth-copy">
                                <p class="chat-tabs__headline">
                                    Ingresa tu número de celular
                                </p>
                                <p class="chat-tabs__hint">
                                    10 dígitos, empezando con 09.
                                </p>
                            </div>
                        </div>
                        <label class="chat-field">
                            <span class="chat-field__label chat-field__label--caps">Celular</span>
                            <div class="chat-field__input-wrap">
                                <ChatIcon
                                    name="phone"
                                    :size="20"
                                    class="chat-field__input-icon"
                                />
                                <input
                                    ref="telefonoInput"
                                    v-model="telefono"
                                    type="tel"
                                    inputmode="numeric"
                                    maxlength="10"
                                    autocomplete="tel"
                                    placeholder="09XXXXXXXX"
                                    class="chat-field__input chat-field__input--with-icon"
                                    :disabled="disabled || activeTab !== 0"
                                    @input="onTelefonoInput"
                                    @focus="onFieldFocus"
                                >
                            </div>
                        </label>
                        <p
                            v-if="telefonoError"
                            class="chat-field__error"
                        >
                            {{ telefonoError }}
                        </p>
                        <ChatDualActionButton
                            :show-back="showBack"
                            continue-text="Continuar"
                            continue-type="submit"
                            :continue-disabled="disabled || !canSubmitTelefono"
                            :back-disabled="disabled"
                            @back="$emit('back')"
                        />
                    </form>

                    <form
                        v-else-if="activeTab === 1"
                        key="cedula"
                        class="chat-tabs__panel"
                        @submit.prevent="submitCedula"
                    >
                        <div class="chat-panel-title-row">
                            <p class="chat-tabs__headline chat-auth-copy">
                                Hola, soy Lucy. Para ayudarte, ingresa tu número de cédula.
                            </p>
                        </div>
                        <label class="chat-field">
                            <span class="chat-field__label chat-field__label--caps">Cédula</span>
                            <input
                                ref="cedulaInput"
                                v-model="cedula"
                                type="tel"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="15"
                                autocomplete="off"
                                placeholder="091234567"
                                class="chat-field__input"
                                :disabled="disabled || activeTab !== 1"
                                @input="onCedulaInput"
                                @focus="onFieldFocus"
                            >
                        </label>
                        <p
                            v-if="cedulaError"
                            class="chat-field__error"
                        >
                            {{ cedulaError }}
                        </p>
                        <ChatDualActionButton
                            :show-back="showBack"
                            continue-text="Continuar"
                            continue-type="submit"
                            :continue-disabled="disabled || !canSubmitCedula"
                            :back-disabled="disabled"
                            @back="$emit('back')"
                        />
                    </form>

                    <form
                        v-else
                        key="nombre"
                        class="chat-tabs__panel"
                        @submit.prevent="submitNombre"
                    >
                        <div class="chat-panel-title-row">
                            <p class="chat-tabs__headline chat-auth-copy">
                                Gracias. Ahora confirma tu nombre completo.
                            </p>
                        </div>
                        <label class="chat-field">
                            <span class="chat-field__label chat-field__label--caps">Nombre &amp; Apellido</span>
                            <input
                                ref="nombreInput"
                                v-model="nombre"
                                type="text"
                                autocomplete="name"
                                placeholder="Juan Perez"
                                class="chat-field__input"
                                :disabled="disabled"
                                @focus="onFieldFocus"
                            >
                        </label>
                        <p
                            v-if="nombreError"
                            class="chat-field__error"
                        >
                            {{ nombreError }}
                        </p>
                        <ChatDualActionButton
                            :show-back="showBack"
                            continue-text="Continuar"
                            continue-type="submit"
                            :continue-disabled="disabled || !canSubmitNombre"
                            :back-disabled="disabled"
                            @back="$emit('back')"
                        />
                    </form>
                </Transition>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import {
    isValidLucyCedula,
    sanitizeCedulaDigits,
    sanitizeTelefonoDigits,
} from '@/lib/lucyIdentificacion.js';
import { scrollFieldIntoView } from '@/lib/useMobileKeyboardInset.js';
import { isValidLucyTelefono, readPersistedLucyTelefono } from '@/lib/lucyTelefono.js';
import ChatDualActionButton from '@/components/chat/ChatDualActionButton.vue';
import ChatIcon from '@/components/chat/ChatIcon.vue';

const props = defineProps({
    nodeId: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    showBack: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'back']);

const tabs = [
    { id: 'telefono', label: 'Celular' },
    { id: 'cedula', label: 'Cédula' },
    { id: 'nombre', label: 'Nombre' },
];

const NODE_TAB = {
    auth_telefono: 0,
    auth_cedula: 1,
    auth_nombre: 2,
};

const activeTab = ref(0);
const transitionName = ref('tab-slide-forward');
const telefono = ref(readPersistedLucyTelefono() || '');
const cedula = ref('');
const nombre = ref('');
const telefonoError = ref('');
const cedulaError = ref('');
const nombreError = ref('');
const telefonoInput = ref(null);
const cedulaInput = ref(null);
const nombreInput = ref(null);

const maxTab = computed(() => NODE_TAB[props.nodeId] ?? 0);

const canSubmitTelefono = computed(
    () => telefono.value.trim().length > 0 && isValidLucyTelefono(telefono.value.trim()),
);
const canSubmitCedula = computed(
    () => cedula.value.trim().length > 0 && isValidLucyCedula(cedula.value),
);
const canSubmitNombre = computed(() => nombre.value.trim().length >= 2);

const sliderStyle = computed(() => {
    const n = tabs.length;
    const index = activeTab.value;
    return {
        width: `calc((100% - 0.5rem) / ${n})`,
        transform: `translateX(calc(${index} * 100%))`,
    };
});

function onTelefonoInput(event) {
    telefonoError.value = '';
    telefono.value = sanitizeTelefonoDigits(event.target.value);
}

function onCedulaInput(event) {
    cedulaError.value = '';
    cedula.value = sanitizeCedulaDigits(event.target.value);
}

function onFieldFocus(event) {
    scrollFieldIntoView(event.target);
}

function focusForTab(index) {
    nextTick(() => {
        if (index === 0) telefonoInput.value?.focus();
        if (index === 1) cedulaInput.value?.focus();
        if (index === 2) nombreInput.value?.focus();
    });
}

watch(
    () => props.nodeId,
    (id) => {
        const next = NODE_TAB[id] ?? 0;
        if (next > activeTab.value) transitionName.value = 'tab-slide-forward';
        else if (next < activeTab.value) transitionName.value = 'tab-slide-back';
        activeTab.value = next;
        telefonoError.value = '';
        cedulaError.value = '';
        nombreError.value = '';
        focusForTab(next);
    },
    { immediate: true },
);

function goTab(index) {
    if (index > maxTab.value) return;
    transitionName.value = index > activeTab.value ? 'tab-slide-forward' : 'tab-slide-back';
    activeTab.value = index;
}

function submitTelefono() {
    const text = telefono.value.trim();
    if (props.disabled) return;
    if (!isValidLucyTelefono(text)) {
        telefonoError.value =
            'Ingresa un celular válido de 10 dígitos que empiece con 09 (solo números).';
        return;
    }
    telefonoError.value = '';
    emit('submit', text);
}

function submitCedula() {
    const text = cedula.value.trim();
    if (props.disabled) return;
    if (!isValidLucyCedula(text)) {
        cedulaError.value = 'Ingresa solo números de cédula (hasta 15 dígitos).';
        return;
    }
    cedulaError.value = '';
    emit('submit', text);
}

function submitNombre() {
    const text = nombre.value.trim();
    if (props.disabled) return;
    if (text.length < 2) {
        nombreError.value = 'Ingresa tu nombre y apellido.';
        return;
    }
    nombreError.value = '';
    emit('submit', text);
}
</script>
