'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminRegistrationSchema, AdminRegistration } from '@/lib/validations';
import toast from 'react-hot-toast';
import { Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Admin {
  _id: string;
  email: string;
  fullName?: string;
  role: 'owner' | 'admin' | 'manager';
  createdBy?: string;
  createdAt: string;
}

const AdminCreator: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      } else {
        toast.error('Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AdminRegistration>({
    resolver: zodResolver(adminRegistrationSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      role: undefined,
    },
  });

  const onSubmit: SubmitHandler<AdminRegistration> = async (data) => {
    setLoading(true);
    try {
      let response;
      if (editAdmin) {
        response = await fetch(`/api/admin/admins/${editAdmin._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include',
        });
      } else {
        response = await fetch('/api/admin/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include',
        });
      }

      if (response.ok) {
        await response.json();
        toast.success(editAdmin ? 'Admin updated successfully' : 'Admin created successfully');
        await fetchAdmins();
        reset();
        setShowEditModal(false);
        setEditAdmin(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to ${editAdmin ? 'update' : 'create'} admin`);
      }
    } catch (error) {
      console.error('Error saving admin:', error);
      toast.error('Failed to save admin');
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setAdmins(admins.filter((a) => a._id !== adminId));
        toast.success('Admin deleted successfully');
      } else {
        toast.error('Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin');
    }
  };

  const populateEditForm = (admin: Admin) => {
    setValue('email', admin.email);
    setValue('fullName', admin.fullName || '');
    setValue('password', '');
    setValue('role', admin.role === 'owner' ? 'admin' : admin.role);
    setEditAdmin(admin);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setEditAdmin(null);
    reset();
  };

  if (loading && admins.length === 0) {
    return (
      <motion.div
        className="flex justify-center items-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading loading-spinner loading-lg"></div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <motion.h1
          className="text-3xl font-bold"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          Admin Management
        </motion.h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary btn-sm"
          onClick={() => {
            reset();
            setEditAdmin(null);
            setShowEditModal(true);
          }}
        >
          Add Admin
        </motion.button>
      </div>

      {/* Admins Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {admins.map((admin, i) => (
                <motion.tr
                  key={admin._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <td>
                    <div className="font-bold">{admin.fullName || 'N/A'}</div>
                    <div className="text-sm opacity-50">Created by: {admin.createdBy || 'N/A'}</div>
                  </td>
                  <td>{admin.email}</td>
                  <td>
                    <div className={`badge ${admin.role === 'owner' ? 'badge' : 'badge'}`}>
                      {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                    </div>
                  </td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      {admin.role !== 'owner' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => populateEditForm(admin)}
                          className="btn btn-secondary btn-xs"
                          title="Edit Admin"
                        >
                          <Edit className="w-3 h-3" />
                        </motion.button>
                      )}
                      {admin.role !== 'owner' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteAdmin(admin._id)}
                          className="btn btn-error btn-xs"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {admins.length === 0 && !loading && (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-4">🛡</div>
            <p className="text-lg font-semibold">No admins found</p>
            <p className="text-sm opacity-70">Admins will appear here once they are added</p>
          </motion.div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="modal modal-open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <h3 className="font-bold text-lg mb-4">
                {editAdmin ? 'Edit Admin' : 'Add Admin'}
              </h3>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Email */}
                <div>
                  <label className="label" htmlFor="email">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter admin email"
                  />
                  {errors.email && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.email.message}</span>
                    </label>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="label" htmlFor="fullName">
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    {...register('fullName')}
                    type="text"
                    className={`input input-bordered w-full ${errors.fullName ? 'input-error' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.fullName.message}</span>
                    </label>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="label" htmlFor="password">
                    <span className="label-text">
                      Password {editAdmin && <span className="text-xs opacity-70">(leave blank to keep current)</span>}
                    </span>
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                    placeholder={editAdmin ? 'Enter new password (optional)' : 'Enter password'}
                  />
                  {errors.password && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.password.message}</span>
                    </label>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="label" htmlFor="role">
                    <span className="label-text">Role</span>
                  </label>
                  <select
                    {...register('role')}
                    className={`select select-bordered w-full ${errors.role ? 'select-error' : ''}`}
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                  {errors.role && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.role.message}</span>
                    </label>
                  )}
                </div>

                {/* Actions */}
                <div className="modal-action">
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleModalClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCreator;
