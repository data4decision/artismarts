'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

interface Props {
  jobRequestId: string;
  isVisible: boolean;
}

export default function ArtisanLiveMap({ jobRequestId, isVisible }: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [position, setPosition] = useState<[number, number]>([8.9667, 4.5667]);
  const [address, setAddress] = useState<string>("");

  // Fix Leaflet icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  useEffect(() => {
  if (!isVisible || !jobRequestId) return;

  const fetchLatest = async () => {
    const { data } = await supabase
      .from('artisan_locations')
      .select('latitude, longitude, manual_address')
      .eq('job_request_id', jobRequestId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      if (data.latitude && data.longitude) {
        const newPos: [number, number] = [data.latitude, data.longitude];

        setPosition(newPos);
        markerRef.current?.setLatLng(newPos);
        mapRef.current?.flyTo(newPos, 18, { duration: 1.5 });
      }

      if (data.manual_address) {
        setAddress(data.manual_address);
      }
    }
  };

  fetchLatest();

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
          mapRef.current?.flyTo(newPos, 18, { duration: 1.5 });
        }

        if (loc?.manual_address) {
          setAddress(loc.manual_address);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [jobRequestId, isVisible]);

  return (
    <MapContainer
      center={position}
      zoom={17}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      <Marker position={position} ref={markerRef}>
        <Popup>
          <div className="text-center">
            <strong>🟢 Artisan is here</strong><br />
            {address || "Live Location"}
          </div>
        </Popup>
      </Marker>

      {/* Pulsing Circle Effect */}
      <circle
        cx={position[1]}
        cy={position[0]}
        r="800"
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        strokeOpacity="0.4"
        className="animate-pulse"
      />
    </MapContainer>
  );
}

