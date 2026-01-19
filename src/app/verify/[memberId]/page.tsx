
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ShieldCheck, ShieldAlert, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AppLogo } from '@/components/icons';
import Link from 'next/link';

interface Member {
    id: string;
    nome: string;
    avatar?: string;
    status: 'Ativo' | 'Inativo' | 'Pendente';
}

export default function VerificationPage() {
    const params = useParams();
    const memberId = params.memberId as string;
    const firestore = useFirestore();

    const memberRef = useMemoFirebase(() => (firestore ? doc(firestore, 'users', memberId) : null), [firestore, memberId]);
    const { data: member, isLoading, error } = useDoc<Member>(memberRef);

    const validityDate = new Date();
    validityDate.setFullYear(validityDate.getFullYear() + 1);
    const isCardValid = member?.status === 'Ativo';

    const getStatusInfo = () => {
        if (isLoading) {
             return {
                icon: <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />,
                title: "Verificando...",
                description: "Aguarde enquanto buscamos os dados da carteirinha.",
                variant: "default"
            };
        }
        if (error) {
             return {
                icon: <XCircle className="h-16 w-16 text-destructive" />,
                title: "Erro na Verificação",
                description: "Não foi possível verificar a carteirinha. Tente novamente mais tarde.",
                variant: "destructive"
            };
        }
        if (member && isCardValid) {
            return {
                icon: <ShieldCheck className="h-16 w-16 text-green-500" />,
                title: "Carteirinha Válida",
                description: `Esta carteirinha é válida até ${format(validityDate, 'dd/MM/yyyy')}.`,
                variant: "default"
            }
        }
        if (member && !isCardValid) {
             return {
                icon: <ShieldAlert className="h-16 w-16 text-yellow-500" />,
                title: "Carteirinha Inválida",
                description: `O status deste membro é "${member.status}".`,
                variant: "destructive"
            }
        }
        return {
            icon: <XCircle className="h-16 w-16 text-destructive" />,
            title: "Membro Não Encontrado",
            description: "Nenhum membro foi encontrado com este identificador.",
            variant: "destructive"
        }
    }

    const statusInfo = getStatusInfo();
    const avatarUrl = member?.avatar?.startsWith('http') ? member.avatar : undefined;

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-secondary p-4">
             <div className="w-full max-w-md space-y-6">
                <Link href="/" className="flex items-center justify-center space-x-2 text-foreground">
                    <AppLogo className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold">A.D.KAIROS CONNECT</span>
                </Link>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">Verificação de Carteirinha</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-4 text-center">
                        {statusInfo.icon}
                        <h2 className={`text-2xl font-bold ${statusInfo.variant === 'destructive' ? 'text-destructive' : ''}`}>{statusInfo.title}</h2>
                        <p className="text-muted-foreground">{statusInfo.description}</p>
                        
                        {member && (
                             <Card className="mt-4 w-full text-left">
                                <CardContent className="p-4 flex items-center gap-4">
                                     <Avatar className="h-16 w-16">
                                        {avatarUrl && <AvatarImage src={avatarUrl} alt={member.nome} />}
                                        <AvatarFallback className="text-2xl">{member.nome?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="font-bold text-lg">{member.nome}</p>
                                        <Badge variant={isCardValid ? 'default' : 'destructive'}>{member.status}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}
