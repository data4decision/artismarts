// app/dashboard/artisan/reviews/page.tsx
// SERVER COMPONENT – NO custom props on default export

// import ArtisanReviewsList from '@/components/review/ArtisanReviewsList'
// import { cookies } from 'next/headers'
// import { redirect } from 'next/navigation'
// import { createServerSupabaseClient } from '@/lib/supabase/server' // use your real path

// export default async function ArtisanReviewsPage() {
//   const cookieStore = cookies()
//   const supabase = await createServerSupabaseClient(cookieStore)

//   const { data: { user } } = await supabase.auth.getUser()

//   if (!user) {
//     redirect('/login?redirect=/dashboard/artisan/reviews')
//   }

//   const artisanId = user.id // most common: artisan_id = auth user id

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-5xl">
//       <h1 className="text-3xl font-bold mb-8">Your Customer Reviews</h1>
//       <ArtisanReviewsList artisanId={artisanId} />
//     </div>
//   )
// }

import React from 'react'

const page = () => {
  return (
    <div>
      <p>Review</p>
    </div>
  )
}

export default page