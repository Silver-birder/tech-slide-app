import { LitElement, html, css, property } from 'lit-element';

export class EmbedlyCard extends LitElement {
  @property({ type: String }) src = '';

  static styles = css``;

  constructor() {
    super();
  }
  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  render() {
    return html`
      <main>
        ${this.src}
      </main>
    `;
  }
}
