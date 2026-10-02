<template>
    <div
        class="chat-menu-list-wrap"
        :class="{
            'chat-menu-list-wrap--stacked': stackedLayout,
            'chat-menu-list-wrap--compact': compactLayout,
            'chat-menu-list-wrap--scroll': needsListScroll && !stackedLayout,
        }"
    >
        <div
            v-if="scrollableItems.length"
            class="chat-menu-scroll-slot"
        >
            <nav
                class="chat-menu-list"
                :class="{ 'chat-menu-list--grid': grid }"
                aria-label="Opciones"
            >
                <button
                    v-for="action in visibleActions"
                    :key="action.id"
                    type="button"
                    class="chat-menu-item"
                    :class="itemClasses(action, actionIndex(action))"
                    :disabled="disabled || Boolean(selectingId)"
                    @click="onSelect(action)"
                >
                    <span
                        class="chat-menu-item__icon"
                        :class="iconTone(action, actionIndex(action))"
                        aria-hidden="true"
                    >
                        <ChatIcon :name="menuIconName(action)" />
                    </span>
                    <ChatMarqueeLabel
                        class="chat-menu-item__label"
                        :text="cleanLabel(action.label)"
                    />
                    <span
                        v-if="!grid"
                        class="chat-menu-item__chevron"
                        aria-hidden="true"
                    >
                        <ChatIcon name="arrow-right" />
                    </span>
                    <span
                        v-if="selectingId === action.id"
                        class="chat-menu-item__ripple"
                        aria-hidden="true"
                    />
                </button>
            </nav>
        </div>

        <nav
            v-if="pinnedActions.length"
            class="chat-menu-list chat-menu-list--pinned"
            aria-label="Opciones adicionales"
        >
            <button
                v-for="(action, index) in pinnedActions"
                :key="action.id"
                type="button"
                class="chat-menu-item"
                :class="itemClasses(action, index)"
                :disabled="disabled || Boolean(selectingId)"
                @click="onSelect(action)"
            >
                <span
                    class="chat-menu-item__icon"
                    :class="iconTone(action, index)"
                    aria-hidden="true"
                >
                    <ChatIcon :name="menuIconName(action)" />
                </span>
                <ChatMarqueeLabel
                    class="chat-menu-item__label"
                    :text="cleanLabel(action.label)"
                />
                <span
                    class="chat-menu-item__chevron"
                    aria-hidden="true"
                >
                    <ChatIcon name="arrow-right" />
                </span>
                <span
                    v-if="selectingId === action.id"
                    class="chat-menu-item__ripple"
                    aria-hidden="true"
                />
            </button>
        </nav>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import ChatIcon from '@/components/chat/ChatIcon.vue';
import ChatMarqueeLabel from '@/components/chat/ChatMarqueeLabel.vue';
import { isRegisteredChatIcon } from '@/constants/chatIconRegistry.js';
import { menuIconTone, resolveMenuIcon } from '@/constants/menuIcons.js';
import { CHAT_MENU_PAGE_SIZE, splitMenuActions } from '@/lib/menuListPagination.js';
import { openExternalUrl } from '@/lib/webviewBridge.js';
import { rewriteLucySolucionCopy, isExitMenuLabel, isPrimaryForwardLabel, isYesMenuLabel } from '@/lib/lucySolucionCopy.js';

function menuIconName(action) {
    if (action.icon && isRegisteredChatIcon(action.icon)) return action.icon;
    return resolveMenuIcon(action);
}

const props = defineProps({
    actions: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
    grid: { type: Boolean, default: false },
    stackedLayout: { type: Boolean, default: false },
    compactLayout: { type: Boolean, default: false },
    pageSize: { type: Number, default: CHAT_MENU_PAGE_SIZE },
});

const emit = defineEmits(['select']);

const selectingId = ref(null);

const split = computed(() => {
    const pinLocation = !(props.compactLayout && props.actions.some((a) => a?.type === 'location'));
    return splitMenuActions(props.actions, { pinLocation });
});
const scrollableItems = computed(() => split.value.items);
const pinnedActions = computed(() => split.value.pinned);
const visibleActions = computed(() => scrollableItems.value);

const needsListScroll = computed(
    () =>
        !props.grid
        && !props.stackedLayout
        && scrollableItems.value.length > props.pageSize,
);

function actionIndex(action) {
    return visibleActions.value.indexOf(action);
}

function iconTone(action, index) {
    if (isExitMenuLabel(action?.label)) return 'tone-exit';
    if (isYesMenuLabel(action?.label)) return 'tone-green';
    if (isPrimaryForwardLabel(action?.label)) return 'tone-blue';
    return action?.menuTone || menuIconTone(index);
}

function itemClasses(action, index) {
    return {
        'chat-menu-item--location': action.type === 'location',
        'chat-menu-item--compact': props.grid,
        'chat-menu-item--capsule': !props.grid,
        'chat-menu-item--selected': selectingId.value === action.id,
        'chat-menu-item--exit': isExitMenuLabel(action?.label),
        'chat-menu-item--forward': isPrimaryForwardLabel(action?.label),
        'chat-menu-item--yes': isYesMenuLabel(action?.label),
    };
}

function cleanLabel(label) {
    return rewriteLucySolucionCopy(String(label || '').replace(/^📍\s*/, ''));
}

function onSelect(action) {
    if (selectingId.value) return;
    if (action?.type === 'link' && action.url) {
        openExternalUrl(action.url);
    }
    selectingId.value = action.id;
    window.setTimeout(() => {
        emit('select', action);
        selectingId.value = null;
    }, 380);
}
</script>
