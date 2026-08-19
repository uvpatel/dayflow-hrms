'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { Roles } from '@/app/types/globals'
import { revalidatePath } from 'next/cache'

export async function setRole(formData: FormData): Promise<void> {
  const { sessionClaims } = await auth()

  // Check that the user trying to set the Role is an admin
  if (sessionClaims?.metadata?.role !== 'admin') {
    return
  }

  const client = await clerkClient()
  const id = formData.get('id') as string
  const role = formData.get('role') as Roles

  try {
    await client.users.updateUserMetadata(id, {
      publicMetadata: { role },
    })
    revalidatePath('/admin')
  } catch (err) {
    console.error(err)
  }
}

export async function removeRole(formData: FormData): Promise<void> {
  const { sessionClaims } = await auth()

  // Check that the user trying to remove the Role is an admin
  if (sessionClaims?.metadata?.role !== 'admin') {
    return
  }

  const client = await clerkClient()
  const id = formData.get('id') as string

  try {
    await client.users.updateUserMetadata(id, {
      publicMetadata: { role: null },
    })
    revalidatePath('/admin')
  } catch (err) {
    console.error(err)
  }
}