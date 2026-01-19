
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Loader2, ShieldAlert, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateMember } from '@/firebase/firestore/mutations';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  nome: string;
  email?: string;
  avatar?: string;
  cargo: string;
}

const ROLES = ['Administrador', 'Pastor/dirigente', 'Pastor(a)', 'Evangelista', 'Missionário(a)', 'Presbítero', 'Diácono(a)', 'Cooperador(a)', 'Membro'];

export default function AdminManagementPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const currentUserRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
  const { data: currentUserData, isLoading: isCurrentUserLoading } = useDoc<User>(currentUserRef);
  
  const usersCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollection);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!firestore || userId === authUser?.uid) {
        toast({
            variant: 'destructive',
            title: 'Ação não permitida',
            description: 'Você não pode alterar seu próprio cargo.',
        });
        return;
    }
    setUpdatingRoleId(userId);
    try {
        await updateMember(firestore, userId, { cargo: newRole });
        toast({
            title: 'Sucesso!',
            description: 'O cargo do usuário foi atualizado.',
        });
    } catch (error) {
        console.error("Failed to update role:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao atualizar',
            description: 'Não foi possível atualizar o cargo do usuário.',
        });
    } finally {
        setUpdatingRoleId(null);
    }
  };

  const filteredUsers = users?.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.nome.localeCompare(b.nome));

  const isLoading = isUserLoading || isCurrentUserLoading || isLoadingUsers;

  if (isLoading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (currentUserData?.cargo !== 'Administrador') {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card className="border-destructive">
          <CardHeader className="items-center text-center">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className='pt-4 text-center'>
            <p>Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Administradores</h2>
        <UserCog className="h-8 w-8 text-muted-foreground" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>Promova usuários a administradores ou outros cargos, ou rebaixe-os conforme necessário.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Input 
                placeholder="Filtrar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Cargo Atual</TableHead>
                <TableHead className="text-right">Novo Cargo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const avatar = user.avatar?.startsWith('http') 
                    ? { imageUrl: user.avatar } 
                    : PlaceHolderImages.find((p) => p.id === user.avatar);
                  const isCurrentUser = user.id === authUser?.uid;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {avatar && <AvatarImage src={avatar.imageUrl} alt={user.nome} />}
                            <AvatarFallback>{user.nome.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                      <TableCell>{user.cargo}</TableCell>
                      <TableCell className="text-right">
                        {updatingRoleId === user.id ? (
                            <div className='flex justify-end'><Loader2 className="h-5 w-5 animate-spin"/></div>
                        ) : (
                            <Select
                                value={user.cargo}
                                onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                disabled={isCurrentUser || updatingRoleId !== null}
                            >
                                <SelectTrigger className="w-48 ml-auto">
                                    <SelectValue placeholder="Alterar cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Nenhum usuário encontrado.
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
