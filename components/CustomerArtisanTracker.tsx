'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';
import { FaUser } from 'react-icons/fa';

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
  const [address, setAddress] = useState<string>("Waiting for artisan location...");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Create custom user icon
  const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #22c55e; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
             <span style="color: white; font-size: 18px;">👤</span>
           </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  // Fix default icons + setup custom icon
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  useEffect(() => {
    if (!jobRequestId) return;

    const fetchLatest = async () => {
      setIsLoading(true);
      try {
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
          setLastUpdated(new Date(data.timestamp || Date.now()));

          markerRef.current?.setLatLng(newPos);
          mapRef.current?.flyTo(newPos, 17, { duration: 1.5 });

          // Pulsing circle
          if (circleRef.current) {
            circleRef.current.setLatLng(newPos);
          } else if (mapRef.current) {
            circleRef.current = L.circle(newPos, {
              radius: 700,
              color: '#22c55e',
              fillColor: '#22c55e',
              fillOpacity: 0.25,
              weight: 3,
            }).addTo(mapRef.current);
          }
        }

        if (data?.manual_address) setAddress(data.manual_address);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatest();

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
            setLastUpdated(new Date(loc.timestamp || Date.now()));

            markerRef.current?.setLatLng(newPos);
            mapRef.current?.flyTo(newPos, 17, { duration: 1.5 });

            if (circleRef.current) circleRef.current.setLatLng(newPos);
          }
          if (loc?.manual_address) setAddress(loc.manual_address);
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
  }, [jobRequestId]);

  if (isLoading) {
    return (
      <div className="h-[450px] flex items-center justify-center bg-gray-100 rounded-2xl">
        Loading live location...
      </div>
    );
  }

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

      <Marker 
        position={position} 
        ref={markerRef}
        icon={userIcon}
      >
        <Popup>
          <div className="text-center min-w-[220px]">
            <div className="text-green-600 font-bold text-lg mb-1">🟢 LIVE</div>
            <strong>Artisan Location</strong><br />
            {address}
            <br />
            <small className="text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </small>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}