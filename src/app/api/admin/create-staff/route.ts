import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create admin client for user creation
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Create regular client for auth check
const getServerClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
};

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Kun administratorer kan oprette personalekonti" },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { email, password, full_name, display_name, role } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email og adgangskode er påkrævet" },
        { status: 400 }
      );
    }
    
    if (!["staff", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Ugyldig rolle. Vælg personale eller administrator" },
        { status: 400 }
      );
    }
    
    // Create user with admin client
    const adminClient = getAdminClient();
    
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        display_name: display_name || full_name,
        role,
      },
    });
    
    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
      },
    });
    
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Der skete en serverfejl" },
      { status: 500 }
    );
  }
}
