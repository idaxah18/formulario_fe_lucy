<template>
    <div class="chat-shell">
        <ChatHeader />
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
</script>
