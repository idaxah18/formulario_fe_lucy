<template>
    <ChatShell>
        <template
            v-if="flowStepper.visible"
            #stepper
        >
            <ChatFlowStepper
                :items="flowStepper.items"
                :current-index="flowStepper.currentIndex"
            />
        </template>

        <div
            class="chat-main"
            :class="{ 'chat-main--menu-overlay': menuOverlay }"
        >
            <div
                ref="listEl"
                class="chat-messages"
                :class="{ 'chat-messages--collapsed': menuOverlay }"
                role="log"
                aria-live="polite"
            >
                <template
                    v-for="(msg, index) in visibleMessages"
                    :key="index"
                >
                    <ChatNarrative
                        v-if="msg.role === 'bot'"
                        :text="msg.text"
                    />
                    <ChatUserChip
                        v-else
                        :text="msg.text"
                    />
                </template>

                <p
                    v-if="geoError && !menuOverlay"
                    class="chat-inline-error"
                >
                    {{ geoError }}
                </p>
            </div>

            <aside
                ref="dockRef"
                class="chat-dock"
                :class="{ 'chat-dock--overlay': menuOverlay }"
            >
                <ChatAuthTabs
                    v-if="isAuthStep"
                    :node-id="state.nodeId"
                    :disabled="busy"
                    @submit="onText"
                />

                <ChatOmniaxBeneficiarioPanel
                    v-else-if="isOmniaxBeneficiarioStep"
                    :disabled="busy"
                    @submit="onOmniaxBeneficiario"
                />

                <ChatOmniaxFechaHoraPanel
                    v-else-if="isOmniaxFechaHoraStep"
                    :disabled="busy"
                    @submit="onOmniaxFechaHora"
                />

                <ChatFormPanel
                    v-else-if="formConfig"
                    :config="formConfig"
                    :disabled="busy"
                    @submit="onText"
                />

                <template v-else-if="quickActions.length || busy">
                    <p
                        v-if="busy"
                        class="chat-dock-loading"
                    >
                        Consultando Omniax…
                    </p>
                    <ChatDockIntro
                        v-if="dockPrompt && !busy"
                        :headline="dockPrompt.headline"
                        :hint="dockPrompt.hint"
                    />
                    <ChatMenuList
                        v-if="!busy"
                        :actions="quickActions"
                        :disabled="busy"
                        :grid="menuIsGrid"
                        @select="onQuick"
                    />
                </template>

                <p
                    v-else
                    class="chat-dock-hint"
                >
                    Escribe <strong>Menú principal</strong> en cualquier momento para volver al inicio.
                </p>

                <p
                    v-if="geoError && menuOverlay"
                    class="chat-inline-error mt-3"
                >
                    {{ geoError }}
                </p>
            </aside>

            <ChatAppFooter />
        </div>
    </ChatShell>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ChatShell from '@/layouts/ChatShell.vue';
import ChatNarrative from '@/components/chat/ChatNarrative.vue';
import ChatUserChip from '@/components/chat/ChatUserChip.vue';
import ChatMenuList from '@/components/chat/ChatMenuList.vue';
import ChatFormPanel from '@/components/chat/ChatFormPanel.vue';
import ChatAuthTabs from '@/components/chat/ChatAuthTabs.vue';
import ChatOmniaxFechaHoraPanel from '@/components/chat/ChatOmniaxFechaHoraPanel.vue';
import { OMX_DEN_BENEF_FORM_NODE, OMX_DEN_FECHA_HORA_NODE } from '@/flows/lucy/omniax/omniaxDentalNodes.js';
import { OMX_MED_BENEF_FORM_NODE, OMX_MED_FECHA_HORA_NODE } from '@/flows/lucy/omniax/omniaxMedicoNodes.js';
import ChatOmniaxBeneficiarioPanel from '@/components/chat/ChatOmniaxBeneficiarioPanel.vue';
import ChatFlowStepper from '@/components/chat/ChatFlowStepper.vue';
import ChatDockIntro from '@/components/chat/ChatDockIntro.vue';
import ChatAppFooter from '@/components/chat/ChatAppFooter.vue';
import { LUCY_ENTRY_NODE } from '@/flows/lucy/lucyFlowGraph.js';
import {
    createLucyChatState,
    getQuickActions,
    reduceLucyChat,
} from '@/flows/lucy/lucyChatEngine.js';
import { getFlowStepper, isAuthFlowStep } from '@/flows/lucy/flowStepper.js';
import {
    getCurrentNodeSaySet,
    getDockPrompt,
    getInputFormConfig,
    isDockStepActive,
    isNpsMenu,
} from '@/flows/lucy/uiMeta.js';
import { formatOmniaxErrorMessage } from '@/api/omniaxMedicoErrors.js';
import { runGeaEnter } from '@/flows/lucy/gea/geaEngine.js';
import { runOmniaxEnter } from '@/flows/lucy/omniax/omniaxEngine.js';

const MENU_VIEWPORT_RATIO = 0.75;

const route = useRoute();
const listEl = ref(null);
const dockRef = ref(null);
const messages = ref([]);
const state = ref(createLucyChatState(resolveEntryNode()));
const busy = ref(false);
const geoError = ref('');
const menuOverlay = ref(false);

let dockObserver = null;

const quickActions = computed(() => getQuickActions(state.value));
const formConfig = computed(() =>
    isAuthStep.value ? null : getInputFormConfig(state.value),
);
const menuIsGrid = computed(() => isNpsMenu(quickActions.value));
const dockPrompt = computed(() => (formConfig.value || isAuthStep.value ? null : getDockPrompt(state.value)));
const flowStepper = computed(() => getFlowStepper(state.value));
const isAuthStep = computed(() => isAuthFlowStep(state.value.nodeId));
const OMNX_FECHA_HORA_NODES = [OMX_MED_FECHA_HORA_NODE, OMX_DEN_FECHA_HORA_NODE];
const OMNX_BENEF_NODES = [OMX_MED_BENEF_FORM_NODE, OMX_DEN_BENEF_FORM_NODE];

const isOmniaxFechaHoraStep = computed(() => OMNX_FECHA_HORA_NODES.includes(state.value.nodeId));
const isOmniaxBeneficiarioStep = computed(() => OMNX_BENEF_NODES.includes(state.value.nodeId));

const dockStepActive = computed(() =>
    isDockStepActive(
        state.value,
        quickActions.value.length > 0,
        Boolean(formConfig.value) ||
            isAuthStep.value ||
            isOmniaxFechaHoraStep.value ||
            isOmniaxBeneficiarioStep.value,
    ),
);

const visibleMessages = computed(() => {
    if (!dockStepActive.value) return messages.value;
    const saySet = getCurrentNodeSaySet(state.value.nodeId);
    return messages.value.filter((m) => {
        if (m.role === 'bot' && saySet.has(String(m.text).trim())) return false;
        return true;
    });
});

function resolveEntryNode() {
    const flow = route.query.flow;
    if (flow === 'hsm') return 'hsm_root';
    if (flow === 'aseguradora') return LUCY_ENTRY_NODE;
    return LUCY_ENTRY_NODE;
}

function measureMenuOverlay() {
    if (
        formConfig.value ||
        isAuthStep.value ||
        isOmniaxFechaHoraStep.value ||
        isOmniaxBeneficiarioStep.value ||
        !quickActions.value.length
    ) {
        menuOverlay.value = false;
        return;
    }
    const dock = dockRef.value;
    if (!dock) return;
    const vh = window.visualViewport?.height || window.innerHeight;
    menuOverlay.value = dock.scrollHeight / vh > MENU_VIEWPORT_RATIO;
}

function setupDockObserver() {
    dockObserver?.disconnect();
    const dock = dockRef.value;
    if (!dock || typeof ResizeObserver === 'undefined') return;
    dockObserver = new ResizeObserver(() => measureMenuOverlay());
    dockObserver.observe(dock);
}

async function runOmniaxTask(task) {
    if (!task || busy.value) return;
    busy.value = true;
    try {
        const result = await runOmniaxEnter(task, state.value);
        applyReduce({ type: 'omniaxResult', result });
    } catch (e) {
        applyReduce({ type: 'omniaxError', message: formatOmniaxErrorMessage(e) });
    } finally {
        busy.value = false;
    }
}

async function runGeaTask(task) {
    if (!task || busy.value) return;
    busy.value = true;
    try {
        const result = await runGeaEnter(task, state.value);
        applyReduce({ type: 'geaResult', result });
    } catch (e) {
        applyReduce({ type: 'geaError', message: formatOmniaxErrorMessage(e) });
    } finally {
        busy.value = false;
    }
}

function applyReduce(event) {
    const result = reduceLucyChat(state.value, messages.value, event);
    state.value = result.state;
    messages.value = result.messages;
    if (result.scroll) scrollToBottom();
    if (result.requestLocation) requestLocation();
    nextTick(() => {
        measureMenuOverlay();
        setupDockObserver();
        if (result.omniaxEnter) runOmniaxTask(result.omniaxEnter);
        if (result.geaEnter) runGeaTask(result.geaEnter);
    });
}

function scrollToBottom() {
    nextTick(() => {
        const el = listEl.value;
        if (el && !menuOverlay.value) el.scrollTop = el.scrollHeight;
    });
}

function onText(text) {
    applyReduce({ type: 'text', text });
}

function onQuick(action) {
    applyReduce({ type: 'quick', action });
}

function onOmniaxFechaHora(payload) {
    applyReduce({ type: 'omniaxFechaHora', ...payload });
}

function onOmniaxBeneficiario(payload) {
    applyReduce({ type: 'omniaxBeneficiario', ...payload });
}

function requestLocation() {
    geoError.value = '';
    if (!navigator.geolocation) {
        geoError.value = 'Tu navegador no permite ubicación. Activa GPS o prueba desde el celular.';
        return;
    }
    busy.value = true;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            busy.value = false;
            applyReduce({
                type: 'location',
                coords: {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                },
            });
        },
        () => {
            busy.value = false;
            geoError.value =
                'No pudimos obtener tu ubicación. Revisa permisos y vuelve a pulsar Compartir ubicación.';
        },
        { enableHighAccuracy: true, timeout: 20000 },
    );
}

function bootstrap() {
    messages.value = [];
    state.value = createLucyChatState(resolveEntryNode());
    geoError.value = '';
    menuOverlay.value = false;
    applyReduce({ type: 'init' });
    if (route.query.flow === 'aseguradora') {
        state.value.context.skipToAseguradora = true;
    }
}

function onViewportChange() {
    measureMenuOverlay();
}

onMounted(() => {
    bootstrap();
    setupDockObserver();
    window.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('resize', onViewportChange);
});

onBeforeUnmount(() => {
    dockObserver?.disconnect();
    window.removeEventListener('resize', onViewportChange);
    window.visualViewport?.removeEventListener('resize', onViewportChange);
});

watch(() => route.query.flow, () => bootstrap());
watch(
    [quickActions, formConfig, isAuthStep, isOmniaxFechaHoraStep, isOmniaxBeneficiarioStep],
    () => nextTick(measureMenuOverlay),
);
</script>
