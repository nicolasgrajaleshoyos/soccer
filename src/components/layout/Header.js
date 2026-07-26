'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Bell, Trophy, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notificaciones');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const navLinks = [
    { href: '/torneos', label: 'Torneos' },
    { href: '/equipos', label: 'Equipos' },
    { href: '/calendario', label: 'Calendario' },
    { href: '/estadisticas', label: 'Estadísticas' },
    { href: '/noticias', label: 'Noticias' },
    { href: '/galeria', label: 'Galería' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-xl">
      <div className="page-container flex h-16 items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-white shrink-0">
          <Trophy className="h-6 w-6 text-amber-500" />
          <span className="font-[Outfit] text-lg tracking-wider text-emerald-400 hidden sm:inline">COPA DE CAMPEONES</span>
          <span className="font-[Outfit] text-lg tracking-wider text-emerald-400 sm:hidden">COPA</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-emerald-400 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          {mounted && user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  if (!showNotifDropdown && unreadCount > 0) handleMarkAllRead();
                }}
                className="relative rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-lg z-50">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <h4 className="font-semibold text-white text-sm">Notificaciones</h4>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-emerald-400 hover:underline">
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No hay notificaciones</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-2.5 rounded-lg text-xs transition-colors ${notif.read ? 'bg-slate-900/20' : 'bg-emerald-500/10 border-l-2 border-emerald-500'}`}>
                          <p className="font-semibold text-slate-200">{notif.title}</p>
                          <p className="text-slate-400 mt-1">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Section */}
          {mounted ? (
            user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-emerald-400 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
                {user.role !== 'aficionado' ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-all"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Panel</span>
                  </Link>
                ) : (
                  <div className="rounded-lg bg-slate-800 p-2 text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <button
                  onClick={logout}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-base btn-primary hover:btn-primary-hover px-5 py-2 text-xs rounded-lg font-bold">
                Iniciar Sesión
              </Link>
            )
          ) : (
            <div className="h-8 w-24 bg-slate-800/40 rounded-lg animate-pulse" />
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/60 bg-slate-900/95 backdrop-blur-xl">
          <nav className="page-container py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-emerald-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
