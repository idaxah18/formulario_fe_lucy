<template>
    <div class="chat-dock-intro">
        <h2 class="chat-dock-intro__title">
            {{ displayHeadline }}
        </h2>
        <p
            v-if="hint"
            class="chat-dock-intro__hint"
        >
            {{ displayHint }}
        </p>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { rewriteLucySolucionCopy } from '@/lib/lucySolucionCopy.js';

const props = defineProps({
    headline: { type: String, required: true },
    hint: { type: String, default: '' },
});

const displayHeadline = computed(() => rewriteLucySolucionCopy(props.headline));
const displayHint = computed(() => rewriteLucySolucionCopy(props.hint));
</script>
