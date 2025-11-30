import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { QrChofer } from "../components/QrChofer"; // <--- Importamos el componente QR

// --- TIPOS Y ESTADOS ---
type DriverState = "Disponible" | "En Ruta" | "Inactivo";

export interface Driver {
  id_chofer: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: DriverState;
  id_ruta_actual?: number | null;
  ruta?: { nombre: string };
}

interface Route {
  id_ruta: number;
  nombre: string;
}

type DriverForm = Omit<Driver, "id_chofer" | "ruta">;

// --- INTERFAZ PARA EL MODAL ---
interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// --- MODAL COMPONENT (Actualizado para Dark Mode) ---
const Modal = ({ open, title, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 px-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="bg-gray-900 dark:bg-black text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-xl">✖</button>
        </div>
        <div className="p-6 text-gray-800 dark:text-gray-200">{children}</div>
      </div>
    </div>
  );
};

// --- VISTA PRINCIPAL ---
export default function GestionChoferes() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false); // Estado para el modal del QR
  const [current, setCurrent] = useState<Driver | null>(null);

  const [form, setForm] = useState<DriverForm>({
    nombre: "",
    email: "",
    telefono: "",
    estado: "Disponible",
    id_ruta_actual: null,
  });

  // 1. CARGAR DATOS
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // A. Choferes
    const { data: driversData, error: driversError } = await supabase
      .from('chofer')
      .select(`
        *,
        ruta:id_ruta_actual ( nombre )
      `)
      .order('id_chofer', { ascending: true });

    if (driversError) console.error("Error cargando choferes:", driversError);
    else setDrivers((driversData as unknown as Driver[]) || []);

    // B. Rutas
    const { data: routesData } = await supabase
      .from('ruta')
      .select('id_ruta, nombre')
      .order('nombre');
      
    setRoutes(routesData || []);
    setLoading(false);
  };

  // Abrir modal
  const openModal = (driver: Driver | null = null) => {
    if (driver) {
      setCurrent(driver);
      setForm({
        nombre: driver.nombre,
        email: driver.email || "",
        telefono: driver.telefono,
        estado: driver.estado,
        id_ruta_actual: driver.id_ruta_actual || null,
      });
    } else {
      setCurrent(null);
      setForm({
        nombre: "",
        email: "",
        telefono: "",
        estado: "Disponible",
        id_ruta_actual: null,
      });
    }
    setModalOpen(true);
  };

  // 2. GUARDAR
  const handleSave = async () => {
    if (!form.nombre || !form.telefono) {
      alert("Nombre y Teléfono son obligatorios");
      return;
    }

    const payload = {
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      estado: form.estado,
      id_ruta_actual: form.id_ruta_actual === 0 ? null : form.id_ruta_actual
    };

    if (current) {
      const { error } = await supabase
        .from('chofer')
        .update(payload)
        .eq('id_chofer', current.id_chofer);

      if (error) alert("Error actualizando: " + error.message);
      else fetchData();
    } else {
      const { error } = await supabase
        .from('chofer')
        .insert([payload]);

      if (error) alert("Error creando: " + error.message);
      else fetchData();
    }
    setModalOpen(false);
  };

  // 3. ELIMINAR
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar a este chófer?")) {
      const { error } = await supabase
        .from('chofer')
        .delete()
        .eq('id_chofer', id);

      if (error) alert("Error eliminando: " + error.message);
      else fetchData();
    }
  };

  // Helper de color (Actualizado para Dark Mode)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disponible": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "En Ruta": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "Inactivo": return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const filtered = drivers.filter((d) =>
    [d.nombre, d.email, d.telefono].some((txt) =>
      txt?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* HEADER DE LA VISTA */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Chóferes</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Asigna rutas y administra el personal.</p>
        </div>
        
        <div className="flex gap-3">
            {/* BOTÓN QR */}
            <button 
                onClick={() => setQrModalOpen(true)} 
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
                📱 App Instalación
            </button>

            {/* BOTÓN NUEVO */}
            <button onClick={() => openModal()} className="bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 cursor-pointer">
                ➕ Nuevo Chófer
            </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 mb-6 transition-colors">
        <span className="text-xl opacity-50 dark:text-white">🔎</span>
        <input
          className="flex-1 outline-none text-gray-700 dark:text-white bg-transparent placeholder-gray-400"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LISTA DE CHOFERES */}
      {loading ? <p className="text-gray-500 dark:text-gray-400 text-center">Cargando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((driver) => (
            <div key={driver.id_chofer} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl">👤</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{driver.nombre}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(driver.estado)}`}>
                          {driver.estado}
                        </span>
                      </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <p>📧 {driver.email || "Sin email"}</p>
                  <p>📱 {driver.telefono}</p>
                  
                  <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                    <p className="text-xs text-gray-400 uppercase font-bold">Ruta Asignada:</p>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {driver.ruta ? `📍 ${driver.ruta.nombre}` : "🚫 Sin asignación"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-50 dark:border-gray-700">
                <button onClick={() => openModal(driver)} className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer">✏️ Editar</button>
                <button onClick={() => handleDelete(driver.id_chofer)} className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL EDITAR/CREAR */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={current ? "Editar Chófer" : "Nuevo Chófer"}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
            <input className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
            <input className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
              <select 
                className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                value={form.estado} 
                onChange={(e) => setForm({ ...form, estado: e.target.value as DriverState })}
              >
                <option value="Disponible">Disponible</option>
                <option value="En Ruta">En Ruta</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">🛣️ Asignar Ruta</label>
            <select 
              className="w-full p-2.5 border-2 border-blue-100 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 font-medium focus:border-blue-500 outline-none"
              value={form.id_ruta_actual || 0}
              onChange={(e) => setForm({ ...form, id_ruta_actual: Number(e.target.value) })}
            >
              <option value={0}>-- Sin Asignar --</option>
              {routes.map(r => (
                <option key={r.id_ruta} value={r.id_ruta}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Selecciona la ruta que realizará este conductor.</p>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">💾 Guardar</button>
          </div>
        </div>
      </Modal>

      {/* MODAL QR (Exclusivo) */}
      <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Instalación App Chofer">
         <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                Muestra este código al conductor para instalar la aplicación.
            </p>
            {/* El componente del QR */}
            <QrChofer />
         </div>
      </Modal>
    </div>
  );
}