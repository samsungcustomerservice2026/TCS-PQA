'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { signInEmployee, signUpEmployee } from '../../services/employeeAuthService';
import {
  EMPLOYEE_PRODUCT_LINE,
  EMPLOYEE_PRODUCT_LINE_LABELS,
} from '../../lib/consultants/constants';

export default function EmployeeAuthModal({ open, onClose, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [gspnId, setGspnId] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [productLine, setProductLine] = useState('');

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        const profile = await signInEmployee({ loginId, password });
        onSuccess?.(profile);
        onClose?.();
      } else {
        const profile = await signUpEmployee({
          email,
          gspnId,
          phone,
          password,
          confirmPassword,
          productLine,
        });
        onSuccess?.(profile);
        onClose?.();
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950 p-6 shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              mode === 'login' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Log in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              mode === 'signup' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Sign up
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'login' ? (
            <>
              <input
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="GSPN account or email"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
                autoComplete="username"
              />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
                autoComplete="current-password"
              />
            </>
          ) : (
            <>
              <input
                required
                value={gspnId}
                onChange={(e) => setGspnId(e.target.value)}
                placeholder="GSPN user ID"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
                autoComplete="username"
              />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
                autoComplete="email"
              />
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
                autoComplete="tel"
              />
              <select
                required
                value={productLine}
                onChange={(e) => setProductLine(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
              >
                <option value="" disabled>
                  Product line — MX or CE (DA & AV)
                </option>
                {Object.values(EMPLOYEE_PRODUCT_LINE).map((p) => (
                  <option key={p} value={p}>
                    {EMPLOYEE_PRODUCT_LINE_LABELS[p]}
                  </option>
                ))}
              </select>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6)"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
                autoComplete="new-password"
              />
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white"
                autoComplete="new-password"
              />
            </>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
