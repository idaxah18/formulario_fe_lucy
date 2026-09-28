<template>
    <div class="chat-tabs">
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
                        <p class="chat-tabs__headline">
                            Ingresa tu número de celular (pruebas en web). En WhatsApp se usa tu número automáticamente.
                        </p>
                    </div>
                    <label class="chat-field">
                        <span class="chat-field__label">Celular</span>
                        <input
                            ref="telefonoInput"
                            v-model="telefono"
                            type="tel"
                            inputmode="tel"
                            maxlength="13"
                            autocomplete="tel"
                            placeholder="Ej: 0991234567"
                            class="chat-field__input"
                            :disabled="disabled || activeTab !== 0"
                        >
                    </label>
                    <button
                        type="submit"
                        class="chat-btn chat-btn--primary"
                        :disabled="disabled || !telefono.trim()"
                    >
                        Continuar
                    </button>
                </form>

                <form
                    v-else-if="activeTab === 1"
                    key="cedula"
                    class="chat-tabs__panel"
                    @submit.prevent="submitCedula"
                >
                    <div class="chat-panel-title-row">
                        <p class="chat-tabs__headline">
                            Hola, soy Lucy. Para ayudarte, ingresa tu número de cédula.
                        </p>
                        <ChatBackButton
                            v-if="showBack"
                            variant="corner"
                            :disabled="disabled"
                            @click="$emit('back')"
                        />
                    </div>
                    <label class="chat-field">
                        <span class="chat-field__label">Número de cédula</span>
                        <input
                            ref="cedulaInput"
                            v-model="cedula"
                            type="tel"
                            inputmode="numeric"
                            maxlength="10"
                            autocomplete="off"
                            placeholder="Ej: 1712345678"
                            class="chat-field__input"
                            :disabled="disabled || activeTab !== 1"
                        >
                    </label>
                    <button
                        type="submit"
                        class="chat-btn chat-btn--primary"
                        :disabled="disabled || !cedula.trim()"
                    >
                        Continuar
                    </button>
                </form>

                <form
                    v-else
                    key="nombre"
                    class="chat-tabs__panel"
                    @submit.prevent="submitNombre"
                >
                    <div class="chat-panel-title-row">
                        <p class="chat-tabs__headline">
                            Gracias. Ahora confirma tu nombre completo.
                        </p>
                        <ChatBackButton
                            v-if="showBack"
                            variant="corner"
                            :disabled="disabled"
                            @click="$emit('back')"
                        />
                    </div>
                    <label class="chat-field">
                        <span class="chat-field__label">Nombre completo</span>
                        <input
                            ref="nombreInput"
                            v-model="nombre"
                            type="text"
                            autocomplete="name"
                            placeholder="Como aparece en tu documento"
                            class="chat-field__input"
                            :disabled="disabled"
                        >
                    </label>
                    <button
                        type="submit"
                        class="chat-btn chat-btn--primary"
                        :disabled="disabled || !nombre.trim()"
                    >
                        Continuar
                    </button>
                </form>
            </Transition>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { readPersistedLucyTelefono } from '@/lib/lucyTelefono.js';
import ChatBackButton from '@/components/chat/ChatBackButton.vue';

const props = defineProps({
    nodeId: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    showBack: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'back']);

const tabs = [
    { id: 'telefono', label: 'Teléfono' },
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
const telefonoInput = ref(null);
const cedulaInput = ref(null);
const nombreInput = ref(null);

const maxTab = computed(() => NODE_TAB[props.nodeId] ?? 0);

const sliderStyle = computed(() => ({
    width: `${100 / tabs.length}%`,
    transform: `translateX(${activeTab.value * 100}%)`,
}));

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
    if (!text || props.disabled) return;
    emit('submit', text);
}

function submitCedula() {
    const text = cedula.value.trim();
    if (!text || props.disabled) return;
    emit('submit', text);
}

function submitNombre() {
    const text = nombre.value.trim();
    if (!text || props.disabled) return;
    emit('submit', text);
}
</script>
