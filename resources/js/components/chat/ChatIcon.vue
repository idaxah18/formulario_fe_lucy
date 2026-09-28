<template>
    <component
        :is="iconComponent"
        :size="size"
        :stroke-width="strokeWidth"
        class="chat-icon"
        aria-hidden="true"
    />
</template>

<script setup>
import { computed } from 'vue';
import {
    ArrowLeft,
    Calendar,
    Car,
    Check,
    ChevronRight,
    CreditCard,
    FileCheck,
    FlaskConical,
    Hash,
    Headphones,
    Heart,
    Home,
    House,
    Info,
    LifeBuoy,
    Logs,
    Lock,
    Mail,
    MapPin,
    Send,
    Handshake,
    Shield,
    Sparkles,
    Star,
    ToothbrushSparkles,
    Toolbox,
    Truck,
    Wrench,
    X,
} from '@lucide/vue';

const props = defineProps({
    name: { type: String, default: 'chevron-right' },
    size: { type: [Number, String], default: 20 },
    strokeWidth: { type: [Number, String], default: 1.75 },
});

const ICONS = {
    'chevron-right': ChevronRight,
    'map-pin': MapPin,
    home: Home,
    house: House,
    car: Car,
    'toothbrush-sparkles': ToothbrushSparkles,
    'arrow-left': ArrowLeft,
    heart: Heart,
    truck: Truck,
    shield: Shield,
    star: Star,
    'lock-closed': Lock,
    beaker: FlaskConical,
    headset: Headphones,
    lifebuoy: LifeBuoy,
    check: Check,
    'x-mark': X,
    envelope: Mail,
    'credit-card': CreditCard,
    calendar: Calendar,
    sparkles: Sparkles,
    hashtag: Hash,
    send: Send,
    info: Info,
    logs: Logs,
    toolbox: Toolbox,
    handshake: Handshake,
    'file-check': FileCheck,
    wrench: Wrench,
};

const iconComponent = computed(() => ICONS[props.name] || ChevronRight);
</script>
