// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import dynamic from 'next/dynamic';
// import L from 'leaflet';
// import { supabase } from '@/lib/supabase';

// const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
// const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
// const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
// const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
// const Circle = dynamic(() => import('react-leaflet').then(m => m.Circle), { ssr: false });

// interface Props {
//   jobRequestId: string;
//   isVisible: boolean;
//   // Optional: if you want to distinguish between viewer and sharer
//   isArtisan?: boolean;
// }

// export default function ArtisanLiveMap({ jobRequestId, isVisible, isArtisan = false }: Props) {
//   const mapRef = useRef<any>(null);
//   const markerRef = useRef<any>(null);
//   const watchIdRef = useRef<number | null>(null);
//   const channelRef = useRef<any>(null);

//   const [position, setPosition] = useState<[number, number]>([9.0820, 8.6753]); // Nigeria center fallback
//   const [address, setAddress] = useState<string>("");
//   const [hasLocation, setHasLocation] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSharing, setIsSharing] = useState<boolean>(false);
//   const [error, setError] = useState<string>("");

//   // Fix Leaflet icons
//   useEffect(() => {
//     delete (L.Icon.Default.prototype as any)._getIconUrl;
//     L.Icon.Default.mergeOptions({
//       iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//       iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//       shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
//     });
//   }, []);

//   // ==================== GET CURRENT LOCATION & SHARE ====================
//   const startSharingLocation = async () => {
//     if (!navigator.geolocation) {
//       setError("Geolocation is not supported by your browser.");
//       return;
//     }

//     setError("");
//     setIsSharing(true);

//     try {
//       // First get current position
//       const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0,
//         });
//       });

//       const { latitude, longitude } = pos.coords;
//       const newPos: [number, number] = [latitude, longitude];

//       setPosition(newPos);
//       setHasLocation(true);

//       // Optional: Reverse geocode (you can use a free service or Nominatim)
//       try {
//         const res = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
//         );
//         const data = await res.json();
//         setAddress(data.display_name || "Current Location");
//       } catch {
//         setAddress("Current Location");
//       }

//       // Send to Supabase
//       await supabase.from('artisan_locations').upsert({
//         job_request_id: jobRequestId,
//         latitude,
//         longitude,
//         manual_address: address,
//         timestamp: new Date().toISOString(),
//       }, { onConflict: 'job_request_id' });

//       // Start live watching
//       if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

//       watchIdRef.current = navigator.geolocation.watchPosition(
//         async (currentPos) => {
//           const { latitude: lat, longitude: lng } = currentPos.coords;
//           const updatedPos: [number, number] = [lat, lng];

//           setPosition(updatedPos);

//           if (markerRef.current) markerRef.current.setLatLng(updatedPos);
//           if (mapRef.current) mapRef.current.flyTo(updatedPos, 18, { duration: 1 });

//           // Update Supabase in real-time
//           await supabase.from('artisan_locations').upsert({
//             job_request_id: jobRequestId,
//             latitude: lat,
//             longitude: lng,
//             manual_address: address,
//             timestamp: new Date().toISOString(),
//           });
//         },
//         (err) => {
//           console.error(err);
//           setError("Failed to watch location. " + err.message);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 0,
//         }
//       );
//     } catch (err: any) {
//       setError(err.message || "Failed to get location. Please allow location permission.");
//       setIsSharing(false);
//     }
//   };

//   const stopSharing = () => {
//     if (watchIdRef.current) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//       watchIdRef.current = null;
//     }
//     setIsSharing(false);
//     setError("");
//     // Optional: you can delete or mark as stopped in DB
//   };

//   // ==================== VIEW MODE (Customer seeing artisan) ====================
//   useEffect(() => {
//     if (!isVisible || !jobRequestId) {
//       setIsLoading(false);
//       return;
//     }

//     if (isArtisan) {
//       setIsLoading(false);
//       return; // Artisan mode uses manual start button
//     }

//     const fetchLatest = async () => {
//       setIsLoading(true);
//       const { data } = await supabase
//         .from('artisan_locations')
//         .select('latitude, longitude, manual_address, timestamp')
//         .eq('job_request_id', jobRequestId)
//         .order('timestamp', { ascending: false })
//         .limit(1)
//         .single();

//       if (data?.latitude && data?.longitude) {
//         const newPos: [number, number] = [data.latitude, data.longitude];
//         setPosition(newPos);
//         setAddress(data.manual_address || "Artisan is here");
//         setHasLocation(true);

//         if (markerRef.current) markerRef.current.setLatLng(newPos);
//         if (mapRef.current) mapRef.current.flyTo(newPos, 18, { duration: 1.2 });
//       } else {
//         setHasLocation(false);
//       }
//       setIsLoading(false);
//     };

//     fetchLatest();

//     const channel = supabase
//       .channel(`live-map-${jobRequestId}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'artisan_locations',
//           filter: `job_request_id=eq.${jobRequestId}`,
//         },
//         (payload) => {
//           const loc = payload.new as any;
//           if (loc?.latitude && loc?.longitude) {
//             const newPos: [number, number] = [loc.latitude, loc.longitude];
//             setPosition(newPos);
//             setAddress(loc.manual_address || "Artisan is here");
//             setHasLocation(true);

//             if (markerRef.current) markerRef.current.setLatLng(newPos);
//             if (mapRef.current) mapRef.current.flyTo(newPos, 18, { duration: 1.2 });
//           }
//         }
//       )
//       .subscribe();

//     channelRef.current = channel;

//     return () => {
//       if (channelRef.current) {
//         supabase.removeChannel(channelRef.current);
//       }
//       if (watchIdRef.current) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//     };
//   }, [jobRequestId, isVisible, isArtisan]);

//   if (!isVisible) return null;

//   if (isLoading) {
//     return <div className="h-[450px] flex items-center justify-center bg-gray-100 rounded-2xl">Loading live location...</div>;
//   }

//   // Artisan Mode UI
//   if (isArtisan) {
//     return (
//       <div className="space-y-4">
//         <div className="flex gap-3">
//           <button
//             onClick={startSharingLocation}
//             disabled={isSharing}
//             className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-medium flex-1"
//           >
//             {isSharing ? "✅ Sharing Live Location" : "📍 Start Sharing My Location"}
//           </button>

//           {isSharing && (
//             <button
//               onClick={stopSharing}
//               className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
//             >
//               Stop
//             </button>
//           )}
//         </div>

//         {error && <p className="text-red-600 text-sm">{error}</p>}

//         {hasLocation && (
//           <MapContainer
//             center={position}
//             zoom={18}
//             style={{ height: '450px', width: '100%' }}
//             ref={mapRef}
//           >
//             <TileLayer
//               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//               attribution='&copy; OpenStreetMap contributors'
//             />
            
//             <Marker position={position} ref={markerRef}>
//               <Popup>
//                 <div className="text-center">
//                   <div className="text-green-600 font-bold text-lg">🟢 LIVE</div>
//                   <strong>My Current Location</strong><br />
//                   {address}
//                 </div>
//               </Popup>
//             </Marker>

//             <Circle
//               center={position}
//               radius={600}
//               color="#22c55e"
//               fillColor="#22c55e"
//               fillOpacity={0.25}
//               weight={4}
//             />
//           </MapContainer>
//         )}

//         {!hasLocation && !isSharing && (
//           <div className="h-[450px] flex flex-col items-center justify-center bg-gray-100 rounded-2xl border border-dashed border-gray-300">
//             <div className="text-6xl mb-4 opacity-75">📍</div>
//             <h3 className="text-xl font-semibold text-gray-700">Ready to share location</h3>
//             <p className="text-gray-500 mt-2">Click the button above to start</p>
//           </div>
//         )}
//       </div>
//     );
//   }

//   // Viewer Mode (Customer)
//   if (!hasLocation) {
//     return (
//       <div className="h-[450px] flex flex-col items-center justify-center bg-gray-100 rounded-2xl border border-dashed border-gray-300">
//         <div className="text-6xl mb-4 opacity-75">📍</div>
//         <h3 className="text-xl font-semibold text-gray-700">Artisan has not started sharing location</h3>
//         <p className="text-gray-500 mt-2 text-center">Waiting for artisan to start GPS sharing...</p>
//       </div>
//     );
//   }

//   return (
//     <MapContainer
//       center={position}
//       zoom={18}
//       style={{ height: '450px', width: '100%' }}
//       ref={mapRef}
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution='&copy; OpenStreetMap contributors'
//       />
      
//       <Marker position={position} ref={markerRef}>
//         <Popup>
//           <div className="text-center">
//             <div className="text-green-600 font-bold text-lg">🟢 LIVE</div>
//             <strong>Artisan Current Location</strong><br />
//             {address || "Moving..."}
//           </div>
//         </Popup>
//       </Marker>

//       <Circle
//         center={position}
//         radius={600}
//         color="#22c55e"
//         fillColor="#22c55e"
//         fillOpacity={0.25}
//         weight={4}
//       />
//     </MapContainer>
//   );
// }


'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

interface LocationPayload {
  latitude: number;
  longitude: number;
  manual_address?: string;
  address?: string;
  timestamp?: string;
}

interface Props {
  jobRequestId: string;
  isVisible: boolean;
  userType: 'artisan' | 'customer';
}

export default function LiveJobMap({ jobRequestId, isVisible, userType }: Props) {
  const mapRef = useRef<any>(null);
  const artisanMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const [artisanPos, setArtisanPos] = useState<[number, number]>([9.0820, 8.6753]);
  const [customerPos, setCustomerPos] = useState<[number, number] | null>(null);
  
  const [artisanAddress, setArtisanAddress] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  
  const [hasArtisanLocation, setHasArtisanLocation] = useState(false);
  const [hasCustomerLocation, setHasCustomerLocation] = useState(false);
  
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [distance, setDistance] = useState<number | null>(null);

  // Custom Colored Markers
  const createCustomIcon = (color: string) => L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; 
                  border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); 
                  display: flex; align-items: center; justify-content: center;">
        <div style="background: white; width: 10px; height: 10px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const blueIcon = createCustomIcon('var(--blue)');
  const orangeIcon = createCustomIcon('var(--orange)');

  const calculateDistance = (pos1: [number, number], pos2: [number, number]): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(pos2[0] - pos1[0]);
    const dLon = toRad(pos2[1] - pos1[1]);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(pos1[0])) * Math.cos(toRad(pos2[0])) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1000);
  };

  // ==================== START SHARING LOCATION ====================
  const startSharingLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setError("");
    setIsSharing(true);

    try {
      console.log(`[${userType.toUpperCase()}] Requesting location...`);

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = pos.coords;
      console.log(`[${userType.toUpperCase()}] Location received:`, latitude, longitude);

      const newPos: [number, number] = [latitude, longitude];
      const tableName = userType === 'customer' ? 'customer_locations' : 'artisan_locations';
      const addressField = userType === 'customer' ? 'address' : 'manual_address';

      let address = userType === 'customer' ? "Customer Location" : "Artisan Location";

      // Reverse Geocoding
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await res.json();
        address = data.display_name || address;
      } catch (e) {
        console.warn("Reverse geocoding failed");
      }

      // Update local state
      if (userType === 'customer') {
        setCustomerPos(newPos);
        setCustomerAddress(address);
        setHasCustomerLocation(true);
      } else {
        setArtisanPos(newPos);
        setArtisanAddress(address);
        setHasArtisanLocation(true);
      }

      // Save to database
      const { error: upsertError } = await supabase.from(tableName).upsert({
        job_request_id: jobRequestId,
        latitude,
        longitude,
        [addressField]: address,
        timestamp: new Date().toISOString(),
      });

      if (upsertError) console.error("Upsert error:", upsertError);

      // Start live tracking
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (currentPos) => {
          const { latitude: lat, longitude: lng } = currentPos.coords;
          const updatedPos: [number, number] = [lat, lng];

          if (userType === 'customer') setCustomerPos(updatedPos);
          else setArtisanPos(updatedPos);

          if (mapRef.current) mapRef.current.flyTo(updatedPos, 18);

          await supabase.from(tableName).upsert({
            job_request_id: jobRequestId,
            latitude: lat,
            longitude: lng,
            [addressField]: address,
            timestamp: new Date().toISOString(),
          });
        },
        (err) => console.error("Watch error:", err),
        { enableHighAccuracy: true }
      );
    } catch (err: any) {
      console.error("Location Error:", err);
      
      let msg = "Failed to get location.";
      if (err.code === 1) msg = "Location permission denied. Please allow access in browser settings.";
      else if (err.code === 2) msg = "Location unavailable. Turn on GPS.";
      else if (err.code === 3) msg = "Location request timed out. Try again.";
      else if (err.message) msg = err.message;

      setError(msg);
      setIsSharing(false);
    }
  };

  const stopSharing = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  };

  // ==================== FETCH & REAL-TIME LISTENING ====================
  useEffect(() => {
    if (!isVisible || !jobRequestId) return;

    const fetchLocations = async () => {
      setIsLoading(true);

      const [artisanRes, customerRes] = await Promise.all([
        supabase.from('artisan_locations').select('*').eq('job_request_id', jobRequestId).order('timestamp', { ascending: false }).limit(1).single(),
        supabase.from('customer_locations').select('*').eq('job_request_id', jobRequestId).order('timestamp', { ascending: false }).limit(1).single()
      ]);

      if (artisanRes.data) {
        setArtisanPos([artisanRes.data.latitude, artisanRes.data.longitude]);
        setArtisanAddress(artisanRes.data.manual_address || "");
        setHasArtisanLocation(true);
      }

      if (customerRes.data) {
        setCustomerPos([customerRes.data.latitude, customerRes.data.longitude]);
        setCustomerAddress(customerRes.data.address || "");
        setHasCustomerLocation(true);
      } else {
        setCustomerPos(null);
        setHasCustomerLocation(false);
      }

      setIsLoading(false);
    };

    fetchLocations();

    const channel = supabase.channel(`live-job-${jobRequestId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artisan_locations', filter: `job_request_id=eq.${jobRequestId}` }, (payload) => {
        const loc = payload.new as LocationPayload;
        if (loc?.latitude && loc?.longitude) {
          setArtisanPos([loc.latitude, loc.longitude]);
          setArtisanAddress(loc.manual_address || "");
          setHasArtisanLocation(true);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_locations', filter: `job_request_id=eq.${jobRequestId}` }, (payload) => {
        const loc = payload.new as LocationPayload;
        if (loc?.latitude && loc?.longitude) {
          setCustomerPos([loc.latitude, loc.longitude]);
          setCustomerAddress(loc.address || "");
          setHasCustomerLocation(true);
        } else {
          setCustomerPos(null);
          setHasCustomerLocation(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [jobRequestId, isVisible]);

  // ==================== DISTANCE CALCULATION ====================
  useEffect(() => {
    if (hasArtisanLocation && hasCustomerLocation && customerPos) {
      setDistance(calculateDistance(artisanPos, customerPos));
    } else {
      setDistance(null);
    }
  }, [artisanPos, customerPos, hasArtisanLocation, hasCustomerLocation]);

  if (!isVisible) return null;
  if (isLoading) return <div className="h-[450px] flex items-center justify-center bg-gray-100 rounded-2xl">Loading map...</div>;

  return (
    <div className="space-y-4">
      {/* Share Button */}
      <div className="flex gap-3">
        <button
          onClick={startSharingLocation}
          disabled={isSharing}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium"
        >
          {isSharing ? "✅ Sharing Live Location" : `📍 Share My Location (${userType})`}
        </button>

        {isSharing && (
          <button onClick={stopSharing} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl">
            Stop
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Distance */}
      {distance !== null && (
        <p className="text-center text-sm font-medium text-gray-700">
          📏 Distance: <span className="text-blue-600">{(distance / 1000).toFixed(2)} km</span>
        </p>
      )}

      {/* Map */}
      <MapContainer
        center={customerPos || artisanPos}
        zoom={17}
        style={{ height: '450px', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Artisan Marker - Blue */}
        {hasArtisanLocation && (
          <Marker position={artisanPos} ref={artisanMarkerRef} icon={blueIcon}>
            <Popup>
              <div className="text-center">
                <div className="text-blue-600 font-bold text-lg">🟢 ARTISAN</div>
                {artisanAddress || "Moving..."}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer Marker - Orange */}
        {hasCustomerLocation && customerPos && (
          <Marker position={customerPos} ref={customerMarkerRef} icon={orangeIcon}>
            <Popup>
              <div className="text-center">
                <div className="text-orange-600 font-bold text-lg">📍 CUSTOMER</div>
                {customerAddress}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}