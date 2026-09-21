import { useState, useCallback, useRef, useEffect } from 'react';
import { isWebNFCSupported, isSecureContextSupported, parseTapTrackUrl, createScanDebouncer } from '../utils/nfcParser';
import cardService from '../services/cardService';

/**
 * Web NFC Hook (v0.4.0 ALPHA)
 *
 * Manages NDEFReader scan lifecycle, permission requests, in-memory debounce,
 * and backend credential verification without recording attendance.
 */
export default function useNFC() {
  const supportsWebNFC = isWebNFCSupported();
  const isSecure = isSecureContextSupported();

  const [status, setStatus] = useState(() => {
    if (!supportsWebNFC) return 'UNSUPPORTED';
    if (!isSecure) return 'INSECURE';
    return 'READY';
  });

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const debouncerRef = useRef(createScanDebouncer(1800));

  const stopScan = useCallback(() => {
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      controllerRef.current = null;
    }
    setScanning(false);
    setStatus((prev) => (prev === 'UNSUPPORTED' || prev === 'INSECURE' ? prev : 'READY'));
  }, []);

  const resetScan = useCallback(() => {
    setResult(null);
    setError(null);
    debouncerRef.current.reset();
    if (scanning) {
      setStatus('SCANNING');
    } else {
      setStatus('READY');
    }
  }, [scanning]);

  const startScan = useCallback(async () => {
    if (!isWebNFCSupported()) {
      setStatus('UNSUPPORTED');
      setError({
        code: 'NOT_SUPPORTED',
        message: 'Web NFC is not supported on this device/browser. Android Chrome or compatible Chromium is required.',
      });
      return;
    }

    if (!isSecureContextSupported()) {
      setStatus('INSECURE');
      setError({
        code: 'INSECURE_CONTEXT',
        message: 'Web NFC requires a secure context (HTTPS).',
      });
      return;
    }

    // Stop existing scan if any
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setError(null);
    setResult(null);
    setStatus('REQUESTING_PERMISSION');
    setScanning(true);

    try {
      const reader = new window.NDEFReader();
      await reader.scan({ signal: controller.signal });

      setStatus('SCANNING');

      reader.onreading = async (event) => {
        try {
          const records = event.message?.records || [];
          let rawUrl = null;

          for (const record of records) {
            if (record.recordType === 'url') {
              const decoder = new TextDecoder();
              rawUrl = decoder.decode(record.data);
              break;
            } else if (record.recordType === 'text') {
              const decoder = new TextDecoder(record.encoding || 'utf-8');
              const text = decoder.decode(record.data);
              if (text.startsWith('http://') || text.startsWith('https://')) {
                rawUrl = text;
                break;
              }
            }
          }

          if (!rawUrl) {
            setError({
              code: 'NO_URL_RECORD',
              message: 'No NDEF URL record found on this NFC card. Cards must be provisioned with a TapTrack /t URL.',
            });
            setStatus('ERROR');
            return;
          }

          const parsed = parseTapTrackUrl(rawUrl);
          if (!parsed.valid) {
            setError({
              code: parsed.code || 'INVALID_URL',
              message: parsed.error || 'NFC card URL is invalid or malformed.',
            });
            setStatus('ERROR');
            return;
          }

          // Ephemeral in-memory debounce to suppress rapid duplicate reads
          if (!debouncerRef.current.shouldProcess(parsed.token)) {
            return;
          }

          // Send credential to backend for authoritative verification
          setStatus('VERIFYING');
          const response = await cardService.verifyCardToken(parsed.token);

          if (response.data && response.data.valid) {
            setResult(response.data);
            setStatus('SUCCESS');
          } else {
            setError({
              code: response.data?.code || 'VERIFICATION_FAILED',
              message: response.data?.error || 'Card verification failed.',
            });
            setStatus('ERROR');
          }
        } catch (readErr) {
          const errData = readErr.response?.data;
          setError({
            code: errData?.code || 'VERIFICATION_FAILED',
            message: errData?.error || readErr.message || 'Error verifying NFC card.',
          });
          setStatus('ERROR');
        }
      };

      reader.onreadingerror = () => {
        setError({
          code: 'READ_ERROR',
          message: 'Could not read NFC card. Please hold the card steady against the back of your phone and try again.',
        });
        setStatus('ERROR');
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        // Scanning stopped by user
        setScanning(false);
        setStatus('READY');
        return;
      }

      setScanning(false);

      if (err.name === 'NotAllowedError') {
        setStatus('ERROR');
        setError({
          code: 'PERMISSION_DENIED',
          message: 'NFC permission was denied. Please allow NFC permissions in your browser settings to scan cards.',
        });
      } else if (err.name === 'NotSupportedError') {
        setStatus('UNSUPPORTED');
        setError({
          code: 'NOT_SUPPORTED',
          message: 'Web NFC is not supported or NFC is disabled in device settings.',
        });
      } else {
        setStatus('ERROR');
        setError({
          code: 'SCAN_FAILED',
          message: err.message || 'Failed to start Web NFC scanner.',
        });
      }
    }
  }, []);

  // Clean up reader on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        try {
          controllerRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    supportsWebNFC,
    isSecure,
    scanning,
    status,
    result,
    error,
    startScan,
    stopScan,
    resetScan,
  };
}
