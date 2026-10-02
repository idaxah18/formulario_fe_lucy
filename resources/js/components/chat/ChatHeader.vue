<template>
    <header class="chat-header chat-header--banner">
        <div class="chat-header__inner">
            <div class="chat-header__avatar-wrap">
                <img
                    v-if="!avatarFailed"
                    src="/images/lucy-avatar.jpg"
                    alt="Lucy"
                    class="chat-header__avatar-img"
                    @error="onAvatarError"
                >
                <img
                    v-else
                    src="/images/lucy-avatar.svg"
                    alt="Lucy"
                    class="chat-header__avatar-img"
                >
            </div>
            <div class="min-w-0 flex-1">
                <h1 class="truncate font-solution text-base font-bold leading-tight text-white">
                    Lucy
                </h1>
                <p class="truncate font-tagline text-xs text-white/85">
                    Solucion 24/7, <strong>Lo hacemos fácil.</strong>
                </p>
            </div>
            <div class="chat-header__actions">
                <button
                    v-if="showNotifications"
                    type="button"
                    class="chat-header__notif"
                    :aria-label="notificationCount ? `${notificationCount} soluciones en curso` : 'Ver soluciones en curso'"
                    @click="$emit('toggle-notifications')"
                >
                    <CircleAlert
                        :size="22"
                        :stroke-width="1.75"
                        aria-hidden="true"
                    />
                    <span
                        v-if="notificationCount > 0"
                        class="chat-header__notif-badge"
                    >
                        {{ notificationCount > 9 ? '9+' : notificationCount }}
                    </span>
                </button>
                <button
                    v-if="showWebviewClose"
                    type="button"
                    class="chat-header__close"
                    @click="$emit('webview-close')"
                >
                    WhatsApp
                </button>
            </div>
        </div>
    </header>
</template>

<script setup>
import { ref } from 'vue';
import { CircleAlert } from '@lucide/vue';

defineProps({
    showWebviewClose: { type: Boolean, default: false },
    showNotifications: { type: Boolean, default: false },
    notificationCount: { type: Number, default: 0 },
});

defineEmits(['webview-close', 'toggle-notifications']);

const avatarFailed = ref(false);

function onAvatarError() {
    avatarFailed.value = true;
}
</script>
