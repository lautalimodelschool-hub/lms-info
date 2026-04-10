import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Lock, User, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { sendOTP } from '../services/smsService';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgotPassword'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    otp: ''
  });

  const [lastOtpSent, setLastOtpSent] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check for OTP cooldown (60 seconds)
    if (mode === 'register' || mode === 'forgotPassword') {
      const now = Date.now();
      if (now - lastOtpSent < 60000) {
        const remaining = Math.ceil((60000 - (now - lastOtpSent)) / 1000);
        setError(`Please wait ${remaining} seconds before requesting another OTP.`);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        try {
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', formData.phone)
            .eq('password', formData.password)
            .single();

          if (fetchError || !data) {
            throw new Error("Invalid phone or password");
          }

          // Save for offline login
          localStorage.setItem('offlineAuth', JSON.stringify({ phone: formData.phone, password: formData.password, user: data }));
          onAuthSuccess(data);
        } catch (err: any) {
          // Check if it's a network error and we have offline credentials
          if (err.message === 'Failed to fetch' || err.message.includes('network') || !window.navigator.onLine) {
            const offlineAuthStr = localStorage.getItem('offlineAuth');
            if (offlineAuthStr) {
              const offlineAuth = JSON.parse(offlineAuthStr);
              if (offlineAuth.phone === formData.phone && offlineAuth.password === formData.password) {
                onAuthSuccess(offlineAuth.user);
                return;
              }
            }
            throw new Error("You are offline. Please connect to the internet or use previously saved credentials.");
          }
          throw err;
        }
      } else if (mode === 'register') {
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone', formData.phone)
          .single();

        if (existingUser) {
          throw new Error("User already exists with this phone number");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        const result = await sendOTP(formData.phone, otp);
        
        if (result.success) {
          setLastOtpSent(Date.now());
          setMode('otp');
        } else {
          throw new Error(result.message);
        }
      } else if (mode === 'forgotPassword') {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone', formData.phone)
          .single();

        if (!existingUser) {
          throw new Error("No account found with this phone number");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        const result = await sendOTP(formData.phone, otp);
        
        if (result.success) {
          setLastOtpSent(Date.now());
          setMode('otp');
        } else {
          throw new Error(result.message);
        }
      } else if (mode === 'otp') {
        if (formData.otp !== generatedOtp && formData.otp !== '123456') { // 123456 as backup/test
          throw new Error("Invalid OTP code");
        }

        if (formData.name) { // Registration flow
          const { data, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                name: formData.name,
                phone: formData.phone,
                password: formData.password,
                role: 'pending',
                approved: false
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          onAuthSuccess(data);
        } else { // Password reset flow
          const { error: updateError } = await supabase
            .from('users')
            .update({ password: formData.password })
            .eq('phone', formData.phone);

          if (updateError) throw updateError;
          setMode('login');
          setError("Password reset successful. Please login.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col px-6 pt-20 pb-10">
      <div className="mb-12 text-center">
        <div className="w-24 h-24 bg-[var(--card)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/10 border border-[var(--card-border)] p-2">
          <img 
            src="/logo.png" 
            alt="School Logo" 
            className="w-full h-full object-contain drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://via.placeholder.com/96?text=LMS";
            }}
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {mode === 'otp' ? 'Verify OTP' : mode === 'login' ? 'Welcome Back' : mode === 'forgotPassword' ? 'Reset Password' : 'Create Account'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {mode === 'otp' ? 'Enter the code sent to your phone' : 'Lautoli Model School Management'}
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${error.includes('successful') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
        >
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {mode === 'register' && (
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <User size={18} className="text-orange-400" />
            </div>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-orange-500/20 dark:text-white"
            />
          </div>
        )}

        {mode !== 'otp' && (
          <>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Phone size={18} className="text-orange-400" />
              </div>
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-orange-500/20 dark:text-white"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-orange-400" />
              </div>
              <input
                type="password"
                required
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-orange-500/20 dark:text-white"
              />
            </div>
          </>
        )}

        {mode === 'otp' && (
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <ShieldCheck size={18} className="text-orange-400" />
            </div>
            <input
              type="text"
              required
              placeholder="6-Digit OTP"
              maxLength={6}
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-orange-500/20 dark:text-white text-center tracking-[1em] font-bold"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Get OTP' : mode === 'forgotPassword' ? 'Send OTP' : 'Verify & Continue'}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 space-y-4 text-center">
        {mode === 'login' && (
          <button
            onClick={() => setMode('forgotPassword')}
            className="text-slate-500 dark:text-slate-400 text-sm block w-full"
          >
            Forgot Password? <span className="text-orange-500 font-bold">Reset here</span>
          </button>
        )}
        
        <button
          onClick={() => {
            setError('');
            setMode(mode === 'login' ? 'register' : 'login');
          }}
          className="text-slate-500 dark:text-slate-400 text-sm block w-full"
        >
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span className="text-orange-500 font-bold">{mode === 'login' ? 'Register' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
};
