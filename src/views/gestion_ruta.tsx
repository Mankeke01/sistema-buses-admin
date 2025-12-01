import { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
import { supabase } from "../lib/supabaseClient";

// --- CONFIGURACIÓN ---
mapboxgl.accessToken = "pk.eyJ1IjoidWx0aW1hdGUtcmFrb3IiLCJhIjoiY21nY3B3cTlkMHM3ZDJtb3FkMml3azFlOSJ9.gyyt8Kdnuad_XqPMbUCfgw";

// --- INTERFACES ---
export interface Route {
  id_ruta: number; 
  nombre: string;
  origen: string;
  destino: string;
  hora_inicio?: string;
  hora_fin?: string;
  distancia_km?: number;
  duracion_min?: number;
}
type RouteForm = Omit<Route, "id_ruta">;

// ==========================================
// 1. COMPONENTE MAP SELECTOR (CON RUTAS REALES)
// ==========================================
const MapSelector = ({
  open,
  modo,
  onClose,
  onSelect,
}: {
  open: boolean;
  modo: "origen" | "destino";
  onClose: () => void;
  onSelect: (
    coords: string,
    extra: { distanciaKm: number; duracionMin: number }
  ) => void;
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const origenRef = useRef<mapboxgl.Marker | null>(null);
  const destinoRef = useRef<mapboxgl.Marker | null>(null);
  
  const [origen, setOrigen] = useState<[number, number] | null>(null);
  const [destino, setDestino] = useState<[number, number] | null>(null);

  const [distanciaKm, setDistanciaKm] = useState(0);
  const [duracionMin, setDuracionMin] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // 1. Inicialización del Mapa
  useEffect(() => {
    if (!open) return;

    const timerInit = setTimeout(() => {
      if (map.current || !mapRef.current) return;

      map.current = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-73.24402, -39.81289], // Valdivia
        zoom: 11,
        attributionControl: false,
      });

      map.current.on("load", () => {
        map.current?.resize();
      });

      map.current.on("click", (e) => {
        const { lng, lat } = e.lngLat;

        if (modo === "origen") {
          if (origenRef.current) origenRef.current.remove();
          origenRef.current = new mapboxgl.Marker({ color: "#22c55e" })
            .setLngLat([lng, lat])
            .addTo(map.current!);
          setOrigen([lng, lat]);
        }

        if (modo === "destino") {
          if (destinoRef.current) destinoRef.current.remove();
          destinoRef.current = new mapboxgl.Marker({ color: "#ef4444" })
            .setLngLat([lng, lat])
            .addTo(map.current!);
          setDestino([lng, lat]);
        }
      });
    }, 100);

    const timerResize = setTimeout(() => {
        if (map.current) map.current.resize();
    }, 400);

    return () => {
      clearTimeout(timerInit);
      clearTimeout(timerResize);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [open, modo]);

  // 2. CALCULAR RUTA REAL (API MAPBOX)
  useEffect(() => {
    if (!origen || !destino || !map.current) return;

    const getRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${origen[0]},${origen[1]};${destino[0]},${destino[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        
        const json = await query.json();
        const data = json.routes[0];
        
        if (!data) return;

        const routeCoords = data.geometry.coordinates;
        
        setDistanciaKm(data.distance / 1000); 
        setDuracionMin(data.duration / 60); 

        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeCoords,
          },
        };

        addOrUpdateRoute(geojson);

        const bbox = turf.bbox(geojson);
        map.current?.fitBounds(bbox as [number, number, number, number], { 
            padding: 80,
            animate: true 
        });

      } catch (error) {
        console.error("Error obteniendo ruta:", error);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    getRoute();

  }, [origen, destino]);

  const addOrUpdateRoute = (route: GeoJSON.Feature<GeoJSON.LineString>) => {
      if (!map.current) return;
      const source = map.current.getSource("ruta") as mapboxgl.GeoJSONSource;

      if (source) {
        source.setData(route);
      } else {
        if (map.current.getLayer("ruta")) map.current.removeLayer("ruta");
        if (map.current.getSource("ruta")) map.current.removeSource("ruta");

        map.current.addLayer({
          id: "ruta",
          type: "line",
          source: {
            type: "geojson",
            data: route,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 5,
            "line-opacity": 0.8
          },
        });
      }
  };

  const confirmar = () => {
    const marker = modo === "origen" ? origen : destino;
    if (!marker) return alert("Por favor selecciona un punto en el mapa");
    const coordsStr = `${marker[1].toFixed(5)}, ${marker[0].toFixed(5)}`;
    onSelect(coordsStr, { distanciaKm, duracionMin });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh] transition-colors duration-300">
        
        <div className="p-4 bg-slate-900 dark:bg-black text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg">
              Seleccionar {modo === "origen" ? "Origen (Verde)" : "Destino (Rojo)"}
            </h3>
            <p className="text-xs text-slate-400">Haz clic en el mapa para marcar</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">✖</button>
        </div>

        <div className="relative flex-1 w-full bg-gray-100 dark:bg-gray-700">
              <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
              
              {(origen && destino) && (
                <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 rounded-xl shadow-xl text-sm border border-slate-200 dark:border-gray-600 z-10 min-w-[200px] text-gray-800 dark:text-gray-200">
                    {isLoadingRoute ? (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400">
                            <span className="animate-spin">⌛</span> Calculando ruta óptima...
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-600 dark:text-gray-300 mb-1 flex justify-between">
                                <span>🛣️ Distancia:</span> 
                                <span className="font-bold text-slate-900 dark:text-white">{distanciaKm.toFixed(1)} km</span>
                            </p>
                            <p className="text-slate-600 dark:text-gray-300 flex justify-between">
                                <span>⏱️ Tiempo:</span> 
                                <span className="font-bold text-slate-900 dark:text-white">{duracionMin.toFixed(0)} min</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-2 border-t dark:border-gray-600 pt-1">Ruta por carretera (Mapbox)</p>
                        </>
                    )}
                </div>
            )}
        </div>

        <div className="p-4 flex justify-end gap-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-gray-300 font-medium hover:bg-slate-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
          <button 
            onClick={confirmar} 
            disabled={isLoadingRoute}
            className={`px-6 py-2 text-white font-bold rounded-lg shadow-md transition-colors ${isLoadingRoute ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. VISTA PRINCIPAL (EXPORT DEFAULT)
// ==========================================
export default function GestionRutas() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState<Route | null>(null);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"origen" | "destino">("origen");

  const [form, setForm] = useState<RouteForm>({
    nombre: "",
    origen: "",
    destino: "",
    hora_inicio: "",
    hora_fin: "",
    distancia_km: 0,
    duracion_min: 0,
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    const { data, error } = await supabase
      .from('ruta')
      .select('*')
      .order('id_ruta', { ascending: true });

    if (error) console.error("Error cargando rutas:", error);
    else setRoutes(data || []);
  };

  const openModal = (route: Route | null = null) => {
    if (route) {
      setCurrent(route);
      setForm({
        nombre: route.nombre,
        origen: route.origen,
        destino: route.destino,
        hora_inicio: route.hora_inicio,
        hora_fin: route.hora_fin,
        distancia_km: route.distancia_km,
        duracion_min: route.duracion_min,
      });
    } else {
      setCurrent(null);
      setForm({
        nombre: "",
        origen: "",
        destino: "",
        hora_inicio: "",
        hora_fin: "",
        distancia_km: 0,
        duracion_min: 0,
      });
    }
    setModalOpen(true);
  };

  const handleOpenMap = (mode: "origen" | "destino") => {
    setMapMode(mode);
    setMapOpen(true);
  };

  const handleMapSelect = (coords: string, extra: { distanciaKm: number; duracionMin: number }) => {
    if (mapMode === "origen") {
      setForm((prev) => ({ ...prev, origen: coords }));
    } else {
      setForm((prev) => ({ 
          ...prev, 
          destino: coords,
          distancia_km: extra.distanciaKm > 0 ? extra.distanciaKm : prev.distancia_km,
          duracion_min: extra.duracionMin > 0 ? extra.duracionMin : prev.duracion_min
      }));
    }
  };

 const handleSave = async () => {
    if (!form.nombre || !form.origen || !form.destino) {
      alert("Faltan datos obligatorios");
      return;
    }

    if (current) {
      const { error } = await supabase
        .from('ruta')
        .update({
          nombre: form.nombre,
          origen: form.origen,
          destino: form.destino,
        })
        .eq('id_ruta', current.id_ruta);

      if (error) alert("Error al actualizar: " + error.message);
      else fetchRoutes(); 
    } else {
      const { error } = await supabase
        .from('ruta')
        .insert([{
          nombre: form.nombre,
          origen: form.origen,
          destino: form.destino,
        }]);

      if (error) alert("Error al crear: " + error.message);
      else fetchRoutes(); 
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar esta ruta permanentemente?")) {
      const { error } = await supabase
        .from('ruta')
        .delete()
        .eq('id_ruta', id); 

      if (error) alert("Error al eliminar: " + error.message);
      else fetchRoutes(); 
    }
  };

  const filtered = routes.filter((r) =>
    [r.nombre, r.origen, r.destino].some((txt) => txt.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <MapSelector 
        open={mapOpen} 
        modo={mapMode} 
        onClose={() => setMapOpen(false)} 
        onSelect={handleMapSelect} 
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Rutas</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Crea y edita los recorridos usando el mapa interactivo.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-transform active:scale-95"
        >
          ➕ Nueva Ruta
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 mb-6 transition-colors">
        <span className="text-xl opacity-50 dark:text-white">🔎</span>
        <input
          className="flex-1 outline-none text-gray-700 dark:text-white bg-transparent placeholder-gray-400"
          placeholder="Buscar rutas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((route) => (
          <div key={route.id_ruta} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{route.nombre}</h3>
                {route.distancia_km ? (
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-md font-medium">
                        {route.distancia_km.toFixed(1)} km
                    </span>
                ) : null}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>📍 <b>Origen:</b> {route.origen}</p>
                <p>🏁 <b>Destino:</b> {route.destino}</p>
                <p>⏰ <b>Horario:</b> {route.hora_inicio} - {route.hora_fin}</p>
              </div>
            </div>
            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button onClick={() => openModal(route)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40">✏️</button>
              <button onClick={() => handleDelete(route.id_ruta)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40">🗑️</button>
            </div>
          </div>
        ))}
        
        {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 border-2 border-dashed dark:border-gray-700 rounded-xl">No hay rutas registradas.</div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center px-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="bg-slate-900 dark:bg-black text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold">{current ? "Editar Ruta" : "Nueva Ruta"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">✖</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Ruta</label>
                <input
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Ruta Costera"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origen (Coordenadas)</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-sm"
                      value={form.origen}
                      readOnly
                      placeholder="Selecciona en el mapa ->"
                    />
                    <button 
                        onClick={() => handleOpenMap("origen")}
                        className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 text-sm font-medium transition-colors"
                    >
                        🗺️ Mapa
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destino (Coordenadas)</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-sm"
                      value={form.destino}
                      readOnly
                      placeholder="Selecciona en el mapa ->"
                    />
                    <button 
                        onClick={() => handleOpenMap("destino")}
                        className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-sm font-medium transition-colors"
                    >
                        🗺️ Mapa
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora Inicio</label>
                  <input type="time" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" value={form.hora_inicio} onChange={(e) => setForm({...form, hora_inicio: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora Fin</label>
                  <input type="time" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" value={form.hora_fin} onChange={(e) => setForm({...form, hora_fin: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2 border-t dark:border-gray-700">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors">💾 Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}