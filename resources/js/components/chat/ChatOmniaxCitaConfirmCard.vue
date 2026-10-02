<template>
    <article
        class="omx-cita-confirm"
        :class="{ 'omx-cita-confirm--fullscreen': fullscreen }"
    >
        <div
            class="omx-cita-confirm__hero"
            aria-hidden="true"
        >
            <span class="omx-cita-confirm__check">
                <ChatIcon
                    name="check"
                    :size="28"
                    :stroke-width="2.5"
                />
            </span>
        </div>

        <h2 class="omx-cita-confirm__title">
            {{ rewriteLucySolucionCopy(confirm.titulo) }}
        </h2>
        <p class="omx-cita-confirm__lead">
            {{ rewriteLucySolucionCopy(confirm.mensaje) }}
        </p>

        <div class="omx-cita-confirm__card">
            <div
                v-if="confirm.fechaLabel || confirm.horaLabel"
                class="omx-cita-confirm__row omx-cita-confirm__row--highlight"
            >
                <ChatIcon
                    name="calendar"
                    :size="22"
                    class="omx-cita-confirm__icon"
                />
                <div>
                    <p class="omx-cita-confirm__label">
                        Fecha y hora
                    </p>
                    <p class="omx-cita-confirm__value">
                        {{ confirm.fechaLabel || confirm.fecha }}
                    </p>
                    <p
                        v-if="confirm.horaLabel"
                        class="omx-cita-confirm__value omx-cita-confirm__value--time"
                    >
                        {{ confirm.horaLabel }}
                    </p>
                </div>
            </div>

            <div
                v-if="confirm.ubicacionTexto"
                class="omx-cita-confirm__row"
            >
                <ChatIcon
                    name="map-pin"
                    :size="22"
                    class="omx-cita-confirm__icon"
                />
                <div class="min-w-0 flex-1">
                    <p class="omx-cita-confirm__label">
                        Ubicación
                    </p>
                    <p class="omx-cita-confirm__value omx-cita-confirm__value--wrap">
                        {{ confirm.ubicacionTexto }}
                    </p>
                </div>
            </div>
        </div>

        <a
            v-if="confirm.seguimientoUrl"
            :href="confirm.seguimientoUrl"
            class="omx-cita-confirm__cta"
            target="_blank"
            rel="noopener noreferrer"
        >
            <ChatIcon
                name="globe-check"
                :size="20"
            />
            Seguir mi cita en línea
        </a>

        <p class="omx-cita-confirm__tip">
            <ChatIcon
                name="info"
                :size="16"
                class="omx-cita-confirm__tip-icon"
            />
            {{ confirm.recordatorio }}
        </p>
    </article>
</template>

<script setup>
import ChatIcon from '@/components/chat/ChatIcon.vue';
import { rewriteLucySolucionCopy } from '@/lib/lucySolucionCopy.js';

defineProps({
    confirm: { type: Object, required: true },
    fullscreen: { type: Boolean, default: false },
});
</script>

<style scoped>
.omx-cita-confirm {
    margin-bottom: 1rem;
    padding: 0.25rem 0.125rem 0.5rem;
}

.omx-cita-confirm--fullscreen {
    margin-bottom: 0;
    padding: 0.5rem 0 1rem;
    min-height: min-content;
}

.omx-cita-confirm__hero {
    display: flex;
    justify-content: center;
    margin-bottom: 0.75rem;
}

.omx-cita-confirm__check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 9999px;
    background: linear-gradient(145deg, #22c55e, #16a34a);
    color: #fff;
    box-shadow: 0 8px 20px rgba(22, 163, 74, 0.35);
}

.omx-cita-confirm__title {
    text-align: center;
    font-family: var(--font-solution, inherit);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    color: #0f3d7a;
}

.omx-cita-confirm__lead {
    margin-top: 0.5rem;
    text-align: center;
    font-size: 0.9375rem;
    line-height: 1.45;
    color: #475569;
}

.omx-cita-confirm__card {
    margin-top: 1rem;
    border-radius: 1rem;
    border: 1px solid rgba(15, 61, 122, 0.12);
    background: #fff;
    box-shadow: 0 4px 18px rgba(15, 61, 122, 0.08);
    overflow: hidden;
}

.omx-cita-confirm__row {
    display: flex;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-top: 1px solid rgba(15, 61, 122, 0.08);
}

.omx-cita-confirm__row:first-child {
    border-top: none;
}

.omx-cita-confirm__row--highlight {
    background: linear-gradient(180deg, rgba(15, 61, 122, 0.06), transparent);
}

.omx-cita-confirm__icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
    color: #0f3d7a;
}

.omx-cita-confirm__label {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
}

.omx-cita-confirm__value {
    margin-top: 0.125rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #0f172a;
}

.omx-cita-confirm__value--time {
    font-size: 1.125rem;
    color: #0f3d7a;
}

.omx-cita-confirm__value--wrap {
    font-weight: 500;
    line-height: 1.4;
}

.omx-cita-confirm__cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    width: 100%;
    padding: 0.875rem 1rem;
    border-radius: 0.875rem;
    background: linear-gradient(135deg, #0f3d7a, #1d5fbf);
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 6px 16px rgba(15, 61, 122, 0.28);
}

.omx-cita-confirm__cta:active {
    transform: scale(0.99);
}

.omx-cita-confirm__tip {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem 0.875rem;
    border-radius: 0.75rem;
    background: rgba(15, 61, 122, 0.08);
    font-size: 0.8125rem;
    line-height: 1.45;
    color: #475569;
}

.omx-cita-confirm__tip-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
    color: #0f3d7a;
}
</style>
