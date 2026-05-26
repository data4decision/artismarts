// "use client";

// import { useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic';
// import { supabase } from '@/lib/supabase';
// import L from 'leaflet';

// // Fix Leaflet default icons in Next.js
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
// const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
// const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// interface ArtisanTrackerMapProps {
//   jobRequestId: string;
// }

// export default function ArtisanTrackerMap({ jobRequestId }: ArtisanTrackerMapProps) {
//   const mapRef = useRef<any>(null);
//   const markerRef = useRef<any>(null);

//   useEffect(() => {
//     const channel = supabase
//       .channel(`location-${jobRequestId}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'artisan_locations',
//           filter: `job_request_id=eq.${jobRequestId}`,
//         },
//         (payload) => {
//           const { latitude, longitude } = payload.new;
          
//           if (mapRef.current && markerRef.current) {
//             markerRef.current.setLatLng([latitude, longitude]);
//             mapRef.current.flyTo([latitude, longitude], 15, { duration: 1 });
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [jobRequestId]);

//   // Initial load
//   // ... fetch latest location and set initial position

//   return (
//     <div className="h-[500px] w-full rounded-lg overflow-hidden border">
//       <MapContainer
//         center={[9.0820, 8.6753]} // Default Nigeria center
//         zoom={13}
//         style={{ height: '100%', width: '100%' }}
//         ref={mapRef}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; OpenStreetMap contributors'
//         />
//         <Marker position={[9.0820, 8.6753]} ref={markerRef} />
//       </MapContainer>
//     </div>
//   );
// }