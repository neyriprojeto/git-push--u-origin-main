'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ShieldAlert, Download } from 'lucide-react';
import Link from 'next/link';

type UserData = { nome: string; cargo?: string; congregacao?: string; };
type ChurchInfo = { statuteUrl?: string; };

export default function StatutePage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();

    // Data fetching
    const userRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);
    
    const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
    const { data: churchInfo, isLoading: isChurchInfoLoading } = useDoc<ChurchInfo>(churchInfoRef);

    const isLoading = isAuthUserLoading || isUserDataLoading || isChurchInfoLoading;

    if (isLoading) {
        return <div className="flex-1 h-screen flex items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    if (!userData?.cargo || !['Administrador', 'Pastor/dirigente'].includes(userData.cargo)) {
         return (
           <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
               <Card className="border-destructive"><CardHeader className="items-center text-center"><ShieldAlert className="h-12 w-12 text-destructive mb-4" /><CardTitle className="text-destructive">Acesso Negado</CardTitle></CardHeader><CardContent className='pt-4 text-center'><p>Você não tem permissão para acessar esta página.</p></CardContent></Card>
           </div>
       );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Estatuto da Igreja</h2>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Estatuto Oficial</CardTitle>
                    <CardDescription>Acesse o documento oficial que rege as normas e diretrizes da nossa igreja.</CardDescription>
                </CardHeader>
                <CardContent>
                    {churchInfo?.statuteUrl ? (
                        <Button asChild>
                            <a href={churchInfo.statuteUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Baixar Estatuto (PDF)
                            </a>
                        </Button>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                            <p>O estatuto da igreja ainda não foi enviado.</p>
                            {userData.cargo === 'Administrador' && (
                                <p className="mt-2">
                                    Por favor, vá para a página de <Link href="/dashboard/settings/congregations" className="underline text-primary">Configurações</Link> para fazer o upload do arquivo PDF.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
