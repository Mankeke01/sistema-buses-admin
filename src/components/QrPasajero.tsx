import QRCode from "react-qr-code";

export const QrPasajero = () => {
  // 👇 Tu link de la landing page
  const linkLanding = "https://sistema-buses-admin.vercel.app"; 

  // Función mágica para descargar el QR como imagen
  const downloadQr = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = "QR-Bus-Pasajeros.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center max-w-sm w-full shadow-lg" id="qr-container">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-[#000080] uppercase tracking-wider">¡Descarga la App!</h3>
          <p className="text-sm text-gray-500">Escanea para ver el bus en tiempo real</p>
        </div>

        <div className="bg-white p-2 rounded-lg border border-gray-100">
          <QRCode 
            id="qr-code-svg" // ID importante para la descarga
            value={linkLanding} 
            size={200} 
            fgColor="#000080" 
            bgColor="#ffffff"
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 mt-2">
            *Pega este código en la entrada del bus
          </p>
        </div>
      </div>

      {/* BOTÓN DE DESCARGA REAL */}
      <button 
        onClick={downloadQr}
        className="mt-6 bg-[#000080] hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-transform active:scale-95 flex items-center gap-2"
      >
        📥 Descargar Imagen (PNG)
      </button>
    </div>
  );
};