import Image from 'next/image'
import React from 'react'

export default function NotFoundPage() {
  return (
    <div className='flex flex-col justify-center items-center min-h-screen bg-muted p-6 md:p-10'>
        <Image src="/notfound.png" alt="404 Not Found" width={600} height={400} className='flex justify-center items-center ' />
      
        </div>
  )
}
