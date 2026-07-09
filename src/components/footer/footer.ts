import { defineElement } from "../../utils/utils";

/**
 * 页面底部占位组件。
 */
export class MediFooter extends HTMLElement {
    connectedCallback(): void {
        console.info("[footer] connected");
        this.innerHTML = `<div class="footer"></div>`;
    }
}

defineElement("medi-footer", MediFooter);
