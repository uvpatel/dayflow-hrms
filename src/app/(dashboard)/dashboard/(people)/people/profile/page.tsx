import { SiteHeader } from '@/components/main/site-header'
import { UserProfile } from '@clerk/nextjs'
import React from 'react'

export default function UserProfilePage() {
  return (
    <div className="flex justify-center flex-col items-center h-screen ">
      <div className="flex justify-center items-center w-full h-full">
      
      </div>
        <UserProfile />
    </div>
  )
}
