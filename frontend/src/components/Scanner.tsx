import React, { useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScanResult: (data: any) => void;
  mode: 'ocr' | 'barcode';
}

const Scanner: React.FC<ScannerProps> = ({ onScanResult, mode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'barcode') {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: {width: 250, height: 250} }, 
        false
      );

      scanner.render((decodedText) => {
        onScanResult({ barcode: decodedText });
        scanner.clear();
      }, () => {
        // Silent error for scanning frames
      });

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [mode, onScanResult]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await Tesseract.recognize(
        e.target.files[0],
        'eng',
        { logger: m => console.log(m) }
      );
      
      // Simple heuristic for medicine parsing
      const text = result.data.text;
      onScanResult({ rawText: text, source: 'ocr' });
    } catch (err) {
      setError("Failed to process image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {mode === 'barcode' ? (
        <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200"></div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-indigo-600 mb-2" size={48} />
              <p className="text-gray-600 font-medium">Extracting information...</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-white rounded-full shadow-sm text-indigo-600">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">Upload Medicine Package</p>
                <p className="text-gray-500 text-sm">We'll auto-extract name, batch, and expiry.</p>
              </div>
              <label className="cursor-pointer bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Select Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </>
          )}
          {error && <p className="text-rose-600 text-sm font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default Scanner;
