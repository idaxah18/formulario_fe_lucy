<template>
    <footer class="chat-composer">
        <form
            class="chat-composer__form"
            @submit.prevent="submit"
        >
            <input
                v-model="draft"
                type="text"
                class="chat-composer__input"
                :placeholder="placeholder"
                :disabled="disabled"
                enterkeyhint="send"
                autocomplete="off"
            >
            <button
                type="submit"
                class="chat-composer__send"
                :disabled="disabled || !draft.trim()"
                aria-label="Enviar"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-5 w-5"
                >
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94l18-7.5a.75.75 0 0 0 0-1.386l-18-7.5Z" />
                </svg>
            </button>
        </form>
    </footer>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    placeholder: { type: String, default: 'Escribe un mensaje' },
    disabled: { type: Boolean, default: false },
    modelValue: { type: String, default: '' },
});

const emit = defineEmits(['send', 'update:modelValue']);

const draft = ref(props.modelValue);

watch(
    () => props.modelValue,
    (v) => {
        draft.value = v;
    },
);

function submit() {
    const text = draft.value.trim();
    if (!text || props.disabled) return;
    emit('send', text);
    emit('update:modelValue', '');
    draft.value = '';
}
</script>
