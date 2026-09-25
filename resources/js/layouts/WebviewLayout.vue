<template>
    <div class="min-h-dvh bg-slate-50">
        <AppHeader
            :title="headerTitle"
            :gradient="headerGradient"
            :tagline="showTagline"
        />
        <main class="lucy-page">
            <RouterView />
        </main>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/ui/AppHeader.vue';

const route = useRoute();

const headerTitle = computed(() => route.meta.title ?? 'Lucy Ecuador');
const headerGradient = computed(() => route.meta.gradient ?? 'blue');
const showTagline = computed(() => route.name === 'home');
</script>
