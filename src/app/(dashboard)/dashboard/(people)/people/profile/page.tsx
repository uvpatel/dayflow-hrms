import { UserProfile } from '@clerk/nextjs'
import React from 'react'

export default function UserProfilePage() {
  return (
    <div className="flex justify-center items-center h-screen ">
        <UserProfile />
    </div>
  )
}
