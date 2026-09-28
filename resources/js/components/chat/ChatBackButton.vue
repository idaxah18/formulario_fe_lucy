<template>
    <button
        type="button"
        class="chat-back"
        :class="variant === 'corner' ? 'chat-back--corner' : 'chat-back--dock'"
        aria-label="Atrás"
        :disabled="disabled"
        @click="$emit('click')"
    >
        <ChatIcon
            name="arrow-left"
            :size="variant === 'corner' ? 18 : 20"
        />
        <span
            v-if="variant === 'dock'"
            class="chat-back__label"
        >Atrás</span>
    </button>
</template>

<script setup>
import ChatIcon from '@/components/chat/ChatIcon.vue';

defineProps({
    variant: { type: String, default: 'dock' },
    disabled: { type: Boolean, default: false },
});

defineEmits(['click']);
</script>
