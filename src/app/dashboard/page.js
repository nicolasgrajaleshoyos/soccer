'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Trophy, Users, Calendar, Newspaper,
  Settings, LayoutDashboard, MapPin, Image as ImageIcon,
  ArrowRight, ShieldAlert, Building2, Flag
} from 'lucide-react';
import Link from 'next/link';

const adminCards = [
  { emoji: '🏢', title: 'Organizaciones', desc: 'Crea ligas, edita sedes y asigna administradores.', href: '/dashboard/organizaciones', icon: Building2 },
  { emoji: '🏆', title: 'Torneos', desc: 'Administra temporadas, categorías y abre inscripciones.', href: '/dashboard/torneos', icon: Trophy },
  { emoji: '⚽', title: 'Fixture y Registro', desc: 'Programa partidos, registra goles, asistencias y tarjetas.', href: '/dashboard/partidos', icon: Calendar },
  { emoji: '🏁', title: 'Árbitros', desc: 'Registra árbitros y su historial de designaciones.', href: '/dashboard/arbitros', icon: Flag },
  { emoji: '📍', title: 'Canchas y Campos', desc: 'Registra canchas, capacidad y coordenadas GPS.', href: '/dashboard/canchas', icon: MapPin },
  { emoji: '📰', title: 'Noticias', desc: 'Publica boletines oficiales y crónicas de partidos.', href: '/dashboard/noticias', icon: Newspaper },
  { emoji: '📸', title: 'Galería', desc: 'Sube fotos y videos de los encuentros.', href: '/dashboard/galeria', icon: ImageIcon },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ organizations: 0, tournaments: 0, teams: 0, matches: 0 });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function loadStats() {
      try {
        const [orgRes, tourRes, teamRes, matchRes] = await Promise.all([
          fetch('/api/organizaciones'),
          fetch('/api/torneos'),
          fetch('/api/equipos'),
          fetch('/api/partidos'),
        ]);

        if (orgRes.ok && tourRes.ok && teamRes.ok && matchRes.ok) {
          const [orgs, tours, teams, matches] = await Promise.all([
            orgRes.json(), tourRes.json(), teamRes.json(), matchRes.json(),
          ]);
          setStats({
            organizations: orgs.organizations?.length || 0,
            tournaments: tours.tournaments?.length || 0,
            teams: teams.teams?.length || 0,
            matches: matches.matches?.length || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    }
    loadStats();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="page-container py-20 text-center text-slate-400 font-medium">
        Cargando panel de control...
      </div>
    );
  }

  if (user.role === 'aficionado') {
    return (
      <div className="page-container py-20 flex flex-col items-center text-center space-y-5 max-w-md mx-auto">
        <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-white">Acceso Denegado</h1>
        <p className="text-sm text-slate-400">
          Tu cuenta tiene rol de Aficionado. Solo los administradores pueden acceder al panel.
        </p>
        <Link href="/" className="btn-base btn-primary hover:btn-primary-hover px-6 py-2.5 rounded-xl text-sm font-bold">
          Volver a Inicio
        </Link>
      </div>
    );
  }

  const statItems = [
    { label: 'Organizaciones', value: stats.organizations, color: 'text-emerald-400' },
    { label: 'Torneos', value: stats.tournaments, color: 'text-blue-400' },
    { label: 'Equipos', value: stats.teams, color: 'text-amber-400' },
    { label: 'Partidos', value: stats.matches, color: 'text-purple-400' },
  ];

  return (
    <div className="page-container py-14 space-y-10">
      {/* Welcome Banner */}
      <div className="glass-card p-8 bg-gradient-to-r from-slate-900 via-slate-900/80 to-emerald-950/20">
        <span className="badge-status bg-emerald-500/15 text-emerald-400">
          Sesión Activa
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-3">
          ¡Hola, {user.name}!
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tienes permisos de <strong className="text-emerald-400 capitalize">{user.role.replace('_', ' ')}</strong>.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map(item => (
          <div key={item.label} className="stat-card space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{item.label}</span>
            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Admin Operations */}
      <div className="space-y-6">
        <div className="section-header flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Operaciones Administrativas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(user.role === 'superadmin' || user.role === 'organizador') && (
            <>
              {adminCards.map(card => (
                <Link key={card.href} href={card.href} className="glass-card hover:glass-card-hover p-6 flex flex-col justify-between h-48 group transition-all duration-300">
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl border border-slate-700/50">
                      {card.emoji}
                    </div>
                    <h3 className="font-bold text-white text-base">{card.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Gestionar <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </>
          )}

          {(user.role === 'superadmin' || user.role === 'admin_equipo') && (
            <Link href="/dashboard/equipos" className="glass-card hover:glass-card-hover p-6 flex flex-col justify-between h-48 border-emerald-500/20 group transition-all duration-300">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl border border-emerald-500/20">
                  🛡️
                </div>
                <h3 className="font-bold text-white text-base">Mi Club y Plantilla</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Administra uniformes, jugadores, dorsales y patrocinadores.</p>
              </div>
              <div className="flex justify-end">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Gestionar <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
