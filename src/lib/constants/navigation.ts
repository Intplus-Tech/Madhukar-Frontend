import type { UserRole } from "@/types/domain";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name, resolved in the nav component
}

export const SALES_NAV: NavItem[] = [
  { label: "Home", href: "/sales", icon: "Home" },
  { label: "Plan", href: "/sales/plan", icon: "MapPin" },
  { label: "Order", href: "/sales/order", icon: "Box" },
  { label: "Report", href: "/sales/report", icon: "ClipboardList" },
];

export const ACCOUNTS_NAV: NavItem[] = [
  { label: "Dashboard", href: "/accounts", icon: "LayoutGrid" },
  { label: "Sales Orders", href: "/accounts/orders", icon: "Receipt" },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutGrid" },
  { label: "Sales Orders", href: "/admin/orders", icon: "Receipt" },
  { label: "Reports", href: "/admin/reports", icon: "BarChart3" },
];

export const ROLE_HOME: Record<UserRole, string> = {
  sales: "/sales",
  accounts: "/accounts",
  admin: "/admin",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  sales: "Sales Representative",
  accounts: "Accounts",
  admin: "Manager",
};
