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
                    key="cedula"
                    class="chat-tabs__panel"
                    @submit.prevent="submitCedula"
                >
                    <p class="chat-tabs__headline">
                        Hola, soy Lucy. Para ayudarte, ingresa tu número de cédula.
                    </p>
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
                            :disabled="disabled || activeTab !== 0"
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
                    <p class="chat-tabs__headline">
                        Gracias. Ahora confirma tu nombre completo.
                    </p>
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

const props = defineProps({
    nodeId: { type: String, required: true },
    disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['submit']);

const tabs = [
    { id: 'cedula', label: 'Cédula' },
    { id: 'nombre', label: 'Nombre' },
];

const activeTab = ref(0);
const transitionName = ref('tab-slide-forward');
const cedula = ref('');
const nombre = ref('');
const cedulaInput = ref(null);
const nombreInput = ref(null);

const maxTab = computed(() => (props.nodeId === 'auth_nombre' ? 1 : 0));

const sliderStyle = computed(() => ({
    width: `${100 / tabs.length}%`,
    transform: `translateX(${activeTab.value * 100}%)`,
}));

watch(
    () => props.nodeId,
    (id) => {
        const next = id === 'auth_nombre' ? 1 : 0;
        if (next > activeTab.value) transitionName.value = 'tab-slide-forward';
        else if (next < activeTab.value) transitionName.value = 'tab-slide-back';
        activeTab.value = next;
        if (id === 'auth_nombre') {
            nextTick(() => nombreInput.value?.focus());
        }
    },
    { immediate: true },
);

function goTab(index) {
    if (index > maxTab.value) return;
    transitionName.value = index > activeTab.value ? 'tab-slide-forward' : 'tab-slide-back';
    activeTab.value = index;
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

watch(
    () => props.nodeId,
    (id) => {
        if (id === 'auth_cedula') nextTick(() => cedulaInput.value?.focus());
    },
    { immediate: true },
);
</script>
