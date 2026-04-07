'use client'

import React from 'react'
import { 
  FaUsers, 
  FaBriefcase, 
  FaCheckCircle, 
  FaWallet, 
  FaChartLine, 
  FaStar,
  FaArrowUp 
} from 'react-icons/fa'

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10">
        
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--blue)]">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of the entire platform • Today is {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-5xl font-bold text-[var(--blue)] mt-4">0</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-2xl">
                <FaUsers className="text-[var(--blue)] text-3xl" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6 text-green-600 text-sm">
              <FaArrowUp />
              <span>0% this month</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Jobs</p>
                <p className="text-5xl font-bold text-[var(--blue)] mt-4">0</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-2xl">
                <FaBriefcase className="text-[var(--orange)] text-3xl" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6 text-green-600 text-sm">
              <FaArrowUp />
              <span>0% from last week</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Completed Jobs</p>
                <p className="text-5xl font-bold text-[var(--blue)] mt-4">0</p>
              </div>
              <div className="bg-green-100 p-4 rounded-2xl">
                <FaCheckCircle className="text-green-600 text-3xl" />
              </div>
            </div>
            <div className="mt-6 text-sm text-gray-600">
              0% completion rate
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Revenue</p>
                <p className="text-5xl font-bold text-[var(--blue)] mt-4">$0.0k</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-2xl">
                <FaWallet className="text-[var(--orange)] text-3xl" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6 text-green-600 text-sm">
              <FaArrowUp />
              <span>0% this month</span>
            </div>
          </div>
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Jobs Trend Chart Placeholder */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-[var(--blue)]">Platform Activity (Last 30 Days)</h2>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[var(--blue)] rounded-full"></div>
                  <span className="text-gray-600">New Jobs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[var(--orange)] rounded-full"></div>
                  <span className="text-gray-600">Completed</span>
                </div>
              </div>
            </div>

            <div className="h-96 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
              <div className="text-center">
                <FaChartLine className="mx-auto text-7xl text-gray-300 mb-4" />
                <p className="text-gray-400 text-lg">Job Activity Chart</p>
                <p className="text-xs text-gray-500 mt-2">Real chart will be added using Chart.js / Recharts</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold text-[var(--blue)] mb-6">Recent Activity</h2>
            
            <div className="space-y-7">
              {[
                { time: "Just now", action: "New customer registered", user: "Alex Rivera" },
                { time: "12 min ago", action: "Artisan verification approved", user: "Maria Lopez" },
                { time: "47 min ago", action: "Job #3921 marked as completed", user: "David Kim" },
                { time: "2 hours ago", action: "Payout of $1,240 processed", user: "Sarah Patel" },
                { time: "5 hours ago", action: "Dispute case resolved", user: "Admin Team" },
              ].map((activity, index) => (
                <div key={index} className="flex gap-4">
                  <div className="text-[var(--orange)] font-mono text-xs mt-1 whitespace-nowrap">
                    {activity.time}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.user}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-8 w-full py-3.5 border border-[var(--blue)] text-[var(--blue)] rounded-2xl hover:bg-[var(--blue)] hover:text-white transition font-medium">
              View All Activity
            </button>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl font-bold text-[var(--blue)]">0</div>
            <p className="text-gray-600 mt-3">Average Rating</p>
            <div className="flex justify-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-[var(--orange)]" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl font-bold text-[var(--blue)]">0%</div>
            <p className="text-gray-600 mt-3">Job Completion Rate</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl font-bold text-[var(--orange)]">0</div>
            <p className="text-gray-600 mt-3">Active Users Today</p>
          </div>
        </div>
      </div>
    </div>
  )
}