<template>
    <form
        class="chat-form-panel"
        @submit.prevent="submit"
    >
        <div class="chat-panel-title-row">
            <h2 class="chat-form-panel__headline">
                {{ rewriteLucySolucionCopy(config.headline) }}
            </h2>
        </div>
        <p
            v-if="config.hint"
            class="chat-form-panel__hint"
        >
            {{ rewriteLucySolucionCopy(config.hint) }}
        </p>

        <label class="chat-field">
            <span class="chat-field__label">{{ rewriteLucySolucionCopy(config.label) }}</span>
            <input
                v-model="draft"
                :type="config.type"
                :inputmode="config.inputmode"
                :autocomplete="config.autocomplete"
                :maxlength="config.maxlength"
                :placeholder="config.placeholder"
                class="chat-field__input"
                :disabled="disabled"
            >
        </label>

        <ChatDualActionButton
            :show-back="showBack"
            :continue-text="config.submitLabel || 'Continuar'"
            continue-type="submit"
            :continue-disabled="disabled || !draft.trim()"
            :back-disabled="disabled"
            @back="$emit('back')"
        />
    </form>
</template>

<script setup>
import { ref, watch } from 'vue';
import ChatDualActionButton from '@/components/chat/ChatDualActionButton.vue';
import { rewriteLucySolucionCopy } from '@/lib/lucySolucionCopy.js';

const props = defineProps({
    config: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    showBack: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'back']);

const draft = ref('');

watch(
    () => props.config?.field,
    () => {
        draft.value = '';
    },
);

function submit() {
    const text = draft.value.trim();
    if (!text || props.disabled) return;
    emit('submit', props.config.field === 'plate' ? text.toUpperCase() : text);
    draft.value = '';
}
</script>
