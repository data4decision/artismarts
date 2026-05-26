"use client";

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseLiveLocationProps {
  jobRequestId: string;
  isActive: boolean;
}

export function useLiveLocation({ jobRequestId, isActive }: UseLiveLocationProps) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSharingRef = useRef(false);

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isSharingRef.current = false;
  }, []);

  useEffect(() => {
    if (!isActive || !jobRequestId) {
      stopSharing();
      return;
    }

    const startSharing = async () => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        return;
      }

      // Prevent duplicate tracking
      if (isSharingRef.current) return;
      isSharingRef.current = true;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const sendLocation = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;

        // In the upsert part, use this:
supabase
  .from('artisan_locations')
  .upsert({
    job_request_id: jobRequestId,
    artisan_id: user.id,
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    speed: speed ?? null,
    heading: heading ?? null,
    timestamp: new Date().toISOString(),
  }, { 
    onConflict: 'job_request_id,artisan_id',
    ignoreDuplicates: false 
  })
}

      // First immediate location
      navigator.geolocation.getCurrentPosition(sendLocation, 
        (err) => console.error('Initial geolocation error:', err)
      );

      // Continuous live tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        sendLocation,
        (error) => console.error('Geolocation watch error:', error),
        { 
          enableHighAccuracy: true, 
          maximumAge: 0, 
          timeout: 15000 
        }
      );

      // Backup interval (every 10 seconds)
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(sendLocation);
      }, 10000);
    };

    startSharing();

    // Cleanup when component unmounts or isActive becomes false
    return () => {
      stopSharing();
    };
  }, [jobRequestId, isActive, stopSharing]);
}