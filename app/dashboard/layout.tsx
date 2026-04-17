import { cookies } from "next/headers";
import { getMe } from "../lib/api";
import { AppSidebar } from "./app-sidebar";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getMe();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar user={user} />
        <SidebarInset className="relative overflow-hidden">
          {/* ── Background glow ──────────────────────────── */}
          <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

          {/* ── Top bar ──────────────────────────────────── */}
          <header
            className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm"
            aria-label="Barra superior"
          >
            <SidebarTrigger className="-ml-1" aria-label="Alternar sidebar" />
            <Separator orientation="vertical" className="mr-2 h-4" aria-hidden="true" />
            <DashboardBreadcrumb />
          </header>

          {/* ── Content ──────────────────────────────────── */}
          <main className="relative mx-auto w-full max-w-6xl px-6 pt-8 pb-16 md:px-12">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="bottom-right" richColors closeButton />
    </TooltipProvider>
  );
}
