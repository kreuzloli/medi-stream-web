import { navigateTo } from '../router';

/**
 * 路由未匹配时展示的 404 页面。
 */
class NotFoundPage extends HTMLElement {
    connectedCallback() {
        console.info('[not-found] connected', {
            hash: location.hash,
        });

        this.innerHTML = `
      <main class="page not-found-page">
        <h1>页面不存在</h1>
        <button id="backHomeBtn">回到首页</button>
      </main>
    `;

        const button = this.querySelector<HTMLButtonElement>('#backHomeBtn');

        button?.addEventListener('click', () => {
            console.info('[not-found] back home clicked');
            navigateTo('/');
        });
    }
}

customElements.define('not-found-page', NotFoundPage);
