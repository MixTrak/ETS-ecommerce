'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactForm } from '@/lib/validations';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Phone, Mail, MapPin, Clock,
  MessageCircle, Home
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

const DRAFT_KEY = 'contact_draft_v1';
const MESSAGE_MAX = 1000;

const ContactPage: React.FC = () => {
  const { firebaseUser, user } = useAuth();
  const currentUser = useMemo(() => {
    return user ||
      (firebaseUser
        ? {
            id: firebaseUser.uid,
            fullName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            provider: 'google' as const,
            avatar: firebaseUser.photoURL || '',
          }
        : null);
  }, [user, firebaseUser]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [messageLen, setMessageLen] = useState(0);
  const autosaveTimer = useRef<number | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, getValues } =
    useForm<ContactForm>({
      resolver: zodResolver(contactSchema),
      defaultValues: { name: '', email: '', message: '' },
    });

  const watched = watch();
  useEffect(() => {
    setMessageLen((watched.message || '').length);
  }, [watched.message]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ContactForm & { savedAt?: number }>;
        reset({
          name: parsed.name || '',
          email: parsed.email || '',
          message: parsed.message || '',
        });
        if (parsed.savedAt) setDraftSavedAt(parsed.savedAt);
      } else if (currentUser) {
        if (currentUser.fullName) setValue('name', currentUser.fullName);
        if (currentUser.email) setValue('email', currentUser.email);
      }
    } catch (err) {
      console.warn('Could not load draft', err);
    }
  }, [reset, currentUser, setValue]);

  useEffect(() => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      const data = {
        name: getValues('name'),
        email: getValues('email'),
        message: getValues('message'),
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setDraftSavedAt(data.savedAt);
      } catch (e) {
        console.warn('Failed to save draft', e);
      }
    }, 700);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [watched.name, watched.email, watched.message, getValues]);

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Message sent successfully!');
        reset();
        localStorage.removeItem(DRAFT_KEY);
        setDraftSavedAt(null);
        setTimeout(() => toast.dismiss(), 6000);
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    reset();
    setDraftSavedAt(null);
    toast('Draft cleared');
  };

  return (
    <div className="min-h-screen bg-base-100 py-12 px-6">
      {/* Navbar */}
      <nav className="navbar bg-base-100 shadow-lg mb-10 rounded-xl px-4">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold">KKG E-Commerce</Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/products">Products</Link></li>
            <li><Link href="/search">Search</Link></li>
            <li><Link href="/contact" className="active">Contact</Link></li>
          </ul>
        </div>
        <div className="navbar-end">
          {currentUser ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <UserAvatar user={currentUser} size="lg" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
                <li className="menu-title">
                  <span className="text-sm opacity-70">{currentUser.fullName}</span>
                </li>
                <li><Link href="/" className="flex items-center gap-2"><Home className="w-4 h-4" /> Go to Home</Link></li>
              </ul>
            </div>
          ) : (
            <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Login</Link>
          )}
        </div>
      </nav>

      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Card */}
        <aside className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg flex flex-col gap-6">
          <h2 className="text-3xl font-bold mb-2">Get in Touch</h2>
          <p className="text-base-content/70">Reach us through any of the following channels, we’re happy to help.</p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Phone className="w-6 h-6 text-primary" />
              <span className="text-lg">+225 07 87 94 22 88</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="w-6 h-6 text-primary" />
              <span className="text-lg">kouadioguillaumek287@gmail.com</span>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="w-6 h-6 text-primary" />
              <span className="text-lg">India</span>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-primary" />
              <span className="text-lg">Mon - Sat: 9am - 7pm</span>
            </div>
          </div>

          <a
            href="https://wa.me/+2250787942288"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success w-full flex items-center justify-center gap-2 mt-4 hover:shadow-xl transition no-underline"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
        </aside>

        {/* Contact Form */}
        <section className="bg-base-200 p-8 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Send us a message</h2>
            <div className="text-sm text-base-content/60">
              Draft saved: {draftSavedAt ? new Date(draftSavedAt).toLocaleTimeString() : '—'}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label"><span className="label-text">Your name</span></label>
              <input {...register('name')} type="text" className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`} placeholder="Full name" />
              {errors.name && <span className="text-error text-sm">{errors.name.message}</span>}
            </div>

            <div>
              <label className="label"><span className="label-text">Email</span></label>
              <input {...register('email')} type="email" className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" />
              {errors.email && <span className="text-error text-sm">{errors.email.message}</span>}
            </div>

            <div>
              <label className="label flex justify-between"><span className="label-text">Message</span><span>{messageLen} / {MESSAGE_MAX}</span></label>
              <textarea {...register('message')} rows={6} maxLength={MESSAGE_MAX} className={`textarea textarea-bordered w-full ${errors.message ? 'textarea-error' : ''}`} placeholder="Write your message..." />
              <div className="h-2 bg-base-300 rounded-full mt-2 overflow-hidden">
                <div style={{ width: `${Math.min((messageLen / MESSAGE_MAX) * 100, 100)}%` }} className="h-full bg-primary transition-all" />
              </div>
              {errors.message && <span className="text-error text-sm">{errors.message.message}</span>}
            </div>

            <div className="flex gap-3">
              <button type="submit" className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              <button type="button" onClick={clearDraft} className="btn btn-ghost">Clear Draft</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ContactPage;
