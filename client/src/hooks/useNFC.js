// Web NFC hook — feature detection and NDEFReader management
import { useState, useCallback } from 'react';

const supportsWebNFC = typeof window !== 'undefined' && 'NDEFReader' in window;

export default function useNFC() {
  const [scanning, setScanning] = useState(false);
  const [lastRead, _setLastRead] = useState(null);
  const [error, setError] = useState(null);

  const startScan = useCallback(async () => {
    if (!supportsWebNFC) {
      setError('Web NFC is not supported in this browser');
      return;
    }
    // NDEFReader scan logic — v0.4.0 ALPHA
    setScanning(true);
  }, []);

  const stopScan = useCallback(() => {
    setScanning(false);
  }, []);

  return { supportsWebNFC, scanning, lastRead, error, startScan, stopScan };
}
