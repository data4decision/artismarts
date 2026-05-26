'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });

interface Props {
  jobRequestId: string;
}

export default function CustomerArtisanTracker({ jobRequestId }: Props) {
  const mapRef = useRef<any>(null);
  const artisanMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const [artisanPosition, setArtisanPosition] = useState<[number, number]>([8.9667, 4.5667]);
  const [customerPosition, setCustomerPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState<string>("Waiting for artisan...");
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Icons
  const artisanIcon = L.divIcon({
    className: 'custom-artisan-icon',
    html: `<div style="background:#22c55e; width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.4); font-size:22px;">👷</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

  const customerIcon = L.divIcon({
    className: 'custom-customer-icon',
    html: `<div style="background:#3b82f6; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.3);">👤</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  // Get Customer Location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const posArray: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCustomerPosition(posArray);
      },
      (err) => console.warn("Customer location unavailable", err)
    );
  }, []);

  // Calculate Distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!jobRequestId) return;

    const fetchArtisanLocation = async () => {
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
        setArtisanPosition(newPos);

        artisanMarkerRef.current?.setLatLng(newPos);
        mapRef.current?.flyTo(newPos, 17, { duration: 1.6 });

        if (circleRef.current) circleRef.current.setLatLng(newPos);
        else if (mapRef.current) {
          circleRef.current = L.circle(newPos, {
            radius: 700,
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.25,
            weight: 3,
          }).addTo(mapRef.current);
        }

        if (customerPosition) {
          const dist = calculateDistance(customerPosition[0], customerPosition[1], newPos[0], newPos[1]);
          setDistance(Math.round(dist * 10) / 10);
        }
      }

      if (data?.manual_address) setAddress(data.manual_address);
      setIsLoading(false);
    };

    fetchArtisanLocation();

    // Real-time WebSocket tracking
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
            setArtisanPosition(newPos);

            artisanMarkerRef.current?.setLatLng(newPos);
            mapRef.current?.flyTo(newPos, 17, { duration: 1.6 });

            if (circleRef.current) circleRef.current.setLatLng(newPos);

            if (customerPosition) {
              const dist = calculateDistance(customerPosition[0], customerPosition[1], newPos[0], newPos[1]);
              setDistance(Math.round(dist * 10) / 10);
            }
          }
          if (loc?.manual_address) setAddress(loc.manual_address);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobRequestId, customerPosition]);

  // Draw connecting line
  useEffect(() => {
    if (!mapRef.current || !customerPosition) return;

    if (polylineRef.current) {
      polylineRef.current.setLatLngs([customerPosition, artisanPosition]);
    } else {
      polylineRef.current = L.polyline([customerPosition, artisanPosition], {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: '8, 8',
      }).addTo(mapRef.current);
    }
  }, [artisanPosition, customerPosition]);

  if (isLoading) {
    return <div className="h-[450px] flex items-center justify-center bg-gray-100 rounded-2xl">Connecting to live location...</div>;
  }

  return (
    <MapContainer
      center={artisanPosition}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* Artisan Marker */}
      <Marker position={artisanPosition} ref={artisanMarkerRef} icon={artisanIcon}>
        <Popup>
          <div className="text-center">
            <div className="text-green-600 font-bold">🟢 ARTISAN LIVE</div>
            <strong>Artisan Location</strong><br />
            {address}
            {distance && <p className="text-sm mt-1">📍 {distance} km from you</p>}
          </div>
        </Popup>
      </Marker>

      {/* Customer Marker */}
      {customerPosition && (
        <Marker position={customerPosition} ref={customerMarkerRef} icon={customerIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {/* Connecting Line */}
      {customerPosition && (
        <Polyline 
          positions={[customerPosition, artisanPosition]} 
          color="#3b82f6" 
          weight={4} 
          opacity={0.7} 
          dashArray="8, 8"
        />
      )}
    </MapContainer>
  );
}