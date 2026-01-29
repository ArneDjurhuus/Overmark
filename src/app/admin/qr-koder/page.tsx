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
  PrinterCheck,
  User,
  Plus,
  Home,
} from 'lucide-react';
import QRCode from 'qrcode';

interface RoomQRCode {
  id: string;
  room_number: string;
  code: string;
  is_active: boolean;
  created_at: string;
  resident_name: string | null;
}

interface ResidentProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  room_number: string | null;
}

interface RoomWithResident {
  qrCode: RoomQRCode | null;
  resident: ResidentProfile | null;
  room_number: string;
}

export default function QRKoderPage() {
  const [rooms, setRooms] = useState<RoomWithResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printingRoom, setPrintingRoom] = useState<RoomWithResident | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printAllMode, setPrintAllMode] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchData = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    setLoading(true);
    
    // Fetch QR codes
    const { data: qrCodes, error: qrError } = await supabase
      .from('room_qr_codes')
      .select('*')
      .eq('is_active', true)
      .order('room_number', { ascending: true });
    
    if (qrError) {
      console.error('Error fetching QR codes:', qrError);
    }

    // Fetch residents with room numbers
    const { data: residents, error: resError } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, room_number')
      .eq('role', 'resident')
      .not('room_number', 'is', null);

    if (resError) {
      console.error('Error fetching residents:', resError);
    }

    // Build room list (1-40) with QR codes and residents
    const roomList: RoomWithResident[] = [];
    for (let i = 1; i <= 40; i++) {
      const roomNum = String(i);
      const qrCode = (qrCodes || []).find(qr => qr.room_number === roomNum) || null;
      const resident = (residents || []).find(r => r.room_number === roomNum) || null;
      roomList.push({
        room_number: roomNum,
        qrCode,
        resident,
      });
    }

    setRooms(roomList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateNewCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateCode = async (room: RoomWithResident) => {
    const supabase = createSupabaseBrowserClient();
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newCode = generateNewCode();
      
      const { error } = await supabase
        .from('room_qr_codes')
        .insert({
          room_number: room.room_number,
          code: newCode,
          resident_name: room.resident?.display_name || room.resident?.full_name || null,
          created_by: user?.id,
        });
      
      if (error) throw error;
      
      fetchData();
    } catch (error) {
      console.error('Error creating QR code:', error);
      alert('Der skete en fejl. Prøv igen.');
    }
    
    setSaving(false);
  };

  const handleRegenerateCode = async (room: RoomWithResident) => {
    if (!room.qrCode) return;
    
    const residentInfo = room.resident 
      ? `(${room.resident.display_name || room.resident.full_name})` 
      : '';
    
    if (!confirm(`Generer ny QR-kode for værelse ${room.room_number} ${residentInfo}?\n\nDen gamle kode vil ikke længere virke.`)) {
      return;
    }
    
    const supabase = createSupabaseBrowserClient();
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
        .eq('id', room.qrCode.id);
      
      // Create new code
      const newCode = generateNewCode();
      const { error } = await supabase
        .from('room_qr_codes')
        .insert({
          room_number: room.room_number,
          code: newCode,
          resident_name: room.resident?.display_name || room.resident?.full_name || null,
          created_by: user?.id,
        });
      
      if (error) throw error;
      
      fetchData();
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      alert('Der skete en fejl. Prøv igen.');
    }
    
    setSaving(false);
  };

  const handlePrint = async (room: RoomWithResident) => {
    if (!room.qrCode) return;
    
    setPrintingRoom(room);
    
    const loginUrl = `${appUrl}/login?code=${room.qrCode.code}`;
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
    
    const roomsWithCodes = rooms.filter(r => r.qrCode);
    
    for (const room of roomsWithCodes) {
      if (!room.qrCode) continue;
      const loginUrl = `${appUrl}/login?code=${room.qrCode.code}`;
      try {
        const dataUrl = await QRCode.toDataURL(loginUrl, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        urls.set(room.room_number, dataUrl);
      } catch {
        console.error('Error generating QR code for room', room.room_number);
      }
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Kunne ikke åbne print-vindue. Tillad pop-ups og prøv igen.');
      setPrintAllMode(false);
      return;
    }
    
    const qrCards = roomsWithCodes.map(room => {
      const residentName = room.resident?.display_name || room.resident?.full_name || '';
      return `
        <div class="card">
          <h2>Værelse ${room.room_number}</h2>
          ${residentName ? `<p class="resident">${residentName}</p>` : ''}
          <img src="${urls.get(room.room_number)}" alt="QR" />
          <p class="instructions">Scan for at logge ind</p>
        </div>
      `;
    }).join('');
    
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
            h2 { font-size: 1.25rem; margin-bottom: 0.25rem; }
            .resident { font-size: 0.875rem; color: #666; margin-bottom: 0.5rem; }
            img { width: 100%; max-width: 150px; height: auto; margin: 0.5rem 0; }
            .instructions { font-size: 0.75rem; color: #666; }
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
    if (!printingRoom?.qrCode || !qrDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const residentName = printingRoom.resident?.display_name || printingRoom.resident?.full_name || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-kode - Værelse ${printingRoom.room_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; }
            .card { border: 3px solid #333; border-radius: 16px; padding: 2rem; max-width: 400px; }
            h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
            .resident { font-size: 1.25rem; color: #666; margin-bottom: 1rem; }
            img { max-width: 100%; height: auto; margin-bottom: 1.5rem; }
            .instructions { font-size: 1rem; color: #666; line-height: 1.5; }
            @media print { body { padding: 0; } .card { border: 2px solid #333; } }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Værelse ${printingRoom.room_number}</h1>
            ${residentName ? `<p class="resident">${residentName}</p>` : ''}
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

  const roomsWithCodes = rooms.filter(r => r.qrCode);
  const roomsWithoutCodes = rooms.filter(r => !r.qrCode);
  const occupiedRooms = rooms.filter(r => r.resident);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">QR-koder</h1>
          <p className="text-gray-400 mt-1">
            {roomsWithCodes.length}/40 værelser har QR-kode • {occupiedRooms.length} beboere tildelt
          </p>
        </div>
        <button 
          onClick={handlePrintAll}
          disabled={printAllMode || loading || roomsWithCodes.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <PrinterCheck className="w-5 h-5" />
          Print alle ({roomsWithCodes.length})
        </button>
      </div>

      {/* Rooms without QR codes */}
      {roomsWithoutCodes.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-4">
          <h2 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Værelser uden QR-kode ({roomsWithoutCodes.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {roomsWithoutCodes.map(room => (
              <button
                key={room.room_number}
                onClick={() => handleCreateCode(room)}
                disabled={saving}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Opret vær. {room.room_number}
              </button>
            ))}
          </div>
        </div>
      )}

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
      ) : roomsWithCodes.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl">
          <QrCode className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Ingen QR-koder oprettet</h3>
          <p className="text-gray-500">Opret QR-koder for værelser ovenfor</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {roomsWithCodes.map((room) => (
            <motion.div 
              key={room.room_number}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-4 text-center group transition-colors ${
                room.resident 
                  ? 'bg-green-900/30 border border-green-700 hover:bg-green-900/50' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {/* Room number */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="text-2xl font-bold text-white">{room.room_number}</span>
              </div>
              
              {/* Resident info */}
              {room.resident ? (
                <div className="flex items-center justify-center gap-1 text-green-400 text-xs mb-2">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-25">
                    {room.resident.display_name || room.resident.full_name}
                  </span>
                </div>
              ) : (
                <div className="text-gray-500 text-xs mb-2">Ingen beboer</div>
              )}
              
              {/* Code preview */}
              <div className="text-xs text-gray-500 font-mono mb-3">
                {room.qrCode?.code}
              </div>

              {/* Actions */}
              <div className="flex gap-1 justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePrint(room)}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="Print QR-kode"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => room.qrCode && copyLoginUrl(room.qrCode.code)}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="Kopiér login URL"
                >
                  {copiedId === room.qrCode?.code ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleRegenerateCode(room)}
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
        {showPrintModal && printingRoom?.qrCode && (
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
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Værelse {printingRoom.room_number}
              </h2>
              
              {printingRoom.resident && (
                <p className="text-gray-600 mb-4">
                  {printingRoom.resident.display_name || printingRoom.resident.full_name}
                </p>
              )}
              
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
