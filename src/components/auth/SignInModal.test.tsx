import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignInModal } from './SignInModal';
const auth = vi.hoisted(() => ({signInWithMagicLink:vi.fn(), loginAsGuestDemo:vi.fn()}));
vi.mock('../../contexts/AuthContext', () => ({useAuth:()=>auth}));
beforeEach(()=>vi.resetAllMocks());
describe('library sign in', () => {
  it('enters the library after successful guest authentication', async () => {
    auth.loginAsGuestDemo.mockResolvedValue(undefined);
    const entered=vi.fn(), close=vi.fn();
    render(<SignInModal isOpen onClose={close} onAuthenticated={entered}/>);
    fireEvent.click(screen.getByText('Continue as Anonymous Guest'));
    await waitFor(()=>expect(entered).toHaveBeenCalledTimes(1));
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('shows guest failure without pretending success', async () => {
    auth.loginAsGuestDemo.mockRejectedValue(new Error('Guest entry unavailable'));
    const entered=vi.fn(), close=vi.fn();
    render(<SignInModal isOpen onClose={close} onAuthenticated={entered}/>);
    fireEvent.click(screen.getByText('Continue as Anonymous Guest'));
    expect(await screen.findByText('Guest entry unavailable')).toBeVisible();
    expect(entered).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
  it('recovers from a rejected email request instead of spinning forever', async () => {
    auth.signInWithMagicLink.mockRejectedValue(new Error('Email service unavailable'));
    render(<SignInModal isOpen onClose={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Email Address'), {target:{value:'test@example.com'}});
    fireEvent.click(screen.getByText('Send Magic Link via Email'));
    expect(await screen.findByText('Email service unavailable')).toBeVisible();
    expect(screen.getByText('Send Magic Link via Email')).not.toBeDisabled();
  });
});
