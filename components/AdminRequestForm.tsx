'use client'

import { useState } from 'react'
import { adminCreateRequest } from '@/app/actions/adminCreateRequest'

export function AdminRequestForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg({ type: '', text: '' })

    const form = e.currentTarget
    const formData = new FormData(form)
    const result = await adminCreateRequest(formData)

    if (result?.error) {
      setMsg({ type: 'error', text: result.error })
    } else if (result?.success) {
      setMsg({ type: 'success', text: result.success })
      form.reset()
    }

    setLoading(false)

    setTimeout(() => {
      setMsg({ type: '', text: '' })
    }, 5000)
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded uppercase border border-purple-100">God Mode</span>
        <h2 className="font-bold text-slate-800">Admin Create Request</h2>
      </div>
      
      {msg.text && (
        <div className={`mb-5 text-xs font-semibold p-3 mx-1 rounded border ${
          msg.type === 'error' 
            ? 'bg-red-50 text-red-600 border-red-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {msg.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5 flex-1">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Customer Email Address</label>
          <input 
            type="email" 
            name="customerEmail"
            required 
            placeholder="customer@example.com" 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-purple-500 transition-colors shadow-inner text-slate-800" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Product Barcode</label>
          <input 
            type="text" 
            name="barcode"
            required 
            placeholder="e.g. PRD-12345" 
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-purple-500 transition-colors shadow-inner font-mono text-slate-700" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Remarks</label>
          <textarea 
            name="telecallerRemarks"
            placeholder="Admin override remarks..." 
            rows={2}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-purple-500 transition-colors shadow-inner text-slate-800 resize-none" 
          ></textarea>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Initial Status</label>
          <select 
            name="statusOverride"
            required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-purple-500 transition-colors shadow-inner text-slate-800 appearance-none"
          >
            <option value="pending_call">Pending Call</option>
            <option value="scheduled">Scheduled</option>
            <option value="assigned">Assigned</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Submitting...' : 'Create Master Request'}
          </button>
        </div>
      </form>
    </section>
  )
}
