<template>
    <Teleport to="body">
        <Transition name="notif-fade">
            <div
                v-if="open"
                class="notif-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="notif-panel-title"
                @click.self="close"
            >
                <div class="notif-panel">
                    <div class="notif-panel__header">
                        <div class="min-w-0 flex-1">
                            <h2
                                id="notif-panel-title"
                                class="notif-panel__title"
                            >
                                Soluciones en curso
                            </h2>
                            <p
                                v-if="totalCount"
                                class="notif-panel__subtitle"
                            >
                                {{ totalCount }} activa{{ totalCount === 1 ? '' : 's' }} · por familia
                            </p>
                        </div>
                        <button
                            type="button"
                            class="notif-panel__close"
                            aria-label="Cerrar"
                            @click="close"
                        >
                            <ChatIcon
                                name="x-mark"
                                :size="20"
                            />
                        </button>
                    </div>

                    <ChatDockLoading
                        v-if="loading"
                        class="notif-panel__loading"
                        label="Cargando soluciones…"
                    />

                    <p
                        v-else-if="!groups.length"
                        class="notif-panel__empty"
                    >
                        No tienes soluciones en curso en este momento.
                    </p>

                    <ul
                        v-else
                        class="notif-accordion"
                    >
                        <li
                            v-for="group in groups"
                            :key="group.id"
                            class="notif-accordion__item"
                            :class="{ 'notif-accordion__item--open': expandedId === group.id }"
                        >
                            <button
                                type="button"
                                class="notif-accordion__trigger"
                                :aria-expanded="expandedId === group.id"
                                @click="toggle(group.id)"
                            >
                                <span
                                    class="notif-accordion__icon chat-menu-item__icon"
                                    :class="group.menuTone"
                                >
                                    <ChatIcon
                                        :name="group.icon"
                                        :size="20"
                                    />
                                </span>
                                <span class="notif-accordion__copy">
                                    <span class="notif-accordion__row-top">
                                        <span class="notif-accordion__label">{{ rewriteLucySolucionCopy(group.label) }}</span>
                                        <span class="notif-accordion__badge">{{ group.count }}</span>
                                    </span>
                                    <span class="notif-accordion__preview">{{ rewriteLucySolucionCopy(group.preview) }}</span>
                                </span>
                                <ChatIcon
                                    name="chevron-right"
                                    :size="18"
                                    class="notif-accordion__chevron"
                                />
                            </button>
                            <div
                                class="notif-accordion__body"
                                :class="{ 'is-open': expandedId === group.id }"
                            >
                                <ul class="notif-accordion__list">
                                    <li
                                        v-for="(item, idx) in group.items"
                                        :key="`${group.id}-${item.id ?? idx}`"
                                    >
                                        <button
                                            type="button"
                                            class="notif-accordion__detail"
                                            @click="onSelect(item)"
                                        >
                                            <span class="notif-accordion__detail-main">
                                                <span
                                                    v-if="item.id != null"
                                                    class="notif-accordion__detail-id"
                                                >#{{ item.id }}</span>
                                                <ChatMarqueeLabel
                                                    class="notif-accordion__detail-text"
                                                    :text="rewriteLucySolucionCopy(item.detalle)"
                                                />
                                            </span>
                                            <ChatIcon
                                                name="chevron-right"
                                                :size="16"
                                                class="notif-accordion__detail-chevron"
                                            />
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import ChatIcon from '@/components/chat/ChatIcon.vue';
import ChatDockLoading from '@/components/chat/ChatDockLoading.vue';
import ChatMarqueeLabel from '@/components/chat/ChatMarqueeLabel.vue';
import { rewriteLucySolucionCopy } from '@/lib/lucySolucionCopy.js';

const props = defineProps({
    open: { type: Boolean, default: false },
    groups: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
});

const emit = defineEmits(['update:open', 'refresh', 'select-assistencia']);

const expandedId = ref(null);

const totalCount = computed(() =>
    props.groups.reduce((sum, g) => sum + (g.count || 0), 0),
);

function close() {
    emit('update:open', false);
}

function toggle(id) {
    expandedId.value = expandedId.value === id ? null : id;
}

function onSelect(item) {
    emit('select-assistencia', item);
}

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            expandedId.value = null;
            emit('refresh');
        } else {
            expandedId.value = null;
        }
    },
);
</script>
