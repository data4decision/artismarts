import { supabase } from '@/lib/supabase'

export const createNotification = async ({
  type,
  title,
  message,
  job_id = null,
}: {
  type: string
  title: string
  message: string
  job_id?: string | null
}) => {
  const { error } = await supabase.from('notifications').insert({
    type,
    title,
    message,
    job_id,
    read: false,
  })

  if (error) console.error('Notification creation failed:', error)
}

// Improved: New Job Request with Customer Name
export const notifyNewJobRequest = async (
  jobId: string, 
  jobTitle: string, 
  customerFirstName: string, 
  customerLastName?: string
) => {
  const customerName = customerLastName 
    ? `${customerFirstName} ${customerLastName}` 
    : customerFirstName

  await createNotification({
    type: 'new_job_request',
    title: 'New Job Request',
    message: `Customer ${customerName} sent a new job request: "${jobTitle}"`,
    job_id: jobId,
  })
}

// Other helpers (keep them as they are)
export const notifyJobActive = async (jobId: string, jobTitle: string) => {
  await createNotification({
    type: 'job_active',
    title: 'Job Now Active',
    message: `Job "${jobTitle}" has been assigned and is now active`,
    job_id: jobId,
  })
}

export const notifyJobCompleted = async (jobId: string, jobTitle: string) => {
  await createNotification({
    type: 'job_completed',
    title: 'Job Completed',
    message: `Customer has marked job "${jobTitle}" as completed`,
    job_id: jobId,
  })
}

export const notifyNewArtisanVerification = async (artisanName: string) => {
  await createNotification({
    type: 'new_artisan_verification',
    title: 'New Artisan Verification',
    message: `${artisanName} has submitted verification documents`,
  })
}

export const notifyDisputedJob = async (jobId: string, jobTitle: string) => {
  await createNotification({
    type: 'new_disputed_job',
    title: 'Dispute Raised',
    message: `A dispute has been raised for job: ${jobTitle}`,
    job_id: jobId,
  })
}

export const notifyJobAcceptedByArtisan = async (
  jobId: string,
  jobTitle: string,
  artisanFirstName: string,
  artisanLastName?: string
) => {
  const artisanName = artisanLastName 
    ? `${artisanFirstName} ${artisanLastName}` 
    : artisanFirstName

  await createNotification({
    type: 'job_accepted',
    title: 'Job Accepted by Artisan',
    message: `Artisan ${artisanName} accepted the job: "${jobTitle}"`,
    job_id: jobId,
  })
}