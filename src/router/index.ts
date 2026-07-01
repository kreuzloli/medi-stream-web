type RouteConfig = {
    path: string;
    component: string;
};

const routes: RouteConfig[] = [
    {
        path: '/',
        component: 'home-page',
    },
    {
        path: '/login',
        component: 'login-page',
    },
    {
        path: '/live',
        component: 'live-page',
    },
    {
        path: '/profile',
        component: 'profile-page',
    },
];

export function startRouter() {
    window.addEventListener('hashchange', renderRoute);

    renderRoute();
}

function renderRoute() {
    const app = document.querySelector<HTMLDivElement>('#app');

    if (!app) {
        return;
    }

    const currentPath = location.hash.replace('#', '') || '/';

    const matchedRoute = routes.find((route) => route.path === currentPath);

    if (!matchedRoute) {
        app.innerHTML = `<not-found-page></not-found-page>`;
        return;
    }

    app.innerHTML = `<${matchedRoute.component}></${matchedRoute.component}>`;
}

export function navigateTo(path: string) {
    location.hash = path;
}
