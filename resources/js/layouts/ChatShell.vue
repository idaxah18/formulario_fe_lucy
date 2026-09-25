<template>
    <div class="chat-shell">
        <ChatHeader
            :show-webview-close="showWebviewClose"
            @webview-close="$emit('webview-close')"
        />
        <div
            v-if="$slots.stepper"
            class="chat-shell__stepper"
        >
            <slot name="stepper" />
        </div>
        <slot />
    </div>
</template>

<script setup>
import ChatHeader from '@/components/chat/ChatHeader.vue';

defineProps({
    showWebviewClose: { type: Boolean, default: false },
});

defineEmits(['webview-close']);
</script>
