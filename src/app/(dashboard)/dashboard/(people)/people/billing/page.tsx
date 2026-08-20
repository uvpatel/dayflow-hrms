import { SiteHeader } from '@/components/main/site-header'
import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return (
    <div className="flex  max-w-300 h-screen items-center justify-center bg-background">
      <SiteHeader />  
      <h1 className="text-2xl font-bold mb-4">Pricing</h1>
      <PricingTable/>
    </div>
  )
}