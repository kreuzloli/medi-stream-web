import { navigateTo } from '../router';

class NotFoundPage extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
      <main class="page not-found-page">
        <h1>页面不存在</h1>
        <button id="backHomeBtn">回到首页</button>
      </main>
    `;

        const button = this.querySelector<HTMLButtonElement>('#backHomeBtn');

        button?.addEventListener('click', () => {
            navigateTo('/');
        });
    }
}

customElements.define('not-found-page', NotFoundPage);
