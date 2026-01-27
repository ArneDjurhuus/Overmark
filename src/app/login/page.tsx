'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, QrCode } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState('Scanner QR kode...');

  useEffect(() => {
    const handleQRLogin = async () => {
      const code = searchParams.get('code');

      if (!code) {
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setMessage('Verificerer QR-kode...');

      const supabase = createSupabaseBrowserClient();

      try {
        // 1. Verify QR code exists and is active
        const { data: qrCode, error: qrError } = await supabase
          .from('room_qr_codes')
          .select('room_number, resident_name, is_active')
          .eq('code', code)
          .eq('is_active', true)
          .single();

        if (qrError || !qrCode) {
          throw new Error('Ugyldig eller udløbet QR-kode. Kontakt personalet for en ny.');
        }

        setMessage(`Logger ind som Værelse ${qrCode.room_number}...`);

        // 2. Create email/password from room + code
        const email = `room${qrCode.room_number}@overmark.local`;
        const password = code;

        // 3. Try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // 4. If sign in fails, try to sign up (first time use of this code)
          console.log('Sign in failed, trying sign up...', signInError.message);
          setMessage('Opretter din profil...');

          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: `Værelse ${qrCode.room_number}`,
                room_number: qrCode.room_number,
                role: 'resident',
              },
            },
          });

          if (signUpError) {
            throw signUpError;
          }
        }

        // Success!
        setStatus('success');
        setMessage(`Velkommen, Værelse ${qrCode.room_number}!`);
        
        // Short delay for user to see success message
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);

      } catch (error) {
        console.error('Login error:', error);
        setStatus('error');
        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage('Der skete en fejl. Kontakt personalet.');
        }
      }
    };

    handleQRLogin();
  }, [searchParams, router]);

  if (status === 'idle') {
    return (
      <div className="text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto bg-blue-100 rounded-3xl flex items-center justify-center">
            <QrCode className="w-12 h-12 text-blue-600" />
          </div>
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Velkommen til Overmarksgården</h1>
        <p className="text-gray-600 text-lg mb-2">
          Scan QR-koden på din dør for at logge ind.
        </p>
        <p className="text-gray-500 text-sm">
          Har du brug for hjælp? Kontakt personalet.
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
        {status === 'success' ? 'Det lykkedes!' : status === 'error' ? 'Ups!' : 'Logger ind...'}
      </h2>
      
      <p className="text-gray-600 text-lg">{message}</p>
      
      {status === 'error' && (
        <button 
          onClick={() => router.push('/login')}
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
