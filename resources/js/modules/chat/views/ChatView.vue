<template>
    <ChatShell :show-webview-close="showWebviewClose" @webview-close="onWebviewClose">
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
                <ChatPanelWrap v-if="isAuthStep">
                    <ChatAuthTabs
                        :node-id="state.nodeId"
                        :disabled="busy"
                        :show-back="canGoBack"
                        @submit="onText"
                        @back="onBack"
                    />
                </ChatPanelWrap>

                <ChatPanelWrap v-else-if="isOmniaxBeneficiarioStep">
                    <ChatOmniaxBeneficiarioPanel
                        :disabled="busy"
                        :show-back="canGoBack"
                        @submit="onOmniaxBeneficiario"
                        @back="onBack"
                    />
                </ChatPanelWrap>

                <ChatPanelWrap v-else-if="isOmniaxFechaHoraStep">
                    <ChatOmniaxFechaHoraPanel
                        :disabled="busy"
                        :show-back="canGoBack"
                        @submit="onOmniaxFechaHora"
                        @back="onBack"
                    />
                </ChatPanelWrap>

                <ChatPanelWrap v-else-if="formConfig">
                    <ChatFormPanel
                        :config="formConfig"
                        :disabled="busy"
                        :show-back="canGoBack"
                        @submit="onText"
                        @back="onBack"
                    />
                </ChatPanelWrap>

                <ChatPanelWrap v-else-if="isIaChatStep">
                    <div class="chat-panel-title-row chat-panel-title-row--composer">
                        <span class="chat-ia-composer__label">Chat con Lucy</span>
                        <ChatBackButton
                            v-if="canGoBack"
                            variant="corner"
                            :disabled="busy"
                            @click="onBack"
                        />
                    </div>
                    <ChatIaComposer
                        :disabled="busy"
                        @submit="onIaText"
                    />
                </ChatPanelWrap>

                <template v-else-if="quickActions.length || busy">
                    <ChatDockLoading
                        v-if="busy && busyOmniax"
                        label="Cargando..."
                    />
                    <ChatDockLoading
                        v-else-if="busy"
                        label="Un momento…"
                    />
                    <p
                        v-if="dockFeedback && !busy"
                        class="chat-dock-feedback"
                        role="status"
                    >
                        {{ dockFeedback }}
                    </p>
                    <ChatDockIntro
                        v-if="dockPrompt && !busy"
                        :headline="dockPrompt.headline"
                        :hint="dockPrompt.hint"
                    />
                    <ChatBackButton
                        v-if="canGoBack && !busy"
                        variant="dock"
                        class="chat-back--after-intro"
                        @click="onBack"
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
import { applyWebviewIntentToContext } from '@/flows/lucy/webviewIntent.js';
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
import ChatIaComposer from '@/components/chat/ChatIaComposer.vue';
import ChatBackButton from '@/components/chat/ChatBackButton.vue';
import ChatDockLoading from '@/components/chat/ChatDockLoading.vue';
import ChatPanelWrap from '@/components/chat/ChatPanelWrap.vue';
import { closeWebview, isEmbeddedWebview } from '@/lib/webviewBridge.js';
import { isIaChatActive, runIaEnter, runIaUserMessage } from '@/flows/lucy/ia/iaEngine.js';
import { LUCY_ENTRY_NODE, LUCY_FLOW_NODES } from '@/flows/lucy/lucyFlowGraph.js';
import {
    canNavigateBack,
    createLucyChatState,
    getQuickActions,
    isComposerEnabled,
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
import { runComEnter } from '@/flows/lucy/comercial/comercialEngine.js';
import { runAsegEnter } from '@/flows/lucy/aseguradora/aseguradoraEngine.js';
import { runGeaEnter } from '@/flows/lucy/gea/geaEngine.js';
import { runOmniaxEnter } from '@/flows/lucy/omniax/omniaxEngine.js';

/** Activa overlay si el dock supera este ratio del viewport; desactiva solo bajo el umbral inferior (evita parpadeo). */
const MENU_OVERLAY_ON_RATIO = 0.78;
const MENU_OVERLAY_OFF_RATIO = 0.68;

const route = useRoute();
const listEl = ref(null);
const dockRef = ref(null);
const messages = ref([]);
const state = ref(createLucyChatState(resolveEntryNode()));
const busy = ref(false);
/** true mientras corre una tarea Omniax (API citas / cabina / listados). */
const busyOmniax = ref(false);
const geoError = ref('');
const menuOverlay = ref(false);

let dockObserver = null;
let overlayMeasureRaf = 0;

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
const isIaChatStep = computed(
    () => isIaChatActive(state.value) && isComposerEnabled(state.value),
);
const showWebviewClose = computed(() => isEmbeddedWebview());
const canGoBack = computed(() => canNavigateBack(state.value));

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

/** Con menú en overlay el historial se colapsa; mostramos el último aviso del bot en el dock. */
const dockFeedback = computed(() => {
    if (!menuOverlay.value || !dockStepActive.value) return null;
    const saySet = getCurrentNodeSaySet(state.value.nodeId);
    for (let i = messages.value.length - 1; i >= 0; i--) {
        const msg = messages.value[i];
        if (msg.role !== 'bot') continue;
        const text = String(msg.text || '').trim();
        if (!text || saySet.has(text)) continue;
        return text;
    }
    return null;
});

function resolveEntryNode() {
    const flow = route.query.flow;
    if (flow === 'hsm') return 'hsm_root';
    if (flow === 'ia' || flow === 'ia_router') return 'ia_router';
    if (flow === 'aseguradora') return LUCY_ENTRY_NODE;
    return LUCY_ENTRY_NODE;
}

function measureMenuOverlay() {
    if (busy.value) {
        return;
    }
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

    const node = LUCY_FLOW_NODES[state.value.nodeId];
    const actionCount = quickActions.value.length;
    if ((node?.useOmniaxMenu || node?.useGeaMenu) && actionCount >= 3) {
        menuOverlay.value = true;
        return;
    }

    const dock = dockRef.value;
    if (!dock) return;
    const vh = window.visualViewport?.height || window.innerHeight;
    if (!vh) return;
    const ratio = dock.scrollHeight / vh;

    if (menuOverlay.value) {
        if (ratio < MENU_OVERLAY_OFF_RATIO) {
            menuOverlay.value = false;
        }
    } else if (ratio > MENU_OVERLAY_ON_RATIO) {
        menuOverlay.value = true;
    }
}

function scheduleMeasureMenuOverlay() {
    if (overlayMeasureRaf) {
        cancelAnimationFrame(overlayMeasureRaf);
    }
    overlayMeasureRaf = requestAnimationFrame(() => {
        overlayMeasureRaf = 0;
        measureMenuOverlay();
    });
}

function setupDockObserver() {
    dockObserver?.disconnect();
    const dock = dockRef.value;
    if (!dock || typeof ResizeObserver === 'undefined') return;
    dockObserver = new ResizeObserver(() => scheduleMeasureMenuOverlay());
    dockObserver.observe(dock);
}

async function runOmniaxTask(task) {
    if (!task || busy.value) return;
    busy.value = true;
    busyOmniax.value = true;
    try {
        const result = await runOmniaxEnter(task, state.value);
        applyReduce({ type: 'omniaxResult', result });
    } catch (e) {
        applyReduce({ type: 'omniaxError', message: formatOmniaxErrorMessage(e) });
    } finally {
        busyOmniax.value = false;
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

async function runAsegTask(task) {
    if (!task || busy.value) return;
    busy.value = true;
    try {
        const result = await runAsegEnter(task, state.value);
        applyReduce({ type: 'asegResult', result });
    } catch (e) {
        applyReduce({ type: 'asegError', message: formatOmniaxErrorMessage(e) });
    } finally {
        busy.value = false;
    }
}

async function runIaTask(task) {
    if (!task || busy.value) return;
    busy.value = true;
    try {
        const result = await runIaEnter(task, state.value);
        applyReduce({ type: 'iaResult', result });
    } catch (e) {
        applyReduce({ type: 'iaError', message: formatOmniaxErrorMessage(e) });
    } finally {
        busy.value = false;
    }
}

function onIaText(text) {
    applyReduce({ type: 'text', text });
}

function onWebviewClose() {
    closeWebview({ nodeId: state.value.nodeId, reason: 'header_button' });
}

async function runComTask(task) {
    if (!task || busy.value) return;
    busy.value = true;
    try {
        const result = await runComEnter(task, state.value);
        applyReduce({ type: 'comResult', result });
    } catch (e) {
        applyReduce({ type: 'comError', message: formatOmniaxErrorMessage(e) });
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
    if (result.webviewClose) {
        closeWebview({
            nodeId: result.webviewClose.nodeId,
            reason: result.webviewClose.reason || 'flow',
        });
    }
    if (result.iaUserMessage) {
        const iaText = result.iaUserMessage;
        nextTick(async () => {
            if (busy.value) return;
            busy.value = true;
            try {
                const iaResult = await runIaUserMessage(state.value, iaText);
                applyReduce({ type: 'iaResult', result: iaResult });
            } catch (e) {
                applyReduce({ type: 'iaError', message: formatOmniaxErrorMessage(e) });
            } finally {
                busy.value = false;
            }
        });
        return;
    }
    nextTick(() => {
        scheduleMeasureMenuOverlay();
        setupDockObserver();
        if (result.omniaxEnter) runOmniaxTask(result.omniaxEnter);
        if (result.geaEnter) runGeaTask(result.geaEnter);
        if (result.asegEnter) runAsegTask(result.asegEnter);
        if (result.comEnter) runComTask(result.comEnter);
        if (result.iaEnter) runIaTask(result.iaEnter);
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

function onBack() {
    if (!canGoBack.value || busy.value) return;
    applyReduce({ type: 'navigateBack' });
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
    applyWebviewIntentToContext(state.value.context);
    applyReduce({ type: 'init' });
    if (route.query.flow === 'aseguradora') {
        state.value.context.skipToAseguradora = true;
    }
    const intentRaw = String(route.query.intent || '').trim();
    if (intentRaw && !state.value.context.webviewIntent) {
        console.warn('[Lucy] intent desconocido en URL:', intentRaw);
    }
}

function onViewportChange() {
    scheduleMeasureMenuOverlay();
}

onMounted(() => {
    bootstrap();
    setupDockObserver();
    window.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('resize', onViewportChange);
});

onBeforeUnmount(() => {
    dockObserver?.disconnect();
    if (overlayMeasureRaf) cancelAnimationFrame(overlayMeasureRaf);
    window.removeEventListener('resize', onViewportChange);
    window.visualViewport?.removeEventListener('resize', onViewportChange);
});

watch(
    () => [route.query.flow, route.query.intent],
    () => bootstrap(),
);
watch(
    [quickActions, formConfig, isAuthStep, isOmniaxFechaHoraStep, isOmniaxBeneficiarioStep],
    () => nextTick(scheduleMeasureMenuOverlay),
);
watch(
    () => state.value.nodeId,
    () => nextTick(scheduleMeasureMenuOverlay),
);
watch(busy, (isBusy, wasBusy) => {
    if (wasBusy && !isBusy) {
        nextTick(scheduleMeasureMenuOverlay);
    }
});
</script>
