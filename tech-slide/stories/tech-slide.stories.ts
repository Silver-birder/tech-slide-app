import { html, TemplateResult } from 'lit-html';
import '../src/tech-slide.js';

export default {
  title: 'TechSlide',
  component: 'tech-slide',
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

interface Story<T> {
  (args: T): TemplateResult;
  args?: Partial<T>;
  argTypes?: Record<string, unknown>;
}

interface ArgTypes {
  title?: string;
  backgroundColor?: string;
}

const Template: Story<ArgTypes> = ({
  title,
  backgroundColor = 'white',
}: ArgTypes) => html`
  <tech-slide
    style="--tech-slide-background-color: ${backgroundColor}"
    .title=${title}
  ></tech-slide>
`;

export const App = Template.bind({});
App.args = {
  title: 'My app',
};
