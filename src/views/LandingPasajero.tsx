import { Link } from "react-router-dom";

export const LandingPasajero = () => {
  // 👇 LINK "TRUCADO" DE GOOGLE DRIVE DEL PASAJERO
  // Recuerda reemplazar "TU_ID_DEL_PASAJERO" con el ID real de tu archivo en Drive
const linkPasajero = "https://drive.google.com/uc?export=download&id=1ngIemOjuzgMO-8Dov6D1CdCjIbprGnhS";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans transition-colors duration-300 bg-gray-50 dark:bg-gray-950">
      
      {/* BARRA SUPERIOR */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center box-border z-10">
        <span className="font-bold text-xl text-[#000080] dark:text-blue-400">
          🚍 Precisión en Ruta
        </span>
        
        {/* Botón Admin adaptable */}
        <Link to="/login" className="bg-[#000080] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors">
          Soy Administrador
        </Link>
      </nav>

      {/* CONTENIDO CENTRAL */}
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl text-center max-w-md w-[90%] z-10 relative border border-gray-100 dark:border-gray-700 transition-colors">
        <h1 className="text-3xl font-bold mb-4 text-[#000080] dark:text-white">
          Viaja Seguro
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Descarga nuestra aplicación para ver la ubicación de tu bus en tiempo real.
        </p>
        
        {/* Botón de Descarga Principal */}
        <a 
          href={linkPasajero} 
          className="block bg-[#000080] text-white p-4 rounded-full text-lg font-bold shadow-lg hover:bg-blue-900 dark:bg-green-600 dark:hover:bg-green-700 transition-all hover:scale-105"
        >
          ⬇ Descargar App Android
        </a>
        
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">Versión 1.0 • Expresos a la Costa</p>
      </div>

      {/* Onda decorativa (Se adapta al color del tema) */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 320" className="w-full h-auto text-[#000080]/10 dark:text-blue-900/20 fill-current transition-colors">
            <path fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
};