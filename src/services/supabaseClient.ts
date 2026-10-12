import { createClient, SupabaseClient } from '@supabase/supabase-js';
export { withSupabase, createSupabaseContext } from '@supabase/server';

/**
 * Configuration Supabase fournie pour le projet MensaStaff / ESSTS
 */
export const SUPABASE_CONFIG = {
  url: 'https://vebfzgiblpnocusdlozu.supabase.co',
  publishableKey: 'sb_publishable_GU2cGO16rGYG80K7ne9sSQ_JuVuX9r_',
  secretKey: 'sb_secret_Yc3fPm-HeCdUfC0MG8ZPng_qYYiizEd',
  jwksUrl: 'https://vebfzgiblpnocusdlozu.supabase.co/auth/v1/.well-known/jwks.json',
};

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;
let currentConfig = { url: '', key: '' };

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const effectiveUrl =
    url ||
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.SUPABASE_URL)) ||
    SUPABASE_CONFIG.url;

  const effectiveKey =
    anonKey ||
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_SUPABASE_ANON_KEY ||
        import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env?.SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env?.SUPABASE_SECRET_KEY)) ||
    SUPABASE_CONFIG.publishableKey;

  if (!effectiveUrl || !effectiveKey) {
    return null;
  }

  if (
    supabaseInstance &&
    currentConfig.url === effectiveUrl &&
    currentConfig.key === effectiveKey
  ) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(effectiveUrl, effectiveKey, {
      auth: { persistSession: false },
    });
    currentConfig = { url: effectiveUrl, key: effectiveKey };
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Client Supabase avec privilèges de service (Secret Key) pour les opérations d'administration
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (supabaseAdminInstance) return supabaseAdminInstance;
  try {
    const url =
      (typeof import.meta !== 'undefined' &&
        (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.SUPABASE_URL)) ||
      SUPABASE_CONFIG.url;
    const secretKey =
      (typeof import.meta !== 'undefined' &&
        (import.meta.env?.VITE_SUPABASE_SECRET_KEY || import.meta.env?.SUPABASE_SECRET_KEY)) ||
      SUPABASE_CONFIG.secretKey;
    supabaseAdminInstance = createClient(url, secretKey, {
      auth: { persistSession: false },
    });
    return supabaseAdminInstance;
  } catch (e) {
    console.warn('Failed to initialize Supabase Admin client:', e);
    return null;
  }
}

/**
 * Script SQL complet prêt à être copié dans l'éditeur SQL de Supabase
 */
export const SUPABASE_SQL_SCHEMA = `-- SCHEMA SUPABASE POUR MENSASTAFF
-- À coller directement dans le "SQL Editor" de votre projet Supabase

-- 1. Table des Menus du Jour
create table if not exists public.menus (
  id text primary key,
  date text not null,
  title text not null,
  is_active boolean default false,
  featured_plat_id text,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Table des Réservations
create table if not exists public.reservations (
  id text primary key,
  date text not null,
  ticket_code text not null,
  staff_name text not null,
  staff_department text not null,
  status text not null default 'confirmed',
  served_at timestamp with time zone,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Table des Utilisateurs Autorisés (Whitelist)
create table if not exists public.authorized_users (
  id text primary key,
  badge_number text unique not null,
  full_name text not null,
  department text not null,
  email text,
  active boolean default true,
  data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Table des Paramètres de l'Établissement
create table if not exists public.app_settings (
  id text primary key default 'global_settings',
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sécurité RLS (Row Level Security) ouverte pour l'application cliente (avec Anon Key)
alter table public.menus enable row level security;
alter table public.reservations enable row level security;
alter table public.authorized_users enable row level security;
alter table public.app_settings enable row level security;

create policy "Allow public all access on menus" on public.menus for all using (true) with check (true);
create policy "Allow public all access on reservations" on public.reservations for all using (true) with check (true);
create policy "Allow public all access on authorized_users" on public.authorized_users for all using (true) with check (true);
create policy "Allow public all access on app_settings" on public.app_settings for all using (true) with check (true);

-- 5. Activation de la réplication temps réel (Supabase Realtime)
alter publication supabase_realtime add table public.menus;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.authorized_users;
alter publication supabase_realtime add table public.app_settings;
`;
