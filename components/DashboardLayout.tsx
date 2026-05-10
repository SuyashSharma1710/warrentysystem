'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export function DashboardLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Memoize client to prevent recreation
  const [supabase] = useState(() => createClient())
  
  const [role, setRole] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    let mounted = true
    async function verifyAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        if (mounted) router.push('/login')
        return
      }

      if (mounted) setEmail(session.user.email ?? null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        if (mounted) router.push('/login')
        return
      }

      if (mounted) setRole(profile.role)

      const section = pathname.split('/')[1]
      
      if (profile.role !== section && profile.role !== 'admin') {
        if (mounted) router.push('/' + profile.role)
        return
      }

      if (mounted) setIsAuthorized(true)
    }

    verifyAccess()

    return () => { mounted = false }
  }, [pathname, router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const allNavItems = [
    { 
      name: 'Admin Dashboard', 
      path: '/admin', 
      role: 'admin',
      subitems: [
        { name: 'Manage Users', path: '/admin/users' }
      ]
    },
    { name: 'Customer Portal', path: '/customer', role: 'customer' },
    { name: 'Telecaller Hub', path: '/telecaller', role: 'telecaller' },
    { name: 'Service Center', path: '/service_center', role: 'service_center' },
    { name: 'Technician Tool', path: '/technician', role: 'technician' },
  ]

  const navItems = role === 'admin' 
    ? allNavItems 
    : allNavItems.filter(item => item.role === role)

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">W</div>
          <span className="text-xl font-semibold tracking-tight text-slate-800">Warranty System Demo <span className="text-slate-400 font-normal">MVP</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{role ? role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Dashboard'}</span>
            <span className="text-xs text-indigo-600 font-mono">{email || 'SUPABASE_AUTH_ACTIVE'}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs hover:bg-slate-300 font-bold text-slate-600"
            title="Log Out"
          >
            Out
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        {/* Sidebar Role Selector */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role Contexts</div>
          <div className="flex flex-col gap-1 px-2">
            {navItems.map((item) => (
              <div key={item.path} className="flex flex-col gap-1">
                <button
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.path 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                      : 'hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${pathname === item.path ? 'bg-indigo-200' : 'bg-slate-600'}`}></div>
                  {item.name}
                </button>
                {item.subitems && (
                  <div className="flex flex-col gap-1 ml-4 border-l border-slate-700 pl-2 mt-1">
                    {item.subitems.map((subitem) => (
                      <button
                        key={subitem.path}
                        onClick={() => router.push(subitem.path)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          pathname === subitem.path 
                            ? 'bg-slate-800 text-white font-medium' 
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${pathname === subitem.path ? 'bg-indigo-400' : 'bg-transparent border border-slate-500'}`}></div>
                        {subitem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-auto p-4 bg-slate-950/50">
            <div className="text-[10px] text-slate-500 mb-1">DB CONNECTION</div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              PostgreSQL Connected
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
          {/* Header Section */}
          <header className="flex justify-between items-end shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
            </div>
          </header>
          
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
