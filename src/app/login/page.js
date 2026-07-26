'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Trophy, LogIn } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('¡Correo verificado exitosamente! Ya puedes iniciar sesión.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 mx-auto">
            <Trophy className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Iniciar Sesión</h1>
          <p className="text-sm text-slate-400">Accede al panel de tu liga y gestiona tus torneos.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium text-center">
            {success}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              className="input-field focus:input-field-focus"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              className="input-field focus:input-field-focus"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Seed Accounts Info */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-500 space-y-1.5">
          <p className="font-bold text-slate-400 text-xs">Cuentas de Prueba:</p>
          <p>• Superadmin: <strong className="text-slate-300">superadmin@soccer.com</strong> / admin123</p>
          <p>• Organizador: <strong className="text-slate-300">organizador@soccer.com</strong> / admin123</p>
          <p>• Admin Equipo: <strong className="text-slate-300">admin_equipo@soccer.com</strong> / admin123</p>
        </div>

        {/* Links */}
        <div className="text-center text-xs text-slate-400">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-emerald-400 font-bold hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-container py-20 text-center text-slate-400">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
