import { Link } from "react-router-dom"; // <--- Importante importar Link

export const LandingPasajero = () => {
  const linkPasajero = "https://tu-proyecto.supabase.co/storage/v1/object/public/instaladores/pasajero.apk";

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-cyan-400 flex flex-col items-center justify-center font-sans">
      
      {/* BARRA SUPERIOR */}
      <nav className="absolute top-0 w-full p-6 flex justify-between box-border">
        <span className="text-white font-bold text-xl">🚍 Precisión en Ruta</span>
        
        {/* BOTÓN PARA IR AL LOGIN DEL ADMIN */}
        <Link to="/login" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
          Soy Administrador
        </Link>
      </nav>

      {/* CONTENIDO CENTRAL */}
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-[90%]">
        <h1 className="text-gray-800 text-3xl font-bold mb-4">Viaja Seguro</h1>
        <p className="text-gray-600 mb-8">Descarga nuestra aplicación para ver la ubicación de tu bus en tiempo real.</p>
        
        <a href={linkPasajero} className="block bg-green-500 text-white p-4 rounded-full text-lg font-bold shadow-lg hover:bg-green-600 transition-transform hover:scale-105">
          ⬇ Descargar App Android
        </a>
        
        <p className="mt-6 text-xs text-gray-400">Versión 1.0 • Expresos a la Costa</p>
      </div>
    </div>
  );
};