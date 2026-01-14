
'use client';

import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home, LayoutGrid, CreditCard, Users, UserPlus, UserCog, Settings, Mail, Instagram, Youtube, Globe, Radio } from "lucide-react";
import { AppLogo } from "@/components/icons";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

interface UserData {
  cargo?: string;
  congregacao?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);

  const isLoading = isUserLoading || isUserDataLoading;
  const userRole = userData?.cargo;

  const isAdmin = userRole === 'Administrador';
  const isPastor = userRole === 'Pastor Dirigente/Local';
  const isMember = userRole === 'Membro';

  // Define visibility based on roles. During load, assume admin to prevent flicker.
  const canSeeAdminMenus = isLoading || isAdmin || isPastor;
  const canSeeFullAdminFeatures = isLoading || isAdmin;

  // For members, "Início" links to their profile. For others, to the main dashboard.
  const homeLink = isMember && user ? `/dashboard/members/${user.uid}` : '/dashboard';


  const settingsLink = isAdmin
    ? "/dashboard/settings/congregations"
    : isPastor && userData?.congregacao
    ? `/dashboard/settings/congregations/${encodeURIComponent(userData.congregacao)}`
    : "#";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <AppLogo className="size-6 text-sidebar-primary" />
              <span className="text-lg font-semibold text-sidebar-foreground">
                A.D.KAIROS
              </span>
            </Link>
            <SidebarTrigger className="md:hidden"/>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={{ children: "Início" }}>
                <Link href={homeLink}>
                  <Home />
                  <span>Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {/* General menus visible to Admins and Pastors */}
            {canSeeAdminMenus && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Mural" }}>
                  <Link href="/dashboard/mural">
                    <LayoutGrid />
                    <span>Mural</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

             {/* Messages menu visible to all authenticated users */}
             {(canSeeAdminMenus || isMember) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Mensagens" }}>
                    <Link href="#">
                      <Mail />
                      <span>Mensagens</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             )}
            
            {/* Card Studio only for full admins */}
            {canSeeFullAdminFeatures && (
                <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Carteirinhas" }}>
                    <Link href="/dashboard/card-studio">
                    <CreditCard />
                    <span>Carteirinhas</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            )}
          </SidebarMenu>

          {/* Admin Group for Admins and Pastors */}
          {canSeeAdminMenus && (
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Membros" }}>
                    <Link href="/dashboard/members">
                      <Users />
                      <span>Membros</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Cadastrar Membro" }}>
                    <Link href="/dashboard/members/new">
                      <UserPlus />
                      <span>Cadastrar Membro</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 {/* Manage Admins only for full admins */}
                {canSeeFullAdminFeatures && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{ children: "Gerenciar Administradores" }}>
                      <Link href="#">
                        <UserCog />
                        <span>Gerenciar Admins</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>
          )}
          
          <SidebarGroup>
            <SidebarGroupLabel>Links Externos</SidebarGroupLabel>
            <SidebarMenu>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Portal de Entrada" }}>
                  <Link href="/">
                    <Home />
                    <span>Portal de Entrada</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: "Instagram" }}>
                    <Instagram />
                    <span>Instagram</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: "YouTube" }}>
                    <Youtube />
                    <span>YouTube</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: "Site" }}>
                    <Globe />
                    <span>Site</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: "Rádio" }}>
                    <Radio />
                    <span>Rádio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
           <SidebarMenu>
             {/* Settings for Admins and Pastors */}
            {canSeeAdminMenus && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Configurações" }}>
                  <Link href={settingsLink}>
                    <Settings />
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
