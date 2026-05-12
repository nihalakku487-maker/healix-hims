import { useEffect, useRef } from 'react';

/**
 * Listens globally for high-frequency keypress events typical of external
 * hardware barcode scanners (acting as USB keyboards).
 * @param {Function} onScan - Callback received with scanned barcode string
 */
export const useBarcodeScanner = (onScan) => {
  const buffer = useRef([]);
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      
      // Logic: Human typing generally takes ~100-200ms per key.
      // Scanners output characters in rapid burst (< 15ms intervals).
      // If gap since last key exceeds 50ms, assume buffer reset (it's human/new scan).
      const timeDiff = currentTime - lastKeyTime.current;
      
      if (timeDiff > 50) {
        buffer.current = [];
      }

      lastKeyTime.current = currentTime;

      // Handheld scanners usually append 'Enter' or 'Tab' suffix on success
      if (e.key === 'Enter') {
        if (buffer.current.length > 3) { 
          const code = buffer.current.join('');
          onScan(code);
          e.preventDefault(); // Stop form submission if focus happened to be on an input
        }
        buffer.current = [];
        return;
      }

      // Exclude control keys
      if (e.key.length === 1) {
        buffer.current.push(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan]);
};
