'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });

interface Props {
  jobRequestId: string;
  isVisible: boolean;
}

export default function ArtisanLiveMap({ jobRequestId, isVisible }: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const [position, setPosition] = useState<[number, number]>([8.9667, 4.5667]); // Ilorin fallback

  // Fix Leaflet default icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Real-time location updates
  useEffect(() => {
    if (!isVisible || !jobRequestId) {
      return;
    }

    // Fetch latest location first
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('artisan_locations')
        .select('latitude, longitude')
        .eq('job_request_id', jobRequestId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (data?.latitude && data?.longitude) {
        const newPos: [number, number] = [data.latitude, data.longitude];
        setPosition(newPos);
        markerRef.current?.setLatLng(newPos);
        mapRef.current?.flyTo(newPos, 16, { duration: 1.5 });
      }
    };

    fetchLatest();

    // Realtime subscription
    const channel = supabase
      .channel(`live-map-${jobRequestId}`)
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
            markerRef.current?.setLatLng(newPos);
            mapRef.current?.flyTo(newPos, 17, { duration: 1.2 });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [jobRequestId, isVisible]);

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Marker position={position} ref={markerRef} />
    </MapContainer>
  );
}