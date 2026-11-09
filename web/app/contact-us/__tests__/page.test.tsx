import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { submitContactMessage } = vi.hoisted(() => ({
  submitContactMessage: vi.fn(),
}));

vi.mock('@/lib/supabase/RequireSession', () => ({
  RequireSession: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/lib/contact/contactApi', () => ({
  ContactError: class ContactError extends Error {},
  submitContactMessage,
}));

import Page from '../page';

describe('contact us page', () => {
  beforeEach(() => {
    submitContactMessage.mockReset();
    submitContactMessage.mockResolvedValue(undefined);
  });

  it('shows the form, topic choices, and active support navigation', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: 'Contact Us' })).toBeInTheDocument();
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    const support = screen.getByRole('navigation', { name: 'Support' });
    expect(within(support).getByRole('link', { name: 'Contact Support' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Share your feedback' })).toHaveAttribute(
      'href',
      '/feedback',
    );
    fireEvent.click(screen.getByRole('button', { name: /Select a topic/i }));
    expect(within(screen.getByRole('listbox')).getAllByRole('option').map((item) => item.textContent)).toEqual([
      'Technical Issue',
      'Account & Sign-in',
      'Privacy & Data',
      'Subscriptions',
      'General Question',
      'Partnership',
      'Other',
    ]);
  });

  it('sends a complete message and confirms receipt', async () => {
    render(<Page />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Jia' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'jia@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Please help.' } });
    fireEvent.click(screen.getByRole('button', { name: /Select a topic/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Privacy & Data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));

    await waitFor(() => {
      expect(submitContactMessage).toHaveBeenCalledWith({
        name: 'Jia',
        email: 'jia@example.com',
        topic: 'privacy_data',
        message: 'Please help.',
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Your message has been received.');
  });

  it('requires a topic before sending', () => {
    render(<Page />);
    fireEvent.submit(screen.getByRole('button', { name: 'Send Message' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a topic.');
    expect(submitContactMessage).not.toHaveBeenCalled();
  });
});

