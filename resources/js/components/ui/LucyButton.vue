<template>
    <button
        :type="type"
        class="disabled:cursor-not-allowed disabled:opacity-60"
        :class="variantClass"
        :disabled="disabled"
        @click="$emit('click', $event)"
    >
        <slot />
    </button>
</template>

<script setup>
import { computed } from 'vue';

defineEmits(['click']);

const props = defineProps({
    variant: {
        type: String,
        default: 'primary',
        validator: (v) => ['primary', 'secondary'].includes(v),
    },
    type: { type: String, default: 'button' },
    disabled: { type: Boolean, default: false },
});

const variantClass = computed(() =>
    props.variant === 'secondary' ? 'lucy-btn-secondary' : 'lucy-btn-primary',
);
</script>
