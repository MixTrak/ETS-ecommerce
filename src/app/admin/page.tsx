'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Admin panel components
import UserList from './UserList';
import ProductManager from './ProductManager';
import AdminCreator from './AdminCreator';
import MessageList from './MessageList';

// Icons for navigation
import { Users, Tag, Shield, Mail } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { admin, logoutAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'admins' | 'messages'>('products');

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
    }
  }, [admin, router]);

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  // Role-based tab visibility
  const getAvailableTabs = () => {
    const tabs: Array<{ id: 'products' | 'users' | 'admins' | 'messages'; label: string; icon: React.ReactNode }> = [];
    
    // All roles can manage products
    tabs.push({ id: 'products', label: 'Manage Products', icon: <Tag className="w-5 h-5" /> });
    
    // Admin and Owner can manage users
    if (admin.role === 'admin' || admin.role === 'owner') {
      tabs.push({ id: 'users', label: 'Manage Users', icon: <Users className="w-5 h-5" /> });
    }
    
    // Only Owner can create admins
    if (admin.role === 'owner') {
      tabs.push({ id: 'admins', label: 'Create Admins', icon: <Shield className="w-5 h-5" /> });
    }
    
    // Admins, Owners, and Managers can view messages
    if (admin.role === 'admin' || admin.role === 'owner' || admin.role === 'manager') {
      tabs.push({ id: 'messages', label: 'Messages', icon: <Mail className='w-5 h-5' /> });
    }
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200 shadow-lg px-3 sm:px-6">
        <div className="navbar-start">
          <div className="text-base sm:text-lg font-semibold">Admin Dashboard</div>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                  {admin.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium">{admin.fullName}</div>
                  <div className="text-xs opacity-70 capitalize">{admin.role}</div>
                </div>
              </div>
            </div>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300 z-[9999]">
              <li><Link href="/">Back to Store</Link></li>
              <li><button onClick={logoutAdmin}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-3 sm:p-6">
        {/* Role-based DaisyUI Tabs - Mobile Responsive */}
        <div className="tabs tabs-bordered mb-8 overflow-x-auto">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab tab-bordered gap-2 whitespace-nowrap ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-base-100">
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'users' && (admin.role === 'admin' || admin.role === 'owner') && <UserList />}
          {activeTab === 'admins' && admin.role === 'owner' && <AdminCreator />}
          {activeTab === 'messages' && (admin.role === 'admin' || admin.role === 'owner' || admin.role === 'manager') && <MessageList />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;