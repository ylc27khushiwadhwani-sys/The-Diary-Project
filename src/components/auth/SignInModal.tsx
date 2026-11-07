import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
  initialMode?: 'signin' | 'signup' | 'password';
}

export const SignInModal: React.FC<SignInModalProps> = ({isOpen,onClose,onAuthenticated,initialMode='signin'}) => {
  const {signInWithMagicLink,signInWithPassword,signUpWithPassword,completeGuestPassword,signInWithGoogle,loginAsGuestDemo} = useAuth();
  const [mode,setMode] = useState(initialMode);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [name,setName] = useState('');
  const [loading,setLoading] = useState(false);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');
  if (!isOpen) return null;
  const finish = () => {onAuthenticated?.();onClose();};
  const run = async (action:()=>Promise<void>) => {
    setLoading(true);setError('');setNotice('');
    try {await action();} catch(err) {setError(err instanceof Error ? err.message : 'Could not connect. Please try again.');} finally {setLoading(false);}
  };
  const submit = (event:React.FormEvent) => {
    event.preventDefault();
    void run(async()=>{
      if (mode==='password') {
        const result=await completeGuestPassword(password); if(result.error) throw result.error; finish();
      } else if (mode==='signup') {
        const result=await signUpWithPassword(email.trim(),password,name.trim());
        if(result.error) throw result.error;
        if(result.needsConfirmation) {setNotice('Check your inbox to verify your email. Open the confirmation link to activate your library card. If you started as a guest, you will set your password after verification so your letters stay with you.');setPassword('');}
        else finish();
      } else {
        const result=await signInWithPassword(email.trim(),password);
        if(result.error) throw result.error;
        finish();
      }
    });
  };
  return <div role="dialog" aria-modal="true" aria-label={mode==='signup'?'Create a library card':'Log in to your library'} className="pv-auth-overlay">
    <section className="pv-auth-card" data-clarity-mask="true">
      <button type="button" onClick={onClose} className="pv-auth-close" aria-label="Close"><X size={20}/></button>
      <p className="pv-auth-eyebrow">THE PAPER VAULT</p>
      <h2>{mode==='password'?'Your email is verified.':mode==='signup'?'A library card of your own.':'Welcome back to your library.'}</h2>
      <p className="pv-auth-intro">{mode==='password'?'Set a password to finish saving your guest library. Your letters stay on the same shelves.':mode==='signup'?'Keep a private place for the words you have carried. Your email stays private; readers see only your pen name.':'Log in to find your private shelves and the letters you left here.'}</p>
      {mode!=='password' && <button type="button" className="pv-auth-google" disabled={loading} onClick={()=>void run(async()=>{const result=await signInWithGoogle();if(result.error) throw result.error;})}>Continue with Google</button>}
      <form onSubmit={submit}>
        {mode==='signup' && <label htmlFor="auth-name">What should we call you?<input id="auth-name" autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)} placeholder="Your pen name" required maxLength={80}/></label>}
        {mode!=='password' && <label htmlFor="auth-email">Email Address<input id="auth-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>}
        <label htmlFor="auth-password">{mode==='signup'?'Password (8+ characters)':'Password'}<input id="auth-password" type="password" autoComplete={mode!=='signin'?'new-password':'current-password'} minLength={mode!=='signin'?8:undefined} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
        {mode==='signup' && <p className="pv-auth-help">Verify your email using the link we send before activating your new library card.</p>}
        {error && <p role="alert" className="pv-auth-error">{error}</p>}
        {notice && <p role="status" className="pv-auth-notice">{notice}</p>}
        <button type="submit" className="pv-auth-submit" disabled={loading}>{loading?'Please wait...':mode==='password'?'Save password and enter':mode==='signup'?'Create my library card':'Log in'}</button>
      </form>
      {mode!=='password' && <p className="pv-auth-switch">{mode==='signup'?'Already have a library card?':'New to the library?'} <button type="button" onClick={()=>{setMode(mode==='signup'?'signin':'signup');setPassword('');setError('');setNotice('');}}>{mode==='signup'?'Log in':'Sign up'}</button></p>}
      {mode==='signin' && <div className="pv-auth-email-link"><p>Used an email link before, or need help signing in?</p><button type="button" disabled={loading || !email.trim()} onClick={()=>void run(async()=>{const result=await signInWithMagicLink(email.trim());if(result.error) throw result.error;setNotice('Check your inbox for a secure sign-in link. Existing library cards and letters are kept.');})}>Email me a sign-in link</button></div>}
      {mode!=='password' && <button type="button" className="pv-auth-guest" disabled={loading} onClick={()=>void run(async()=>{await loginAsGuestDemo();finish();})}>Continue as Anonymous Guest</button>}
    </section>
  </div>;
};
