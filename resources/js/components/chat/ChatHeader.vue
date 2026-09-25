<template>
    <header class="chat-header chat-header--banner">
        <div class="chat-header__inner">
            <div class="chat-header__avatar-wrap">
                <img
                    v-if="!avatarFailed"
                    src="/images/lucy-avatar.png"
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
                    GEA · Lo hacemos fácil
                </p>
            </div>
            <span
                class="chat-header__status"
                aria-label="En línea"
            />
        </div>
    </header>
</template>

<script setup>
import { ref } from 'vue';

const avatarFailed = ref(false);

function onAvatarError() {
    avatarFailed.value = true;
}
</script>
