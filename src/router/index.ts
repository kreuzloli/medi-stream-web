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
        component: 'live-room-page',
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

    const currentPath = getCurrentPath();

    const matchedRoute = routes.find((route) => route.path === currentPath);

    if (!matchedRoute) {
        app.innerHTML = `<not-found-page></not-found-page>`;
        return;
    }

    app.innerHTML = `<${matchedRoute.component}></${matchedRoute.component}>`;
}

function getCurrentPath(): string {
    const hash = location.hash.replace('#', '');

    const path = hash.split('?')[0];

    return path || '/';
}

export function navigateTo(path: string) {
    location.hash = path;
}

export function getHashQueryParam(name: string): string | null {
    const hash = location.hash.replace('#', '');

    const queryString = hash.split('?')[1];

    if (!queryString) {
        return null;
    }

    const params = new URLSearchParams(queryString);

    return params.get(name);
}
