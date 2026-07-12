/**
 * 判断 Header 导航项是否对应当前路由。
 *
 * 首页只匹配根路径；栏目详情页继续高亮所属栏目。
 */
export function isHeaderNavActive(path: string, currentPath: string): boolean {
    if (path === "/") {
        return currentPath === "/";
    }

    if (path === "/certificates" && currentPath === "/certificate-detail") {
        return true;
    }

    return currentPath === path || currentPath.startsWith(`${path}-`);
}
