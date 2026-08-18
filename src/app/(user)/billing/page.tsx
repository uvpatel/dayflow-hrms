import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return (
    <div className="flex  max-w-300 h-screen items-center justify-center bg-background">
      <PricingTable/>
    </div>
  )
}