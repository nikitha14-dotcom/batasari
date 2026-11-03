import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/navigation', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { DailyNeedsPage } from './DailyNeedsPage';

const sections = [
  ['Home Utilities', 'Home Utilities'] as const,
  ['Groceries', 'Groceries'] as const,
  ['Food Banks', 'Food banks'] as const,
  ['Transportation', "Transportation — public transit, driver's licence, and car"] as const,
  ['Mobile Phone and Internet', 'Mobile phone and internet'] as const,
  ['Major Malls', 'Major malls'] as const,
];

function responseFor(subcategory: string) {
  return {
    ok: true,
    json: async () => ({
      sections: [
        {
          section_key: 'document-copy',
          title: subcategory,
          body_markdown: `Content managed by the API for ${subcategory}.`,
          source: null,
        },
        {
          section_key: 'resource',
          title: 'Sample resource',
          body_markdown: '',
          source: {
            name: 'Managed resource',
            url: 'https://example.test/resource',
            authority_tier: 'A',
            jurisdiction: 'Ontario',
          },
        },
      ],
    }),
  };
}

function installContentApiMock() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    return responseFor(url.searchParams.get('subcategory') ?? 'unknown');
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function groceryResponse() {
  return {
    ok: true,
    json: async () => ({
      sections: [
        {
          section_key: 'document-copy',
          title: 'Groceries',
          body_markdown: `#### Apps to save $ on groceries:

* where grocers list deeply discounted food: flashfood
* weekly deals: flipp

#### Affordable grocery stores:

* No Frills, FreshCo, Dollarama, Dollar Tree, Costco, Walmart, Real-Canadian-Superstore, etc

#### Tips and recommendations:

* Use coupons found on sites such as Canadian Free Stuff, Save.ca, and Extreme Savings Canada.
* Check your receipt at purchase for accurate pricing.`,
          source: null,
        },
        {
          section_key: 'flashfood',
          title: 'Flashfood',
          body_markdown: '',
          source: { name: 'Flashfood', url: 'https://flashfood.com/', authority_tier: 'C' },
        },
        {
          section_key: 'flipp',
          title: 'Flipp',
          body_markdown: '',
          source: { name: 'Flipp', url: 'https://flipp.com/', authority_tier: 'C' },
        },
        {
          section_key: 'canadian-free-stuff',
          title: 'Canadian Free Stuff',
          body_markdown: '',
          source: {
            name: 'Canadian Free Stuff',
            url: 'https://www.canadianfreestuff.com/',
            authority_tier: 'C',
          },
        },
        {
          section_key: 'save-ca',
          title: 'Save.ca',
          body_markdown: '',
          source: { name: 'Save.ca', url: 'https://www.save.ca/', authority_tier: 'C' },
        },
        {
          section_key: 'extreme-savings-canada',
          title: 'Extreme Savings Canada',
          body_markdown: '',
          source: {
            name: 'Extreme Savings Canada',
            url: 'https://www.extremesavingscanada.com/',
            authority_tier: 'C',
          },
        },
      ],
    }),
  };
}

function responseWith(sections: unknown[]) {
  return { ok: true, json: async () => ({ sections }) };
}

const foodBanksSections = [
  {
    section_key: 'document-copy',
    title: 'Food banks',
    body_markdown: `**What are food banks**? They are non-profit organizations that collect and distribute free food to those in need.

How it works in:

* Toronto: Daily Bread Food Bank
* GTA: North York Harvest Food Bank, Food Banks Mississauga`,
    source: null,
  },
  {
    section_key: 'daily-bread',
    title: 'Daily Bread Food Bank',
    body_markdown: '',
    source: {
      name: 'Daily Bread Food Bank',
      url: 'https://www.dailybread.ca/need-food/how-it-works/',
      authority_tier: 'C',
    },
  },
  {
    section_key: 'north-york-harvest',
    title: 'North York Harvest Food Bank',
    body_markdown: '',
    source: {
      name: 'North York Harvest Food Bank',
      url: 'https://northyorkharvest.com/',
      authority_tier: 'C',
    },
  },
  {
    section_key: 'food-banks-mississauga',
    title: 'Food Banks Mississauga',
    body_markdown: '',
    source: {
      name: 'Food Banks Mississauga',
      url: 'https://www.foodbanksmississauga.ca/',
      authority_tier: 'C',
    },
  },
];

const transportationSections = [
  {
    section_key: 'document-copy',
    title: 'Transportation',
    body_markdown: `#### Public transit:

* across Ontario can be accessed with a single card called PRESTO.

#### Driver's licence: [drivers-licence](https://www.ontario.ca/page/drivers-licence)

#### Car: [buy-or-sell-used-vehicle-ontario](https://www.ontario.ca/page/buy-or-sell-used-vehicle-ontario), [register-out-province-vehicle-ontario](https://www.ontario.ca/page/register-out-province-vehicle-ontario)`,
    source: null,
  },
  {
    section_key: 'presto',
    title: 'PRESTO',
    body_markdown: '',
    source: { name: 'PRESTO', url: 'https://www.prestocard.ca/en', authority_tier: 'A' },
  },
  {
    section_key: 'drivers-licence',
    title: "Ontario driver's licence",
    body_markdown: '',
    source: {
      name: "Ontario driver's licence",
      url: 'https://www.ontario.ca/page/drivers-licence',
      authority_tier: 'A',
    },
  },
  {
    section_key: 'buy-sell-used-vehicle',
    title: 'Ontario used vehicle guidance',
    body_markdown: '',
    source: {
      name: 'Ontario used vehicle guidance',
      url: 'https://www.ontario.ca/page/buy-or-sell-used-vehicle-ontario',
      authority_tier: 'A',
    },
  },
  {
    section_key: 'out-of-province-vehicle',
    title: 'Ontario out-of-province vehicle registration',
    body_markdown: '',
    source: {
      name: 'Ontario out-of-province vehicle registration',
      url: 'https://www.ontario.ca/page/register-out-province-vehicle-ontario',
      authority_tier: 'A',
    },
  },
];

const mobileSections = [
  {
    section_key: 'description',
    title: 'Mobile phone and internet',
    body_markdown: `**4 main providers**: Bell, Rogers, TELUS, Quebecor, Costco, and their subsidiary brands

**Two main types of connections**: Prepaid & Postpaid

* **Tips**: If you expect to travel frequently within Canada, check the provider's coverage map.`,
    source: null,
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DailyNeedsPage', () => {
  it('follows the DN-01 through DN-07 exclusive accordion sequence with API content', async () => {
    const fetchMock = installContentApiMock();
    render(<DailyNeedsPage />);

    const buttons = sections.map(([title]) =>
      screen.getByRole('button', { name: new RegExp(title) }),
    );
    buttons.forEach((button) => expect(button).toHaveAttribute('aria-expanded', 'false'));

    for (const [[title, subcategory], button] of sections.map(
      (section, index) => [section, buttons[index]] as const,
    )) {
      fireEvent.click(button);
      await waitFor(() =>
        expect(
          screen.getByText(`Content managed by the API for ${subcategory}.`),
        ).toBeInTheDocument(),
      );
      expect(button).toHaveAttribute('aria-expanded', 'true');
      buttons.forEach((other) => {
        if (other !== button) expect(other).toHaveAttribute('aria-expanded', 'false');
      });
    }

    expect(fetchMock).toHaveBeenCalledTimes(sections.length);
    const requestedSubcategories = fetchMock.mock.calls.map(([input]) =>
      new URL(String(input)).searchParams.get('subcategory'),
    );
    expect(requestedSubcategories).toEqual(sections.map(([, subcategory]) => subcategory));
  });

  it('keeps every accordion button connected to an accessible panel', () => {
    installContentApiMock();
    render(<DailyNeedsPage />);

    sections.forEach(([title]) => {
      const button = screen.getByRole('button', { name: new RegExp(title) });
      const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');

      expect(button.closest('h2')).toBeInTheDocument();
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('hidden');

      fireEvent.click(button);
      expect(panel).not.toHaveAttribute('hidden');

      fireEvent.click(button);
      expect(panel).toHaveAttribute('hidden');
    });
  });

  it('renders API resources as safe new-tab links', async () => {
    installContentApiMock();
    render(<DailyNeedsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Groceries/ }));
    const link = await screen.findByRole('link', { name: 'Managed resource' });

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    expect(link).toHaveAttribute('href', 'https://example.test/resource');
  });

  it('uses Grocery API content in the Figma savings, store, and tips groups', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => groceryResponse()),
    );
    render(<DailyNeedsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Groceries/ }));

    expect(
      await screen.findByRole('heading', { name: 'Apps to save $ on groceries' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Where grocers list deeply discounted food' }),
    ).toHaveAttribute('href', 'https://flashfood.com/');
    expect(screen.getByText('No Frills').closest('a')).toBeNull();
    expect(screen.getByText('Real Canadian Superstore')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tips and recommendations' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Canadian Free Stuff' })).toHaveAttribute(
      'href',
      'https://www.canadianfreestuff.com/',
    );
  });

  it('uses API data to group Food Banks, Transportation, and Mobile content like their Figma panels', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const subcategory = new URL(String(input)).searchParams.get('subcategory');
        if (subcategory === 'Food banks') return responseWith(foodBanksSections);
        if (subcategory?.startsWith('Transportation')) return responseWith(transportationSections);
        if (subcategory === 'Mobile phone and internet') return responseWith(mobileSections);
        return responseFor(subcategory ?? 'unknown');
      }),
    );
    render(<DailyNeedsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Food Banks/ }));
    expect(
      await screen.findByRole('heading', { name: 'What are food banks?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Greater Toronto Area.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Daily Bread Food Bank' })).toHaveAttribute(
      'href',
      'https://www.dailybread.ca/need-food/how-it-works/',
    );

    fireEvent.click(screen.getByRole('button', { name: /^Transportation/ }));
    expect(await screen.findByRole('heading', { name: 'Public Transit' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Driver's Licence" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'PRESTO' })).toHaveAttribute(
      'href',
      'https://www.prestocard.ca/en',
    );

    fireEvent.click(screen.getByRole('button', { name: /Mobile Phone and Internet/ }));
    expect(
      await screen.findByRole('heading', { name: 'Two Main Types of Connections' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Bell').closest('a')).toBeNull();
    expect(screen.getByText('Costco').closest('a')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Tips and Recommendations' })).toBeInTheDocument();
  });

  it('shows an API error and retries into an empty state', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sections: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    render(<DailyNeedsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Home Utilities/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText(/coming soon/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

