<template>
    <form
        class="chat-ia-composer"
        @submit.prevent="submit"
    >
        <input
            v-model="draft"
            type="text"
            class="chat-ia-composer__input"
            placeholder="Escribe a Lucy…"
            :disabled="disabled"
            autocomplete="off"
        >
        <button
            type="submit"
            class="chat-ia-composer__btn"
            :disabled="disabled || !draft.trim()"
        >
            Enviar
        </button>
    </form>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['submit']);

const draft = ref('');

function submit() {
    const text = draft.value.trim();
    if (!text) return;
    emit('submit', text);
    draft.value = '';
}
</script>

<style scoped>
.chat-ia-composer {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 0 0;
    width: 100%;
}
.chat-ia-composer__input {
    flex: 1;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 999px;
    padding: 0.65rem 1rem;
    font-size: 0.95rem;
}
.chat-ia-composer__btn {
    border: none;
    border-radius: 999px;
    background: #005eb8;
    color: #fff;
    padding: 0.65rem 1.1rem;
    font-weight: 600;
    font-size: 0.9rem;
}
.chat-ia-composer__btn:disabled {
    opacity: 0.5;
}
</style>
