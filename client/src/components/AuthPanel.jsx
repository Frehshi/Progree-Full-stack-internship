import { useState } from 'react';
import { X } from 'lucide-react';
import { api, writeSession } from '../lib/api';
import { Button } from './Button';

export function AuthPanel({ onAuthenticated, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = mode === 'register' ? form : { email: form.email, password: form.password };
      const session = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      writeSession(session);
      onAuthenticated(session);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function useDemo() {
    setForm({ name: '', email: 'demo@progree.local', password: 'Demo123!' });
    setMode('login');
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        {onClose ? <button className="icon-button auth-close" aria-label="Close sign in" onClick={onClose}><X /></button> : null}
        <h2 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p>{mode === 'login' ? 'Sign in to sync tasks and your cart.' : 'Your password is hashed before it is stored.'}</p>
        <form onSubmit={submit}>
          {mode === 'register' ? <label>Name<input required minLength="2" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label> : null}
          <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input required minLength="8" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
        </form>
        <div className="auth-actions">
          <button className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Use an existing account'}</button>
          <button className="text-button" onClick={useDemo}>Use demo account</button>
        </div>
      </section>
    </div>
  );
}

