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
// }

// export default function CustomerLiveMap({ jobRequestId, isVisible }: Props) {
//   const mapRef = useRef<any>(null);
//   const artisanMarkerRef = useRef<any>(null);
//   const customerMarkerRef = useRef<any>(null);
//   const watchIdRef = useRef<number | null>(null);

//   const [artisanPos, setArtisanPos] = useState<[number, number]>([9.0820, 8.6753]);
//   const [customerPos, setCustomerPos] = useState<[number, number] | null>(null);
  
//   const [artisanAddress, setArtisanAddress] = useState("");
//   const [customerAddress, setCustomerAddress] = useState("");
  
//   const [hasArtisanLocation, setHasArtisanLocation] = useState(false);
//   const [hasCustomerLocation, setHasCustomerLocation] = useState(false);
//   const [customerAccuracy, setCustomerAccuracy] = useState(50);

//   const [isSharing, setIsSharing] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [distance, setDistance] = useState<number | null>(null);

//   // Icons
//   const blueIcon = L.divIcon({
//     className: 'custom-marker',
//     html: `<div style="background-color: var(--blue); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><div style="background: white; width: 10px; height: 10px; border-radius: 50%;"></div></div>`,
//     iconSize: [28, 28],
//     iconAnchor: [14, 14],
//   });

//   const orangeIcon = L.divIcon({
//     className: 'custom-marker',
//     html: `<div style="background-color: var(--orange); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><div style="background: white; width: 10px; height: 10px; border-radius: 50%;"></div></div>`,
//     iconSize: [28, 28],
//     iconAnchor: [14, 14],
//   });

//   const calculateDistance = (pos1: [number, number], pos2: [number, number]): number => {
//     const toRad = (x: number) => (x * Math.PI) / 180;
//     const R = 6371;
//     const dLat = toRad(pos2[0] - pos1[0]);
//     const dLon = toRad(pos2[1] - pos1[1]);
//     const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//               Math.cos(toRad(pos1[0])) * Math.cos(toRad(pos2[0])) *
//               Math.sin(dLon/2) * Math.sin(dLon/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return Math.round(R * c * 1000);
//   };

//   // Share Customer Location
//   const startSharingLocation = async () => {
//     if (!navigator.geolocation) {
//       setError("Geolocation is not supported.");
//       return;
//     }

//     setError("");
//     setIsSharing(true);

//     try {
//       const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 0,
//         });
//       });

//       const { latitude, longitude, accuracy } = pos.coords;
//       const newPos: [number, number] = [latitude, longitude];

//       setCustomerPos(newPos);
//       setCustomerAccuracy(accuracy);
//       setHasCustomerLocation(true);

//       let address = "Customer Location";
//       try {
//         const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
//         const data = await res.json();
//         address = data.display_name || address;
//       } catch {}
//       setCustomerAddress(address);

//       // Save as customer using user_type field
//       await supabase.from('artisan_locations').upsert({
//         job_request_id: jobRequestId,
//         latitude,
//         longitude,
//         manual_address: address,
//         user_type: 'customer',           // ← Important
//         timestamp: new Date().toISOString(),
//       });

//       if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

//       watchIdRef.current = navigator.geolocation.watchPosition(
//         async (currentPos) => {
//           const { latitude: lat, longitude: lng, accuracy: acc } = currentPos.coords;
//           const updatedPos: [number, number] = [lat, lng];

//           setCustomerPos(updatedPos);
//           setCustomerAccuracy(acc);

//           if (mapRef.current) mapRef.current.flyTo(updatedPos, 18);

//           await supabase.from('artisan_locations').upsert({
//             job_request_id: jobRequestId,
//             latitude: lat,
//             longitude: lng,
//             manual_address: address,
//             user_type: 'customer',
//             timestamp: new Date().toISOString(),
//           });
//         },
//         (err) => console.error(err),
//         { enableHighAccuracy: true }
//       );
//     } catch (err: any) {
//       setError(err.code === 1 ? "Location permission denied" : "Failed to get location");
//       setIsSharing(false);
//     }
//   };

//   const stopSharing = () => {
//     if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
//     watchIdRef.current = null;
//     setIsSharing(false);
//   };

//   // Real-time updates
//   useEffect(() => {
//     if (!isVisible || !jobRequestId) return;

//     const fetchLocations = async () => {
//       setIsLoading(true);

//       const { data } = await supabase
//         .from('artisan_locations')
//         .select('*')
//         .eq('job_request_id', jobRequestId)
//         .order('timestamp', { ascending: false });

//       // Separate artisan and customer
//       const artisanData = data?.find(item => item.user_type !== 'customer');
//       const customerData = data?.find(item => item.user_type === 'customer');

//       if (artisanData) {
//         setArtisanPos([artisanData.latitude, artisanData.longitude]);
//         setArtisanAddress(artisanData.manual_address || "");
//         setHasArtisanLocation(true);
//       }

//       if (customerData) {
//         setCustomerPos([customerData.latitude, customerData.longitude]);
//         setCustomerAddress(customerData.manual_address || "");
//         setHasCustomerLocation(true);
//       }

//       setIsLoading(false);
//     };

//     fetchLocations();

//     const channel = supabase.channel(`customer-map-${jobRequestId}`)
//       .on('postgres_changes', { 
//         event: '*', 
//         schema: 'public', 
//         table: 'artisan_locations', 
//         filter: `job_request_id=eq.${jobRequestId}` 
//       }, (payload) => {
//         const loc = payload.new as any;
//         if (!loc) return;

//         if (loc.user_type === 'customer') {
//           setCustomerPos([loc.latitude, loc.longitude]);
//           setCustomerAddress(loc.manual_address || "");
//           setHasCustomerLocation(true);
//         } else {
//           setArtisanPos([loc.latitude, loc.longitude]);
//           setArtisanAddress(loc.manual_address || "");
//           setHasArtisanLocation(true);
//         }
//       })
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//       if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
//     };
//   }, [jobRequestId, isVisible]);

//   if (!isVisible) return null;
//   if (isLoading) return <div className="h-[450px] flex items-center justify-center bg-gray-100 rounded-2xl">Loading map...</div>;

//   return (
//     <div className="space-y-4">
//       <div className="flex gap-3">
//         <button
//           onClick={startSharingLocation}
//           disabled={isSharing}
//           className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium"
//         >
//           {isSharing ? "✅ Sharing My Location" : "📍 Share My Location to Artisan"}
//         </button>

//         {isSharing && (
//           <button onClick={stopSharing} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl">
//             Stop
//           </button>
//         )}
//       </div>

//       {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl">{error}</div>}

//       <MapContainer
//         center={customerPos || artisanPos}
//         zoom={17}
//         style={{ height: '450px', width: '100%' }}
//         ref={mapRef}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; OpenStreetMap contributors'
//         />

//         {hasArtisanLocation && (
//           <Marker position={artisanPos} ref={artisanMarkerRef} icon={blueIcon}>
//             <Popup>🟢 ARTISAN</Popup>
//           </Marker>
//         )}

//         {hasCustomerLocation && customerPos && (
//           <>
//             <Marker position={customerPos} ref={customerMarkerRef} icon={orangeIcon}>
//               <Popup>📍 YOU (CUSTOMER)</Popup>
//             </Marker>
//             <Circle
//               center={customerPos}
//               radius={customerAccuracy}
//               color="#f97316"
//               fillColor="#f97316"
//               fillOpacity={0.2}
//             />
//           </>
//         )}
//       </MapContainer>
//     </div>
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
const Circle = dynamic(() => import('react-leaflet').then(m => m.Circle), { ssr: false });

interface Props {
  jobRequestId: string;
  isVisible: boolean;
}

export default function CustomerLiveMap({ jobRequestId, isVisible }: Props) {
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
  const [customerAccuracy, setCustomerAccuracy] = useState(50);

  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [shareableLink, setShareableLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Icons
  const blueIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: var(--blue); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><div style="background: white; width: 10px; height: 10px; border-radius: 50%;"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const orangeIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: var(--orange); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><div style="background: white; width: 10px; height: 10px; border-radius: 50%;"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

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

  // === NEW: Generate Shareable Link ===
  const generateShareableLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/shared-live-map/${jobRequestId}`;
    setShareableLink(link);
    
    navigator.clipboard.writeText(link);
    setCopied(true);
    
    setTimeout(() => setCopied(false), 2000);
  };

  // Share Customer Location
  const startSharingLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }

    setError("");
    setIsSharing(true);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = pos.coords;
      const newPos: [number, number] = [latitude, longitude];

      setCustomerPos(newPos);
      setCustomerAccuracy(accuracy);
      setHasCustomerLocation(true);

      let address = "Customer Location";
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        address = data.display_name || address;
      } catch {}
      setCustomerAddress(address);

      await supabase.from('artisan_locations').upsert({
        job_request_id: jobRequestId,
        latitude,
        longitude,
        manual_address: address,
        user_type: 'customer',
        timestamp: new Date().toISOString(),
      });

      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (currentPos) => {
          const { latitude: lat, longitude: lng, accuracy: acc } = currentPos.coords;
          const updatedPos: [number, number] = [lat, lng];

          setCustomerPos(updatedPos);
          setCustomerAccuracy(acc);

          if (mapRef.current) mapRef.current.flyTo(updatedPos, 18);

          await supabase.from('artisan_locations').upsert({
            job_request_id: jobRequestId,
            latitude: lat,
            longitude: lng,
            manual_address: address,
            user_type: 'customer',
            timestamp: new Date().toISOString(),
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    } catch (err: any) {
      setError(err.code === 1 ? "Location permission denied" : "Failed to get location");
      setIsSharing(false);
    }
  };

  const stopSharing = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsSharing(false);
  };

  // Real-time updates
  useEffect(() => {
    if (!isVisible || !jobRequestId) return;

    const fetchLocations = async () => {
      setIsLoading(true);

      const { data } = await supabase
        .from('artisan_locations')
        .select('*')
        .eq('job_request_id', jobRequestId)
        .order('timestamp', { ascending: false });

      const artisanData = data?.find(item => item.user_type !== 'customer');
      const customerData = data?.find(item => item.user_type === 'customer');

      if (artisanData) {
        setArtisanPos([artisanData.latitude, artisanData.longitude]);
        setArtisanAddress(artisanData.manual_address || "");
        setHasArtisanLocation(true);
      }

      if (customerData) {
        setCustomerPos([customerData.latitude, customerData.longitude]);
        setCustomerAddress(customerData.manual_address || "");
        setHasCustomerLocation(true);
      }

      setIsLoading(false);
    };

    fetchLocations();

    const channel = supabase.channel(`customer-map-${jobRequestId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'artisan_locations', 
        filter: `job_request_id=eq.${jobRequestId}` 
      }, (payload) => {
        const loc = payload.new as any;
        if (!loc) return;

        if (loc.user_type === 'customer') {
          setCustomerPos([loc.latitude, loc.longitude]);
          setCustomerAddress(loc.manual_address || "");
          setHasCustomerLocation(true);
        } else {
          setArtisanPos([loc.latitude, loc.longitude]);
          setArtisanAddress(loc.manual_address || "");
          setHasArtisanLocation(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [jobRequestId, isVisible]);

  if (!isVisible) return null;
  if (isLoading) return <div className="h-[450px] flex items-center justify-center bg-gray-100 rounded-2xl">Loading map...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={startSharingLocation}
          disabled={isSharing}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium"
        >
          {isSharing ? "✅ Sharing My Location" : "📍 Share My Location to Artisan"}
        </button>

        {isSharing && (
          <button onClick={stopSharing} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl">
            Stop
          </button>
        )}

        {/* === NEW: Shareable Link Button === */}
        <button
          onClick={generateShareableLink}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2"
        >
          🔗 {copied ? "Copied!" : "Share Live Link"}
        </button>
      </div>

      {/* Shareable Link Display */}
      {shareableLink && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-sm">
          <p className="font-medium text-green-800 mb-1">Share this link with others:</p>
          <p className="font-mono break-all text-green-700">{shareableLink}</p>
          <p className="text-xs text-green-600 mt-2">Anyone with this link can view live movement in real-time.</p>
        </div>
      )}

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl">{error}</div>}

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

        {hasArtisanLocation && (
          <Marker position={artisanPos} ref={artisanMarkerRef} icon={blueIcon}>
            <Popup>🟢 ARTISAN</Popup>
          </Marker>
        )}

        {hasCustomerLocation && customerPos && (
          <>
            <Marker position={customerPos} ref={customerMarkerRef} icon={orangeIcon}>
              <Popup>📍 YOU (CUSTOMER)</Popup>
            </Marker>
            <Circle
              center={customerPos}
              radius={customerAccuracy}
              color="#f97316"
              fillColor="#f97316"
              fillOpacity={0.2}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}