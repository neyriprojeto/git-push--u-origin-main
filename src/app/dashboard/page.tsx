
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
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserData {
  cargo?: string;
  dataMembro?: Timestamp;
}

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  leaders: number;
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
  
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    newMembers: 0,
    leaders: 0,
  });

  useEffect(() => {
    // Redireciona usuários que não são administradores
    if (!isUserDataLoading && user && userData?.cargo && userData.cargo !== 'Administrador') {
      router.replace(`/dashboard/members/${user.uid}`);
    }
  }, [userData, isUserDataLoading, user, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!firestore || !userData || userData.cargo !== 'Administrador') return;

      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(query(usersCollection, where('cargo', '!=', 'Administrador')));
      
      const allMembers = usersSnapshot.docs.map(doc => doc.data() as UserData);
      
      const totalMembers = allMembers.length;
      const activeMembers = allMembers.filter(m => (m as any).status === 'Ativo').length;

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const newMembers = allMembers.filter(m => m.dataMembro && m.dataMembro.toDate() > oneYearAgo).length;

      const leaderRoles = ['Pastor(a)', 'Pastor Dirigente/Local', 'Diácono(a)', 'Presbítero', 'Evangelista', 'Missionário(a)'];
      const leaders = allMembers.filter(m => m.cargo && leaderRoles.includes(m.cargo)).length;

      setStats({ totalMembers, activeMembers, newMembers, leaders });
    };

    fetchStats();
  }, [firestore, userData]);

  const isLoading = isUserLoading || isUserDataLoading;

  // Mostra um loader enquanto carrega ou redireciona
  if (isLoading || (userData?.cargo && userData.cargo !== 'Administrador')) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  const { totalMembers, activeMembers, newMembers, leaders } = stats;

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
            <p className="text-xs text-muted-foreground">Membros cadastrados (exceto Admins)</p>
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
