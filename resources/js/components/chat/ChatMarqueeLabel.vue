<template>
    <span
        ref="rootEl"
        class="chat-marquee"
        :class="{ 'chat-marquee--scroll': shouldScroll }"
        :title="text"
    >
        <span
            class="chat-marquee__track"
            :class="{ 'chat-marquee__track--scroll': shouldScroll }"
        >
            <span class="chat-marquee__text">{{ text }}</span>
            <span
                v-if="shouldScroll"
                class="chat-marquee__text"
                aria-hidden="true"
            >{{ text }}</span>
        </span>
    </span>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
    text: { type: String, default: '' },
});

const rootEl = ref(null);
const shouldScroll = ref(false);
let observer = null;

function measure() {
    const root = rootEl.value;
    if (!root) return;
    const track = root.querySelector('.chat-marquee__text');
    if (!track) return;
    shouldScroll.value = track.scrollWidth > root.clientWidth + 2;
}

function setupObserver() {
    if (typeof ResizeObserver === 'undefined' || !rootEl.value) return;
    observer = new ResizeObserver(() => measure());
    observer.observe(rootEl.value);
}

onMounted(async () => {
    await nextTick();
    measure();
    setupObserver();
});

onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
});

watch(
    () => props.text,
    async () => {
        await nextTick();
        measure();
    },
);
</script>
