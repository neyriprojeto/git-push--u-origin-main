
'use client';

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Eye, FileText, Loader2, CreditCard } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc } from "firebase/firestore";

// Definição do tipo para os dados que esperamos do Firestore
type Member = {
  id: string;
  nome: string;
  avatar?: string;
  cargo: string;
  status: 'Ativo' | 'Inativo' | 'Pendente';
  dataBatismo?: string; 
  congregacao?: string;
};


export default function MembersPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Busca os dados do usuário logado para obter cargo e congregação
  const currentUserRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: currentUserData, isLoading: isCurrentUserLoading } = useDoc<Member>(currentUserRef);


  const membersCollection = useMemoFirebase(() => {
    if (!firestore || !currentUserData) return null;
    
    // Se for Pastor Dirigente, filtra pela sua congregação
    if (currentUserData.cargo === 'Pastor/dirigente' && currentUserData.congregacao) {
      return query(
        collection(firestore, 'users'), 
        where('congregacao', '==', currentUserData.congregacao),
      );
    }
    
    // Se for admin, mostra todos os usuários.
    if (currentUserData.cargo === 'Administrador') {
       return query(collection(firestore, 'users'));
    }

    // Se for um membro comum ou qualquer outro caso, não deve ver ninguém.
    // Retorna uma query que nunca terá resultados para garantir que a lista fique vazia.
    return query(collection(firestore, 'users'), where('id', '==', 'non-existent-user-to-prevent-listing'));

  }, [firestore, currentUserData]);
  
  const { data: members, isLoading } = useCollection<Member>(membersCollection);

  const showLoading = isLoading || isUserLoading || isCurrentUserLoading;
  
  // Filtra o próprio administrador da lista de membros no lado do cliente
  const filteredMembers = members?.filter(member => member.id !== user?.uid);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Membros</h2>
         <div className="md:hidden">
            <SidebarTrigger />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>
            Uma lista de todos os membros da igreja cadastrados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Congregação</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                     <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const avatar = PlaceHolderImages.find(
                    (p) => p.id === member.avatar
                  );
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {avatar && <AvatarImage src={avatar.imageUrl} alt={avatar.description} data-ai-hint={avatar.imageHint} />}
                            <AvatarFallback>
                              {member.nome ? member.nome.charAt(0) : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid gap-0.5">
                              <span className="font-medium">{member.nome}</span>
                              <span className="text-xs text-muted-foreground md:hidden">{member.cargo}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{member.cargo}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === "Ativo" ? "default" : member.status === "Pendente" ? "outline" : "destructive"}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {member.congregacao || 'Não informada'}
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/dashboard/members/${member.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver Perfil</span>
                              </Link>
                            </Button>
                             <Button asChild variant="ghost" size="icon">
                              <Link href={`/dashboard/members/${member.id}/file`}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Ver Ficha</span>
                              </Link>
                            </Button>
                             <Button asChild variant="ghost" size="icon">
                              <Link href={`/dashboard/members/${member.id}/card`}>
                                <CreditCard className="h-4 w-4" />
                                <span className="sr-only">Ver Carteirinha</span>
                              </Link>
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhum membro encontrado ou você não tem permissão para visualizar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
