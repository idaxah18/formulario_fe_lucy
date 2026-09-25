<template>
    <section class="lucy-card text-center">
        <p class="font-solution text-lg font-bold">Página no encontrada</p>
        <RouterLink
            class="mt-4 inline-block text-lucy-blue underline"
            :to="{ name: 'home' }"
        >
            Volver al inicio
        </RouterLink>
    </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
