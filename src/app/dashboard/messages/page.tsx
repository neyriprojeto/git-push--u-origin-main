

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, collection, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, ShieldAlert, Mail, Trash2, Inbox, Paperclip, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { addReplyToMessage, deleteMessage } from '@/firebase/firestore/mutations';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { uploadArquivo } from '@/lib/cloudinary';

type UserData = { cargo?: string; congregacao?: string; nome?: string };
type Reply = {
    authorId: string;
    authorName: string;
    body: string;
    attachmentUrl?: string;
    createdAt: Timestamp;
};
type Message = {
    id: string;
    userId: string;
    senderName: string;
    recipientId: string;
    recipientName: string;
    subject: string;
    body: string;
    attachmentUrl?: string;
    createdAt: Timestamp;
    replies?: Reply[];
};

export default function MessagesPage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const { toast } = useToast();

    const userRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);

    const [messages, setMessages] = useState<Message[] | null>(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [replyText, setReplyText] = useState<Record<string, string>>({});
    const [isReplying, setIsReplying] = useState<string | null>(null);
    
    const [replyAttachments, setReplyAttachments] = useState<Record<string, File | null>>({});
    const replyAttachmentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        if (!firestore || !authUser || !userData) {
             if (!isUserDataLoading && !isAuthUserLoading) {
                setIsLoadingMessages(false);
             }
             return;
        };

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                let finalMessages: Message[] = [];
                if (userData.cargo === 'Administrador') {
                    const q = query(collection(firestore, 'messages'), orderBy('createdAt', 'desc'));
                    const querySnapshot = await getDocs(q);
                    finalMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                } else if (userData.cargo === 'Pastor/dirigente' || userData.cargo === 'Pastor(a)') {
                    const q = query(collection(firestore, 'messages'), where('recipientId', 'in', [authUser.uid, 'ADMIN_GROUP']));
                    const querySnapshot = await getDocs(q);
                    const combined = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                    
                    const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
                    unique.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                    finalMessages = unique;
                }
                setMessages(finalMessages);
            } catch (err: any) {
                console.error("Error fetching messages:", err);
                if (err.code === 'permission-denied') {
                     toast({
                        variant: 'destructive',
                        title: 'Erro de Permissão',
                        description: 'Você não tem permissão para visualizar estas mensagens.',
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Erro ao Carregar',
                        description: 'Não foi possível carregar as mensagens.',
                    });
                }
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [firestore, authUser, userData, toast, isUserDataLoading, isAuthUserLoading]);


    const handleReplyChange = (messageId: string, text: string) => {
        setReplyText(prev => ({ ...prev, [messageId]: text }));
    };

    const handleReplyAttachmentChange = (messageId: string, file: File | null) => {
        setReplyAttachments(prev => ({ ...prev, [messageId]: file }));
    };

    const handleReplySubmit = async (message: Message) => {
        if (!firestore || !authUser || !userData) return;
        
        const replyBody = replyText[message.id];
        const attachment = replyAttachments[message.id];

        if (!replyBody || !replyBody.trim()) {
            toast({ variant: 'destructive', title: 'Erro', description: 'A resposta não pode estar vazia.' });
            return;
        }
    
        setIsReplying(message.id);
        try {
            let attachmentUrl: string | undefined = undefined;
            if (attachment) {
                attachmentUrl = await uploadArquivo(attachment);
            }

            const replyData: { authorId: string; authorName: string; body: string; attachmentUrl?: string; } = {
                authorId: authUser.uid,
                authorName: userData.nome || 'Admin',
                body: replyBody,
            };

            if (attachmentUrl) {
                replyData.attachmentUrl = attachmentUrl;
            }

            await addReplyToMessage(firestore, message.id, replyData);
            
            // Refetch messages to show the new reply
            const updatedMessages = messages ? [...messages] : [];
            const messageIndex = updatedMessages.findIndex(m => m.id === message.id);
            if (messageIndex > -1) {
                const updatedMessage = { ...updatedMessages[messageIndex] };
                if (!updatedMessage.replies) {
                    updatedMessage.replies = [];
                }
                updatedMessage.replies.push({
                    ...replyData,
                    createdAt: Timestamp.now(), // Use client-side timestamp for immediate UI update
                });
                updatedMessages[messageIndex] = updatedMessage;
                setMessages(updatedMessages);
            }
    
            handleReplyChange(message.id, '');
            setReplyAttachments(prev => ({ ...prev, [message.id]: null }));
            if (replyAttachmentInputRefs.current && replyAttachmentInputRefs.current[message.id]) {
                replyAttachmentInputRefs.current[message.id]!.value = '';
            }
            toast({ title: 'Sucesso', description: 'Sua resposta foi enviada.' });
    
        } catch (error) {
            console.error('Error sending reply:', error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar a resposta.' });
        } finally {
            setIsReplying(null);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!firestore) return;
        try {
            await deleteMessage(firestore, messageId);
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

    if (!userData?.cargo || !['Administrador', 'Pastor/dirigente', 'Pastor(a)'].includes(userData.cargo)) {
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
                                                <Badge variant="secondary" className='mt-1'>{message.recipientName}</Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-4">
                                        <p className="text-muted-foreground whitespace-pre-wrap">{message.body}</p>

                                        {message.attachmentUrl && (
                                            <div className="pt-2">
                                                <p className="text-sm font-semibold mb-1">Anexo:</p>
                                                <Button asChild variant="link" className="p-0 h-auto text-left">
                                                    <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate">
                                                        <Paperclip className="mr-2 h-4 w-4 shrink-0" /> <span className="truncate">{message.attachmentUrl.split('/').pop()?.split('?')[0]}</span>
                                                    </a>
                                                </Button>
                                            </div>
                                        )}

                                        {message.replies && message.replies.length > 0 && (
                                            <div className="space-y-4 pt-4 border-t">
                                                <h4 className="text-sm font-semibold">Respostas</h4>
                                                {message.replies.map((reply, index) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{reply.authorName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-semibold text-sm">{reply.authorName}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                                                                </p>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{reply.body}</p>
                                                            {reply.attachmentUrl && (
                                                                <div className="pt-2">
                                                                    <Button asChild variant="link" className="p-0 h-auto text-left text-xs">
                                                                        <a href={reply.attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate">
                                                                            <Paperclip className="mr-2 h-3 w-3 shrink-0" /> 
                                                                            <span className="truncate">{reply.attachmentUrl.split('/').pop()?.split('?')[0]}</span>
                                                                        </a>
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-4 border-t space-y-2">
                                            <Label htmlFor={`reply-${message.id}`} className="font-semibold">Responder</Label>
                                            <Textarea
                                                id={`reply-${message.id}`}
                                                className="mt-2"
                                                placeholder="Escreva sua resposta..."
                                                value={replyText[message.id] || ''}
                                                onChange={(e) => handleReplyChange(message.id, e.target.value)}
                                            />
                                             <div className="space-y-1">
                                                <Label htmlFor={`reply-attachment-${message.id}`} className="text-xs font-medium text-muted-foreground">Anexo (Opcional)</Label>
                                                <Input 
                                                    id={`reply-attachment-${message.id}`}
                                                    type="file"
                                                    onChange={(e) => handleReplyAttachmentChange(message.id, e.target.files ? e.target.files[0] : null)}
                                                    ref={(el) => {
                                                        if (replyAttachmentInputRefs.current) {
                                                            replyAttachmentInputRefs.current[message.id] = el;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="mt-2" 
                                                onClick={() => handleReplySubmit(message)}
                                                disabled={isReplying === message.id}
                                            >
                                                {isReplying === message.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                                Enviar Resposta
                                            </Button>
                                        </div>

                                        {userData.cargo === 'Administrador' && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive mt-4">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir Conversa
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta ação não pode ser desfeita. A mensagem e todas as suas respostas serão excluídas permanentemente.</AlertDialogDescription>
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
