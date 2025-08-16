'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userLoginSchema, UserLogin } from '@/lib/validations';

export default function LoginPage(): JSX.Element {
  const { loginUser, loginWithGoogle, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserLogin>({
    resolver: zodResolver(userLoginSchema),
  });

  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  const onSubmit = async (data: UserLogin) => {
    setLoading(true);
    try {
      await loginUser(data.email, data.password);
      router.push('/');
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
      <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl p-8">
        <header className="mb-6 text-center">
          <Link href="/" className="inline-block text-3xl font-bold text-primary">
            KKG E-Commerce
          </Link>
          <p className="mt-2 text-sm text-base-content/70">Sign in to your account</p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-error">{String(errors.email?.message)}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot?
              </Link>
            </div>

            <input
              id="password"
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
            />
            {errors.password && <p className="mt-1 text-xs text-error">{String(errors.password?.message)}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" className="checkbox checkbox-primary" />
            <span className="text-sm">Remember me</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="divider text-sm">OR</div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-outline w-full"
          >
            Continue with Google
          </button>

          <p className="mt-3 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
