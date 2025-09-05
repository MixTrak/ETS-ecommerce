'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  provider: 'email' | 'google';
  createdAt: string;
}

const UserList: React.FC = () => {
  const { admin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users?page=${currentPage}&search=${searchTerm}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deleteUser = async (userId: string) => {
    if (!admin?.permissions.canDeleteUsers) {
      toast.error('You do not have permission to delete users');
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId));
        toast.success('User deleted successfully');
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="text-sm opacity-70">
          Total Users: {users.length}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="join">
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="input input-bordered join-item flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary join-item">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Provider</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="font-bold">{user.fullName}</div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone || 'N/A'}</td>
                <td>
                  <div className={`badge ${user.provider === 'google' ? 'badge' : 'badge'}`}>
                    {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
                  </div>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-2">
                    {admin?.permissions.canDeleteUsers && (
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="btn btn-error btn-xs"
                        title="Delete User"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-lg font-semibold">No users found</p>
            <p className="text-sm opacity-70">Users will appear here once they register</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join">
            <button
              className="join-item btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              «
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  className={`join-item btn ${currentPage === pageNum ? 'btn-active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className="join-item btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
