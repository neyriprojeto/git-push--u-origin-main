
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- Types ---
type UserData = { nome: string; cargo?: string; congregacao?: string; };
type ChurchInfo = { 
    pastorName?: string; 
    pastorSignatureUrl?: string; 
    presentationCertBgUrl?: string;
};

// --- Document Renderer ---
const DocumentRenderer = React.forwardRef<HTMLDivElement, {
    churchInfo: ChurchInfo | null,
    childName: string,
    childDetails: string,
    localPastor: string,
    bgImage?: string;
}>(({ churchInfo, childName, childDetails, localPastor, bgImage }, ref) => {
    
    const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    const presidentName = churchInfo?.pastorName || '_________________________';
    
    return (
        <div 
            ref={ref} 
            className="w-[297mm] h-[210mm] bg-white text-black relative font-body"
            style={{
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 flex flex-col items-center text-center text-[#333] pt-[25mm] pb-[15mm] px-[20mm]">
                
                <div style={{ height: '20mm' }}></div>

                <p className="font-bold tracking-[0.2em]" style={{ fontSize: '16pt' }}>CERTIFICADO</p>
                <p className="font-bold tracking-[0.2em] mb-4" style={{ fontSize: '16pt' }}>DE APRESENTAÇÃO</p>
                
                <p className="mt-4" style={{ fontSize: '12pt' }}>CERTIFICAMOS QUE</p>
                
                <p className="font-script my-3 text-black" style={{ fontSize: '36pt', lineHeight: 1.2 }}>
                    {childName || '________________'}
                </p>
                
                <div className="w-[85%] space-y-3 mt-3" style={{ fontSize: '11pt' }}>
                    <p>{childDetails || 'Nascida no dia ___ de ________ de _____, filha(o) de ______________ e ______________'}</p>
                    <p>foi apresentada oficialmente ao SENHOR JESUS CRISTO, na Igreja Evangélica Assembleia de Deus Ministério Kairós.</p>
                    <p>No dia {today}</p>
                </div>
                
                <p className="italic mt-6 w-[75%]" style={{ fontSize: '9pt' }}>
                    “E, cumprindo-se os dias da purificação dela, segundo a lei de Moisés, o levaram a Jerusalém, para o apresentarem ao Senhor.” <span className="font-semibold not-italic">Lucas 2:22</span>
                </p>

                <div style={{ flexGrow: 2 }}></div>

                <footer className="w-full">
                    <div className="flex justify-around items-end">
                        <div className="text-center w-2/5">
                             <div className="relative w-full mx-auto mb-1 flex items-center justify-center min-h-[15mm]">
                                {churchInfo?.pastorSignatureUrl && (
                                    <img 
                                        src={churchInfo.pastorSignatureUrl} 
                                        alt="Assinatura Pastor Presidente" 
                                        className="object-contain max-h-[25mm] max-w-full"
                                        crossOrigin="anonymous"
                                    />
                                )}
                            </div>
                            <div className="border-b-2 border-black w-full" />
                            <p className="mt-1" style={{ fontSize: '9pt' }}>{presidentName}</p>
                            <p className="italic" style={{ fontSize: '7pt' }}>Pastor Presidente</p>
                        </div>
                         <div className="text-center w-2/5">
                            <div className="relative w-full mx-auto mb-1 flex items-center justify-center min-h-[15mm]" />
                            <div className="border-b-2 border-black w-full" />
                            <p className="mt-1" style={{ fontSize: '9pt' }}>{localPastor || '____________________'}</p>
                            <p className="italic" style={{ fontSize: '7pt' }}>Pastor Dirigente</p>
                        </div>
                    </div>
                </footer>
                <div style={{ flexGrow: 1 }}></div>
            </div>
        </div>
    );
});
DocumentRenderer.displayName = 'DocumentRenderer';


// --- Page Component ---
export default function PresentationCertificatePage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const documentRef = useRef<HTMLDivElement>(null);
    
    // States
    const [childName, setChildName] = useState('');
    const [childDetails, setChildDetails] = useState('');
    const [localPastor, setLocalPastor] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [bgImage, setBgImage] = useState('');

    // Data fetching
    const userRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);
    
    const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
    const { data: churchInfo, isLoading: isChurchInfoLoading } = useDoc<ChurchInfo>(churchInfoRef);
    
    useEffect(() => {
        if (churchInfo) {
            setBgImage(churchInfo.presentationCertBgUrl || PlaceHolderImages.find(p => p.id === 'presentation-certificate-bg')?.imageUrl || '');
        } else if (!isChurchInfoLoading) {
            setBgImage(PlaceHolderImages.find(p => p.id === 'presentation-certificate-bg')?.imageUrl || '');
        }

        if (userData?.cargo === 'Pastor/dirigente') {
            setLocalPastor(userData.nome);
        }

    }, [churchInfo, isChurchInfoLoading, userData]);

    const handleGeneratePdf = async () => {
        const source = documentRef.current;
        if (!source || !source.parentElement) {
            alert('Não foi possível encontrar o elemento do documento para gerar o PDF.');
            return;
        };

        setIsGeneratingPdf(true);
        const scaledParent = source.parentElement;
        
        const originalClasses = scaledParent.className;
        scaledParent.className = '';
        scaledParent.style.transform = 'scale(1)';
        
        try {
            await new Promise(resolve => setTimeout(resolve, 50));
            const canvas = await html2canvas(source, { scale: 4, useCORS: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
            pdf.save(`certificado-apresentacao-${childName.replace(/ /g, '_') || 'crianca'}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
             alert('Não foi possível gerar o arquivo.');
        } finally {
            scaledParent.className = originalClasses;
            scaledParent.style.transform = '';
            setIsGeneratingPdf(false);
        }
    };
    
    const isLoading = isAuthUserLoading || isUserDataLoading || isChurchInfoLoading;

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
                <h2 className="text-3xl font-bold tracking-tight">Gerar Certificado de Apresentação</h2>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf || !childName}>
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                        {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Configurar Certificado</CardTitle>
                    <CardDescription>Preencha os dados da criança para gerar o documento.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="child-name">Nome da Criança</Label>
                        <Input id="child-name" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Ex: Helena Victoria" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="local-pastor">Pastor Dirigente</Label>
                        <Input id="local-pastor" value={localPastor} onChange={(e) => setLocalPastor(e.target.value)} placeholder="Nome do pastor local" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="child-details">Detalhes (Nascimento e Filiação)</Label>
                        <Textarea id="child-details" value={childDetails} onChange={(e) => setChildDetails(e.target.value)} placeholder="Ex: Nascida no dia 22 de Dezembro 2023, filha de Diego Preste e Natasha Soares da Rosa" />
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-muted/50 rounded-lg w-full flex justify-center items-start overflow-x-auto">
                <div className="origin-top transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-[0.8] transition-transform duration-300">
                    <DocumentRenderer 
                        ref={documentRef}
                        churchInfo={churchInfo}
                        childName={childName}
                        childDetails={childDetails}
                        localPastor={localPastor}
                        bgImage={bgImage}
                    />
                </div>
            </div>
        </div>
    );
}
