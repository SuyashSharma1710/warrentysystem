'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TechnicianDashboard() {
  const [requests, setRequests] = useState<any[]>([])
  const [completedJobs, setCompletedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    const { data: reqData } = await supabase
      .from('service_requests')
      .select('*, warranties(barcode)')
      .eq('status', 'assigned')
      .eq('assigned_tech_id', session.user.id)
      .order('created_at', { ascending: false })
      
    if (reqData) setRequests(reqData)

    const { data: completedData } = await supabase
      .from('service_requests')
      .select('*, warranties(barcode)')
      .eq('assigned_tech_id', session.user.id)
      .eq('status', 'closed')
      .order('created_at', { ascending: false })

    if (completedData) setCompletedJobs(completedData)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function markAsDone(id: string, expectedOtp: string, formData: FormData) {
    const enteredOtp = formData.get('otp') as string
    setMsg('')
    
    if (enteredOtp !== expectedOtp) {
      alert('Invalid OTP. Ask the customer for the correct 4-digit code.')
      return
    }
    
    const { error } = await supabase
      .from('service_requests')
      .update({
        status: 'closed'
      })
      .eq('id', id)
      
    if (error) {
      alert(error.message)
    } else {
      alert('Service marked as closed successfully!')
      fetchData()
    }
  }

  return (
    <DashboardLayout title="Technician Tool" subtitle="View assigned jobs and submit completion OTPs.">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Current Assignments</p>
            <p className="text-3xl font-bold text-indigo-600">{requests.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Successfully Completed</p>
            <p className="text-3xl font-bold text-indigo-600">{completedJobs.length}</p>
          </div>
        </div>
        
        {msg && <div className="bg-emerald-50 text-emerald-700 p-4 border border-emerald-200 rounded-xl font-bold shadow-sm">{msg}</div>}
        
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800">My Field Jobs</h2>
            <button type="button" onClick={fetchData} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 font-medium">Refresh Jobs</button>
          </div>
          
          <div className="p-6 bg-slate-50/30">
            {loading ? <p className="text-sm text-slate-500">Loading...</p> : requests.length === 0 ? <p className="text-sm text-slate-500">No assigned jobs at the moment. Take a break!</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map(req => (
                  <div key={req.id} className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden group hover:border-indigo-200 transition-colors">
                    <div className="relative w-full h-32 bg-slate-100 overflow-hidden border-b border-slate-100">
                      <Image 
                        src={`https://picsum.photos/seed/${req.id}/600/300`} 
                        alt="Map Route Placeholder" 
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-90"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600 text-white shadow-md text-[10px] font-bold rounded uppercase border border-indigo-700">Assigned</span>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Request Details</p>
                      <p className="font-mono text-xs text-slate-500 mb-3">{req.id.substring(0,8)}...</p>
                      
                      <div className="space-y-2 mb-4 flex-1">
                        <div>
                          <p className="text-[10px] text-slate-500 font-medium">Barcode</p>
                          <p className="font-mono text-sm font-semibold text-slate-800">{req.warranties?.barcode}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-medium">Time</p>
                          <p className="text-sm text-slate-800">{new Date(req.customer_availability).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                        {req.telecaller_remarks && (
                          <div className="mt-2 bg-slate-50 p-2 border border-slate-100 rounded text-xs text-slate-600 italic">
                            &quot;{req.telecaller_remarks}&quot;
                          </div>
                        )}
                      </div>
                      
                      <form action={(fd) => markAsDone(req.id, req.otp_code, fd)} className="mt-auto border-t border-slate-100 pt-4 flex flex-col gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Verification OTP</label>
                          <input 
                            type="text" 
                            name="otp" 
                            required 
                            maxLength={4}
                            placeholder="• • • •"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-base text-center tracking-[0.5em] font-mono outline-none focus:border-emerald-500 transition-colors shadow-inner font-bold" 
                          />
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200">
                          Complete Job
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800">Completed Jobs</h2>
          </div>
          
          <div className="p-6 bg-slate-50/30">
            {loading ? <p className="text-sm text-slate-500">Loading...</p> : completedJobs.length === 0 ? <p className="text-sm text-slate-500">No completed jobs yet.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {completedJobs.map(job => (
                  <div key={job.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase border border-emerald-100">Completed</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Request ID</p>
                      <p className="font-mono text-xs text-slate-500 mb-3">{job.id.substring(0,8)}...</p>
                      
                      <p className="text-[10px] font-medium text-slate-500">Barcode</p>
                      <p className="font-mono text-sm font-semibold text-slate-800 break-all">{job.warranties?.barcode || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

