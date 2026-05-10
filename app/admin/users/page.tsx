'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const supabase = createClient()

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*')

      if (data) {
        setUsers(data)
      }
      setLoading(false)
    }

    fetchUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(u => u.role === filter)

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-100'
      case 'technician':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'service_center':
        return 'bg-orange-50 text-orange-700 border-orange-100'
      case 'telecaller':
        return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'customer':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <DashboardLayout title="Manage Users" subtitle="View and filter all registered users in the system.">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* Controls */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <label htmlFor="role-filter" className="text-sm font-semibold text-slate-700">Filter by Role:</label>
            <select
              id="role-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors text-slate-800 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="service_center">Service Center</option>
              <option value="technician">Technician</option>
              <option value="telecaller">Telecaller</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </div>
        </section>

        {/* Data Table */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">User ID</th>
                  <th className="px-6 py-4 font-semibold">Email Address</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No users found for this filter.</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {user.id ? `${user.id.substring(0, 8)}...` : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {user.email || 'No email provided'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeColor(user.role)}`}>
                          {user.role ? user.role.replace('_', ' ') : 'None'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
