import QRCode from "react-qr-code";

export const QrChofer = () => {
  // 👇 Enlace de VISTA PREVIA de Google Drive (ID: 1ngIemOjuzgMO-8Dov6D1CdCjIbprGnhS)
  const linkChofer = "https://drive.google.com/file/d/1ngIemOjuzgMO-8Dov6D1CdCjIbprGnhS/view";

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
        Escanea para ir a la descarga
      </p>
    </div>
  );
};