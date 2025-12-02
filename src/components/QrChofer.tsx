import QRCode from "react-qr-code";

export const QrChofer = () => {
  // 👇 Enlace de VISTA PREVIA de Google Drive (ID: 1D5Zz3jsAy7yGkdNF4OEhVJ-twYvR4PHH)
  const linkChofer = "https://drive.google.com/file/d/1D5Zz3jsAy7yGkdNF4OEhVJ-twYvR4PHH/view";

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center transition-colors duration-300">
      
      {/* Contenedor blanco para el QR (necesario para el contraste) */}
      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-inner">
        <QRCode 
          value={linkChofer} 
          size={180} 
          fgColor="#000000" // Siempre negro para que lea bien
          bgColor="#ffffff" // Siempre blanco el fondo del QR
        />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-300 mt-4 text-center font-medium">
        Escanea para descargar la App Chofer
      </p>
    </div>
  );
};