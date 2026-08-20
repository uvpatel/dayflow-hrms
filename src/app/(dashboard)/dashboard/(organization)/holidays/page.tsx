 "use client";                                                                                   
                                                                                                    
import { SiteHeader } from "@/components/main/site-header";
    import React, { useEffect, useState } from "react";                                             
                                                                                                    
    interface AttendanceRecord {                                                                    
      id: number;                                                                                   
      userId: string;                                                                               
      date: string;                                                                                 
      checkInTime?: string | null;                                                                  
      checkOutTime?: string | null;                                                                 
      status: string;                                                                               
    }                                                                                               
                                                                                                    
    export default function HolidayPage() {                                                      
      const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);                       
      const [loading, setLoading] = useState(true);                                                 
      const [error, setError] = useState<string | null>(null);                                      
                                                                                                    
      useEffect(() => {                                                                             
        const fetchData = async () => {                                                             
          try {                                                                                     
            setLoading(true);                                                                       
            // Correct endpoint: /api/v1/attendence (or /api/v1/attendance)                         
            const response = await fetch("/api/v1/attendence");                                     
            if (!response.ok) {                                                                     
              throw new Error(`HTTP error! status: ${response.status}`);                            
            }                                                                                       
            const result = await response.json();                                                   
            if (result.success) {                                                                   
              setAttendances(result.data || []);                                                    
            } else {                                                                                
              setError(result.error || "Failed to fetch attendance");                               
            }                                                                                       
          } catch (err) {                                                                           
            console.error("Error fetching data:", err);                                             
            setError(err instanceof Error ? err.message : "An error occurred");                     
          } finally {                                                                               
            setLoading(false);                                                                      
          }                                                                                         
        };                                                                                          
                                                                                                    
        fetchData();                                                                                
      }, []);                                                                                       
  
      return (
        <div className="p-6">
          <SiteHeader />
          <h1 className="text-2xl font-bold mb-4">Holiday Page</h1>
          {loading && <p>Loading holidays...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!loading && !error && (
            <ul className="space-y-2">
              {attendances.map((item) => (
                <li key={item.id} className="p-3 border rounded">
                  User: {item.userId} | Date: {new Date(item.date).toLocaleDateString()} | Status:  
  {item.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
