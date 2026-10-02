<template>
    <div
        class="chat-panel-wrap"
        :class="{ 'chat-panel-wrap--wizard': wizardCard }"
    >
        <div
            v-if="wizardCard"
            class="chat-flow-wizard-card"
        >
            <slot />
        </div>
        <slot v-else />
    </div>
</template>

<script setup>
defineProps({
    wizardCard: { type: Boolean, default: false },
});
</script>
