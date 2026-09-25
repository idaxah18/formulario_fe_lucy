<template>
    <div class="chat-quick-wrap">
        <div
            class="chat-quick-actions"
            :class="{ 'chat-quick-actions--grid': actions.length > 4 }"
        >
            <button
                v-for="action in actions"
                :key="action.id"
                type="button"
                class="chat-quick-btn"
                :disabled="disabled"
                @click="$emit('select', action)"
            >
                {{ action.label }}
            </button>
        </div>
    </div>
</template>

<script setup>
defineProps({
    actions: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
});

defineEmits(['select']);
</script>
