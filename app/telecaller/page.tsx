'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { TelecallerRequestForm } from '@/components/TelecallerRequestForm'

export default function TelecallerDashboard() {
  const [requests, setRequests] = useState<any[]>([])
  const [centers, setCenters] = useState<any[]>([])
  const [dispatchedTasks, setDispatchedTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchData() {
    setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    const { data: reqData } = await supabase
      .from('service_requests')
      .select('*, warranties(barcode), product_service_count, customer_service_count')
      .eq('status', 'pending_call')
      .order('created_at', { ascending: false })
      
    if (reqData) setRequests(reqData)
    
    const { data: cenData } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'service_center')
      
    if (cenData) setCenters(cenData)
    
    const { data: dispatchedData } = await supabase
      .from('service_requests')
      .select('*')
      .in('status', ['scheduled', 'assigned', 'closed'])
      .eq('telecaller_id', session.user.id)
      .order('created_at', { ascending: false })
      
    if (dispatchedData) setDispatchedTasks(dispatchedData)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function scheduleRequest(id: string, formData: FormData) {
    const availability = formData.get('availability') as string
    const remarks = formData.get('remarks') as string
    const centerId = formData.get('center_id') as string
    
    if (!availability || !centerId) return alert('Availability and Center are required')
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return alert('Your session has expired. Please log in again.')

    const { error } = await supabase
      .from('service_requests')
      .update({
        customer_availability: new Date(availability).toISOString(),
        telecaller_remarks: remarks,
        assigned_center_id: centerId,
        telecaller_id: session.user.id,
        status: 'scheduled'
      })
      .eq('id', id)
      
    if (error) {
      alert(error.message)
    } else {
      alert('Scheduled successfully')
      fetchData()
    }
  }

  const callsWaiting = requests.length
  const myDispatched = dispatchedTasks.length
  const totalTouched = requests.length + dispatchedTasks.length

  return (
    <DashboardLayout title="Telecaller Hub" subtitle="Process new service requests and assign them to centers.">
      <div className="max-w-5xl mx-auto w-full mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Calls Waiting</p>
            <p className="text-3xl font-bold text-indigo-600">{callsWaiting}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">My Dispatched</p>
            <p className="text-3xl font-bold text-indigo-600">{myDispatched}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Touched</p>
            <p className="text-3xl font-bold text-indigo-600">{totalTouched}</p>
          </div>
        </div>
        <TelecallerRequestForm />
      </div>
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden max-w-5xl mx-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Pending Calls Queue</h2>
          <button type="button" onClick={fetchData} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 font-medium">Refresh Queue</button>
        </div>
        
        <div className="p-6 bg-slate-50/30">
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : requests.length === 0 ? <p className="text-sm text-slate-500">No pending calls in the queue.</p> : (
            <div className="space-y-4">
              {requests.map(req => (
                <form 
                  key={req.id} 
                  className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col lg:flex-row gap-6 transition-all hover:border-indigo-200"
                  action={(fd) => scheduleRequest(req.id, fd)}
                >
                  <div className="flex-[0.8] flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded uppercase w-max mb-3 border border-amber-100">Pending Call</span>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Request ID</p>
                    <p className="font-mono text-sm text-indigo-600 mb-3">{req.id.substring(0,12)}...</p>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Product Barcode</p>
                    <p className="font-mono text-sm text-slate-700 mb-3">{req.warranties?.barcode}</p>

                    <div>
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
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Customer Availability</label>
                        <input type="datetime-local" name="availability" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Assign Center</label>
                        <select name="center_id" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none appearance-none focus:border-indigo-500 transition-colors">
                          <option value="">Select Center...</option>
                          {centers.map(c => (
                            <option key={c.id} value={c.id}>{c.email}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Remarks</label>
                      <input type="text" name="remarks" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors" placeholder="Discussion notes..." />
                    </div>
                  </div>
                  
                  <div className="flex items-end lg:w-32">
                    <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">Schedule</button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden max-w-5xl mx-auto mt-8">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Dispatched Tasks</h2>
        </div>
        
        <div className="p-6 bg-slate-50/30">
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : dispatchedTasks.length === 0 ? <p className="text-sm text-slate-500">No dispatched tasks.</p> : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Request ID</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Telecaller Remarks</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {dispatchedTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600">{task.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          task.status === 'assigned' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-[250px] truncate" title={task.telecaller_remarks}>
                        {task.telecaller_remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}
