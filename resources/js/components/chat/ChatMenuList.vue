<template>
    <nav
        class="chat-menu-list"
        :class="{ 'chat-menu-list--grid': grid }"
        aria-label="Opciones"
    >
        <button
            v-for="(action, index) in actions"
            :key="action.id"
            type="button"
            class="chat-menu-item"
            :class="{
                'chat-menu-item--location': action.type === 'location',
                'chat-menu-item--compact': grid,
                'chat-menu-item--selected': selectingId === action.id,
            }"
            :disabled="disabled || Boolean(selectingId)"
            @click="onSelect(action)"
        >
            <span
                class="chat-menu-item__icon"
                :class="menuIconTone(index)"
                aria-hidden="true"
            >
                <ChatIcon :name="resolveMenuIcon(action)" />
            </span>
            <span class="chat-menu-item__label">{{ cleanLabel(action.label) }}</span>
            <span
                v-if="!grid"
                class="chat-menu-item__chevron"
                aria-hidden="true"
            >
                <ChatIcon name="chevron-right" />
            </span>
            <span
                v-if="selectingId === action.id"
                class="chat-menu-item__ripple"
                aria-hidden="true"
            />
        </button>
    </nav>
</template>

<script setup>
import { ref } from 'vue';
import ChatIcon from '@/components/chat/ChatIcon.vue';
import { menuIconTone, resolveMenuIcon } from '@/constants/menuIcons.js';

defineProps({
    actions: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
    grid: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);

const selectingId = ref(null);

function cleanLabel(label) {
    return String(label || '').replace(/^📍\s*/, '');
}

function onSelect(action) {
    if (selectingId.value) return;
    selectingId.value = action.id;
    window.setTimeout(() => {
        emit('select', action);
        selectingId.value = null;
    }, 380);
}
</script>
