<template>
    <article
        class="chat-narrative"
        :class="`chat-narrative--${variant}`"
    >
        <div
            v-if="variant === 'success'"
            class="chat-success-hero"
            aria-hidden="true"
        >
            <div class="chat-success-hero__doc">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 64 64"
                    class="h-16 w-16 text-lucy-blue"
                >
                    <rect
                        x="12"
                        y="8"
                        width="40"
                        height="48"
                        rx="4"
                        fill="currentColor"
                        opacity="0.12"
                    />
                    <path
                        d="M22 22h20M22 30h20M22 38h12"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                    />
                    <circle
                        cx="46"
                        cy="46"
                        r="14"
                        fill="#E8A317"
                    />
                    <path
                        d="M40 46l4 4 8-8"
                        stroke="#fff"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        fill="none"
                    />
                </svg>
            </div>
        </div>

        <h2
            v-if="displayTitle"
            class="chat-narrative__title"
        >
            {{ displayTitle }}
        </h2>
        <p
            v-if="displayBody"
            class="chat-narrative__body"
        >
            {{ displayBody }}
        </p>

        <div
            v-if="variant === 'success' && infoText"
            class="chat-info-box"
        >
            <span class="chat-info-box__icon">i</span>
            <p>{{ infoText }}</p>
        </div>
    </article>
</template>

<script setup>
import { computed } from 'vue';
import { parseBotMessage } from '@/flows/lucy/uiMeta.js';

const props = defineProps({
    text: { type: String, required: true },
});

const parsed = computed(() => parseBotMessage(props.text));

const variant = computed(() => parsed.value.variant);
const displayTitle = computed(() => {
    if (parsed.value.variant === 'success') {
        return parsed.value.title || '¡Tu solicitud ha sido registrada!';
    }
    return parsed.value.title;
});
const displayBody = computed(() => {
    if (parsed.value.variant === 'success' && parsed.value.title) {
        return parsed.value.body;
    }
    if (parsed.value.variant === 'muted') return parsed.value.text;
    return parsed.value.title ? parsed.value.body : parsed.value.text;
});

const infoText = computed(() => {
    if (parsed.value.variant !== 'success') return '';
    const body = parsed.value.body || '';
    if (body.includes('WhatsApp')) return body.split('\n').find((l) => l.includes('WhatsApp')) || body;
    return 'En producción, un asesor o proveedor continuaría el proceso contigo por este mismo canal.';
});
</script>
