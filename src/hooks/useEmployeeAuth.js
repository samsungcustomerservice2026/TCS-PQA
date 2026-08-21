'use client';

import { useEffect, useState } from 'react';
import { subscribeEmployeeAuth, signOutEmployee } from '../services/employeeAuthService';

/**
 * Firebase Auth session for Samsung employees (GSPN).
 */
export function useEmployeeAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = subscribeEmployeeAuth(({ user: u, profile: p, error: err }) => {
      setUser(u || null);
      setProfile(p || null);
      setError(err || '');
      setLoading(false);
    });
    return () => {
      try {
        unsub();
      } catch {
        /* ignore */
      }
    };
  }, []);

  async function logout() {
    await signOutEmployee();
    setUser(null);
    setProfile(null);
  }

  return {
    user,
    profile,
    loading,
    error,
    isLoggedIn: !!user && !!profile,
    logout,
  };
}
