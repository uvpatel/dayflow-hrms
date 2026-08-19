import { DataTable } from '@/components/main/data-table'
import React from 'react'
import data from "../../../data.json"



export default function DepartmentsPage() {
  return (
    <div>
        <DataTable data={data} />
    </div>
  )
}
