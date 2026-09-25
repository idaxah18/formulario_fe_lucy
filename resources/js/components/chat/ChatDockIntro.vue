<template>
    <div class="chat-dock-intro">
        <h2 class="chat-dock-intro__title">
            {{ headline }}
        </h2>
        <p
            v-if="hint"
            class="chat-dock-intro__hint"
        >
            {{ hint }}
        </p>
    </div>
</template>

<script setup>
defineProps({
    headline: { type: String, required: true },
    hint: { type: String, default: '' },
});
</script>
