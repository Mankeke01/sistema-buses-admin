// 1. IMPORTAMOS ReactNode AQUÍ
import { useEffect, useState, useRef, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "./lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

// Vistas
import Login from "./views/login";
import GestionRutas from "./views/gestion_ruta";
import GestionChoferes from "./views/gestion_choferes";
import Configuracion from "./views/configuracion";
import { LandingPasajero } from "./views/LandingPasajero"; 

// Token de Mapbox
mapboxgl.accessToken = "pk.eyJ1IjoidWx0aW1hdGUtcmFrb3IiLCJhIjoiY21nY3B3cTlkMHM3ZDJtb3FkMml3azFlOSJ9.gyyt8Kdnuad_XqPMbUCfgw";

// Tipo de vistas del Admin
type ViewState = 'dashboard' | 'rutas' | 'choferes' | 'reportes' | 'config';

// ----------------------------------------------------------------------
// 1. COMPONENTES DEL PANEL ADMIN (Sidebar, Header, Dashboard)
// ----------------------------------------------------------------------

interface SidebarProps { currentView: ViewState; onNavigate: (view: ViewState) => void; }

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => (
  <aside className="w-64 bg-gray-900 dark:bg-black text-white h-screen fixed top-0 left-0 flex flex-col shadow-2xl z-20 transition-colors duration-300">
    <div className="p-6">
      <h1 className="text-2xl font-extrabold leading-tight">
        Precisión en<br/>
        <span className="text-blue-400">Ruta</span>
      </h1>
    </div>
    <nav className="flex-1 space-y-1 px-2">
      <NavItem icon="📊" text="Dashboard" active={currentView === 'dashboard'} onClick={() => onNavigate('dashboard')} />
      <NavItem icon="🛣️" text="Gestión de Rutas" active={currentView === 'rutas'} onClick={() => onNavigate('rutas')} />
      <NavItem icon="🚌" text="Gestión de Chóferes" active={currentView === 'choferes'} onClick={() => onNavigate('choferes')} />
      <NavItem icon="📈" text="Reportes" active={currentView === 'reportes'} onClick={() => onNavigate('reportes')} />
      <NavItem icon="⚙️" text="Configuración" active={currentView === 'config'} onClick={() => onNavigate('config')} />
    </nav>
    <div className="p-4 mt-auto border-t border-gray-800 dark:border-gray-900">
        <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Sistema Operativo
        </div>
    </div>
  </aside>
);

interface NavItemProps { icon: string; text: string; active: boolean; onClick: () => void; }
const NavItem: React.FC<NavItemProps> = ({ icon, text, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-left transition-all duration-200 cursor-pointer ${active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-900'}`}>
    <span className="text-xl">{icon}</span><span className="font-medium">{text}</span>
  </button>
);

const Header = ({ onLogout }: { onLogout: () => void }) => (
  <header className="bg-white dark:bg-gray-900 shadow-sm h-16 px-8 flex justify-between items-center z-10 sticky top-0 transition-colors duration-300">
    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Panel de Administración</h2>
    <button onClick={onLogout} className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium py-2 px-4 rounded-lg transition-colors text-sm cursor-pointer">
      Cerrar Sesión
    </button>
  </header>
);

const DashboardContent = ({ initialCenter, initialZoom }: { initialCenter: [number, number], initialZoom: number }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current, style: "mapbox://styles/mapbox/streets-v12", center: initialCenter, zoom: initialZoom,
        });
        new mapboxgl.Marker({ color: "#EF4444", scale: 0.8 }).setLngLat(initialCenter).setPopup(new mapboxgl.Popup().setText("Central Expresos")).addTo(mapRef.current);
        mapRef.current.on('load', () => { mapRef.current?.resize(); });
    }
    const channel = supabase.channel('admin-dashboard-mapa')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ubicacion' }, (payload) => {
          const { id_bus, latitud, longitud } = payload.new as { id_bus: string, latitud: number, longitud: number };
          if (!mapRef.current) return;
          if (markersRef.current[id_bus]) { markersRef.current[id_bus].setLngLat([longitud, latitud]); } 
          else {
            const el = document.createElement('div'); el.className = 'marker-bus'; el.style.fontSize = '24px'; el.innerHTML = '🚌';
            const newMarker = new mapboxgl.Marker(el).setLngLat([longitud, latitud]).setPopup(new mapboxgl.Popup({ offset: 25 }).setText(`Unidad: ${id_bus}`)).addTo(mapRef.current);
            markersRef.current[id_bus] = newMarker;
          }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [initialCenter, initialZoom]);

  return (
    <div className="flex-1 p-8 h-full overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6 flex justify-between items-center transition-colors">
        <div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Vista General de la Flota</h2>
           <p className="text-gray-500 dark:text-gray-400">Monitoreo satelital en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-800">
           <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
           Conexión en Vivo
        </div>
      </div>
      <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-inner border border-gray-300 dark:border-gray-700 relative overflow-hidden">
         <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. LAYOUT DEL PANEL ADMIN
// ----------------------------------------------------------------------
const AdminPanel = () => {
  const [center] = useState<[number, number]>([-73.24402, -39.81289]);
  const [zoom] = useState<number>(12);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/"); 
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardContent initialCenter={center} initialZoom={zoom} />;
      case 'rutas': return <GestionRutas />;
      case 'choferes': return <GestionChoferes />;
      case 'config': return <Configuracion />;
      default: return (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
          <div className="text-center"><span className="text-4xl mb-4 block">🚧</span><p>Módulo en construcción</p></div>
        </div>
      );
    }
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen font-sans transition-colors duration-300">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Header onLogout={handleLogout} />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 relative transition-colors duration-300">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. SEGURIDAD Y REDIRECCIONES
// ----------------------------------------------------------------------

// 2. CAMBIAMOS JSX.Element POR ReactNode PARA CORREGIR EL ERROR
const RutaProtegida = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-gray-950 dark:text-white">Cargando...</div>;
  
  // Usamos replace para que no puedan volver atrás
  if (!session) return <Navigate to="/login" replace />; 

  return <>{children}</>;
};

// Wrapper para el Login
const LoginWrapper = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin");
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate("/admin");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return <Login onLogin={function (): void {
    throw new Error("Function not implemented.");
  } } />;
};

// ----------------------------------------------------------------------
// 4. APP PRINCIPAL (ROUTER)
// ----------------------------------------------------------------------
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPasajero />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/admin/*" element={
          <RutaProtegida>
            <AdminPanel />
          </RutaProtegida>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;