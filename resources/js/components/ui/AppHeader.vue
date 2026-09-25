<template>
    <header
        class="px-4 pb-6 pt-5 text-white"
        :class="gradientClass"
    >
        <div class="mx-auto max-w-lg">
            <p class="font-tagline text-sm opacity-90">GEA Ecuador</p>
            <h1 class="font-solution text-2xl font-bold leading-tight">
                {{ title }}
            </h1>
            <p
                v-if="tagline"
                class="mt-1 font-tagline text-sm opacity-95"
            >
                Lo hacemos fácil
            </p>
        </div>
    </header>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    title: { type: String, required: true },
    gradient: {
        type: String,
        default: 'blue',
        validator: (v) => ['blue', 'green', 'warm'].includes(v),
    },
    tagline: { type: Boolean, default: false },
});

const gradientClass = computed(() => {
    const map = {
        blue: 'bg-gradient-lucy-blue',
        green: 'bg-gradient-lucy-green',
        warm: 'bg-gradient-lucy-warm',
    };
    return map[props.gradient] ?? map.blue;
});
</script>
