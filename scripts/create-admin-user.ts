/**
 * Script to create an admin user in Supabase
 * Run with: npx tsx scripts/create-admin-user.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL is not set");
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  console.log("\nTo get your service role key:");
  console.log("1. Go to https://supabase.com/dashboard/project/_/settings/api");
  console.log("2. Copy the 'service_role' key (NOT the anon key)");
  console.log("3. Add it to .env.local:");
  console.log("   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  const email = "admin@overmarksgaarden.dk";
  const password = "admin123";

  console.log(`\n🔄 Creating admin user: ${email}`);

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  if (existingUser) {
    console.log("⚠️  User already exists, updating password...");
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password }
    );
    if (updateError) {
      console.error("❌ Failed to update user:", updateError.message);
      process.exit(1);
    }
    
    // Update profile to ensure admin role
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: existingUser.id,
        full_name: "Administrator",
        display_name: "Admin",
        role: "admin",
      });
    
    if (profileError) {
      console.error("❌ Failed to update profile:", profileError.message);
      process.exit(1);
    }
    
    console.log("✅ User updated successfully!");
  } else {
    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Administrator",
      },
    });

    if (error) {
      console.error("❌ Failed to create user:", error.message);
      process.exit(1);
    }

    // Create profile with admin role
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: "Administrator",
      display_name: "Admin",
      role: "admin",
    });

    if (profileError) {
      console.error("❌ Failed to create profile:", profileError.message);
      process.exit(1);
    }

    console.log("✅ Admin user created successfully!");
  }

  console.log("\n📧 Login credentials:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log("\n🔐 Go to /admin/login to sign in\n");
}

createAdminUser().catch(console.error);
