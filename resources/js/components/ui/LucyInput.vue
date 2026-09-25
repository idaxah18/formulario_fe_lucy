<template>
    <div>
        <label
            v-if="label"
            :for="id"
            class="lucy-label"
        >{{ label }}</label>
        <input
            :id="id"
            class="lucy-input"
            :type="type"
            :value="modelValue"
            :placeholder="placeholder"
            :autocomplete="autocomplete"
            :inputmode="inputmode"
            @input="$emit('update:modelValue', $event.target.value)"
        >
        <p
            v-if="hint"
            class="mt-2 text-sm text-slate-500"
        >
            {{ hint }}
        </p>
        <p
            v-if="error"
            class="mt-2 text-sm font-medium text-lucy-burgundy"
        >
            {{ error }}
        </p>
    </div>
</template>

<script setup>
defineProps({
    id: { type: String, required: true },
    label: { type: String, default: '' },
    modelValue: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    hint: { type: String, default: '' },
    error: { type: String, default: '' },
    autocomplete: { type: String, default: 'off' },
    inputmode: { type: String, default: 'text' },
});

defineEmits(['update:modelValue']);
</script>
