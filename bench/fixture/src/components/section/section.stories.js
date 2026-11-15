import './section.js';

/**
 * Section (design/components/section.md; Figma 4:547). Its title comes in when its head is a quarter of the way up
 * the viewport: reload the story to see it again; with reduced motion asked for, it is simply there.
 */
const LEAD =
  'design-fence puts your design process in the repository, where every agent reads it and every commit goes through it.';
const STATEMENT =
  'Every request adds a little more drift that no one designed. Checking each change by eye does not keep up, and asking the agent twice does not either.';

export default {
  title: 'Components/Section',
  component: 'df-section',
  args: {heading: 'How it works', lead: LEAD, wide: false, statement: false},
  render: ({heading, lead, wide, statement}) => {
    const section = document.createElement('df-section');
    section.setAttribute('heading', heading);
    if (statement) section.setAttribute('statement', '');
    const p = document.createElement('p');
    p.slot = 'lead';
    p.textContent = lead;
    section.append(p);
    if (wide) {
      const content = document.createElement('p');
      content.textContent = 'ok   format (1091 ms), ok   design specs (56 ms)';
      section.append(content);
    }
    return section;
  },
};

export const Default = {};

/** Wide: content under the title and its lead, the column's full width. */
export const Wide = {args: {heading: 'Shown working', wide: true}};

/** Viewport Tablet: 768px to under 1024px, the title over its lead (Figma's Tablet variant). */
export const Tablet = {args: {wide: true}, globals: {viewport: {value: 'tablet', isRotated: false}}};

/** Viewport Mobile: under 768px (Figma's Mobile variant). */
export const Mobile = {args: {wide: true}, globals: {viewport: {value: 'phone', isRotated: false}}};

/** Statement: no title shown, the lead centred and set as a title ("The problem"). */
export const Statement = {args: {heading: 'The problem', lead: STATEMENT, statement: true}};

/** Statement on a phone: set in h3. */
export const StatementMobile = {
  args: Statement.args,
  globals: {viewport: {value: 'phone', isRotated: false}},
};
