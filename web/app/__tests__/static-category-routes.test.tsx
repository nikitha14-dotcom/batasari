import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  notFound: vi.fn(),
}));
vi.mock('../../lib/supabase/RequireSession', () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import DailyNeeds from '../daily-needs/page';
import Health from '../health/page';
import Immigration from '../immigration/page';
import MovingShipping from '../moving-shipping/page';
import TheCity from '../the-city/page';

const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ sections: [] }) }));
vi.stubGlobal('fetch', fetchMock);

describe.each([
  ['Daily Needs', DailyNeeds],
  ['Health', Health],
  ['Get ready for your stay in India.', Immigration],
  ['The City', TheCity],
  ['Choose help with confidence.', MovingShipping],
])('/%s route', (name, Page) => {
  it('renders its category heading', async () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument();

  });
});

