import QRCode from "react-qr-code";

export const QrPasajero = () => {
  // 👇 AQUÍ PEGA TU LINK FINAL DE VERCEL (Ej: https://mi-proyecto.vercel.app)
  // IMPORTANTE: No pongas /login ni /admin, solo la raíz.
  const linkLanding = "https://sistema-buses-admin.vercel.app"; 

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center max-w-sm mx-auto shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-[#000080] uppercase tracking-wider">¡Descarga la App!</h3>
        <p className="text-sm text-gray-500">Escanea para ver el bus en tiempo real</p>
      </div>

      {/* Contenedor del QR (Siempre fondo blanco para que imprima bien) */}
      <div className="bg-white p-2 rounded-lg border border-gray-100">
        <QRCode 
          value={linkLanding} 
          size={200} 
          fgColor="#000080" // Azul corporativo para el código
          bgColor="#ffffff"
        />
      </div>

      <div className="mt-4 text-center">
        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
          {linkLanding}
        </span>
        <p className="text-xs text-gray-400 mt-2">
          *Pega este código en la entrada del bus
        </p>
      </div>
    </div>
  );
};