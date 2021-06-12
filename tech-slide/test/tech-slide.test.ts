import { html, fixture, expect } from '@open-wc/testing';

import { TechSlide } from '../src/TechSlide.js';
import '../src/tech-slide.js';

describe('TechSlide', () => {
  let element: TechSlide;
  beforeEach(async () => {
    element = await fixture(html`<tech-slide></tech-slide>`);
  });

  it('renders a h1', () => {
    const h1 = element.shadowRoot!.querySelector('h1')!;
    expect(h1).to.exist;
    expect(h1.textContent).to.equal('My app');
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
