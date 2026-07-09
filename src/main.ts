import './styles/global.css';
import './pages';
import { startRouter } from './router';

/**
 * 应用入口：先注册页面组件，再启动 hash 路由。
 */
console.info('[app] bootstrap start');
startRouter();
