import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff } from 'lucide-react';

/** Camera QR scanner. Ignores the same code for 4 seconds so one ticket isn't submitted repeatedly. */
export default function QRScanner({ onScan }) {
  const [error, setError] = useState('');
  const cb = useRef(onScan);
  cb.current = onScan;
  const last = useRef({ text: '', at: 0 });

  useEffect(() => {
    let cancelled = false;
    let scanner = null;
    let started = null;
    // Small delay so React StrictMode's mount/unmount/mount cycle doesn't fight over the camera.
    const t = setTimeout(() => {
      if (cancelled) return;
      scanner = new Html5Qrcode('qr-reader');
      started = scanner
        .start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 230, height: 230 } },
          (text) => {
            const now = Date.now();
            if (text === last.current.text && now - last.current.at < 4000) return;
            last.current = { text, at: now };
            cb.current(text);
          }, () => {})
        .catch(() => setError('Camera unavailable. Allow camera access (needs HTTPS or localhost), or use the code box below.'));
    }, 60);
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (started) started.then(() => scanner.stop()).then(() => scanner.clear()).catch(() => {});
    };
  }, []);

  return (
    <div className="scanner">
      <div id="qr-reader" style={{ width: '100%' }} />
      {!error && (
        <>
          <div className="frame" />
          <motion.div className="scan-line" initial={{ top: '16%' }} animate={{ top: ['16%', '80%', '16%'] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
        </>
      )}
      {error && <div className="center" style={{ color: '#fff', padding: 40, display: 'grid', gap: 12, justifyItems: 'center' }}><CameraOff size={34} /><p style={{ maxWidth: '34ch' }}>{error}</p></div>}
    </div>
  );
}
