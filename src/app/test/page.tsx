"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function TestPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult("Testing connection...\n");

    try {
      const supabase = createSupabaseBrowserClient();
      
      // Test 1: Basic API call
      setResult(prev => prev + "\n1. Testing Supabase connection...");
      const { data, error } = await supabase.from("profiles").select("count").limit(1);
      
      if (error) {
        setResult(prev => prev + `\n❌ Database error: ${error.message}`);
      } else {
        setResult(prev => prev + "\n✅ Database connection works!");
      }

      // Test 2: Auth health check
      setResult(prev => prev + "\n\n2. Testing auth service...");
      const { data: session, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setResult(prev => prev + `\n❌ Auth error: ${authError.message}`);
      } else {
        setResult(prev => prev + "\n✅ Auth service works!");
        setResult(prev => prev + `\n   Session: ${session?.session ? "Active" : "None"}`);
      }

      // Test 3: Sign in attempt
      setResult(prev => prev + "\n\n3. Testing sign in...");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: "test@test.com",
        password: "wrongpassword123",
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setResult(prev => prev + "\n✅ Auth signin endpoint works (got expected error for wrong credentials)");
        } else if (signInError.message.includes("fetch")) {
          setResult(prev => prev + `\n❌ Network error: ${signInError.message}`);
          setResult(prev => prev + "\n\n🔍 Possible causes:");
          setResult(prev => prev + "\n   - Browser extension blocking requests");
          setResult(prev => prev + "\n   - Network firewall");
          setResult(prev => prev + "\n   - Incorrect Supabase URL");
        } else {
          setResult(prev => prev + `\n⚠️ Auth error: ${signInError.message}`);
        }
      } else {
        setResult(prev => prev + "\n✅ Sign in worked (unexpected!)");
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setResult(prev => prev + `\n\n❌ Exception: ${message}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Run Test"}
        </button>

        <pre className="mt-4 p-4 bg-white rounded border text-sm whitespace-pre-wrap">
          {result || "Click 'Run Test' to check Supabase connection"}
        </pre>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Environment:</strong>
          <br />
          URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}
          <br />
          Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (hidden)" : "Not set"}
        </div>
      </div>
    </div>
  );
}
