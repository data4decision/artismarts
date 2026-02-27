// // utils/auth.ts (or in your supabase client file)
// let isAuthCheckInProgress = false

// export async function safeGetUser() {
//   if (isAuthCheckInProgress) {
//     // Wait a bit instead of fighting for the lock
//     await new Promise(r => setTimeout(r, 500))
//     return supabase.auth.getUser()
//   }

//   isAuthCheckInProgress = true
//   try {
//     return await supabase.auth.getUser()
//   } finally {
//     isAuthCheckInProgress = false
//   }
// }