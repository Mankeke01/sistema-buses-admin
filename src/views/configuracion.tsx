import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Configuracion() {
  // Estado para el Tema
  const [isDark, setIsDark] = useState(false);

  // Estados para la Contraseña
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 1. Cargar preferencia de tema al iniciar
  useEffect(() => {
    // Verificar si la clase 'dark' ya está en el HTML (cargada desde localStorage en main.tsx o index.html)
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  // 2. Función para cambiar el tema (Compatible con Tailwind v4)
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

  // 3. Función para cambiar contraseña en Supabase
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

    const { error } = await supabase.auth.updateUser({
      password: passwords.new
    });

    if (error) {
      setMessage({ type: 'error', text: "Error: " + error.message });
    } else {
      setMessage({ type: 'success', text: "¡Contraseña actualizada correctamente!" });
      setPasswords({ new: "", confirm: "" });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Configuración del Sistema</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TARJETA 1: APARIENCIA */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎨</span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Apariencia</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-200">Modo Oscuro</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cambia entre tema claro y oscuro.</p>
            </div>
            
            {/* Switch Personalizado */}
            <button 
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* TARJETA 2: SEGURIDAD */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔒</span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Seguridad</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña</label>
              <input 
                type="password" 
                className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                placeholder="Mínimo 6 caracteres"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Contraseña</label>
              <input 
                type="password" 
                className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                placeholder="Repite la contraseña"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm cursor-pointer"
              >
                {loading ? "Actualizando..." : "Cambiar Contraseña"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}