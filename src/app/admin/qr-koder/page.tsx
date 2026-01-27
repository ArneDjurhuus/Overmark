'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  QrCode, 
  RefreshCw, 
  Printer, 
  Check,
  Copy,
  PrinterCheck
} from 'lucide-react';
import QRCode from 'qrcode';

interface RoomQRCode {
  id: string;
  room_number: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export default function QRKoderPage() {
  const [qrCodes, setQrCodes] = useState<RoomQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printingCode, setPrintingCode] = useState<RoomQRCode | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printAllMode, setPrintAllMode] = useState(false);

  const supabase = createSupabaseBrowserClient();
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchQRCodes = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('room_qr_codes')
      .select('*')
      .eq('is_active', true)
      .order('room_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching QR codes:', error);
    } else {
      // Sort numerically
      const sorted = (data || []).sort((a, b) => {
        const numA = parseInt(a.room_number) || 0;
        const numB = parseInt(b.room_number) || 0;
        return numA - numB;
      });
      setQrCodes(sorted);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  const generateNewCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleRegenerateCode = async (roomCode: RoomQRCode) => {
    if (!confirm(`Generer ny QR-kode for værelse ${roomCode.room_number}?\n\nDen gamle kode vil ikke længere virke.`)) {
      return;
    }
    
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Deactivate old code
      await supabase
        .from('room_qr_codes')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', roomCode.id);
      
      // Create new code
      const newCode = generateNewCode();
      const { error } = await supabase
        .from('room_qr_codes')
        .insert({
          room_number: roomCode.room_number,
          code: newCode,
          created_by: user?.id,
        });
      
      if (error) throw error;
      
      fetchQRCodes();
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      alert('Der skete en fejl. Prøv igen.');
    }
    
    setSaving(false);
  };

  const handlePrint = async (roomCode: RoomQRCode) => {
    setPrintingCode(roomCode);
    
    const loginUrl = `${appUrl}/login?code=${roomCode.code}`;
    try {
      const dataUrl = await QRCode.toDataURL(loginUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
      setShowPrintModal(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Kunne ikke generere QR-kode billede.');
    }
  };

  const handlePrintAll = async () => {
    setPrintAllMode(true);
    const urls = new Map<string, string>();
    
    for (const qrCode of qrCodes) {
      const loginUrl = `${appUrl}/login?code=${qrCode.code}`;
      try {
        const dataUrl = await QRCode.toDataURL(loginUrl, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        urls.set(qrCode.room_number, dataUrl);
      } catch {
        console.error('Error generating QR code for room', qrCode.room_number);
      }
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Kunne ikke åbne print-vindue. Tillad pop-ups og prøv igen.');
      setPrintAllMode(false);
      return;
    }
    
    const qrCards = qrCodes.map(qr => `
      <div class="card">
        <h2>Værelse ${qr.room_number}</h2>
        <img src="${urls.get(qr.room_number)}" alt="QR" />
        <p>Scan for at logge ind</p>
      </div>
    `).join('');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-koder - Alle værelser</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 1rem; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
            .card { border: 2px solid #333; border-radius: 12px; padding: 1rem; text-align: center; page-break-inside: avoid; }
            h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
            img { width: 100%; max-width: 150px; height: auto; margin: 0.5rem 0; }
            p { font-size: 0.75rem; color: #666; }
            @media print { .grid { grid-template-columns: repeat(4, 1fr); } .card { border: 1px solid #333; } }
          </style>
        </head>
        <body>
          <div class="grid">${qrCards}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setPrintAllMode(false);
  };

  const printQRCode = () => {
    if (!printingCode || !qrDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-kode - Værelse ${printingCode.room_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; }
            .card { border: 3px solid #333; border-radius: 16px; padding: 2rem; max-width: 400px; }
            h1 { font-size: 2.5rem; margin-bottom: 1rem; }
            img { max-width: 100%; height: auto; margin-bottom: 1.5rem; }
            .instructions { font-size: 1rem; color: #666; line-height: 1.5; }
            @media print { body { padding: 0; } .card { border: 2px solid #333; } }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Værelse ${printingCode.room_number}</h1>
            <img src="${qrDataUrl}" alt="QR Code" />
            <p class="instructions">Scan denne QR-kode med din telefon for at logge ind på appen.</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyLoginUrl = async (code: string) => {
    const loginUrl = `${appUrl}/login?code=${code}`;
    await navigator.clipboard.writeText(loginUrl);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">QR-koder</h1>
          <p className="text-gray-400 mt-1">Værelser 1-40 • Generer nye koder ved beboerskift</p>
        </div>
        <button 
          onClick={handlePrintAll}
          disabled={printAllMode || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <PrinterCheck className="w-5 h-5" />
          Print alle
        </button>
      </div>

      {/* QR Codes Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/2 mx-auto mb-3" />
              <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      ) : qrCodes.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl">
          <QrCode className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Ingen QR-koder fundet</h3>
          <p className="text-gray-500">Kontakt administrator</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {qrCodes.map((qrCode) => (
            <motion.div 
              key={qrCode.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-4 text-center group hover:bg-gray-700 transition-colors"
            >
              <div className="text-3xl font-bold text-white mb-1">
                {qrCode.room_number}
              </div>
              <div className="text-xs text-gray-500 mb-3 font-mono">
                {qrCode.code}
              </div>

              <div className="flex gap-1 justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePrint(qrCode)}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="Print QR-kode"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyLoginUrl(qrCode.code)}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="Kopiér login URL"
                >
                  {copiedId === qrCode.code ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleRegenerateCode(qrCode)}
                  disabled={saving}
                  className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  title="Generer ny kode (ved beboerskift)"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Print Preview Modal */}
      <AnimatePresence>
        {showPrintModal && printingCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPrintModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-sm text-center"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Værelse {printingCode.room_number}
              </h2>
              
              {qrDataUrl && (
                <Image 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  width={192}
                  height={192}
                  className="mx-auto mb-4 rounded-lg"
                  unoptimized
                />
              )}
              
              <p className="text-sm text-gray-500 mb-6">
                Scan denne QR-kode med din telefon for at logge ind på appen.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Luk
                </button>
                <button
                  onClick={printQRCode}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
