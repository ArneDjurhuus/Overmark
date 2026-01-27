/**
 * User role types for Overmarksgården
 * 
 * Database uses English values: resident, staff, admin
 * UI displays Danish labels: Beboer, Personale, Administrator
 * 
 * - resident: Resident - can view content (read-only)
 * - staff: Staff - can manage calendars, meal plans via admin panel
 * - admin: Administrator - full access including user management
 */
export type UserRole = "resident" | "staff" | "admin";

/**
 * Profile type matching the Supabase profiles table
 */
export type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  role: UserRole;
  room_number: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * Helper to check if a role has staff-level permissions
 */
export function isStaffOrAdmin(role: UserRole | string): boolean {
  return role === "staff" || role === "admin" || role === "personale";
}

/**
 * Get Danish label for a role
 */
export function getRoleLabel(role: UserRole | string): string {
  switch (role) {
    case "staff":
    case "personale":
      return "Personale";
    case "admin":
      return "Administrator";
    default:
      return "Beboer";
  }
}

/**
 * Get Tailwind color classes for a role badge
 */
export function getRoleColor(role: UserRole | string): string {
  switch (role) {
    case "staff":
    case "personale":
      return "bg-blue-100 text-blue-700";
    case "admin":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}
