'use client';

import React, { useEffect, useState } from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, collection, query, where, orderBy, Timestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, ShieldAlert, Mail, Trash2, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

type UserData = { cargo?: string; congregacao?: string; };
type Message = {
    id: string;
    senderId: string;
    senderName: string;
    recipient: string;
    subject: string;
    body: string;
    createdAt: Timestamp;
};

export default function MessagesPage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const { toast } = useToast();

    // Fetch current user's data to determine their role and congregation
    const userRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);

    const [messages, setMessages] = useState<Message[] | null>(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!firestore || !userData || !['Administrador', 'Pastor/dirigente'].includes(userData.cargo || '')) {
                setMessages([]);
                setIsLoadingMessages(false);
                return;
            }

            setIsLoadingMessages(true);
            try {
                const baseQuery = collection(firestore, 'messages');
                let finalMessages: Message[] = [];

                if (userData.cargo === 'Administrador') {
                    const adminQuery = query(baseQuery, orderBy('createdAt', 'desc'));
                    const snapshot = await getDocs(adminQuery);
                    finalMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                } else if (userData.cargo === 'Pastor/dirigente' && userData.congregacao) {
                    const congregationQuery = query(baseQuery, where('recipient', '==', userData.congregacao));
                    const adminMessagesQuery = query(baseQuery, where('recipient', '==', 'Administração Geral'));
                    
                    const [congregationSnapshot, adminSnapshot] = await Promise.all([
                        getDocs(congregationQuery),
                        getDocs(adminMessagesQuery)
                    ]);

                    const congregationMessages = congregationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                    const adminMessages = adminSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                    
                    finalMessages = [...congregationMessages, ...adminMessages];
                    finalMessages.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                }

                setMessages(finalMessages);
            } catch (error: any) {
                 if (error.name === 'FirestoreError' && error.code === 'permission-denied') {
                    // Error is already handled by global listener
                 } else {
                    console.error("Error fetching messages:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Erro ao carregar mensagens',
                        description: 'Não foi possível buscar as mensagens. Tente novamente mais tarde.',
                    });
                 }
                 setMessages(null);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [firestore, userData, toast]);

    
    const handleDeleteMessage = async (messageId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'messages', messageId));
            setMessages(prev => prev ? prev.filter(m => m.id !== messageId) : null);
            toast({ title: 'Sucesso', description: 'Mensagem removida.' });
        } catch (error) {
            console.error("Error deleting message:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover a mensagem.' });
        }
    };

    const isLoading = isAuthUserLoading || isUserDataLoading;

    if (isLoading) {
        return <div className="flex-1 h-screen flex items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    if (!userData?.cargo || !['Administrador', 'Pastor/dirigente'].includes(userData.cargo)) {
         return (
           <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
               <Card className="border-destructive"><CardHeader className="items-center text-center"><ShieldAlert className="h-12 w-12 text-destructive mb-4" /><CardTitle className="text-destructive">Acesso Negado</CardTitle></CardHeader><CardContent className='pt-4 text-center'><p>Você não tem permissão para acessar a caixa de entrada.</p></CardContent></Card>
           </div>
       );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Caixa de Entrada</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Mensagens Recebidas</CardTitle>
                    <CardDescription>Mensagens enviadas por membros através do formulário de contato.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingMessages ? (
                         <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : messages && messages.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {messages.map(message => (
                                <AccordionItem value={message.id} key={message.id}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-4 text-left w-full">
                                            <Avatar className="h-9 w-9 hidden sm:flex">
                                                <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-1 flex-1">
                                                <p className="font-medium truncate">{message.subject}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    De: <span className="font-semibold">{message.senderName}</span>
                                                </p>
                                            </div>
                                            <div className="text-sm text-muted-foreground text-right ml-4">
                                                <p>{formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true, locale: ptBR })}</p>
                                                <Badge variant="secondary" className='mt-1'>{message.recipient}</Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-4">
                                        <p className="text-muted-foreground whitespace-pre-wrap">{message.body}</p>
                                        {userData.cargo === 'Administrador' && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta ação não pode ser desfeita. A mensagem será excluída permanentemente.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteMessage(message.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Excluir
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                            <Inbox className="mx-auto h-12 w-12" />
                            <p className="mt-4">Sua caixa de entrada está vazia.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
