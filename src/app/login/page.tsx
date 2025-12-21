'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState('Scanner QR kode...');

  useEffect(() => {
    const handleQRLogin = async () => {
      const room = searchParams.get('room');
      const code = searchParams.get('code');

      if (!room || !code) {
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setMessage(`Logger ind på Værelse ${room}...`);

      const supabase = createSupabaseBrowserClient();
      const email = `room${room}@overmark.local`;
      const password = code;

      try {
        // 1. Try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // 2. If sign in fails, try to sign up
          console.log('Sign in failed, trying sign up...', signInError.message);
          setMessage(`Opretter Værelse ${room}...`);

          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: `Værelse ${room}`,
                room_number: room,
                role: 'resident', // Default role
              },
            },
          });

          if (signUpError) {
            throw signUpError;
          }
        }

        // Success!
        setStatus('success');
        setMessage('Velkommen hjem!');
        
        // Short delay for user to see success message
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);

      } catch (error) {
        console.error('Login error:', error);
        setStatus('error');
        setMessage('Der skete en fejl. Prøv at scanne koden igen.');
      }
    };

    handleQRLogin();
  }, [searchParams, router]);

  if (status === 'idle') {
    return (
      <div className="text-center p-8">
        <div className="mb-6 text-6xl">📱</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Velkommen til Overmarksgården</h1>
        <p className="text-gray-600 text-lg">
          Scan QR-koden på din dør for at logge ind.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 flex justify-center"
      >
        {status === 'loading' && (
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-16 h-16 text-green-500" />
        )}
        {status === 'error' && (
          <XCircle className="w-16 h-16 text-red-500" />
        )}
      </motion.div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        {status === 'success' ? 'Det lykkedes!' : 'Logger ind...'}
      </h2>
      
      <p className="text-gray-600 text-lg">{message}</p>
      
      {status === 'error' && (
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-95 transition-transform"
        >
          Prøv igen
        </button>
      )}
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="animate-pulse text-center">
        <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <div className="h-6 w-48 bg-gray-200 rounded mx-auto"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <Suspense fallback={<LoginLoading />}>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
