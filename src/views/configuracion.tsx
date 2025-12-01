import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { QrPasajero } from "../components/QrPasajero";

// --- COMPONENTE DE ACORDEÓN REUTILIZABLE ---
const AccordionItem = ({ 
  title, 
  icon, 
  children, 
  isOpen, 
  onToggle 
}: { 
  title: string; 
  icon: string; 
  children: ReactNode; 
  isOpen: boolean; 
  onToggle: () => void;
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
      <button 
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
        </div>
        <span className={`text-gray-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {/* Contenido desplegable con animación suave */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Configuracion() {
  const [isDark, setIsDark] = useState(false);
  
  // Estado para controlar qué sección está abierta
  const [openSection, setOpenSection] = useState<string>('apariencia');

  // Estados de contraseña
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: "Las contraseñas no coinciden." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (error) {
      setMessage({ type: 'error', text: "Error: " + error.message });
    } else {
      setMessage({ type: 'success', text: "¡Contraseña actualizada correctamente!" });
      setPasswords({ new: "", confirm: "" });
    }
    setLoading(false);
  };

  // Función helper para abrir/cerrar secciones
  const toggleSection = (section: string) => {
    if (openSection === section) {
      setOpenSection(''); // Si ya estaba abierta, la cierra
    } else {
      setOpenSection(section); // Abre la nueva y cierra las demás
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Configuración</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Administra las preferencias generales y la seguridad.</p>

        <div className="space-y-4">
          
          {/* 1. SECCIÓN APARIENCIA */}
          <AccordionItem 
            title="Apariencia" 
            icon="🎨" 
            isOpen={openSection === 'apariencia'} 
            onToggle={() => toggleSection('apariencia')}
          >
            <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Modo Oscuro</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alternar entre el tema claro y oscuro de la interfaz.</p>
                </div>
                <button onClick={toggleTheme} className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
            </div>
          </AccordionItem>

          {/* 2. SECCIÓN SEGURIDAD */}
          <AccordionItem 
            title="Seguridad" 
            icon="🔒" 
            isOpen={openSection === 'seguridad'} 
            onToggle={() => toggleSection('seguridad')}
          >
             <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña</label>
                  <input type="password" className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" placeholder="Mínimo 6 caracteres" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Contraseña</label>
                  <input type="password" className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" placeholder="Repite la contraseña" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
                </div>
                {message && (
                  <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {message.text}
                  </div>
                )}
                <div className="pt-2">
                  <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm cursor-pointer w-full sm:w-auto">
                    {loading ? "Actualizando..." : "Cambiar Contraseña"}
                  </button>
                </div>
              </form>
          </AccordionItem>

          {/* 3. SECCIÓN CÓDIGO QR */}
          <AccordionItem 
            title="Material para Buses" 
            icon="🖨️" 
            isOpen={openSection === 'qr'} 
            onToggle={() => toggleSection('qr')}
          >
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                Descarga e imprime este código QR para pegarlo en las unidades de transporte. 
                Redirige a los pasajeros a la descarga de la App.
            </p>
            <QrPasajero />
          </AccordionItem>

        </div>
      </div>
    </div>
  );
}