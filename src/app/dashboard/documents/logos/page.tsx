'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Loader2, ShieldAlert, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';


type UserData = { cargo?: string };
type Logo = { id: string; name: string; imageUrl: string };

export default function LogosPage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();

    // Data fetching
    const userRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);

    const logosRef = useMemoFirebase(() => (firestore ? collection(firestore, 'logos') : null), [firestore]);
    const { data: logos, isLoading: isLoadingLogos } = useCollection<Logo>(logosRef);

    const isLoading = isAuthUserLoading || isUserDataLoading || isLoadingLogos;

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
            <h2 className="text-3xl font-bold tracking-tight">Logos da Igreja</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Logos Oficiais</CardTitle>
                    <CardDescription>Baixe os logos oficiais da igreja para uso em materiais de divulgação.</CardDescription>
                </CardHeader>
                <CardContent>
                    {logos && logos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {logos.map((logo) => (
                                <Card key={logo.id}>
                                    <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
                                        <div className="w-32 h-32 relative flex items-center justify-center bg-muted/50 rounded-md p-2">
                                            <Image src={logo.imageUrl} alt={logo.name} layout="fill" objectFit="contain" />
                                        </div>
                                        <p className="text-sm font-medium text-center">{logo.name}</p>
                                        <Button asChild className="w-full">
                                            <a href={logo.imageUrl} download target="_blank" rel="noopener noreferrer">
                                                <Download className="mr-2 h-4 w-4" />
                                                Baixar
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                            <p>Nenhum logo foi enviado ainda.</p>
                            {userData.cargo === 'Administrador' && (
                                <p className="mt-2">
                                    Vá para as <Link href="/dashboard/settings/congregations" className='underline text-primary'>Configurações</Link> para adicionar logos.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
