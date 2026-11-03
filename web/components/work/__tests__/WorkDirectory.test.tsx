import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WORK_SUBCATEGORIES } from '../../../lib/work/directory';
import { WorkDirectory } from '../WorkDirectory';

function sectionButton(name: string) {
  return screen.getByRole('button', { name });
}

describe('WorkDirectory', () => {
  afterEach(() => {
    cleanup();
  });

  it('loads with all seven sections collapsed and no links showing (TC-D-01)', () => {
    render(<WorkDirectory />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
    for (const button of buttons) {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('opens a section with its tip above its links (TC-D-02)', () => {
    render(<WorkDirectory />);

    fireEvent.click(sectionButton('Employment services & Support Agencies'));

    expect(sectionButton('Employment services & Support Agencies')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const panel = screen.getByRole('region', {
      name: 'Employment services & Support Agencies',
    });
    const links = within(panel).getAllByRole('link');
    expect(links).toHaveLength(7);

    const [firstLink] = links;
    if (!firstLink) throw new Error('expected at least one link');
    const tip = within(panel).getByText(/Government-funded settlement agencies/);
    expect(tip.compareDocumentPosition(firstLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('closes the open section when another one opens (spec §4.2)', () => {
    render(<WorkDirectory />);

    fireEvent.click(sectionButton('Employment services & Support Agencies'));
    fireEvent.click(sectionButton('Employee Rights'));

    expect(sectionButton('Employment services & Support Agencies')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(sectionButton('Employee Rights')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getAllByRole('link')).toHaveLength(7);
  });

  it('closes a section when its own header is clicked again', () => {
    render(<WorkDirectory />);

    fireEvent.click(sectionButton('Networking'));
    fireEvent.click(sectionButton('Networking'));

    expect(sectionButton('Networking')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('points each header at the panel it controls', () => {
    render(<WorkDirectory />);

    const button = sectionButton('Salary Information');
    fireEvent.click(button);

    const panel = screen.getByRole('region', { name: 'Salary Information' });
    expect(button.getAttribute('aria-controls')).toBe(panel.id);
  });

  it('shows every link in every section, with no see-more control (TC-D-11)', () => {
    render(<WorkDirectory />);

    for (const subcategory of WORK_SUBCATEGORIES) {
      fireEvent.click(sectionButton(subcategory.title));
      const panel = screen.getByRole('region', { name: subcategory.title });
      expect(within(panel).getAllByRole('link')).toHaveLength(subcategory.links.length);
    }
    expect(screen.queryByText(/see more/i)).toBeNull();
  });

  it('opens every link safely in a new tab with a name that includes the source (TC-D-04, FR-1.11)', () => {
    render(<WorkDirectory />);

    for (const subcategory of WORK_SUBCATEGORIES) {
      fireEvent.click(sectionButton(subcategory.title));
      const panel = screen.getByRole('region', { name: subcategory.title });

      const links = within(panel).getAllByRole('link');
      const names = links.map((link) => link.getAttribute('aria-label') ?? '');
      const hrefs = links.map((link) => link.getAttribute('href'));

      expect(hrefs).toEqual(subcategory.links.map((source) => source.url));
      expect(names).toEqual(
        subcategory.links.map((source) => `Visit Website: ${source.name} (opens in a new tab)`),
      );
      for (const link of links) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link.getAttribute('rel') ?? '').toContain('noopener');
      }

      // Twelve identical "Visit Website" links would be indistinguishable to
      // a screen reader user; every name in a section must be unique.
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('renders only the subcategories it is given', () => {
    render(<WorkDirectory subcategories={WORK_SUBCATEGORIES.slice(0, 2)} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});

