'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setErrorMsg(error.message)
          return
        }
        
        if (data.user) {
          // Fetch role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()
            
          if (profileError) {
            setErrorMsg('Error fetching profile')
            return
          }
          
          if (profile && profile.role) {
            router.push(`/${profile.role}`)
          } else {
            router.push('/customer') // fallback
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setErrorMsg(error.message)
          return
        }
        
        if (data.user) {
           // Create profile for customer
           const { error: insertError } = await supabase.from('profiles').insert([
             { id: data.user.id, email, role: 'customer' }
           ])
           
           if (insertError) {
             setErrorMsg('Failed to create profile: ' + insertError.message)
           } else {
             alert('Signup successful. Please login.')
             setIsLogin(true)
           }
        }
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An unexpected error occurred during the request. Please check your network connection.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">W</div>
          <span className="text-2xl font-bold tracking-tight text-slate-800">Warranty<span className="text-indigo-600">Sync</span></span>
        </div>
        
        <h1 className="text-xl font-bold text-slate-800 mb-6 text-center">{isLogin ? 'Sign in to your account' : 'Create a new account'}</h1>
        
        {errorMsg && <div className="bg-red-50 text-red-600 border border-red-200 p-3 mb-6 rounded-lg text-sm font-medium">{errorMsg}</div>}
        
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800"
              placeholder="you@example.com"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 mt-2">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500 mb-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isLogin ? 'Create a customer account' : 'Sign in to existing account'}
          </button>
        </div>
      </div>
    </div>
  )
}
