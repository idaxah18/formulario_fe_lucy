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
                <ChatIcon
                    name="file-check"
                    :size="64"
                    :stroke-width="1.5"
                    class="text-lucy-blue"
                />
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
            <span class="chat-info-box__icon">
                <ChatIcon
                    name="info"
                    :size="16"
                    :stroke-width="2"
                />
            </span>
            <p>{{ infoText }}</p>
        </div>
    </article>
</template>

<script setup>
import { computed } from 'vue';
import { parseBotMessage } from '@/flows/lucy/uiMeta.js';
import ChatIcon from '@/components/chat/ChatIcon.vue';
import { rewriteLucySolucionCopy } from '@/lib/lucySolucionCopy.js';

const props = defineProps({
    text: { type: String, required: true },
});

const parsed = computed(() => parseBotMessage(props.text));

const variant = computed(() => parsed.value.variant);
const displayTitle = computed(() => {
    if (parsed.value.variant === 'success') {
        return rewriteLucySolucionCopy(parsed.value.title || '¡Tu solicitud ha sido registrada!');
    }
    return rewriteLucySolucionCopy(parsed.value.title);
});
const displayBody = computed(() => {
    if (parsed.value.variant === 'success' && parsed.value.title) {
        return rewriteLucySolucionCopy(parsed.value.body);
    }
    if (parsed.value.variant === 'muted') return rewriteLucySolucionCopy(parsed.value.text);
    return rewriteLucySolucionCopy(parsed.value.title ? parsed.value.body : parsed.value.text);
});

const infoText = computed(() => {
    if (parsed.value.variant !== 'success') return '';
    const body = parsed.value.body || '';
    if (body.includes('WhatsApp')) return body.split('\n').find((l) => l.includes('WhatsApp')) || body;
    return 'En producción, un asesor o proveedor continuaría el proceso contigo por este mismo canal.';
});
</script>
