<template>
    <div
        class="chat-dock-loading"
        role="status"
        aria-live="polite"
    >
        <span
            class="chat-dock-loading__spinner"
            aria-hidden="true"
        />
        <span class="chat-dock-loading__label">{{ label }}</span>
    </div>
</template>

<script setup>
defineProps({
    label: { type: String, default: 'Cargando...' },
});
</script>
