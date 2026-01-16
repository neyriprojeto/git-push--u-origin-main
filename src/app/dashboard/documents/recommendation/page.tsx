'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Tipos
type Member = { id: string; nome: string; cargo: string; dataMembro?: any; congregacao?: string; };
type UserData = { nome: string; cargo?: string; congregacao?: string; };
type ChurchInfo = { pastorName?: string; pastorSignatureUrl?: string; };

const DocumentRenderer = React.forwardRef<HTMLDivElement, {
    templateUrl?: string,
    member: Member | null,
    docType: 'recomendacao' | 'mudanca' | null,
    date: Date,
    city: string,
    presidentName?: string,
    directorName?: string,
    pastorSignatureUrl?: string,
}>(({ templateUrl, member, docType, date, city, presidentName, directorName, pastorSignatureUrl }, ref) => {
    
    const formatDate = (d: any): string => {
        if (!d) return '';
        try {
            const dateObj = d.toDate ? d.toDate() : new Date(d);
            // Corrige o problema de fuso horário
            const timeZoneOffset = dateObj.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(dateObj.getTime() + timeZoneOffset);
            return format(adjustedDate, 'dd/MM/yyyy');
        } catch { return ''; }
    };

    return (
        <div ref={ref} className="relative w-[148mm] h-[210mm] bg-white mx-auto scale-50 sm:scale-75 md:scale-100 origin-top">
            {templateUrl ? (
                <Image src={templateUrl} alt="Fundo da carta" layout="fill" objectFit="contain" priority />
            ) : (
                 <div className="w-full h-full border flex items-center justify-center">
                    <p className='text-center text-muted-foreground'>Fundo da carta não configurado.<br/>Vá para Configurações para fazer o upload.</p>
                </div>
            )}
            
            <div className="absolute inset-0 font-serif text-[11pt] text-black">
                {/* Checkboxes */}
                <div className="absolute font-bold" style={{ top: '86.5mm', left: '77mm' }}>
                    {docType === 'recomendacao' && <span className='text-lg'>X</span>}
                </div>
                <div className="absolute font-bold" style={{ top: '94.5mm', left: '77mm' }}>
                    {docType === 'mudanca' && <span className='text-lg'>X</span>}
                </div>

                {/* Member data */}
                <div className="absolute" style={{ top: '122mm', left: '42mm' }}>{member?.nome || ''}</div>
                <div className="absolute" style={{ top: '128mm', left: '33mm' }}>{member?.cargo || ''}</div>
                <div className="absolute" style={{ top: '134mm', left: '47mm' }}>{formatDate(member?.dataMembro)}</div>

                {/* Date */}
                <div className="absolute" style={{ top: '165mm', left: '31mm' }}>{city}</div>
                <div className="absolute" style={{ top: '165mm', left: '56mm' }}>{format(date, 'd')}</div>
                <div className="absolute" style={{ top: '165mm', left: '80mm' }}>{format(date, 'MMMM', { locale: ptBR })}</div>
                <div className="absolute" style={{ top: '165mm', left: '118mm' }}>{format(date, 'yy')}</div>
                
                {/* Signatures */}
                <div className="absolute flex justify-around items-end" style={{ bottom: '22mm', left: '10mm', right: '10mm', gap: '10mm' }}>
                    <div className="text-center w-[65mm]">
                        <div className="border-t border-black w-full mx-auto" style={{ marginBottom: '1mm' }} />
                        <p className="text-[10pt] mt-1">{directorName}</p>
                        <p className="text-[9pt] italic">Pastor Dirigente</p>
                    </div>
                    <div className="text-center w-[65mm]">
                        {pastorSignatureUrl && (
                            <div className="relative w-[60mm] h-[15mm] mx-auto -mb-1">
                               <Image src={pastorSignatureUrl} alt="Assinatura Pastor Presidente" layout="fill" objectFit="contain" />
                            </div>
                        )}
                        <div className="border-t border-black w-full mx-auto" style={{ marginBottom: '1mm' }}/>
                        <p className="text-[10pt] mt-1">{presidentName}</p>
                        <p className="text-[9pt] italic">Pastor Presidente</p>
                    </div>
                </div>

            </div>
        </div>
    );
});
DocumentRenderer.displayName = 'DocumentRenderer';


export default function RecommendationLetterPage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const documentRef = useRef<HTMLDivElement>(null);
    
    // States
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [documentType, setDocumentType] = useState<'recomendacao' | 'mudanca' | null>('recomendacao');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Data fetching
    const userRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);
    
    const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
    const { data: churchInfo, isLoading: isChurchInfoLoading } = useDoc<ChurchInfo>(churchInfoRef);
    
    const membersQuery = useMemoFirebase(() => {
        if (!firestore || !userData) return null;
        if (userData.cargo === 'Administrador') return collection(firestore, 'users');
        if (userData.cargo === 'Pastor/dirigente' && userData.congregacao) return query(collection(firestore, 'users'), where('congregacao', '==', userData.congregacao));
        return null;
    }, [firestore, userData]);
    const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersQuery);

    const templateRef = useMemoFirebase(() => (firestore ? doc(firestore, 'documentTemplates', 'recommendation-letter') : null), [firestore]);
    const { data: templateData, isLoading: isLoadingTemplate } = useDoc<{ backgroundUrl?: string }>(templateRef);

    const handleGeneratePdf = async () => {
        if (!documentRef.current) return;
        setIsGeneratingPdf(true);
        try {
            const canvas = await html2canvas(documentRef.current, { scale: 3, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a5');
            pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
            pdf.save(`carta-recomendacao-${selectedMember?.nome.replace(/ /g, '_') || 'membro'}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    
    const selectedMember = members?.find(m => m.id === selectedMemberId) || null;
    const presidentName = churchInfo?.pastorName || '';
    const pastorSignatureUrl = churchInfo?.pastorSignatureUrl || '';
    const directorName = userData?.cargo === 'Pastor/dirigente' ? userData.nome : '';

    const isLoading = isAuthUserLoading || isUserDataLoading || isLoadingMembers || isLoadingTemplate || isChurchInfoLoading;

    if (isLoading) {
        return (
            <div className="flex-1 h-screen flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        );
    }

    if (!userData?.cargo || !['Administrador', 'Pastor/dirigente'].includes(userData.cargo)) {
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
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Carta de Recomendação</h2>
                <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf || !selectedMember}>
                    {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Configurar Documento</CardTitle>
                    <CardDescription>Selecione o membro e o tipo de carta para gerar o documento.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Selecione o Membro</Label>
                        <Select onValueChange={setSelectedMemberId} disabled={!members}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingMembers ? "Carregando..." : "Escolha um membro"} />
                            </SelectTrigger>
                            <SelectContent>
                                {members?.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Carta</Label>
                        <div className="flex items-center gap-8 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="rec" checked={documentType === 'recomendacao'} onCheckedChange={(c) => c && setDocumentType('recomendacao')} />
                                <Label htmlFor="rec" className="font-normal">Recomendação</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="mud" checked={documentType === 'mudanca'} onCheckedChange={(c) => c && setDocumentType('mudanca')} />
                                <Label htmlFor="mud" className="font-normal">Mudança</Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-muted/50 rounded-lg overflow-x-auto">
                 <DocumentRenderer 
                    ref={documentRef}
                    templateUrl={templateData?.backgroundUrl}
                    member={selectedMember}
                    docType={documentType}
                    date={new Date()}
                    city="Veranópolis"
                    presidentName={presidentName}
                    directorName={directorName}
                    pastorSignatureUrl={pastorSignatureUrl}
                />
            </div>
        </div>
    );
}
