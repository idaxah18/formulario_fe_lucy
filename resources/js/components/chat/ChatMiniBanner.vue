<template>
    <div class="chat-mini-banner">
        <div class="chat-mini-banner__visual" aria-hidden="true">
            <div class="chat-mini-banner__gradient" />
            <div class="chat-mini-banner__pattern" />
        </div>
        <div class="chat-mini-banner__copy">
            <p class="chat-mini-banner__brand">
                Lucy
            </p>
            <p class="chat-mini-banner__title">
                {{ title }}
            </p>
            <p
                v-if="subtitle"
                class="chat-mini-banner__subtitle"
            >
                {{ subtitle }}
            </p>
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
});
</script>
