"use client";

import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Video, CreditCard, Settings, Sparkles, Menu, X, ShieldPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

import CreditDisplay from "./_components/CreditDisplay";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Create Video", href: "/dashboard/create", icon: Video },
  { name: "My Videos", href: "/dashboard/videos", icon: Sparkles },
  { name: "Pricing", href: "/dashboard/pricing", icon: ShieldPlus },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 border-r border-sidebar-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0 bg-sidebar/95 backdrop-blur-lg' : '-translate-x-full md:translate-x-0 bg-sidebar'}
        `}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary-dark to-brand-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">
              Vidholdify
            </span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 ring-2 ring-brand-primary/40 hover:ring-brand-primary transition-all",
                  userButtonPopoverCard: "bg-black/90 backdrop-blur-xl border border-brand-primary/30 shadow-2xl",
                  userButtonPopoverActionButton: "text-white hover:bg-brand-primary/20 transition",
                  userButtonPopoverActionButtonText: "text-white",
                  userButtonPopoverActionButtonIcon: "text-white",
                  userPreviewMainIdentifier: "text-white",
                  userPreviewSecondaryIdentifier: "text-white/60",
                },
                variables: {
                  colorPrimary: "#413BFA",
                  colorText: "white",
                  colorBackground: "black",
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                User Account
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                Manage profile
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            <h1 className="text-xl font-semibold text-foreground">
              Dashboard
            </h1>
          </div>

          {/* Credit Display & User Button */}
          <div className="flex items-center gap-2 md:gap-4">
            <CreditDisplay />



            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-brand-primary/40 hover:ring-brand-primary transition-all",
                  userButtonPopoverCard: "bg-black/90 backdrop-blur-xl border border-brand-primary/30 shadow-2xl",
                  userButtonPopoverActionButton: "text-white hover:bg-brand-primary/20 px-3 py-2 rounded-md transition",
                  userButtonPopoverActionButtonText: "text-white",
                  userButtonPopoverActionButtonIcon: "text-white",
                  userPreviewMainIdentifier: "text-white",
                  userPreviewSecondaryIdentifier: "text-white/60",
                  card: "bg-black/95 backdrop-blur-xl text-white border border-brand-primary/30 shadow-2xl",
                  headerTitle: "text-white",
                  headerSubtitle: "text-white/60",
                  navbar: "bg-black/90 backdrop-blur-xl border-r border-brand-primary/20",
                  navbarButton: "text-white hover:bg-brand-primary/20 transition",
                  pageScrollBox: "bg-black/95 backdrop-blur-xl text-white",
                  scrollBox: "bg-black/95",
                  formFieldLabel: "text-white",
                  formFieldInput: "bg-black border border-brand-primary/40 text-white placeholder-white/40 focus:border-brand-primary",
                  formButtonPrimary: "bg-brand-primary hover:bg-brand-primary-dark text-white shadow",
                  badge: "bg-brand-primary/20 text-brand-primary",
                },
                variables: {
                  colorPrimary: "#413BFA",
                  colorText: "white",
                  colorBackground: "black",
                  colorInputBackground: "black",
                  colorInputText: "white",
                  colorTextSecondary: "white",
                }
              }}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
