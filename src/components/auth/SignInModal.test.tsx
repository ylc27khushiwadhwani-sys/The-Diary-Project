import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignInModal } from './SignInModal';
const auth = vi.hoisted(() => ({signInWithMagicLink:vi.fn(), signInWithGoogle:vi.fn(), signInWithPassword:vi.fn(), signUpWithPassword:vi.fn(), loginAsGuestDemo:vi.fn()}));
vi.mock('../../contexts/AuthContext', () => ({useAuth:()=>auth}));
beforeEach(()=>vi.resetAllMocks());
describe('library sign in', () => {
  it('offers separate password signup with verification and password login', async () => {
    auth.signUpWithPassword.mockResolvedValue({error:null,needsConfirmation:true});
    const entered=vi.fn();
    render(<SignInModal isOpen initialMode="signup" onClose={()=>{}} onAuthenticated={entered}/>);
    fireEvent.change(screen.getByLabelText('What should we call you?'),{target:{value:'Quiet Q'}});
    fireEvent.change(screen.getByLabelText('Email Address'),{target:{value:'test@example.com'}});
    fireEvent.change(screen.getByLabelText('Password (8+ characters)'),{target:{value:'example-only'}});
    fireEvent.click(screen.getByText('Create my library card'));
    expect(await screen.findByRole('status')).toHaveTextContent('verify your email');
    expect(entered).not.toHaveBeenCalled();
    expect(auth.signUpWithPassword).toHaveBeenCalledWith('test@example.com','example-only','Quiet Q');
  });
  it('enters after password login succeeds', async () => {
    auth.signInWithPassword.mockResolvedValue({error:null});
    const entered=vi.fn();
    render(<SignInModal isOpen onClose={()=>{}} onAuthenticated={entered}/>);
    fireEvent.change(screen.getByLabelText('Email Address'),{target:{value:'test@example.com'}});
    fireEvent.change(screen.getByLabelText('Password'),{target:{value:'example-only'}});
    fireEvent.click(screen.getByRole('button',{name:/^Log in$/}));
    await waitFor(()=>expect(entered).toHaveBeenCalledTimes(1));
  });
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
    fireEvent.click(screen.getByText('Email me a sign-in link'));
    expect(await screen.findByText('Email service unavailable')).toBeVisible();
    expect(screen.getByText('Email me a sign-in link')).not.toBeDisabled();
  });
});
