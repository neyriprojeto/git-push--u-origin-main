
'use client';

import React, { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AppLogo } from '@/components/icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


// Interface for member data
interface Member {
    id: string;
    nome: string;
    avatar?: string;
    rg?: string;
    cargo: string;
    dataNascimento?: string | { seconds: number; nanoseconds: number };
    dataMembro?: string | { seconds: number; nanoseconds: number };
    congregacao?: string;
}

const formatDate = (dateValue?: string | { seconds: number; nanoseconds: number } | Date) => {
    if (!dateValue) return 'N/A';
    try {
        let date;
        if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            date = new Date(dateValue.seconds * 1000);
        } else {
           return 'N/A';
        }
        date.setDate(date.getDate() + 1); // Adjust for timezone issues
        return format(date, 'dd/MM/yyyy');
    } catch {
        return 'N/A';
    }
};

const CardView = React.forwardRef<HTMLDivElement, { member: Member }>(({ member }, ref) => {
    const avatar = member.avatar?.startsWith('http') 
        ? { imageUrl: member.avatar } 
        : PlaceHolderImages.find((p) => p.id === member.avatar) || PlaceHolderImages.find((p) => p.id === 'member-avatar-1');
    
    const churchPicture = PlaceHolderImages.find((p) => p.id === "church-banner");

    return (
        <div ref={ref} className="w-[21cm] h-[29.7cm] bg-white flex justify-center items-center p-4">
            <div className="w-[85.6mm] h-[54mm] scale-[2.5] origin-center">
                 <div className={cn("flip-card w-full h-full")}>
                    {/* Card Front */}
                    <div className="flip-card-front">
                    <Card className="h-full w-full overflow-hidden shadow-lg bg-[#0a2749] text-white flex flex-col">
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {churchPicture && 
                                <Image src={churchPicture.imageUrl} alt="Igreja" width={60} height={60} className="rounded-md" />
                                }
                                <div>
                                <h3 className="font-bold text-sm sm:text-base">ASSEMBLEIA DE DEUS</h3>
                                <h4 className="font-semibold text-xs sm:text-sm">MINISTÉRIO KAIRÓS</h4>
                                <p className="text-xs opacity-80">Tempo de Deus</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <AppLogo className="h-8 w-8 mx-auto" />
                                <span className="text-[10px] font-bold">A.D. K</span>
                            </div>
                            </div>
                            <p className="text-center text-xs opacity-80 mt-2">Rua Presidente Prudente, 28, Eldorado, Diadema - SP, 09972-300</p>
                        </div>
                        <div className="bg-white text-gray-800 p-4 space-y-3 flex-1">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Avatar className="h-20 w-20 border">
                                        {avatar && <AvatarImage src={avatar.imageUrl} alt={member.nome} />}
                                        <AvatarFallback className="text-3xl">
                                            {member.nome.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="border-b pb-1 flex-1">
                                    <Label className="text-xs text-muted-foreground">NOME</Label>
                                    <p className="font-bold text-sm">{member.nome}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border-b pb-1">
                                    <Label className="text-xs text-muted-foreground">RG</Label>
                                    <p className="font-bold text-sm">{member.rg || 'N/A'}</p>
                                </div>
                                <div className="border-b pb-1">
                                    <Label className="text-xs text-muted-foreground">CARGO</Label>
                                    <p className="font-bold text-sm">{member.cargo}</p>
                                </div>
                                <div className="border-b pb-1">
                                    <Label className="text-xs text-muted-foreground">NASCIMENTO</Label>
                                    <p className="font-bold text-sm">{formatDate(member.dataNascimento)}</p>
                                </div>
                                    <div className="border-b pb-1">
                                    <Label className="text-xs text-muted-foreground">MEMBRO DESDE</Label>
                                    <p className="font-bold text-sm">{formatDate(member.dataMembro)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                    </div>
                </div>
            </div>
        </div>
    );
});
CardView.displayName = 'CardView';


export default function MemberCardPage() {
    const params = useParams();
    const router = useRouter();
    const memberId = params.id as string;
    const firestore = useFirestore();
    const { user: authUser, isUserLoading } = useUser();
    const cardRef = React.useRef<HTMLDivElement>(null);

    const memberRef = useMemoFirebase(() => (firestore ? doc(firestore, 'users', memberId) : null), [firestore, memberId]);
    const { data: member, isLoading: memberLoading } = useDoc<Member>(memberRef);

    const currentUserRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: currentUser, isLoading: currentUserLoading } = useDoc<Member>(currentUserRef);

    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

     useEffect(() => {
        if (currentUserLoading || memberLoading) return;

        if (!currentUser || !member) {
            setHasAccess(false);
            return;
        }

        if (currentUser.cargo === 'Administrador') {
            setHasAccess(true);
        } else if (currentUser.cargo === 'Pastor Dirigente/Local' && currentUser.congregacao === member.congregacao) {
            setHasAccess(true);
        } else {
            setHasAccess(false);
        }
    }, [currentUser, member, currentUserLoading, memberLoading]);

    const isLoading = memberLoading || currentUserLoading || isUserLoading || hasAccess === null;
    
    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-secondary p-4 flex justify-center items-center">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        );
    }

    if (!member) {
        return notFound();
    }
    
    if (!hasAccess) {
        return (
             <div className="w-full min-h-screen bg-secondary p-4 flex justify-center items-center">
                <Card className="border-destructive">
                    <CardHeader className='text-center'>
                        <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
                        <CardTitle className="text-destructive">Acesso Negado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Você não tem permissão para visualizar esta carteirinha.</p>
                        <Button onClick={() => router.back()} className='w-full mt-6'>Voltar</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-200">
             <div className="fixed top-4 right-4 z-50 print:hidden">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir / Salvar PDF
                </Button>
            </div>
            <div className="print-container">
                <CardView member={member} ref={cardRef}/>
            </div>
        </div>
    );
}
    