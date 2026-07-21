type RouteConfig = {
    path: string;
    component: string;
};

/**
 * 前端 hash 路由表。
 *
 * component 必须对应已经注册过的 Web Component 名称。
 */
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
    {
        path: '/live-push',
        component: 'live-pusher-page',
    },
    {
        path: '/live-play',
        component: 'live-page',
    },
    {
        path: '/live-watch',
        component: 'live-watch-page',
    },
    {
        path: '/wechat-register',
        component: 'wechat-register-page',
    },
    {
        path: '/wechat-live-play',
        component: 'wechat-live-page',
    },
    {
        path: '/topics',
        component: 'topics-page',
    },
    {
        path: '/live-list',
        component: 'live-list-page',
    },
    {
        path: '/training',
        component: 'training-list-page',
    },
    {
        path: '/training-detail',
        component: 'training-detail-page',
    },
    {
        path: '/certificates',
        component: 'certificate-query-page',
    },
    {
        path: '/certificate-detail',
        component: 'certificate-detail-page',
    },
];

/**
 * 启动 hash 路由。
 */
export function startRouter() {
    console.info('[router] start router', {
        routeCount: routes.length,
    });

    window.addEventListener('hashchange', renderRoute);

    renderRoute();
}

/**
 * 根据当前 hash 渲染对应页面组件。
 */
function renderRoute() {
    const app = document.querySelector<HTMLDivElement>('#app');

    if (!app) {
        console.error('[router] app root not found');
        return;
    }

    const currentPath = getCurrentPath();
    const matchedRoute = routes.find((route) => route.path === currentPath);

    if (!matchedRoute) {
        console.warn('[router] route not found', {
            path: currentPath,
        });

        app.innerHTML = `<not-found-page></not-found-page>`;
        return;
    }

    console.info('[router] render route', {
        path: currentPath,
        component: matchedRoute.component,
    });

    app.innerHTML = `<${matchedRoute.component}></${matchedRoute.component}>`;
}

/**
 * 从 location.hash 里提取当前路由路径。
 */
function getCurrentPath(): string {
    const hash = location.hash.replace('#', '');
    // hash 路由的查询串属于当前页面参数，不参与路由匹配。
    const path = hash.split('?')[0];

    return normalizeRoutePath(path);
}

/**
 * 统一路由路径格式，避免空路径、缺少斜杠、结尾斜杠导致匹配失败。
 */
function normalizeRoutePath(path: string): string {
    const normalizedPath = path.trim();

    if (!normalizedPath) {
        return '/';
    }

    const pathWithLeadingSlash = normalizedPath.startsWith('/')
        ? normalizedPath
        : `/${normalizedPath}`;

    if (pathWithLeadingSlash.length > 1 && pathWithLeadingSlash.endsWith('/')) {
        return pathWithLeadingSlash.slice(0, -1);
    }

    return pathWithLeadingSlash;
}

/**
 * 跳转到指定 hash 路由。
 */
export function navigateTo(path: string) {
    console.info('[router] navigate', {
        path,
    });

    location.hash = path;
}

/**
 * 从当前 hash 路由的 query string 读取参数。
 */
export function getHashQueryParam(name: string): string | null {
    const hash = location.hash.replace('#', '');
    const queryString = hash.split('?')[1];

    if (!queryString) {
        console.info('[router] hash query not found', {
            name,
        });

        return null;
    }

    const params = new URLSearchParams(queryString);
    const value = params.get(name);

    console.info('[router] hash query param read', {
        name,
        hasValue: Boolean(value),
    });

    return value;
}
