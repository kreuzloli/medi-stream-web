import { defineElement } from "../../utils/utils";

export class MediFooter extends HTMLElement {
    connectedCallback(): void {
        this.innerHTML = `<div class="footer"></div>`;
    }
}

defineElement("medi-footer", MediFooter);
