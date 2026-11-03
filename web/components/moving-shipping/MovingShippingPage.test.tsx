import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/navigation', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { MovingShippingPage } from './MovingShippingPage';

const source = (name: string, url: string) => ({ name, url });

function responseFor(input: RequestInfo | URL) {
  const request = decodeURIComponent(String(input)).replace(/\+/g, ' ');
  if (request.includes('Official guidance')) {
    return {
      sections: [
        {
          section_key: 'canada-moving-advice',
          title: 'Moving Advice',
          body_markdown: '',
          source: source('Canada moving advice', 'https://ised-isde.canada.ca/moving'),
        },
        {
          section_key: 'bringing-goods',
          title: 'Bringing Personal Goods into Canada',
          body_markdown: '',
          source: source('CBSA moving advice', 'https://www.cbsa-asfc.gc.ca/moving'),
        },
      ],
    };
  }
  return {
    sections: [
      {
        section_key: 'canada-post',
        title: 'Canada Post',
        body_markdown: '',
        source: source('Canada Post', 'https://www.canadapost-postescanada.ca/'),
      },
      {
        section_key: 'fedex',
        title: 'FedEx Canada',
        body_markdown: '',
        source: source('FedEx Canada', 'https://www.fedex.com/'),
      },
      {
        section_key: 'uhaul-rental',
        title: 'U-Haul',
        body_markdown: '',
        source: source('U-Haul truck rental', 'https://www.uhaul.com/'),
      },
      {
        section_key: 'pods',
        title: 'PODS Canada',
        body_markdown: '',
        source: source('PODS Canada', 'https://www.pods.ca/'),
      },
      {
        section_key: 'moving-com',
        title: 'Moving.com',
        body_markdown: '',
        source: source('Moving.com', 'https://www.moving.com/'),
      },
      {
        section_key: 'uhaul-storage',
        title: 'U-Haul Storage Toronto',
        body_markdown: '',
        source: source('U-Haul Storage Toronto', 'https://www.uhaul.com/Storage/Toronto-ON/'),
      },
      {
        section_key: 'unexpected',
        title: 'A newly added resource',
        body_markdown: '',
        source: source('New resource', 'https://example.com/new'),
      },
    ],
  };
}

describe('MovingShippingPage', () => {
  it('starts collapsed, loads official guidance, and closes the active section', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => ({
        ok: true,
        json: async () => responseFor(input),
      })),
    );

    render(<MovingShippingPage />);
    const official = screen.getByRole('button', { name: /Official guidance/ });
    const options = screen.getByRole('button', { name: /Moving and shipping options/ });
    expect(official).toHaveAttribute('aria-expanded', 'false');
    expect(options).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(official);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Moving Advice' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Moving Advice' })).toHaveAttribute('target', '_blank');
    fireEvent.click(official);
    expect(official).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps one section open and groups moving options while preserving unknown resources', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => ({
        ok: true,
        json: async () => responseFor(input),
      })),
    );

    render(<MovingShippingPage />);
    const official = screen.getByRole('button', { name: /Official guidance/ });
    const options = screen.getByRole('button', { name: /Moving and shipping options/ });
    fireEvent.click(options);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Professional household movers' }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('heading', { name: 'Airline checked or excess baggage' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Parcel or courier shipping' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Containers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'A newly added resource' })).toBeInTheDocument();
    fireEvent.click(official);
    await waitFor(() => {
      expect(options).toHaveAttribute('aria-expanded', 'false');
      expect(official).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('shows an API error and retries into an empty state', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sections: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    render(<MovingShippingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Official guidance/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText(/coming soon/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

