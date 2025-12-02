import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { QrChofer } from "../components/QrChofer";

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

// Extendemos para incluir password en el formulario
type DriverForm = Omit<Driver, "id_chofer" | "ruta"> & { password?: string };

// --- INTERFAZ PARA EL MODAL ---
interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// --- MODAL COMPONENT ---
const Modal = ({ open, title, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="bg-slate-900 dark:bg-black text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✖</button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [current, setCurrent] = useState<Driver | null>(null);

  const [form, setForm] = useState<DriverForm>({
    nombre: "",
    email: "",
    telefono: "",
    estado: "Disponible",
    id_ruta_actual: null,
    password: "", // Campo contraseña inicializado
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
      .select(`*, ruta:id_ruta_actual ( nombre )`)
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
        password: "", // No mostramos password al editar
      });
    } else {
      setCurrent(null);
      setForm({
        nombre: "",
        email: "",
        password: "", // Vacío para nuevo usuario
        telefono: "",
        estado: "Disponible",
        id_ruta_actual: null,
      });
    }
    setModalOpen(true);
  };

  // 2. GUARDAR (Lógica Principal)
  const handleSave = async () => {
    if (!form.nombre || !form.telefono || !form.email) {
      alert("Nombre, Email y Teléfono son obligatorios");
      return;
    }

    // Validación de contraseña solo para nuevos
    if (!current && (!form.password || form.password.length < 6)) {
        alert("Para un nuevo chófer, la contraseña es obligatoria (mín. 6 caracteres)");
        return;
    }

    // Payload básico para actualizar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      estado: form.estado,
      id_ruta_actual: form.id_ruta_actual === 0 ? null : form.id_ruta_actual
    };

    if (current) {
      // --- MODO EDICIÓN (UPDATE SIMPLE) ---
      // Aquí solo actualizamos los datos de la tabla, no tocamos el usuario Auth
      const { error } = await supabase
        .from('chofer')
        .update(payload)
        .eq('id_chofer', current.id_chofer);

      if (error) alert("Error actualizando: " + error.message);
      else fetchData();
      
    } else {
      // --- MODO CREACIÓN (INSERT CON RPC) ---
      // Aquí llamamos a la función SQL que crea Usuario Auth + Ficha Chofer a la vez
      const { error } = await supabase.rpc('crear_chofer_con_auth', {
        nombre_input: form.nombre,
        email_input: form.email,
        password_input: form.password, // Enviamos la contraseña
        telefono_input: form.telefono,
        estado_input: form.estado,
        id_ruta_input: payload.id_ruta_actual
      });

      if (error) {
        console.error(error);
        // Fallback: Si no existe la RPC, intentamos insert normal (sin auth)
        if (error.message.includes('function not found')) {
             const { error: insertError } = await supabase.from('chofer').insert([payload]);
             if (insertError) alert("Error creando chofer: " + insertError.message);
             else {
                alert("⚠️ Chofer creado en tabla, pero NO se creó el usuario Auth (Falta función SQL).");
                fetchData();
             }
        } else {
            alert("Error al crear usuario: " + error.message);
        }
      } else {
        alert("✅ Usuario y Chofer creados correctamente.");
        fetchData();
      }
    }
    setModalOpen(false);
  };

  // 3. ELIMINAR
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar a este chófer? (El usuario perderá acceso)")) {
      const { error } = await supabase
        .from('chofer')
        .delete()
        .eq('id_chofer', id);

      if (error) alert("Error eliminando: " + error.message);
      else fetchData();
    }
  };

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
    <div className="p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Gestión de Chóferes</h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Asigna rutas y administra el personal.</p>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={() => setQrModalOpen(true)} 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
                📱 App Instalación
            </button>

            <button onClick={() => openModal()} className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95">
                ➕ Nuevo Chófer
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3 mb-6 transition-colors">
        <span className="text-xl opacity-50 dark:text-white">🔎</span>
        <input
          className="flex-1 outline-none text-slate-700 dark:text-white bg-transparent placeholder-slate-400"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <p className="text-slate-500 dark:text-gray-400 text-center">Cargando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((driver) => (
            <div key={driver.id_chofer} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl">👤</div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{driver.nombre}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(driver.estado)}`}>
                          {driver.estado}
                        </span>
                      </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-gray-300 mb-6">
                  <p>📧 {driver.email || "Sin email"}</p>
                  <p>📱 {driver.telefono}</p>
                  
                  <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-bold">Ruta Asignada:</p>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {driver.ruta ? `📍 ${driver.ruta.nombre}` : "🚫 Sin asignación"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-50 dark:border-slate-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(driver)} className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer">✏️ Editar</button>
                <button onClick={() => handleDelete(driver.id_chofer)} className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE FORMULARIO */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={current ? "Editar Chófer" : "Nuevo Chófer"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nombre Completo</label>
            <input className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Correo Electrónico (Usuario)</label>
            <input className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          {/* CAMPO CONTRASEÑA (SOLO SI ES NUEVO) */}
          {!current && (
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Contraseña (Acceso App)</label>
                <input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                />
                <p className="text-xs text-slate-500 mt-1">Esta clave permitirá al chofer iniciar sesión en la App.</p>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Estado</label>
              <select 
                className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                value={form.estado} 
                onChange={(e) => setForm({ ...form, estado: e.target.value as DriverState })}
              >
                <option value="Disponible">Disponible</option>
                <option value="En Ruta">En Ruta</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">🛣️ Asignar Ruta</label>
            <select 
              className="w-full p-2.5 border-2 border-blue-100 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 font-medium focus:border-blue-500 outline-none transition-colors"
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
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Selecciona la ruta que realizará este conductor.</p>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer shadow-sm">
                {current ? "💾 Guardar Cambios" : "✨ Crear Usuario y Chofer"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL QR */}
      <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Instalación App Chofer">
         <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 text-center px-4">
                Muestra este código al conductor para instalar la aplicación operativa en su dispositivo.
            </p>
            <QrChofer />
         </div>
      </Modal>
    </div>
  );
}