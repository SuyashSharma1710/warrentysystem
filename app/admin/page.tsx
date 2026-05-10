'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAccount } from '@/app/actions/admin'

import { DashboardLayout } from '@/components/DashboardLayout'

import { WarrantyRegistrationPanel } from '@/components/WarrantyRegistrationPanel'
import { AddProductPanel } from '@/components/AddProductPanel'
import { AdminRequestForm } from '@/components/AdminRequestForm'

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authRole, setAuthRole] = useState('telecaller')
  const [msg, setMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    fetchRequests()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchRequests() {
    setLoading(true)
    const { data, error } = await supabase.from('service_requests').select('*, warranties(barcode), product_service_count, customer_service_count').order('created_at', { ascending: false })
    if (data) setRequests(data)
    setLoading(false)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Creating...')
    const formData = new FormData()
    formData.append('email', authEmail)
    formData.append('password', authPassword)
    formData.append('role', authRole)
    
    const res = await createAccount(formData)
    if (res.error) {
      setMsg(`Error: ${res.error}`)
    } else {
      setMsg('User created successfully')
      setAuthEmail('')
      setAuthPassword('')
    }
  }

  const totalRequests = requests.length
  const pendingCalls = requests.filter(r => r.status === 'pending_call').length
  const activeInField = requests.filter(r => r.status === 'scheduled' || r.status === 'assigned').length
  const resolvedJobs = requests.filter(r => r.status === 'closed').length

  const filteredRequests = requests.filter(r => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return r.id.toLowerCase().includes(q) || r.warranties?.barcode?.toLowerCase().includes(q)
  })

  return (
    <DashboardLayout title="Administrator Control Panel" subtitle="Manage role-based access and monitor active service requests.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Requests</p>
          <p className="text-3xl font-bold text-indigo-600">{totalRequests}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Pending Calls</p>
          <p className="text-3xl font-bold text-indigo-600">{pendingCalls}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Active in Field</p>
          <p className="text-3xl font-bold text-indigo-600">{activeInField}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Resolved Jobs</p>
          <p className="text-3xl font-bold text-indigo-600">{resolvedJobs}</p>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-8 flex-1">
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">Action</span>
              <h2 className="font-bold text-slate-800">Create Staff Account</h2>
            </div>
            {msg && <div className="mb-4 text-xs font-semibold text-indigo-600 bg-indigo-50 p-2 rounded">{msg}</div>}
            <form onSubmit={handleCreateUser} className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Email Address</label>
                <input type="email" required placeholder="user@service.com" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Assign Role</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none appearance-none" value={authRole} onChange={e => setAuthRole(e.target.value)}>
                  <option value="telecaller">Telecaller</option>
                  <option value="service_center">Service Center</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Password</label>
                <input type="password" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
                  Register with Service Role
                </button>
                <p className="text-[10px] text-slate-400 mt-2 text-center">Uses `SUPABASE_SERVICE_ROLE_KEY` bypass.</p>
              </div>
            </form>
          </section>

          <WarrantyRegistrationPanel />
          <AddProductPanel />
          <AdminRequestForm />
        </div>
        
        <section className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800">Global Service Queue</h2>
            <div className="flex gap-2 items-center">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">v_service_requests</span>
              <input 
                type="text" 
                placeholder="Search ID or Barcode..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors"
              />
              <button type="button" onClick={fetchRequests} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 font-medium">Refresh Data</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {loading ? <p className="p-6 text-sm text-slate-500">Loading requests...</p> : (
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Request ID</th>
                    <th className="px-6 py-3 font-semibold">Warranty ID</th>
                    <th className="px-6 py-3 font-semibold">Remarks</th>
                    <th className="px-6 py-3 font-semibold">Availability</th>
                    <th className="px-6 py-3 font-semibold">History (Item / Total)</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Tech ID</th>
                    <th className="px-6 py-3 font-semibold">Center ID</th>
                    <th className="px-6 py-3 font-semibold">Telecaller ID</th>
                    <th className="px-6 py-3 font-semibold text-right">OTP</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {filteredRequests.length === 0 && <tr><td colSpan={10} className="px-6 py-4 text-slate-500 text-center">No requests found.</td></tr>}
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600">{req.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.warranty_id ? req.warranty_id.substring(0, 8) + '...' : '-'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-[150px] truncate" title={req.telecaller_remarks}>{req.telecaller_remarks || '-'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{req.customer_availability ? new Date(req.customer_availability).toLocaleString() : 'Not set'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        <span className={req.product_service_count > 1 ? 'text-rose-600 font-bold' : ''}>
                          {req.product_service_count || 0}
                        </span>
                        {' / '}
                        {req.customer_service_count || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                          req.status === 'closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          req.status === 'assigned' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          req.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.assigned_tech_id?.substring(0,8) || 'Unassigned'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.assigned_center_id?.substring(0,8) || 'Unassigned'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.telecaller_id?.substring(0,8) || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-400">{req.otp_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/30">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
              <span>Viewing {filteredRequests.length} total requests</span>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
