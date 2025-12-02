import { useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import { toPng } from 'html-to-image';

export const QrPasajero = () => {
  // 👇 Link de tu Landing Page
  const linkLanding = "https://sistema-buses-admin.vercel.app"; 
  
  // Referencia al elemento que queremos "fotografiar"
  const ref = useRef<HTMLDivElement>(null);

  const downloadSticker = useCallback(() => {
    if (ref.current === null) {
      return;
    }

    // Convertimos el elemento a PNG
    toPng(ref.current, { cacheBust: true, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'Sticker-Bus-Imprimible.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Error al generar la imagen:', err);
        alert("Hubo un error al descargar. Intenta de nuevo.");
      });
  }, [ref]);

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* ESTE ES EL CONTENEDOR QUE SE VA A DESCARGAR */}
      {/* Usamos 'ref' para identificarlo, es más seguro que el ID */}
      <div 
        ref={ref}
        className="bg-white p-8 rounded-xl border-4 border-dashed border-slate-300 flex flex-col items-center text-center max-w-sm w-full shadow-sm"
      >
        <div className="mb-5">
          <h3 className="text-2xl font-black text-[#000080] uppercase tracking-wide leading-none mb-1">
            ¡DESCARGA LA APP!
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Escanea para ver el bus en tiempo real
          </p>
        </div>

        {/* Contenedor del QR */}
        <div className="bg-white p-2 rounded-lg border-2 border-slate-100">
          <QRCode 
            value={linkLanding} 
            size={220} 
            fgColor="#000080" // Azul corporativo
            bgColor="#ffffff"
          />
        </div>

        <div className="mt-5">
          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
          </p>
        </div>
      </div>

      {/* BOTÓN DE DESCARGA */}
      <button 
        onClick={downloadSticker}
        className="mt-6 bg-[#000080] hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
      >
        🖨️ Descargar Sticker (PNG)
      </button>
    </div>
  );
};