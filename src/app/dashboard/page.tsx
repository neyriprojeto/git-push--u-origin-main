
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserPlus, ShieldCheck, UserCheck, Loader2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UserData {
  cargo?: string;
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);

  useEffect(() => {
    // Quando os dados do usuário carregarem, verificamos o cargo
    if (!isUserDataLoading && user && (userData?.cargo === 'Membro' || userData?.cargo === 'Pastor Dirigente/Local')) {
      // Se for membro ou pastor, redireciona para o próprio perfil
      router.replace(`/dashboard/members/${user.uid}`);
    }
  }, [userData, isUserDataLoading, user, router]);

  const isLoading = isUserLoading || isUserDataLoading;

  // Mostra um loader enquanto carrega ou enquanto redireciona para membros/pastores
  if (isLoading || userData?.cargo === 'Membro' || userData?.cargo === 'Pastor Dirigente/Local') {
    return (
      <div className="flex-1 h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  // TODO: Substituir dados mocados por dados do Firestore
  const totalMembers = 0;
  const activeMembers = 0;
  const newMembers = 0;
  const leaders = 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
         <div className="md:hidden">
            <SidebarTrigger />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Membros cadastrados no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">{totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(0) : 0}% de participação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Membros (Ano)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newMembers}</div>
            <p className="text-xs text-muted-foreground">Membros que se juntaram no último ano</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liderança</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaders}</div>
            <p className="text-xs text-muted-foreground">Pastores, diáconos e líderes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
