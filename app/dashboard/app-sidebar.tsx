"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/app/types/auth";
import { NAV_GENERAL, NAV_STREAMER, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, ChevronsUpDown, LogOut } from "lucide-react";

function NavGroup({
  label,
  items,
  user,
}: {
  label: string;
  items: NavItem[];
  user: User;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if (item.requiresStreamer && !user.streamerEnabled) return null;
            if (item.requiresAdmin && user.role !== "admin") return null;

            const isActive =
              pathname === item.href ||
              item.children?.some((c) => pathname === c.href);

            if (item.children) {
              return (
                <Collapsible
                  key={item.href}
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isActive}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      }
                    />
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children.map((child) => {
                          if (child.requiresAdmin && user.role !== "admin")
                            return null;
                          const isChildActive = pathname === child.href;
                          return (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton
                                isActive={isChildActive}
                                render={<Link href={child.href} />}
                              >
                                <span>{child.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.href}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ user }: { user: User }) {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* ── Header: Logo ───────────────────────────────── */}
      <SidebarHeader className="p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-bold"
        >
          <span className="truncate">
            Memor<span className="text-primary">AIA</span>
          </span>
        </Link>
      </SidebarHeader>

      {/* ── Navigation ─────────────────────────────────── */}
      <SidebarContent>
        <NavGroup label="General" items={NAV_GENERAL} user={user} />
        {user.streamerEnabled && (
          <NavGroup label="Streamer" items={NAV_STREAMER} user={user} />
        )}
      </SidebarContent>

      {/* ── Footer: User menu ──────────────────────────── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user.avatarUrl ?? undefined}
                        alt={user.displayName}
                      />
                      <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                        {user.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user.displayName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.login}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user.avatarUrl ?? undefined}
                      alt={user.displayName}
                    />
                    <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user.displayName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.login}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <form action={logout} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2"
                    >
                      <LogOut className="size-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
