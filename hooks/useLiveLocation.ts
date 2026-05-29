'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface UseLiveLocationProps {
  jobRequestId: string;
  isActive: boolean;   // Changed from isSharing to match your usage
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
    if (intervalRef.current) {
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

      if (isSharingRef.current) return;
      isSharingRef.current = true;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sendLocation = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;

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
          }, { onConflict: 'job_request_id,artisan_id' })
          .then(({ error }) => {
            if (error) console.error('Location update failed:', error);
          });
      };

      const handleError = (error: GeolocationPositionError) => {
        console.error('Geolocation error:', error);
        if (error.code === 1) {
          toast.error("Location access denied. Please allow location permission.");
        } else if (error.code === 2) {
          console.warn("Position unavailable. Retrying with lower accuracy...");
        } else if (error.code === 3) {
          console.warn("Location request timed out.");
        }
      };

      // First immediate attempt
      navigator.geolocation.getCurrentPosition(sendLocation, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      });

      // Continuous tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        sendLocation,
        handleError,
        { 
          enableHighAccuracy: true, 
          maximumAge: 0, 
          timeout: 20000 
        }
      );

      // Backup interval (every 12 seconds)
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(sendLocation, handleError, {
          enableHighAccuracy: false,   // fallback to lower accuracy
          timeout: 10000
        });
      }, 12000);
    };

    startSharing();

    return () => {
      stopSharing();
    };
  }, [jobRequestId, isActive, stopSharing]);
}