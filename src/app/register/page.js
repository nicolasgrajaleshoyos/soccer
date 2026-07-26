'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Trophy, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('aficionado');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await register(name, email, password, role);
      setSuccess('¡Registro exitoso! Revisa la consola del servidor para el enlace de verificación de correo.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
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
          <h1 className="text-2xl font-extrabold text-white">Crear Cuenta</h1>
          <p className="text-sm text-slate-400">Regístrate para seguir o administrar equipos y ligas.</p>
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

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              required
              className="input-field focus:input-field-focus"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.com"
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
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="input-field focus:input-field-focus"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Usuario</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field focus:input-field-focus bg-slate-950/80 cursor-pointer"
            >
              <option value="aficionado">Aficionado (Solo consulta)</option>
              <option value="admin_equipo">Administrador de Equipo</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-base btn-primary hover:btn-primary-hover w-full py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        {/* Links */}
        <div className="text-center text-xs text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-emerald-400 font-bold hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
