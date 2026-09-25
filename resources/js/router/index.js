import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'chat',
        component: () => import('@/modules/chat/views/ChatView.vue'),
        meta: { title: 'Chat' },
    },
    {
        path: '/chat',
        redirect: (to) => ({ path: '/', query: to.query }),
    },
    // Enlaces legacy / deep links desde WhatsApp → mismo chat
    {
        path: '/aseguradora/:rest*',
        redirect: () => ({ path: '/', query: { flow: 'aseguradora' } }),
    },
    {
        path: '/encuesta/:rest*',
        redirect: { path: '/', query: { flow: 'aseguradora' } },
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.afterEach((to) => {
    document.title = 'Lucy · Chat';
});

export default router;
