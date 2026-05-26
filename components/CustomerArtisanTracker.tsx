'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

interface Props {
  jobRequestId: string;
}

export default function CustomerArtisanTracker({ jobRequestId }: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  const [position, setPosition] = useState<[number, number]>([8.9667, 4.5667]);
  const [address, setAddress] = useState<string>("Connecting to artisan...");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [distance, setDistance] = useState<number | null>(null);
  const [customerPos, setCustomerPos] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fix Leaflet icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Get Customer's Current Location
  const getCustomerLocation = useCallback(async () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const custPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCustomerPos(custPos);
      },
      (err) => console.warn("Could not get customer location:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  // Calculate Distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    if (!jobRequestId) return;

    getCustomerLocation();

    const fetchLatestLocation = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('artisan_locations')
        .select('latitude, longitude, manual_address, timestamp')
        .eq('job_request_id', jobRequestId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (data?.latitude && data?.longitude) {
        const newPos: [number, number] = [data.latitude, data.longitude];
        setPosition(newPos);
        setLastUpdated(new Date(data.timestamp));

        markerRef.current?.setLatLng(newPos);
        mapRef.current?.flyTo(newPos, 18, { duration: 1.8 });

        // Pulsing circle
        if (circleRef.current) {
          circleRef.current.setLatLng(newPos);
        } else if (mapRef.current) {
          circleRef.current = L.circle(newPos, {
            radius: 700,
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.25,
            weight: 4,
          }).addTo(mapRef.current);
        }

        // Calculate distance if customer location is available
        if (customerPos) {
          const dist = calculateDistance(
            customerPos[0], customerPos[1],
            newPos[0], newPos[1]
          );
          setDistance(Math.round(dist * 10) / 10); // 1 decimal place
        }
      }

      if (data?.manual_address) setAddress(data.manual_address);
      setIsLoading(false);
    };

    fetchLatestLocation();

    // Real-time subscription
    const channel = supabase
      .channel(`customer-track-${jobRequestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artisan_locations',
          filter: `job_request_id=eq.${jobRequestId}`,
        },
        (payload) => {
          const loc = payload.new as any;
          if (loc?.latitude && loc?.longitude) {
            const newPos: [number, number] = [loc.latitude, loc.longitude];
            setPosition(newPos);
            setLastUpdated(new Date(loc.timestamp));

            markerRef.current?.setLatLng(newPos);
            mapRef.current?.flyTo(newPos, 18, { duration: 1.8 });

            if (circleRef.current) circleRef.current.setLatLng(newPos);

            if (customerPos) {
              const dist = calculateDistance(customerPos[0], customerPos[1], newPos[0], newPos[1]);
              setDistance(Math.round(dist * 10) / 10);
            }
          }
          if (loc?.manual_address) setAddress(loc.manual_address);
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Auto-refresh every 8 seconds (WhatsApp style)
    const interval = setInterval(fetchLatestLocation, 8000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [jobRequestId, customerPos]);

  if (isLoading) {
    return <div className="h-[450px] flex items-center justify-center bg-gray-100 rounded-2xl">Connecting to live location...</div>;
  }

  return (
    <MapContainer
      center={position}
      zoom={18}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      <Marker position={position} ref={markerRef}>
        <Popup>
          <div className="text-center min-w-[240px]">
            <div className="text-green-600 font-bold text-lg mb-1">🟢 LIVE</div>
            <strong>Artisan Current Location</strong><br />
            <span className="text-sm">{address}</span>
            {distance && (
              <p className="text-sm text-gray-600 mt-1">
                📍 {distance} km away from you
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}