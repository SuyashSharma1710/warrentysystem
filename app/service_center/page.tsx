'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function ServiceCenterDashboard() {
  const [requests, setRequests] = useState<any[]>([])
  const [allCenterJobs, setAllCenterJobs] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  async function assignTechnician(requestId: string, technicianId: string) {
    if (!technicianId) return alert('Please select a technician.')

    const { error } = await supabase
      .from('service_requests')
      .update({
        assigned_tech_id: technicianId,
        status: 'assigned'
      })
      .eq('id', requestId)
      
    if (error) {
      alert('Error dispatching technician: ' + error.message)
    } else {
      setRequests(prev => prev.filter(req => req.id !== requestId))
    }
  }

  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          if (mounted) setLoading(false)
          return
        }

        const { data: reqData } = await supabase
          .from('service_requests')
          .select('*, warranties(barcode), product_service_count, customer_service_count') 
          .eq('status', 'scheduled')
          .eq('assigned_center_id', user.id)

        const { data: historyData } = await supabase
          .from('service_requests')
          .select('*')
          .eq('assigned_center_id', user.id)
          .in('status', ['assigned', 'closed'])

        const { data: techData } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('role', 'technician')

        if (mounted) {
          if (reqData) setRequests(reqData)
          if (historyData) setAllCenterJobs(historyData)
          if (techData) setTechnicians(techData)
        }
      } catch (err: any) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [supabase])

  const pendingDispatch = requests.length
  const activeInField = allCenterJobs.filter(j => j.status === 'assigned').length
  const completed = allCenterJobs.filter(j => j.status === 'closed').length

  return (
    <DashboardLayout title="Service Center" subtitle="Assign scheduled jobs to local technicians.">
      <div className="max-w-5xl mx-auto w-full mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Pending Dispatch</p>
            <p className="text-3xl font-bold text-indigo-600">{pendingDispatch}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Active in Field</p>
            <p className="text-3xl font-bold text-indigo-600">{activeInField}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Completed</p>
            <p className="text-3xl font-bold text-indigo-600">{completed}</p>
          </div>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden max-w-5xl mx-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Dispatch Queue</h2>
        </div>
        
        <div className="p-6 bg-slate-50/30">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">No scheduled jobs in your queue.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map(req => (
                <div 
                  key={req.id} 
                  className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden"
                >
                  <div className="p-5 relative">
                    <span className="absolute top-5 right-5 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase border border-blue-100">Scheduled</span>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Request ID</p>
                    <p className="font-mono text-sm text-indigo-600 mb-4">{req.id.substring(0,8)}...</p>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Customer Availability</p>
                        <p className="text-sm font-medium text-slate-800">
                          {req.customer_availability 
                            ? new Date(req.customer_availability).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : 'Not provided'}
                        </p>
                      </div>

                      <div className="mt-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Service History</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                            {req.customer_service_count || 0} Total Lifetime
                          </span>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            (req.product_service_count || 1) > 1 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {req.product_service_count || 0} On This Item
                          </span>
                        </div>
                      </div>

                      {req.telecaller_remarks && (
                        <div className="bg-slate-50 p-3 rounded border border-slate-100">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Telecaller Remarks</p>
                          <p className="text-xs text-slate-600">{req.telecaller_remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <form 
                    action={(fd) => assignTechnician(req.id, fd.get('tech_id') as string)}
                    className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3"
                  >
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Assign Technician</label>
                      <select 
                        name="tech_id" 
                        required 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none appearance-none focus:border-slate-400 transition-colors shadow-sm text-slate-800"
                      >
                        <option value="">Select Technician...</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>{t.email}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm border border-slate-800"
                    >
                      Dispatch Technician
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}