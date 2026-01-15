
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface UserData {
    cargo?: string;
    congregacao?: string;
}

export default function CongregationSettingsPage() {
    const params = useParams();
    // Decode the congregation name from the URL, replacing encoded spaces
    const congregationId = decodeURIComponent(params.congregationId as string);
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);

    const isLoading = isUserLoading || isUserDataLoading;

    if (isLoading) {
        return (
             <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        )
    }

    // Security check: Ensure the logged-in pastor belongs to the congregation they are trying to view
    if (userData?.cargo === 'Pastor/dirigente' && userData?.congregacao !== congregationId) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Acesso Negado</CardTitle>
                        <CardDescription>
                            Você não tem permissão para acessar as configurações desta congregação.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configurações da Congregação</CardTitle>
                    <CardDescription>Gerencie as informações e membros da sua congregação.</CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="text-xl font-bold">{congregationId}</h3>
                    <p className="text-muted-foreground mt-2">
                        Bem-vindo à área de gerenciamento da sua congregação. Em breve, mais funcionalidades estarão disponíveis aqui.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
