<template>
    <nav
        class="chat-stepper"
        aria-label="Progreso del proceso"
    >
        <ol class="chat-stepper__list">
            <li
                v-for="(item, index) in items"
                :key="index"
                class="chat-stepper__item"
                :class="stepClass(index)"
            >
                <div class="chat-stepper__track">
                    <span
                        class="chat-stepper__indicator"
                        :class="{ 'chat-stepper__indicator--pulse': index === currentIndex }"
                    >
                        <span
                            v-if="index < currentIndex"
                            class="chat-stepper__check"
                        >✓</span>
                        <span v-else>{{ index + 1 }}</span>
                    </span>
                    <span
                        v-if="index < items.length - 1"
                        class="chat-stepper__separator"
                        :class="{ 'chat-stepper__separator--done': index < currentIndex }"
                    />
                </div>
                <div class="chat-stepper__labels">
                    <span class="chat-stepper__title">{{ rewriteLucySolucionCopy(item.title) }}</span>
                    <span
                        v-if="item.description"
                        class="chat-stepper__desc"
                    >{{ rewriteLucySolucionCopy(item.description) }}</span>
                </div>
            </li>
        </ol>
    </nav>
</template>

<script setup>
import { rewriteLucySolucionCopy } from '@/lib/lucySolucionCopy.js';

const props = defineProps({
    items: { type: Array, default: () => [] },
    currentIndex: { type: Number, default: 0 },
});

function stepClass(index) {
    if (index < props.currentIndex) return 'chat-stepper__item--completed';
    if (index === props.currentIndex) return 'chat-stepper__item--active';
    return 'chat-stepper__item--pending';
}
</script>
