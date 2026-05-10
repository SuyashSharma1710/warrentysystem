'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

import { DashboardLayout } from '@/components/DashboardLayout'

export default function CustomerDashboard() {
  const [requests, setRequests] = useState<any[]>([])
  const [registeredProducts, setRegisteredProducts] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUserId(session.user.id)
        fetchMyRequests(session.user.id)
        fetchRegisteredProducts(session.user.id)
      }
    }
    loadUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchRegisteredProducts(uid: string) {
    const { data } = await supabase
      .from('warranties')
      .select('*, products(product_name, warranty_months)')
      .eq('customer_id', uid)
    if (data) {
      setRegisteredProducts(data)
    }
  }

  async function fetchMyRequests(uid: string) {
    const { data } = await supabase
      .from('warranties')
      .select(`
        id, 
        service_requests (*)
      `)
      .eq('customer_id', uid)
      
    if (data) {
      const allReqs = data.flatMap(w => w.service_requests)
      setRequests(allReqs)
    }
  }

  async function handleCreateRequest(warrantyId: string) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    
    const { error } = await supabase.from('service_requests').insert([{
      warranty_id: warrantyId,
      status: 'pending_call',
      otp_code: otp
    }])
    
    if (error) {
      setMsg('Error requesting service: ' + error.message)
    } else {
      setMsg('Service requested successfully!')
      if (userId) fetchMyRequests(userId)
      
      setTimeout(() => {
        setMsg('')
      }, 4000)
    }
  }

  return (
    <DashboardLayout title="Customer Portal" subtitle="Check warranty status and request service.">
      
      {msg && <div className="mb-6 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">{msg}</div>}

      {/* My Registered Products Section */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800">My Registered Products</h2>
        </div>
        <div className="p-6">
          {registeredProducts.length === 0 ? (
            <p className="text-sm text-slate-500">You have no registered products.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredProducts.map(product => {
                const isExpired = new Date(product.expiry_date) < new Date()
                return (
                  <div key={product.id} className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-800 mb-1">{product.products?.product_name || 'Unknown Product'}</h3>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        Barcode: <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{product.barcode}</span>
                      </p>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-4 flex justify-between gap-2 mt-2">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Duration</p>
                        <p className="text-sm font-medium text-slate-800">{product.products?.warranty_months} Mos</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Registered</p>
                        <p className="text-sm font-medium text-slate-800">{new Date(product.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Valid Until</p>
                        <p className={`text-sm font-medium ${isExpired ? 'text-red-500' : 'text-emerald-600'}`}>
                          {new Date(product.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      {isExpired ? (
                        <button disabled className="w-full py-2.5 rounded-lg text-sm font-semibold bg-red-50 text-red-500 border border-red-100 cursor-not-allowed">
                          Warranty Expired
                        </button>
                      ) : (
                        <button onClick={() => handleCreateRequest(product.id)} className="w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
                          Request Service
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
      
      {/* My Service Requests Section */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800">My Service Requests</h2>
        </div>
        <div className="p-6 overflow-y-auto">
          {requests.length === 0 ? <p className="text-sm text-slate-500">No active requests.</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((req: any) => (
                <div key={req.id} className="border border-slate-200 p-5 rounded-lg bg-white shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        req.status === 'closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        req.status === 'assigned' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        req.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {req.status}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-2.5">ID: {req.id.substring(0,8)}...</p>
                    </div>
                    <div className="text-right bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Your OTP</p>
                      <p className="text-xl font-mono font-bold text-indigo-600 tracking-widest">{req.otp_code}</p>
                    </div>
                  </div>
                  {req.telecaller_remarks && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                      <span className="font-semibold text-slate-700">Remarks:</span> {req.telecaller_remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </DashboardLayout>
  )
}
