'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(m => m.Circle), { ssr: false });

interface Props {
  jobRequestId: string;
  isVisible: boolean;
  // Optional: if you want to distinguish between viewer and sharer
  isArtisan?: boolean;
}

export default function ArtisanLiveMap({ jobRequestId, isVisible, isArtisan = false }: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  const [position, setPosition] = useState<[number, number]>([9.0820, 8.6753]); // Nigeria center fallback
  const [address, setAddress] = useState<string>("");
  const [hasLocation, setHasLocation] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Fix Leaflet icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // ==================== GET CURRENT LOCATION & SHARE ====================
  const startSharingLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setError("");
    setIsSharing(true);

    try {
      // First get current position
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = pos.coords;
      const newPos: [number, number] = [latitude, longitude];

      setPosition(newPos);
      setHasLocation(true);

      // Optional: Reverse geocode (you can use a free service or Nominatim)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await res.json();
        setAddress(data.display_name || "Current Location");
      } catch {
        setAddress("Current Location");
      }

      // Send to Supabase
      await supabase.from('artisan_locations').upsert({
        job_request_id: jobRequestId,
        latitude,
        longitude,
        manual_address: address,
        timestamp: new Date().toISOString(),
      }, { onConflict: 'job_request_id' });

      // Start live watching
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (currentPos) => {
          const { latitude: lat, longitude: lng } = currentPos.coords;
          const updatedPos: [number, number] = [lat, lng];

          setPosition(updatedPos);

          if (markerRef.current) markerRef.current.setLatLng(updatedPos);
          if (mapRef.current) mapRef.current.flyTo(updatedPos, 18, { duration: 1 });

          // Update Supabase in real-time
          await supabase.from('artisan_locations').upsert({
            job_request_id: jobRequestId,
            latitude: lat,
            longitude: lng,
            manual_address: address,
            timestamp: new Date().toISOString(),
          });
        },
        (err) => {
          console.error(err);
          setError("Failed to watch location. " + err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to get location. Please allow location permission.");
      setIsSharing(false);
    }
  };

  const stopSharing = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    setError("");
    // Optional: you can delete or mark as stopped in DB
  };

  // ==================== VIEW MODE (Customer seeing artisan) ====================
  useEffect(() => {
    if (!isVisible || !jobRequestId) {
      setIsLoading(false);
      return;
    }

    if (isArtisan) {
      setIsLoading(false);
      return; // Artisan mode uses manual start button
    }

    const fetchLatest = async () => {
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
        setAddress(data.manual_address || "Artisan is here");
        setHasLocation(true);

        if (markerRef.current) markerRef.current.setLatLng(newPos);
        if (mapRef.current) mapRef.current.flyTo(newPos, 18, { duration: 1.2 });
      } else {
        setHasLocation(false);
      }
      setIsLoading(false);
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
            setAddress(loc.manual_address || "Artisan is here");
            setHasLocation(true);

            if (markerRef.current) markerRef.current.setLatLng(newPos);
            if (mapRef.current) mapRef.current.flyTo(newPos, 18, { duration: 1.2 });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [jobRequestId, isVisible, isArtisan]);

  if (!isVisible) return null;

  if (isLoading) {
    return <div className="h-[450px] flex items-center justify-center bg-gray-100 rounded-2xl">Loading live location...</div>;
  }

  // Artisan Mode UI
  if (isArtisan) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={startSharingLocation}
            disabled={isSharing}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-medium flex-1"
          >
            {isSharing ? "✅ Sharing Live Location" : "📍 Start Sharing My Location"}
          </button>

          {isSharing && (
            <button
              onClick={stopSharing}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
            >
              Stop
            </button>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {hasLocation && (
          <MapContainer
            center={position}
            zoom={18}
            style={{ height: '450px', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            
            <Marker position={position} ref={markerRef}>
              <Popup>
                <div className="text-center">
                  <div className="text-green-600 font-bold text-lg">🟢 LIVE</div>
                  <strong>My Current Location</strong><br />
                  {address}
                </div>
              </Popup>
            </Marker>

            <Circle
              center={position}
              radius={600}
              color="#22c55e"
              fillColor="#22c55e"
              fillOpacity={0.25}
              weight={4}
            />
          </MapContainer>
        )}

        {!hasLocation && !isSharing && (
          <div className="h-[450px] flex flex-col items-center justify-center bg-gray-100 rounded-2xl border border-dashed border-gray-300">
            <div className="text-6xl mb-4 opacity-75">📍</div>
            <h3 className="text-xl font-semibold text-gray-700">Ready to share location</h3>
            <p className="text-gray-500 mt-2">Click the button above to start</p>
          </div>
        )}
      </div>
    );
  }

  // Viewer Mode (Customer)
  if (!hasLocation) {
    return (
      <div className="h-[450px] flex flex-col items-center justify-center bg-gray-100 rounded-2xl border border-dashed border-gray-300">
        <div className="text-6xl mb-4 opacity-75">📍</div>
        <h3 className="text-xl font-semibold text-gray-700">Artisan has not started sharing location</h3>
        <p className="text-gray-500 mt-2 text-center">Waiting for artisan to start GPS sharing...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={position}
      zoom={18}
      style={{ height: '450px', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      <Marker position={position} ref={markerRef}>
        <Popup>
          <div className="text-center">
            <div className="text-green-600 font-bold text-lg">🟢 LIVE</div>
            <strong>Artisan Current Location</strong><br />
            {address || "Moving..."}
          </div>
        </Popup>
      </Marker>

      <Circle
        center={position}
        radius={600}
        color="#22c55e"
        fillColor="#22c55e"
        fillOpacity={0.25}
        weight={4}
      />
    </MapContainer>
  );
}