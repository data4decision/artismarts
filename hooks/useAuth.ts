// hooks/useAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type User = Awaited<ReturnType<ReturnType<typeof createClient>['auth']['getUser']>>['data']['user'];

// Base profile fields (common to both tables)
interface BaseProfile {
  id: string;
  role: 'customer' | 'artisan' | 'admin' | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
}

// Customer/Artisan profile (from profiles table)
interface RegularProfile extends BaseProfile {
  table: 'profiles';
  state?: string | null;
  lga?: string | null;
  // add any other fields specific to regular users
}

// Admin profile (from admin_profiles table)
interface AdminProfile extends BaseProfile {
  table: 'admin_profiles';
  residential_address?: string | null;
  secret_code?: string | null; // only if you want to expose it (usually not)
  // add any other admin-specific fields
}

type Profile = RegularProfile | AdminProfile | null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const initializeAuth = async () => {
      try {
        // 1. Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          setLoading(false);
          return;
        }

        // 2. First try to fetch from admin_profiles (admins are fewer, faster check)
        let fetchedProfile: Profile = null;

        // Try admin_profiles first
        const { data: adminData, error: adminError } = await supabase
          .from('admin_profiles')
          .select(`
            role,
            first_name,
            last_name,
            avatar_url,
            phone,
            residential_address
          `)
          .eq('id', user.id)
          .single();

        if (!adminError && adminData) {
          const fullName = adminData.first_name && adminData.last_name
            ? `${adminData.first_name} ${adminData.last_name}`.trim()
            : null;

          fetchedProfile = {
            table: 'admin_profiles',
            id: user.id,
            role: adminData.role || 'admin',
            first_name: adminData.first_name,
            last_name: adminData.last_name,
            full_name: fullName,
            avatar_url: adminData.avatar_url,
            phone: adminData.phone,
            residential_address: adminData.residential_address,
          };
        } else {
          // If not admin → fetch from regular profiles
          const { data: regularData, error: regularError } = await supabase
            .from('profiles')
            .select(`
              role,
              first_name,
              last_name,
              avatar_url,
              phone,
              state,
              lga
            `)
            .eq('id', user.id)
            .single();

          if (regularError) {
            console.warn('Regular profile fetch failed:', regularError.message);
          } else if (regularData) {
            const fullName = regularData.first_name && regularData.last_name
              ? `${regularData.first_name} ${regularData.last_name}`.trim()
              : null;

            fetchedProfile = {
              table: 'profiles',
              id: user.id,
              role: regularData.role || null,
              first_name: regularData.first_name,
              last_name: regularData.last_name,
              full_name: fullName,
              avatar_url: regularData.avatar_url,
              phone: regularData.phone,
              state: regularData.state,
              lga: regularData.lga,
            };
          }
        }

        setProfile(fetchedProfile);
        setLoading(false);
      } catch (err) {
        console.error('Auth initialization failed:', err);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Re-run profile fetch logic on auth change
        const supabase = createClient();

        // Same logic as above (you could extract to a helper function)
        let fetchedProfile: Profile = null;

        const { data: adminData, error: adminError } = await supabase
          .from('admin_profiles')
          .select('role, first_name, last_name, avatar_url, phone, residential_address')
          .eq('id', currentUser.id)
          .single();

        if (!adminError && adminData) {
          const fullName = adminData.first_name && adminData.last_name
            ? `${adminData.first_name} ${adminData.last_name}`.trim()
            : null;

          fetchedProfile = {
            table: 'admin_profiles',
            id: currentUser.id,
            role: adminData.role || 'admin',
            first_name: adminData.first_name,
            last_name: adminData.last_name,
            full_name: fullName,
            avatar_url: adminData.avatar_url,
            phone: adminData.phone,
            residential_address: adminData.residential_address,
          };
        } else {
          const { data: regularData, error: regularError } = await supabase
            .from('profiles')
            .select('role, first_name, last_name, avatar_url, phone, state, lga')
            .eq('id', currentUser.id)
            .single();

          if (!regularError && regularData) {
            const fullName = regularData.first_name && regularData.last_name
              ? `${regularData.first_name} ${regularData.last_name}`.trim()
              : null;

            fetchedProfile = {
              table: 'profiles',
              id: currentUser.id,
              role: regularData.role || null,
              first_name: regularData.first_name,
              last_name: regularData.last_name,
              full_name: fullName,
              avatar_url: regularData.avatar_url,
              phone: regularData.phone,
              state: regularData.state,
              lga: regularData.lga,
            };
          }
        }

        setProfile(fetchedProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,       // Now typed as RegularProfile | AdminProfile | null
    loading,
  };
}