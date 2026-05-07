import { supabase } from './supabase';

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
};

export async function signUpPatient(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) throw error;

  // Create user_profiles row after signup
  if (data.user) {
    await supabase.from('user_profiles').upsert({
      id: data.user.id,
      email: data.user.email!,
      full_name: fullName,
    }, { onConflict: 'id' });
  }

  return data;
}

export async function signInPatient(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutPatient() {
  // Clear all Supabase auth keys from localStorage directly.
  // supabase.auth.signOut() acquires the navigator.lock and can fail
  // when realtime subscriptions are active. Direct clear always works.
  try {
    // Clear both the new key and any old Supabase default key
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-') || k === 'mediq-auth-token')
      .forEach(k => localStorage.removeItem(k));
  } catch (_) { /* ignore */ }
  // Hard reload so React state is fully reset
  window.location.href = '/';
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function ensureUserProfile(userId: string, email: string, fullName?: string) {
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('user_profiles').insert({
      id: userId,
      email,
      full_name: fullName ?? null,
    });
  }
}
