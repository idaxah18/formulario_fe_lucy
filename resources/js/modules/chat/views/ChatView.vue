<template>
    <ChatShell
        :show-webview-close="showWebviewClose"
        :hide-stepper="citaConfirmFullscreen"
        :stepper-auth="stepperWizardChrome"
        :immersive="citaConfirmFullscreen"
        @webview-close="onWebviewClose"
    >
        <template
            v-if="flowStepper.visible && !citaConfirmFullscreen"
            #stepper
        >
            <ChatFlowStepper
                :items="flowStepper.items"
                :current-index="flowStepper.currentIndex"
            />
        </template>

        <div
            class="chat-main"
            :class="{
                'chat-main--menu-overlay': menuOverlay && !citaConfirmFullscreen,
                'chat-main--dock-stack': dockStackedMenu && !citaConfirmFullscreen,
                'chat-main--cita-confirm': citaConfirmFullscreen,
            }"
        >
            <div
                ref="listEl"
                class="chat-messages"
                :class="{
                    'chat-messages--collapsed':
                        citaConfirmFullscreen
                        || (menuOverlay && !isOmniaxCitaDone && !isFlowTerminalStep),
                }"
                role="log"
                aria-live="polite"
            >
                <template
                    v-for="(msg, index) in visibleMessages"
                    :key="index"
                >
                    <ChatOmniaxCitaConfirmCard
                        v-if="msg.layout === 'omniax_cita_confirm' && msg.confirm"
                        :confirm="msg.confirm"
                    />
                    <ChatNarrative
                        v-else-if="msg.role === 'bot'"
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
                    {{ rewriteLucySolucionCopy(geoError) }}
                </p>
            </div>

            <aside
                ref="dockRef"
                class="chat-dock"
                :class="{
                    'chat-dock--overlay': menuOverlay && !citaConfirmFullscreen,
                    'chat-dock--cita-fullscreen': citaConfirmFullscreen,
                    'chat-dock--wizard': dockWizardChrome,
                    'chat-dock--fill': dockStackedMenu && !citaConfirmFullscreen,
                }"
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

                <ChatPanelWrap
                    v-else-if="isOmniaxBeneficiarioStep"
                    :wizard-card="useFlowWizardChrome"
                >
                    <ChatOmniaxBeneficiarioPanel
                        :disabled="busy"
                        :show-back="canGoBack"
                        @submit="onOmniaxBeneficiario"
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
                            variant="mini"
                            :disabled="busy"
                            @click="onBack"
                        />
                    </div>
                    <ChatIaComposer
                        :disabled="busy"
                        @submit="onIaText"
                    />
                </ChatPanelWrap>

                <template v-else-if="citaConfirmFullscreen && citaConfirmInDock">
                    <div class="omx-cita-fullscreen__scroll">
                        <ChatOmniaxCitaConfirmCard
                            :confirm="citaConfirmInDock"
                            fullscreen
                        />
                    </div>
                    <div class="omx-cita-fullscreen__actions">
                        <ChatMenuList
                            :actions="quickActions"
                            :disabled="busy"
                            :grid="menuIsGrid"
                            :stacked-layout="dockStackedMenu"
                            :compact-layout="dockCompactMenu"
                            @select="onQuick"
                        />
                    </div>
                </template>

                <template v-else-if="quickActions.length || busy">
                    <div
                        v-if="dockWizardChrome"
                        class="chat-cita-wizard-shell"
                    >
                        <div class="chat-flow-wizard-card">
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
                                {{ rewriteLucySolucionCopy(dockFeedback) }}
                            </p>
                        <ChatDockIntro
                            v-if="dockPrompt && !busy"
                            :headline="dockPrompt.headline"
                            :hint="dockPrompt.hint"
                        />
                            <ChatDualActionButton
                                v-if="dockDualCapsule && !busy"
                                class="chat-back--after-intro"
                                show-back
                                :continue-text="dualForwardAction.label"
                                :continue-disabled="busy"
                                :back-disabled="busy"
                                @back="onBack"
                                @continue="onQuick(dualForwardAction)"
                            />
                            <ChatBackButton
                                v-else-if="canGoBack && !busy"
                                variant="mini"
                                class="chat-back--after-intro"
                                @click="onBack"
                            />
                            <ChatMenuList
                                v-if="!busy && !dockDualCapsule"
                                :actions="quickActions"
                                :disabled="busy"
                                :grid="menuIsGrid"
                                :stacked-layout="dockStackedMenu"
                            :compact-layout="dockCompactMenu"
                                @select="onQuick"
                            />
                        </div>
                    </div>
                    <div
                        v-else
                        class="chat-dock-quick"
                        :class="{ 'chat-dock-stack': dockStackedMenu }"
                    >
                        <div
                            class="chat-dock-stack__chrome"
                            :class="{ 'chat-dock-stack__chrome--inline': !dockStackedMenu }"
                        >
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
                                {{ rewriteLucySolucionCopy(dockFeedback) }}
                            </p>
                            <ChatDockIntro
                                v-if="dockPrompt && !busy"
                                :headline="dockPrompt.headline"
                                :hint="dockPrompt.hint"
                            />
                            <ChatBackButton
                                v-if="canGoBack && !busy && !dockDualCapsule"
                                variant="mini"
                                class="chat-back--after-intro"
                                @click="onBack"
                            />
                        </div>
                        <ChatDualActionButton
                            v-if="dockDualCapsule && !busy"
                            show-back
                            :continue-text="dualForwardAction.label"
                            :continue-disabled="busy"
                            :back-disabled="busy"
                            @back="onBack"
                            @continue="onQuick(dualForwardAction)"
                        />
                        <ChatMenuList
                            v-else-if="!busy"
                            class="chat-dock-stack__menu"
                            :actions="quickActions"
                            :disabled="busy"
                            :grid="menuIsGrid"
                            :stacked-layout="dockStackedMenu"
                            :compact-layout="dockCompactMenu"
                            @select="onQuick"
                        />
                    </div>
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
                    {{ rewriteLucySolucionCopy(geoError) }}
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
import ChatOmniaxCitaConfirmCard from '@/components/chat/ChatOmniaxCitaConfirmCard.vue';
import ChatUserChip from '@/components/chat/ChatUserChip.vue';
import ChatMenuList from '@/components/chat/ChatMenuList.vue';
import ChatFormPanel from '@/components/chat/ChatFormPanel.vue';
import ChatAuthTabs from '@/components/chat/ChatAuthTabs.vue';
import { OMX_DEN_BENEF_FORM_NODE } from '@/flows/lucy/omniax/omniaxDentalNodes.js';
import { OMX_MED_BENEF_FORM_NODE } from '@/flows/lucy/omniax/omniaxMedicoNodes.js';
import ChatOmniaxBeneficiarioPanel from '@/components/chat/ChatOmniaxBeneficiarioPanel.vue';
import ChatFlowStepper from '@/components/chat/ChatFlowStepper.vue';
import ChatDockIntro from '@/components/chat/ChatDockIntro.vue';
import ChatAppFooter from '@/components/chat/ChatAppFooter.vue';
import ChatIaComposer from '@/components/chat/ChatIaComposer.vue';
import ChatBackButton from '@/components/chat/ChatBackButton.vue';
import ChatDualActionButton from '@/components/chat/ChatDualActionButton.vue';
import ChatDockLoading from '@/components/chat/ChatDockLoading.vue';
import ChatPanelWrap from '@/components/chat/ChatPanelWrap.vue';
import {
    isEmbeddedWebview,
    notifyJelouUserCloseCallback,
    returnToWhatsApp,
} from '@/lib/webviewBridge.js';
import { isIaChatActive, runIaEnter, runIaUserMessage } from '@/flows/lucy/ia/iaEngine.js';
import { LUCY_ENTRY_NODE, LUCY_FLOW_NODES } from '@/flows/lucy/lucyFlowGraph.js';
import {
    canNavigateBack,
    createLucyChatState,
    getQuickActions,
    isComposerEnabled,
    reduceLucyChat,
} from '@/flows/lucy/lucyChatEngine.js';
import { getFlowStepper, isAuthFlowStep, isFlowWizardChrome } from '@/flows/lucy/flowStepper.js';
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
import { bindMobileKeyboardInset } from '@/lib/useMobileKeyboardInset.js';
import { splitMenuActions } from '@/lib/menuListPagination.js';
import { isAdvisorHandoffDoneNode, isCabinaPrefaceNode } from '@/flows/lucy/advisorHandoffCopy.js';
import { shouldDisableMenuOverlay } from '@/flows/lucy/flowDockUi.js';
import { rewriteLucySolucionCopy, shouldUseDockDualCapsule } from '@/lib/lucySolucionCopy.js';

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
let unbindKeyboardInset = null;

const quickActions = computed(() => getQuickActions(state.value));
const formConfig = computed(() =>
    isAuthStep.value ? null : getInputFormConfig(state.value),
);
const menuIsGrid = computed(() => isNpsMenu(quickActions.value));

/** Cierre de flujo (cabina, crear GEA, cita): nunca modo overlay de menú largo. */
const isFlowTerminalStep = computed(() => isAdvisorHandoffDoneNode(state.value.nodeId));

const EN_PROCESO_DOCK_FILL_NODES = new Set([
    'asistencias_activas_hub',
    'omx_med_en_proceso_hub',
    'omx_den_en_proceso_hub',
    'omx_med_reag_pick',
    'omx_den_reag_pick',
]);

const dockLocationStep = computed(() =>
    quickActions.value.some((action) => action?.type === 'location'),
);

/** Lista con scroll + botones fijos abajo (solo si hay ítems anclados: asistencias en curso, etc.). */
const dockStackedMenu = computed(() => {
    if (menuIsGrid.value || dockCompactMenu.value) return false;
    const actions = quickActions.value;
    if (!actions.length) return false;
    const { pinned, items } = splitMenuActions(actions);
    if (!pinned.length) return false;
    if (EN_PROCESO_DOCK_FILL_NODES.has(state.value.nodeId)) return true;
    return items.length > 0;
});

const dockCompactMenu = computed(() => {
    const nodeId = state.value.nodeId || '';
    const node = LUCY_FLOW_NODES[nodeId];
    const dynamicList = Boolean(
        node?.useOmniaxMenu || node?.useGeaMenu || node?.useAsegMenu || node?.useComMenu,
    );
    const shortStaticChoice = !dynamicList
        && !menuIsGrid.value
        && !EN_PROCESO_DOCK_FILL_NODES.has(nodeId)
        && quickActions.value.length > 0
        && quickActions.value.length <= 3;
    const shortAutoChoice = nodeId.startsWith('auto_');
    return (
        isFlowTerminalStep.value
        || isCabinaPrefaceNode(nodeId)
        || nodeId === 'omx_med_who'
        || nodeId === 'omx_den_who'
        || nodeId === 'omx_med_donde'
        || nodeId === 'omx_den_donde'
        || shortAutoChoice
        || shortStaticChoice
        || (!menuIsGrid.value && dockLocationStep.value)
    );
});

const dockPrompt = computed(() => (formConfig.value || isAuthStep.value ? null : getDockPrompt(state.value)));
const flowStepper = computed(() => getFlowStepper(state.value));
const isAuthStep = computed(() => isAuthFlowStep(state.value.nodeId));
const OMNX_BENEF_NODES = [OMX_MED_BENEF_FORM_NODE, OMX_DEN_BENEF_FORM_NODE];

const isOmniaxBeneficiarioStep = computed(() => OMNX_BENEF_NODES.includes(state.value.nodeId));
const isIaChatStep = computed(
    () => isIaChatActive(state.value) && isComposerEnabled(state.value),
);
const showWebviewClose = computed(() => isEmbeddedWebview());
const canGoBack = computed(() => canNavigateBack(state.value));

const dualForwardAction = computed(() => {
    if (!shouldUseDockDualCapsule({
        canGoBack: canGoBack.value,
        actions: quickActions.value,
        busy: busy.value,
        grid: menuIsGrid.value,
    })) {
        return null;
    }
    return quickActions.value[0] || null;
});
const dockDualCapsule = computed(() => Boolean(dualForwardAction.value));

const isOmniaxCitaDone = computed(
    () => state.value.nodeId === 'omx_med_done' || state.value.nodeId === 'omx_den_done',
);

const citaConfirmInDock = computed(() => {
    if (!isOmniaxCitaDone.value) return null;
    for (let i = messages.value.length - 1; i >= 0; i--) {
        const m = messages.value[i];
        if (m.layout === 'omniax_cita_confirm' && m.confirm) return m.confirm;
    }
    return null;
});

const citaConfirmFullscreen = computed(
    () => isOmniaxCitaDone.value && Boolean(citaConfirmInDock.value),
);

const stepperWizardChrome = computed(
    () => isFlowWizardChrome(state.value) && !citaConfirmFullscreen.value,
);
const dockWizardChrome = computed(
    () =>
        isFlowWizardChrome(state.value)
        && !menuOverlay.value
        && !citaConfirmFullscreen.value,
);
const useFlowWizardChrome = dockWizardChrome;

const dockStepActive = computed(() =>
    isDockStepActive(
        state.value,
        quickActions.value.length > 0,
        Boolean(formConfig.value) ||
            isAuthStep.value ||
            isOmniaxBeneficiarioStep.value,
    ),
);

const visibleMessages = computed(() => {
    if (!dockStepActive.value) return messages.value;
    const saySet = getCurrentNodeSaySet(state.value.nodeId);
    return messages.value.filter((m) => {
        if (m.layout === 'omniax_cita_confirm' && isOmniaxCitaDone.value) return false;
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
    const nodeId = state.value.nodeId;

    if (shouldDisableMenuOverlay(nodeId)) {
        menuOverlay.value = false;
        return;
    }

    if (busy.value) {
        return;
    }
    if (
        formConfig.value ||
        isAuthStep.value ||
        isOmniaxBeneficiarioStep.value ||
        !quickActions.value.length
    ) {
        menuOverlay.value = false;
        return;
    }
    const node = LUCY_FLOW_NODES[nodeId];
    const actionCount = quickActions.value.length;

    if (EN_PROCESO_DOCK_FILL_NODES.has(nodeId) && actionCount > 0) {
        menuOverlay.value = true;
        return;
    }

    const dynamicList = Boolean(
        node?.useOmniaxMenu || node?.useGeaMenu || node?.useAsegMenu || node?.useComMenu,
    );
    if (!dynamicList && actionCount > 0 && actionCount <= 3) {
        menuOverlay.value = false;
        return;
    }

    if (!dynamicList && actionCount > 3) {
        menuOverlay.value = true;
        return;
    }

    if (
        /^menu_/.test(nodeId)
        && actionCount > 0
        && !node?.useOmniaxMenu
        && !node?.useGeaMenu
    ) {
        menuOverlay.value = true;
        return;
    }

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
    if (!task) return;
    for (let attempt = 0; attempt < 8 && busy.value; attempt += 1) {
        await new Promise((resolve) => {
            setTimeout(resolve, 40);
        });
    }
    if (busy.value) return;
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

async function onWebviewClose() {
    if (busy.value) return;
    busy.value = true;
    try {
        const result = await notifyJelouUserCloseCallback();
        if (result?.skipped && result.reason === 'no_execution_id') {
            returnToWhatsApp({ nodeId: state.value.nodeId, reason: 'header_button' });
        }
    } finally {
        busy.value = false;
    }
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
        returnToWhatsApp({
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
    document.documentElement.style.setProperty('--keyboard-offset', '0px');
    applyReduce({ type: 'navigateBack' });
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
    unbindKeyboardInset = bindMobileKeyboardInset();
    window.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('resize', onViewportChange);
});

onBeforeUnmount(() => {
    dockObserver?.disconnect();
    unbindKeyboardInset?.();
    unbindKeyboardInset = null;
    if (overlayMeasureRaf) cancelAnimationFrame(overlayMeasureRaf);
    window.removeEventListener('resize', onViewportChange);
    window.visualViewport?.removeEventListener('resize', onViewportChange);
});

watch(
    () => [route.query.flow, route.query.intent],
    () => bootstrap(),
);
watch(
    [quickActions, formConfig, isAuthStep, isOmniaxBeneficiarioStep],
    () => nextTick(scheduleMeasureMenuOverlay),
);
watch(
    () => state.value.nodeId,
    (id) => {
        if (shouldDisableMenuOverlay(id)) {
            menuOverlay.value = false;
        }
        nextTick(scheduleMeasureMenuOverlay);
    },
);
watch(busy, (isBusy, wasBusy) => {
    if (wasBusy && !isBusy) {
        nextTick(scheduleMeasureMenuOverlay);
    }
});
</script>
