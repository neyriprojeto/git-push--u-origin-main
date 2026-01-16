
'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- Types ---
type Member = { 
    id: string; 
    nome: string; 
    cargo: string; 
    dataNascimento?: any;
    dataBatismo?: any;
    congregacao?: string; 
    responsiblePastor?: string;
    gender?: 'Masculino' | 'Feminino';
};
type UserData = { nome: string; cargo?: string; congregacao?: string; };
type ChurchInfo = { 
    pastorName?: string; 
    pastorSignatureUrl?: string; 
    conventionLogo1Url?: string;
    conventionLogo2Url?: string;
};

// --- Document Renderer ---
const DocumentRenderer = React.forwardRef<HTMLDivElement, {
    churchInfo: ChurchInfo | null,
    member: Member | null,
    date: Date,
    city: string,
    celebrantPastor?: string,
    bgImage?: string;
}>(({ churchInfo, member, date, city, celebrantPastor, bgImage }, ref) => {
    
    const formatDate = (d: any, isLong = false): string => {
        if (!d) return '___/___/______';
        try {
            const dateObj = d.toDate ? d.toDate() : new Date(d);
            // Corrige o problema de fuso horário que pode fazer a data voltar um dia
            const timeZoneOffset = dateObj.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(dateObj.getTime() + timeZoneOffset);
            return isLong ? format(adjustedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : format(adjustedDate, 'dd/MM/yyyy');
        } catch { return '___/___/______'; }
    };
    
    const genderTerm = member?.gender === 'Feminino' ? 'batizada' : 'batizado';
    const presidentName = churchInfo?.pastorName || '_________________________';
    
    return (
        <div 
            ref={ref} 
            className="w-full max-w-[297mm] aspect-[297/210] bg-white mx-auto shadow-lg font-serif text-black relative print:shadow-none print:border-0 print:w-[297mm] print:h-[210mm]"
            style={{
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}
        >
            {/* This container will hold all the content and manage spacing */}
            <div className="absolute inset-0 flex flex-col items-center justify-between p-16">
            
                {/* Spacer at the top */}
                <div />

                {/* Middle text content */}
                <div className="w-[80%] text-center text-[#444]">
                    <p className="font-bold text-4xl my-4 text-[#63532f]" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                       {member?.nome || '________________'}
                   </p>
                   <p className="text-lg leading-relaxed mt-4">
                       Crendo e obedecendo nas sagradas Escrituras e as doutrinas ensinadas por 
                       Jesus Cristo, foi {genderTerm} sob profissão de fé em nome do Pai, do Filho e do Espírito Santo,
                       no dia <span className="font-semibold">{formatDate(member?.dataBatismo, true)}</span> na Assembleia de Deus Kairós congregação de {member?.congregacao || '____________'}.
                   </p>
               </div>
           
                {/* Footer at the bottom */}
                <footer className="w-full">
                    <div className="flex justify-around items-end">
                        <div className="text-center w-2/5">
                            <div className="border-b-2 border-black w-full" />
                            <p className="text-sm mt-1">{presidentName}</p>
                            <p className="text-xs italic">Pastor Presidente</p>
                        </div>
                         <div className="text-center w-2/5">
                            <div className="border-b-2 border-black w-full" />
                            <p className="text-sm mt-1">{celebrantPastor || '________________'}</p>
                            <p className="text-xs italic">Pastor Celebrante</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
});
DocumentRenderer.displayName = 'DocumentRenderer';


// --- Page Component ---
export default function BaptismCertificatePage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const documentRef = useRef<HTMLDivElement>(null);
    
    // States
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [celebrantPastor, setCelebrantPastor] = useState('');
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
            const canvas = await html2canvas(documentRef.current, { scale: 4, useCORS: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');
            
            // A4 landscape: 297mm x 210mm
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`certificado-batismo-${selectedMember?.nome.replace(/ /g, '_') || 'membro'}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    
    const selectedMember = members?.find(m => m.id === selectedMemberId) || null;
    const bgImage = PlaceHolderImages.find(p => p.id === 'baptism-certificate-bg')?.imageUrl;


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
                <h2 className="text-3xl font-bold tracking-tight">Gerar Certificado de Batismo</h2>
                <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf || !selectedMember}>
                    {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Configurar Certificado</CardTitle>
                    <CardDescription>Selecione o membro e preencha as informações para gerar o documento.</CardDescription>
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
                         <Label htmlFor="celebrantPastor">Pastor Celebrante</Label>
                         <Input 
                            id="celebrantPastor"
                            placeholder="Nome do pastor que realizou o batismo"
                            value={celebrantPastor}
                            onChange={(e) => setCelebrantPastor(e.target.value)}
                         />
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-muted/50 rounded-lg">
                 <DocumentRenderer 
                    ref={documentRef}
                    churchInfo={churchInfo}
                    member={selectedMember}
                    date={new Date()}
                    city="Veranópolis"
                    celebrantPastor={celebrantPastor}
                    bgImage={bgImage}
                />
            </div>
        </div>
    );
}
