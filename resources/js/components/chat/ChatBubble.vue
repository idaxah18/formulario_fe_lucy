<template>
    <div
        class="chat-row"
        :class="fromUser ? 'chat-row--user' : 'chat-row--bot'"
    >
        <div
            class="chat-bubble"
            :class="fromUser ? 'chat-bubble--user' : 'chat-bubble--bot'"
        >
            <p class="whitespace-pre-wrap break-words text-[15px] leading-snug">
                {{ text }}
            </p>
            <time
                class="chat-bubble__time"
                :datetime="isoTime"
            >{{ timeLabel }}</time>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    text: { type: String, required: true },
    fromUser: { type: Boolean, default: false },
    at: { type: [Date, String, Number], default: () => new Date() },
});

const date = computed(() => new Date(props.at));

const timeLabel = computed(() =>
    date.value.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
);

const isoTime = computed(() => date.value.toISOString());
</script>
