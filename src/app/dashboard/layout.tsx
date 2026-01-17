
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
import { Home, LayoutGrid, CreditCard, Users, UserPlus, UserCog, Settings, Mail, Instagram, Youtube, Globe, Radio, FileText, LogOut } from "lucide-react";
import { AppLogo } from "@/components/icons";
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";


interface UserData {
  cargo?: string;
  congregacao?: string;
}

interface ChurchInfo {
  instagramUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  radioPageUrl?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();


  const userRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);

  const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
  const { data: churchInfo, isLoading: isChurchInfoLoading } = useDoc<ChurchInfo>(churchInfoRef);


  const isLoading = isUserLoading || isUserDataLoading;
  const userRole = userData?.cargo;

  const isMember = !isLoading && userRole === 'Membro';
  const canSeeAdminMenus = !isLoading && userRole && ['Administrador', 'Pastor/dirigente'].includes(userRole);
  const isFullAdmin = !isLoading && userRole === 'Administrador';

  const homeLink = isMember && user ? `/dashboard/members/${user.uid}` : '/dashboard';

  const settingsLink = userRole === 'Administrador'
    ? "/dashboard/settings/congregations"
    : userRole === 'Pastor/dirigente' && userData?.congregacao
    ? `/dashboard/settings/congregations/${encodeURIComponent(userData.congregacao)}`
    : "#";

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        router.push('/login');
      } catch (error) {
        console.error("Error signing out: ", error);
        // Optionally, show a toast message on error
      }
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <Link href={homeLink} className="flex items-center gap-2">
              <AppLogo className="size-6 text-sidebar-primary" />
              <span className="text-lg font-semibold text-sidebar-foreground">
                A.D.KAIROS CONNECT
              </span>
            </Link>
            <SidebarTrigger className="md:hidden"/>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Member-specific Menu */}
          {isMember && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Início" }}>
                  <Link href={homeLink}>
                    <Home />
                    <span>Início</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
          
          {/* Admin and Pastor Menu */}
          {canSeeAdminMenus && (
            <>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Início" }}>
                    <Link href={homeLink}>
                      <Home />
                      <span>Início</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Mural" }}>
                    <Link href="/dashboard/mural">
                      <LayoutGrid />
                      <span>Mural</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Documentos" }}>
                    <Link href="/dashboard/documents">
                      <FileText />
                      <span>Documentos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Caixa de Entrada" }}>
                    <Link href="/dashboard/messages">
                      <Mail />
                      <span>Caixa de Entrada</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isFullAdmin && (
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
                  {isFullAdmin && (
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
            </>
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
              {isChurchInfoLoading ? (
                <>
                  <SidebarMenuItem><SidebarMenuButton disabled><Instagram /><span>Instagram</span></SidebarMenuButton></SidebarMenuItem>
                  <SidebarMenuItem><SidebarMenuButton disabled><Youtube /><span>YouTube</span></SidebarMenuButton></SidebarMenuItem>
                  <SidebarMenuItem><SidebarMenuButton disabled><Globe /><span>Site</span></SidebarMenuButton></SidebarMenuItem>
                  <SidebarMenuItem><SidebarMenuButton disabled><Radio /><span>Rádio</span></SidebarMenuButton></SidebarMenuItem>
                </>
              ) : (
                <>
                  {churchInfo?.instagramUrl && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={{ children: "Instagram" }}>
                        <Link href={churchInfo.instagramUrl} target="_blank">
                          <Instagram />
                          <span>Instagram</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {churchInfo?.youtubeUrl && (
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{ children: "YouTube" }}>
                          <Link href={churchInfo.youtubeUrl} target="_blank">
                              <Youtube />
                              <span>YouTube</span>
                          </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {churchInfo?.websiteUrl && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{ children: "Site" }}>
                          <Link href={churchInfo.websiteUrl} target="_blank">
                              <Globe />
                              <span>Site</span>
                          </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {churchInfo?.radioPageUrl && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={{ children: "Rádio" }}>
                        <Link href={churchInfo.radioPageUrl} target="_blank">
                            <Radio />
                            <span>Rádio</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroup>

        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
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
             <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={{ children: "Sair" }}>
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
