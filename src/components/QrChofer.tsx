import QRCode from "react-qr-code";

export const QrChofer = () => {
  // Pon tu link de Supabase real aquí
  const linkChofer = "https://tu-proyecto.supabase.co/storage/v1/object/public/instaladores/chofer.apk";

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', display: 'inline-block', textAlign: 'center' }}>
      <div style={{ background: 'white', padding: '10px' }}>
        <QRCode value={linkChofer} size={150} />
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Escanea para descargar</p>
    </div>
  );
};