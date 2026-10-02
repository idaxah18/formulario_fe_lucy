<template>
    <button
        type="button"
        class="chat-back"
        :class="variantClass"
        aria-label="Atrás"
        :disabled="disabled"
        @click="$emit('click')"
    >
        <ChatIcon
            name="arrow-left"
            :size="iconSize"
            :stroke-width="2.5"
        />
        <span
            v-if="variant === 'dock'"
            class="chat-back__label"
        >Atrás</span>
    </button>
</template>

<script setup>
import { computed } from 'vue';
import ChatIcon from '@/components/chat/ChatIcon.vue';

const props = defineProps({
    variant: { type: String, default: 'mini' },
    disabled: { type: Boolean, default: false },
});

defineEmits(['click']);

const variantClass = computed(() => {
    if (props.variant === 'corner') return 'chat-back--corner';
    if (props.variant === 'dock') return 'chat-back--dock';
    return 'chat-back--mini';
});

const iconSize = computed(() => (props.variant === 'corner' ? 18 : 20));
</script>
