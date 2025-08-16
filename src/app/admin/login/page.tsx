'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminLoginSchema, AdminLogin } from '@/lib/validations';

const AdminLoginPage: React.FC = () => {
  const { loginAdmin, admin } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLogin>({
    resolver: zodResolver(adminLoginSchema),
  });

  // Redirect if already logged in as admin
  React.useEffect(() => {
    if (admin) {
      router.push('/admin');
    }
  }, [admin, router]);

  const onSubmit = async (data: AdminLogin) => {
    setLoading(true);
    try {
      await loginAdmin(data.email, data.password);
      router.push('/admin');
    } catch {
      // Error handling is done in the context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            KKG E-Commerce
          </Link>
          <div className="flex items-center justify-center mt-4 mb-2">
            <Shield className="w-8 h-8 text-primary mr-2" />
            <h2 className="text-3xl font-extrabold text-base-content">
              Admin Login
            </h2>
          </div>
          <p className="mt-2 text-sm text-base-content/60">
            Sign in to your admin account to manage the platform
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="label">
                  <span className="label-text">Email address</span>
                </label>
                <div className="relative">
                  <input
                    {...register('email')}
                    type="email"
                    className={`input input-bordered w-full pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your admin email"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                </div>
                {errors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.email.message}</span>
                  </label>
                )}
              </div>

              <div>
                <label htmlFor="password" className="label">
                  <span className="label-text">Password</span>
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`input input-bordered w-full pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-base-content/40" />
                    ) : (
                      <Eye className="w-4 h-4 text-base-content/40" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.password.message}</span>
                  </label>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                >
                  {loading ? 'Signing in...' : 'Sign in as Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-base-content/60">
            Need help?{' '}
            <Link href="/contact" className="font-medium text-primary hover:text-primary-focus">
              Contact support
            </Link>
          </p>
          <div className="mt-4">
            <Link href="/" className="btn btn-ghost btn-sm">
              ← Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
