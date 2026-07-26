import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/layout/Header';

export const metadata = {
  title: 'Copa de Campeones - Torneos de Fútbol Amateur',
  description: 'Plataforma premium para la gestión y consulta de ligas y torneos de fútbol amateur.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0f172a] text-slate-50 font-sans min-h-screen">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="py-8 text-center text-sm text-slate-500 border-t border-slate-800/50 mt-12 bg-slate-950/30">
              <div className="page-container">
                <p>© 2026 Copa de Campeones. Todos los derechos reservados.</p>
                <p className="mt-1 text-slate-600 text-xs">Plataforma deportiva con estadísticas en tiempo real.</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
