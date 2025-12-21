'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard, { GlassButton } from '@/components/GlassCard';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import { createClient } from '@/utils/supabase/client';
import type { RealtimeMessage } from '@/types';

export default function BeboerPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const supabase = createClient();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Setup realtime subscription (requires Supabase project configuration)
  useEffect(() => {
    // This would connect to a real Supabase table
    // For now, it's a placeholder for the realtime functionality
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Realtime update:', payload);
          // Handle realtime updates here
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // This would insert to Supabase
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            Velkommen, Beboer
          </h1>
          <p className="text-lg text-gray-600">
            Dit personlige område i Overmarksgården Intra
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <GlassCard>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Mine Aktiviteter
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Se dine planlagte aktiviteter og arrangementer
                  </p>
                  <GlassButton className="w-full bg-blue-500 text-white">
                    Se aktiviteter
                  </GlassButton>
                </motion.div>
              </GlassCard>

              <GlassCard>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Beskeder
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Kommuniker med personalet og andre beboere
                  </p>
                  <GlassButton className="w-full bg-green-500 text-white">
                    Åbn beskeder
                  </GlassButton>
                </motion.div>
              </GlassCard>

              <GlassCard>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Min Profil
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Opdater dine oplysninger og indstillinger
                  </p>
                  <GlassButton className="w-full bg-purple-500 text-white">
                    Se profil
                  </GlassButton>
                </motion.div>
              </GlassCard>
            </>
          )}
        </div>

        {/* Realtime Message Demo */}
        <GlassCard className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Live Beskeder
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Beskeder opdateres i realtid via Supabase Realtime
          </p>
          
          <div className="space-y-4">
            <div className="bg-white/50 rounded-lg p-4 min-h-[200px]">
              {messages.length === 0 && !loading && (
                <p className="text-gray-500 text-center py-8">
                  Ingen beskeder endnu. Send den første besked!
                </p>
              )}
              {loading && <Skeleton height="h-20" />}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Skriv en besked..."
                className="flex-1 px-4 py-3 rounded-xl glass min-h-[48px] text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={loading}
              />
              <GlassButton 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || loading}
                className="bg-blue-500 text-white"
              >
                Send
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
