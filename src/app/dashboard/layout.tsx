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
import { Home, MessageSquare, Users, UserCog, Settings, CreditCard, LayoutGrid, Radio, Share2, Mail, Youtube, Instagram, Globe, UserPlus, Building } from "lucide-react";
import { AppLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                <Link href="/dashboard">
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
                <SidebarMenuButton asChild tooltip={{ children: "Mensagens" }}>
                  <Link href="#">
                    <Mail />
                    <span>Mensagens</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Carteirinhas" }}>
                  <Link href="/dashboard/card-studio">
                    <CreditCard />
                    <span>Carteirinhas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Gerenciar Administradores" }}>
                  <Link href="#">
                    <UserCog />
                    <span>Gerenciar Admins</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          
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
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={{ children: "Configurações" }}>
                <Link href="/dashboard/settings/congregations">
                  <Settings />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
