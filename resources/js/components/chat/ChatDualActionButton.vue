<template>
    <div class="chat-capsule-wrap">
        <div
            class="chat-capsule"
            :class="{ 'chat-capsule--solo': !showBack }"
        >
            <button
                v-if="showBack"
                type="button"
                class="chat-capsule__back"
                aria-label="Atrás"
                :disabled="backDisabled"
                @click="$emit('back')"
            >
                <ChatIcon
                    name="arrow-left"
                    :size="20"
                    :stroke-width="2.5"
                />
            </button>
            <button
                :type="continueType"
                class="chat-capsule__forward"
                :disabled="continueDisabled"
                @click="onForwardClick"
            >
                <span>{{ displayContinueText }}</span>
                <ChatIcon
                    name="arrow-right"
                    :size="20"
                    :stroke-width="2.5"
                />
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import ChatIcon from '@/components/chat/ChatIcon.vue';
import { rewriteLucySolucionCopy } from '@/lib/lucySolucionCopy.js';

const props = defineProps({
    showBack: { type: Boolean, default: false },
    continueText: { type: String, default: 'Continuar' },
    continueDisabled: { type: Boolean, default: false },
    backDisabled: { type: Boolean, default: false },
    continueType: { type: String, default: 'button' },
});

const emit = defineEmits(['back', 'continue']);

const displayContinueText = computed(() => rewriteLucySolucionCopy(props.continueText));

function onForwardClick(event) {
    if (props.continueType === 'submit') return;
    event.preventDefault();
    emit('continue');
}
</script>
