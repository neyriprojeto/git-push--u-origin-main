
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, setDoc } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert, Upload, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { uploadArquivo } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';

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
    baptismCertBgUrl?: string;
    baptismCertLogoUrl?: string;
};

// --- Document Renderer ---
const DocumentRenderer = React.forwardRef<HTMLDivElement, {
    churchInfo: ChurchInfo | null,
    member: Member | null,
    localPastor: string,
    bgImage?: string;
    logoImage?: string;
}>(({ churchInfo, member, localPastor, bgImage, logoImage }, ref) => {
    
    const formatDate = (d: any, isLong = false): string => {
        if (!d) return '___/___/______';
        try {
            const dateObj = d.toDate ? d.toDate() : new Date(d);
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
            className="w-[297mm] h-[210mm] bg-white font-serif text-black relative"
            style={{
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}
        >
            {logoImage && (
                <img 
                    src={logoImage} 
                    alt="Logo" 
                    className="absolute top-[20mm] left-[25mm] w-[40mm] h-[40mm] object-contain" 
                    crossOrigin="anonymous"
                />
            )}
            <div className="absolute inset-0 flex flex-col items-center p-[15mm]">

                <div style={{ flexGrow: 1.5 }}></div>

                <div className="w-[85%] text-center text-[#444]">
                   <p className="font-bold my-4 text-black uppercase" style={{ fontFamily: "serif", fontSize: '28pt', letterSpacing: '0.1em' }}>
                       {member?.nome || '________________'}
                   </p>
                   <p className="leading-relaxed mt-4" style={{ fontSize: '12pt' }}>
                       Crendo e obedecendo nas sagradas Escrituras e as doutrinas ensinadas por 
                       Jesus Cristo, foi {genderTerm} sob profissão de fé em nome do Pai, do Filho e do Espírito Santo,
                       no dia <span className="font-semibold">{formatDate(member?.dataBatismo, true)}</span> na Assembleia de Deus Kairós congregação de {member?.congregacao || '____________'}.
                   </p>
               </div>
                
                <div style={{ flexGrow: 1 }}></div>

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
                            <p className="mt-1" style={{ fontSize: '10pt' }}>{presidentName}</p>
                            <p className="italic" style={{ fontSize: '8pt' }}>Pastor Presidente</p>
                        </div>
                         <div className="text-center w-2/5">
                            <div className="relative w-full mx-auto mb-1 flex items-center justify-center min-h-[15mm]" />
                            <div className="border-b-2 border-black w-full" />
                            <p className="mt-1" style={{ fontSize: '10pt' }}>{localPastor}</p>
                            <p className="italic" style={{ fontSize: '8pt' }}>Pastor Local</p>
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
    const { toast } = useToast();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const documentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const signatureFileInputRef = useRef<HTMLInputElement>(null);
    
    // States
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [bgImage, setBgImage] = useState('');
    const [logoImage, setLogoImage] = useState('');
    const [signatureImage, setSignatureImage] = useState('');


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

    useEffect(() => {
        if (churchInfo) {
            setLogoImage(churchInfo.baptismCertLogoUrl || churchInfo.conventionLogo1Url || PlaceHolderImages.find(p => p.id === 'church-logo')?.imageUrl || '');
            setBgImage(churchInfo.baptismCertBgUrl || PlaceHolderImages.find(p => p.id === 'baptism-certificate-bg')?.imageUrl || '');
            setSignatureImage(churchInfo.pastorSignatureUrl || '');
        } else if (!isChurchInfoLoading) {
            setLogoImage(PlaceHolderImages.find(p => p.id === 'church-logo')?.imageUrl || '');
            setBgImage(PlaceHolderImages.find(p => p.id === 'baptism-certificate-bg')?.imageUrl || '');
            setSignatureImage('');
        }
    }, [churchInfo, isChurchInfoLoading]);

    const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>, target: 'background' | 'logo' | 'signature') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const src = await uploadArquivo(file);
            if (target === 'background') {
                setBgImage(src);
                toast({ title: 'Sucesso', description: 'Imagem de fundo atualizada. Clique em "Salvar Alterações" para persistir.' });
            } else if (target === 'logo') {
                setLogoImage(src);
                toast({ title: 'Sucesso', description: 'Logo atualizado. Clique em "Salvar Alterações" para persistir.' });
            } else if (target === 'signature') {
                setSignatureImage(src);
                toast({ title: 'Sucesso', description: 'Assinatura atualizada. Clique em "Salvar Alterações" para persistir.' });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro de Upload', description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!churchInfoRef) {
            toast({
                variant: 'destructive',
                title: 'Erro de Conexão',
                description: 'Não foi possível conectar ao banco de dados para salvar.',
            });
            return;
        }

        setIsSaving(true);
        try {
            await setDoc(churchInfoRef, {
                baptismCertBgUrl: bgImage,
                baptismCertLogoUrl: logoImage,
                pastorSignatureUrl: signatureImage,
            }, { merge: true });
            toast({ title: 'Sucesso!', description: 'As alterações foram salvas.' });
        } catch (error: any) {
            console.error("Error saving certificate settings:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar as configurações do certificado.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGeneratePdf = async () => {
        const source = documentRef.current;
        if (!source || !source.parentElement) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível encontrar o elemento do documento para gerar o PDF.' });
            return;
        };

        setIsGeneratingPdf(true);
        const scaledParent = source.parentElement;
        
        const originalClasses = scaledParent.className;

        scaledParent.className = '';
        scaledParent.style.transform = 'scale(1)';
        
        try {
            await new Promise(resolve => setTimeout(resolve, 50));

            const canvas = await html2canvas(source, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
            });

            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`certificado-batismo-${selectedMember?.nome.replace(/ /g, '_') || 'membro'}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
             toast({ variant: 'destructive', title: 'Erro ao gerar PDF', description: 'Não foi possível gerar o arquivo.' });
        } finally {
            scaledParent.className = originalClasses;
            scaledParent.style.transform = '';
            setIsGeneratingPdf(false);
        }
    };
    
    const selectedMember = members?.find(m => m.id === selectedMemberId) || null;
    const localPastorName = selectedMember?.responsiblePastor || (userData?.cargo === 'Pastor/dirigente' ? userData.nome : '________________');

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
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSaveChanges} disabled={isSaving || isUploading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf || !selectedMember}>
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                        {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Configurar Certificado</CardTitle>
                    <CardDescription>Selecione o membro e as imagens para gerar o documento.</CardDescription>
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
                        <Label>Imagens do Certificado</Label>
                        <div className='flex flex-wrap gap-2'>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={(e) => onSelectFile(e, 'background')}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Upload className="mr-2 h-4 w-4" />
                                Trocar Fundo
                            </Button>
                             <input
                                type="file"
                                accept="image/*"
                                ref={logoFileInputRef}
                                onChange={(e) => onSelectFile(e, 'logo')}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => logoFileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Upload className="mr-2 h-4 w-4" />
                                Trocar Logo
                            </Button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={signatureFileInputRef}
                                onChange={(e) => onSelectFile(e, 'signature')}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => signatureFileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Upload className="mr-2 h-4 w-4" />
                                Trocar Assinatura
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-muted/50 rounded-lg w-full flex justify-center items-start overflow-x-auto">
                <div 
                    className="origin-top transform scale-[0.3] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.8] xl:scale-[0.9] transition-transform duration-300"
                >
                    <DocumentRenderer 
                        ref={documentRef}
                        churchInfo={churchInfo}
                        member={selectedMember}
                        localPastor={localPastorName}
                        bgImage={bgImage}
                        logoImage={logoImage}
                    />
                </div>
            </div>
        </div>
    );
}
