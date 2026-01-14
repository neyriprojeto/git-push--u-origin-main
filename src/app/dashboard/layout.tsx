
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

  const userRole = userData?.cargo;
  const userCongregacao = userData?.congregacao;
  const isLoading = isUserLoading || isUserDataLoading;

  const isAdmin = userRole === 'Administrador';
  const isPastor = userRole === 'Pastor Dirigente/Local';
  
  // New logic: Menus are visible during loading, and hidden only when we confirm the user is a 'Membro'.
  const canSeeAdminMenus = isLoading || isAdmin || isPastor;
  const canSeeCardStudio = isLoading || isAdmin;
  const canSeeSettings = isLoading || isAdmin || isPastor;


  const settingsLink = isAdmin
    ? "/dashboard/settings/congregations"
    : isPastor && userCongregacao
    ? `/dashboard/settings/congregations/${encodeURIComponent(userCongregacao)}`
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
                <Link href={user ? `/dashboard` : "/dashboard"}>
                  <Home />
                  <span>Início</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {/* Show these menus if loading or if user is NOT a member */}
            {canSeeAdminMenus && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Mural" }}>
                    <Link href="/dashboard/mural">
                      <LayoutGrid />
                      <span>Mural</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Mensagens" }}>
                    <Link href="#">
                      <Mail />
                      <span>Mensagens</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Show Card Studio only if loading or if user is Admin */}
                {canSeeCardStudio && (
                    <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{ children: "Carteirinhas" }}>
                        <Link href="/dashboard/card-studio">
                        <CreditCard />
                        <span>Carteirinhas</span>
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
              </>
            )}
          </SidebarMenu>

          {/* Show Admin Group if loading or if user is Admin/Pastor */}
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
                 {/* Show Manage Admins only if loading or if user is Admin */}
                {isAdmin && (
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
             {/* Show Settings only if loading or if user is Admin/Pastor */}
            {canSeeSettings && (
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
