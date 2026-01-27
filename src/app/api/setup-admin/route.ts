import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// This endpoint creates an initial admin account
// It should only be used once during setup, then deleted or disabled

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    return NextResponse.json({ 
      error: "SUPABASE_SERVICE_ROLE_KEY not configured",
      instructions: "Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file. Find it in Supabase Dashboard -> Settings -> API -> service_role key"
    }, { status: 500 });
  }
  
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const email = "admin@overmark.dk";
  const password = "DetErEnTest";

  try {
    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      // Update password
      const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password: password,
      });
      
      if (error) throw error;
      
      // Ensure profile has admin role
      await adminClient.from('profiles').update({ role: 'admin' }).eq('id', existingUser.id);
      
      return NextResponse.json({ 
        success: true, 
        message: "Password updated for existing admin",
        email,
        password,
      });
    }
    
    // Create new admin user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: "Administrator",
        role: "admin",
      },
    });
    
    if (createError) throw createError;
    
    // Update profile to admin role
    await adminClient.from('profiles').update({ 
      role: 'admin',
      display_name: 'Administrator',
    }).eq('id', newUser.user.id);
    
    return NextResponse.json({ 
      success: true, 
      message: "Admin account created!",
      email,
      password,
      note: "DELETE this file after setup: src/app/api/setup-admin/route.ts"
    });
    
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
