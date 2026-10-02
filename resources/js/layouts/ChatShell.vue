<template>
    <div
        class="chat-shell"
        :class="{ 'chat-shell--immersive': immersive }"
    >
        <ChatHeader
            v-if="!hideHeader"
            :show-webview-close="showWebviewClose"
            :show-notifications="showNotifications"
            :notification-count="notificationCount"
            @webview-close="$emit('webview-close')"
            @toggle-notifications="$emit('toggle-notifications')"
        />
        <div
            v-if="$slots.stepper && !hideStepper"
            class="chat-shell__stepper"
            :class="{ 'chat-shell__stepper--auth': stepperAuth }"
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
    showNotifications: { type: Boolean, default: false },
    notificationCount: { type: Number, default: 0 },
    hideHeader: { type: Boolean, default: false },
    hideStepper: { type: Boolean, default: false },
    stepperAuth: { type: Boolean, default: false },
    immersive: { type: Boolean, default: false },
});

defineEmits(['webview-close', 'toggle-notifications']);
</script>
