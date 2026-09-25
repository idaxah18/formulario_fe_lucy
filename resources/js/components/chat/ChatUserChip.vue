<template>
    <div class="chat-user-chip">
        <span class="chat-user-chip__label">Tu respuesta</span>
        <p class="chat-user-chip__text">
            {{ text }}
        </p>
    </div>
</template>

<script setup>
defineProps({
    text: { type: String, required: true },
});
</script>
