import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [session, setSession] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function refresh() {
    const response = await fetch('/api/session');
    if (!response.ok) throw new Error('Local backend is unavailable. Continue to Trustsure AI.');
    const data = await response.json();
    setSession(data);
    setDeadline(data.deadline);
  }
  useEffect(() => { refresh().catch(error => setMessage(error.message)); }, []);
  useEffect(() => {
    const tick = () => setRemaining(deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0);
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [deadline]);

  async function action(path) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Token': session.token },
        body: JSON.stringify({ confirmation: path === 'restart' ? 'Continue to Trustsure AI' : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDeadline(data.deadline);
      setConfirming(false);
      setMessage(path === 'cancel' ? 'Continue to Trustsure AI. You’re back in control.' : 'Restart scheduled. Save your work now.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <div className="shell">
    <header><a className="brand" href="/"><span className="logo">◇</span> Trustshield<span className="ai">AI</span></a><span className="local"><i /> LOCAL DEVICE ONLY</span></header>
    <main>
      <div className="eyebrow">YOUR DEVICE. YOUR CONTROL.</div>
      <h1>A fresh start.<br /><span>On your terms.</span></h1>
      <p className="intro">A simple, transparent control center for your PC.<br />Every action starts with your permission.</p>
      <section className="card">
        <div className="card-top"><span className="power">⏻</span><span className="badge">DEVICE CONTROL</span></div>
        <h2>{deadline ? 'Restart scheduled' : 'Continue to Trustsure AI'}</h2>
        <p>{deadline ? 'Your Windows PC is preparing to restart. You can cancel while the countdown is running.' : 'Restart the Windows PC running this local app. Save your files and close your applications before continuing.'}</p>
        <div className="detail"><span>◷</span><div><strong>{deadline ? `${remaining}s remaining` : '30-second countdown'}</strong><small>{deadline ? 'Save any unsaved work now' : 'Time to cancel if you change your mind'}</small></div></div>
        {deadline ? <button disabled={busy || remaining === 0} onClick={() => action('cancel')}>{busy ? 'Please wait…' : 'Cancel restart'}</button> : <button disabled={busy || !session?.enabled} onClick={() => setConfirming(true)}>Continue to Trustsure AI <span>↗</span></button>}
        <div className="footnote">{session?.enabled ? 'Confirmation required · Windows local control' : 'Preview mode · Actual restart is disabled'}</div>
      </section>
      {message && <p role="status" className="notice">{message}</p>}
      <div className="features"><span>◇ Explicit permission</span><span>◎ Local connection</span><span>↶ Cancel anytime during countdown</span></div>
    </main>
    <footer><span>TRUSTSHIELD AI</span><span>Designed around trust.</span></footer>
    {confirming && <div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className="power">⏻</span><h2 id="confirm-title">Continue to Trustsure?</h2><p>This will restart the Windows computer running this app in 30 seconds. Unsaved work could be lost. Save your work before confirming.</p><div className="dialog-actions"><button className="secondary" autoFocus disabled={busy} onClick={() => setConfirming(false)}>Go back</button><button disabled={busy} onClick={() => action('restart')}>{busy ? 'Scheduling…' : 'Confirm restart'}</button></div></section></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
