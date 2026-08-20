import { DataTable } from '@/components/main/data-table'
import React from 'react'
import data from "../../../data.json"
import { SiteHeader } from '@/components/main/site-header'



export default function DepartmentsPage() {
  return (
    <div>
      <SiteHeader />
        <DataTable data={data} />
    </div>
  )
}
