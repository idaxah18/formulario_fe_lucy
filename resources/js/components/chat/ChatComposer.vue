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
                <ChatIcon
                    name="send"
                    :size="20"
                    :stroke-width="2"
                />
            </button>
        </form>
    </footer>
</template>

<script setup>
import { ref, watch } from 'vue';
import ChatIcon from '@/components/chat/ChatIcon.vue';

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
