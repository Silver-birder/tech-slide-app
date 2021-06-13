import { LitElement, html, css, property } from 'lit-element';

export class TechSlide extends LitElement {
  @property({ type: String }) title = 'Hot Tech Slide';

  static styles = css``;

  render() {
    return html`
      <main>
        <h1>${this.title}</h1>
      </main>
    `;
  }
}
