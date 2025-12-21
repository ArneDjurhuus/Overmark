'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard, { GlassButton } from '@/components/GlassCard';
import Skeleton, { SkeletonCard } from '@/components/Skeleton';
import { createClient } from '@/utils/supabase/client';

export default function PersonalePage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'residents' | 'activities'>('overview');
  const supabase = createClient();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Oversigt' },
    { id: 'residents', label: 'Beboere' },
    { id: 'activities', label: 'Aktiviteter' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-green-50 to-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            Personale Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Administrer Overmarksgården Intra
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold min-h-[48px] transition-all ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'glass text-gray-700 hover:bg-white/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      Aktive Beboere
                    </h3>
                    <p className="text-4xl font-bold text-green-600 mb-2">24</p>
                    <p className="text-gray-600 text-sm">
                      Total kapacitet: 30
                    </p>
                  </motion.div>
                </GlassCard>

                <GlassCard>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Dagens Aktiviteter
                    </h3>
                    <p className="text-4xl font-bold text-blue-600 mb-2">5</p>
                    <p className="text-gray-600 text-sm">
                      3 planlagte, 2 igangværende
                    </p>
                  </motion.div>
                </GlassCard>

                <GlassCard>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Ulæste Beskeder
                    </h3>
                    <p className="text-4xl font-bold text-purple-600 mb-2">12</p>
                    <p className="text-gray-600 text-sm">
                      Fra beboere og kolleger
                    </p>
                  </motion.div>
                </GlassCard>
              </>
            )}
          </div>
        )}

        {/* Residents Tab */}
        {activeTab === 'residents' && (
          <GlassCard>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Beboeroversigt
            </h3>
            {loading ? (
              <div className="space-y-4">
                <Skeleton height="h-16" />
                <Skeleton height="h-16" />
                <Skeleton height="h-16" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Her kan du se og administrere alle beboere
                </p>
                <GlassButton className="bg-green-500 text-white">
                  Tilføj ny beboer
                </GlassButton>
              </div>
            )}
          </GlassCard>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <GlassCard>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Aktivitetskalender
            </h3>
            {loading ? (
              <div className="space-y-4">
                <Skeleton height="h-16" />
                <Skeleton height="h-16" />
                <Skeleton height="h-16" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Planlæg og administrer aktiviteter for beboerne
                </p>
                <GlassButton className="bg-blue-500 text-white">
                  Opret ny aktivitet
                </GlassButton>
              </div>
            )}
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
