
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Tipos
type Member = { id: string; nome: string; cargo: string; dataMembro?: any; congregacao?: string; responsiblePastor?: string; };
type UserData = { nome: string; cargo?: string; congregacao?: string; };
type ChurchInfo = { 
    pastorName?: string; 
    pastorSignatureUrl?: string; 
    conventionLogo1Url?: string;
    conventionLogo2Url?: string;
};

const DocumentRenderer = React.forwardRef<HTMLDivElement, {
    churchInfo: ChurchInfo | null,
    member: Member | null,
    docType: 'recomendacao' | 'mudanca' | null,
    date: Date,
    city: string,
    directorName?: string,
}>(({ churchInfo, member, docType, date, city, directorName }, ref) => {
    
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

    const logo1Url = churchInfo?.conventionLogo1Url;
    const logo2Url = churchInfo?.conventionLogo2Url;
    const presidentName = churchInfo?.pastorName || '';
    const pastorSignatureUrl = churchInfo?.pastorSignatureUrl;

    return (
        <div ref={ref} className="relative w-[148mm] h-[210mm] bg-white mx-auto shadow-lg p-[8mm] font-serif text-[11pt] text-black flex flex-col">
            
            {/* Header */}
            <header className="flex justify-between items-center pb-4 border-b-2 border-black">
                <div className="w-20 h-20 relative">
                    {logo1Url ? <img src={logo1Url} alt="Logo Convenção 1" style={{ objectFit: 'contain', width: '100%', height: '100%' }} crossOrigin="anonymous" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Logo 1</div>}
                </div>
                <div className="text-center">
                    <p className="font-bold text-sm">IGREJA ASSEMBLEIA DE DEUS</p>
                    <p className="font-bold text-sm">MINISTÉRIO KAIRÓS</p>
                    <p className="text-xs">A.D. KAIRÓS</p>
                    <p className="text-[10px] italic">TEMPO DE DEUS</p>
                </div>
                <div className="w-20 h-20 relative">
                    {logo2Url ? <img src={logo2Url} alt="Logo Convenção 2" style={{ objectFit: 'contain', width: '100%', height: '100%' }} crossOrigin="anonymous" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Logo 2</div>}
                </div>
            </header>

            {/* Title */}
            <div className="text-center my-8">
                <p className="font-bold text-base mb-2">CARTA DE,</p>
                <div className="flex justify-center gap-6 text-sm font-sans">
                    <div className="flex items-center gap-2">RECOMENDAÇÃO ({docType === 'recomendacao' ? <span className="font-bold">X</span> : ' '})</div>
                    <div className="flex items-center gap-2">MUDANÇA ({docType === 'mudanca' ? <span className="font-bold">X</span> : ' '})</div>
                </div>
            </div>

            {/* Body */}
            <main className="space-y-4 leading-relaxed text-justify text-base">
                <p className="font-bold text-center mb-6">Saudações no Senhor,</p>
                <p>
                    A Igreja Evangélica Assembleia de Deus Ministério Kairós apresenta,
                    o(a) Irmão(ã): <span className="font-bold underline">{member?.nome || '...'}</span>
                </p>
                 <p>
                    Cargo: <span className="font-bold underline">{member?.cargo || '...'}</span>
                </p>
                <p>
                    Membro desde: <span className="font-bold underline">{formatDate(member?.dataMembro) || '...'}</span>
                </p>
                <p className="text-center font-bold my-8 text-sm">
                    POR SE ACHAR EM COMUNHÃO COM ESSA IGREJA, RECOMENDAMOS QUE
                    O(A) RECEBAIS NO SENHOR, COMO COSTUMAM FAZER OS SANTOS.
                </p>
            </main>

            {/* Date */}
            <div className="text-center mt-6 font-sans">
                <p>{city}, {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
            
            {/* Signatures */}
            <footer className="pt-4 mt-auto">
                <div className="flex justify-between items-end w-[130mm] mx-auto">
                    {/* Left side: President */}
                    <div className="text-center w-[60mm]">
                         <div className="relative w-full mx-auto mb-1 flex items-center justify-center" style={{ minHeight: '30mm' }}>
                             {pastorSignatureUrl && <img src={pastorSignatureUrl} alt="Assinatura Pastor Presidente" style={{ objectFit: 'contain', maxHeight: '30mm', maxWidth: '50mm' }} crossOrigin="anonymous" />}
                        </div>
                        <div className="border-t border-black w-full" />
                        <p className="text-sm font-sans mt-1">{presidentName}</p>
                        <p className="text-xs font-sans italic">Pastor Presidente</p>
                    </div>

                    {/* Right side: Director */}
                     <div className="text-center w-[60mm]">
                         <div className="relative w-full mx-auto mb-1" style={{ minHeight: '30mm' }}>
                            {/* Empty space for manual signature */}
                        </div>
                        <div className="border-t border-black w-full" />
                        <p className="text-sm font-sans mt-1">{directorName || ' '}</p>
                        <p className="text-xs font-sans italic">Pastor Dirigente</p>
                    </div>
                </div>

                <div className="text-center text-xs font-sans mt-8">
                    <p>Válida por 30 dias</p>
                </div>
            </footer>
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

    const handleGeneratePdf = async () => {
        if (!documentRef.current) return;
        setIsGeneratingPdf(true);
        try {
            const canvas = await html2canvas(documentRef.current, { scale: 4, useCORS: true });
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
    const directorName = selectedMember?.responsiblePastor || (userData?.cargo === 'Pastor/dirigente' ? userData.nome : '');

    const isLoading = isAuthUserLoading || isUserDataLoading || isLoadingMembers || isChurchInfoLoading;

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
                <h2 className="text-3xl font-bold tracking-tight">Gerar Carta</h2>
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
                    churchInfo={churchInfo}
                    member={selectedMember}
                    docType={documentType}
                    date={new Date()}
                    city="Veranópolis"
                    directorName={directorName}
                />
            </div>
        </div>
    );
}
