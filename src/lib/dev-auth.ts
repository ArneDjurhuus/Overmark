/**
 * Development-only auto-login utilities
 * In dev mode, automatically logs in as room 1 user
 */

import { createSupabaseBrowserClient } from "./supabase/browser";

// Mock QR code for Room 1 - matches the actual code in database
export const DEV_QR_CODE = "B412A27D";
export const DEV_ROOM_NUMBER = "1";

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Auto-login for development mode
 * Simulates QR code scan for room 1
 */
export async function devAutoLogin(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isDev()) {
    return { success: false, message: "Not in development mode" };
  }

  const supabase = createSupabaseBrowserClient();

  // Check if already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return { success: true, message: "Already logged in" };
  }

  try {
    // Try to sign in with dev credentials
    const email = `room${DEV_ROOM_NUMBER}@overmark.local`;
    const password = DEV_QR_CODE;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // First time - create the account
      console.log("[Dev Auth] Creating dev user account...");

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            room_number: DEV_ROOM_NUMBER,
            role: "resident",
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      return { success: true, message: "Dev account created and logged in" };
    }

    return { success: true, message: "Logged in as dev user" };
  } catch (error) {
    console.error("[Dev Auth] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get the dev QR login URL
 */
export function getDevQRUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/login?code=${DEV_QR_CODE}`;
}
