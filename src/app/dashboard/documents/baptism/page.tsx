
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, setDoc } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

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

type ElementStyle = {
    position: { top: number; left: number };
    size: { fontSize: number; width?: number; height?: number; };
    text?: string;
    src?: string;
    fontWeight?: 'normal' | 'bold';
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    letterSpacing?: string;
    lineHeight?: number;
    fontStyle?: 'normal' | 'italic';
};
type DocElements = { [key: string]: ElementStyle };

type ChurchInfo = { 
    pastorSignatureName?: string; 
    pastorSignatureUrl?: string; 
    conventionLogo1Url?: string;
    conventionLogo2Url?: string;
    baptismCertBgUrl?: string;
    baptismCertLogoUrl?: string;
    baptismCertElements?: DocElements;
};

const defaultElements: DocElements = {
    'Logo': { position: { top: 7, left: 10 }, size: { width: 150, height: 150, fontSize: 12 }, src: '' },
    'NomeMembro': { position: { top: 45, left: 50 }, size: { fontSize: 48, width: 800 }, text: 'Nome do Membro', fontFamily: "'Great Vibes', cursive", fontWeight: 'bold', textAlign: 'center', letterSpacing: '0.1em' },
    'TextoPrincipal': { position: { top: 58, left: 50 }, size: { fontSize: 24, width: 950 }, text: 'Crendo e obedecendo...', textAlign: 'center', lineHeight: 1.7 },
    'AssinaturaPresidente': { position: { top: 85, left: 25 }, size: { width: 180, height: 50, fontSize: 12 }, src: '' },
    'LinhaPresidente': { position: { top: 95, left: 25}, size: { fontSize: 12, width: 250, height: 2 } },
    'NomePresidente': { position: { top: 97, left: 25 }, size: { fontSize: 10 }, text: 'Pastor Presidente', textAlign: 'center' },
    'CargoPresidente': { position: { top: 99, left: 25 }, size: { fontSize: 8 }, text: 'Pastor Presidente', textAlign: 'center', fontStyle: 'italic' },
    'LinhaPastorLocal': { position: { top: 95, left: 75}, size: { fontSize: 12, width: 250, height: 2 } },
    'NomePastorLocal': { position: { top: 97, left: 75 }, size: { fontSize: 10 }, text: 'Pastor Local', textAlign: 'center' },
    'CargoPastorLocal': { position: { top: 99, left: 75 }, size: { fontSize: 8 }, text: 'Pastor Local', textAlign: 'center', fontStyle: 'italic' },
};

const toTitleCase = (str: string) => {
    if (!str) return '';
    // If the string is all uppercase, convert it to title case.
    if (str === str.toUpperCase()) {
        return str.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
    }
    // Otherwise, return it as is.
    return str;
};


// --- Document Renderer ---
const DocumentRenderer = React.forwardRef<HTMLDivElement, {
    elements: DocElements;
    onElementClick: (id: string) => void;
    selectedElementId: string | null;
    bgImage?: string;
}>(({ elements, onElementClick, selectedElementId, bgImage }, ref) => {

    const renderElement = (id: string) => {
        const el = elements[id];
        if (!el) return null;

        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${el.position.top}%`,
            left: `${el.position.left}%`,
            transform: 'translateX(-50%)',
            height: el.size.height ? `${el.size.height}px` : 'auto',
            fontFamily: el.fontFamily,
            fontSize: `${el.size.fontSize}pt`,
            fontWeight: el.fontWeight,
            textAlign: el.textAlign,
            color: el.color,
            letterSpacing: el.letterSpacing,
            lineHeight: el.lineHeight,
            width: el.size.width ? `${el.size.width}px` : 'auto',
        };
        
        if (id.includes('Linha')) {
            return (
                <div key={id} style={style} onClick={(e) => {e.stopPropagation(); onElementClick(id); }}
                    className={cn('border-b-2 border-black', { 'ring-2 ring-blue-500': selectedElementId === id })}>
                </div>
            )
        }

        if (el.src) {
            return (
                <div key={id} style={style} onClick={(e) => {e.stopPropagation(); onElementClick(id); }} 
                    className={cn({ 'ring-2 ring-blue-500': selectedElementId === id })}>
                    <img src={el.src} alt={id} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
                </div>
            );
        }

        return (
            <p key={id} style={style} onClick={(e) => { e.stopPropagation(); onElementClick(id); }} 
                className={cn(
                    'whitespace-pre-wrap', 
                    { 'ring-2 ring-blue-500 p-1': selectedElementId === id },
                    { 'whitespace-nowrap': id === 'NomeMembro' }
                )}
            >
                {el.text}
            </p>
        );
    };

    return (
        <div 
            ref={ref} 
            className="w-[297mm] h-[210mm] bg-white text-black relative"
            style={{
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}
             onClick={() => onElementClick('')}
        >
            {Object.keys(elements).map(id => renderElement(id))}
        </div>
    );
});
DocumentRenderer.displayName = 'DocumentRenderer';


// --- Page Component ---
export default function BaptismCertificatePage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const documentRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // States
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    const [elements, setElements] = useState<DocElements>(defaultElements);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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

    const selectedMember = members?.find(m => m.id === selectedMemberId) || null;
    const localPastorName = selectedMember?.responsiblePastor || (userData?.cargo === 'Pastor/dirigente' ? userData.nome : '________________');

    useEffect(() => {
        if (churchInfo) {
            const initialElements = churchInfo.baptismCertElements ? { ...defaultElements, ...churchInfo.baptismCertElements } : defaultElements;
            
            const genderTerm = selectedMember?.gender === 'Feminino' ? 'batizada' : 'batizado';
            const baptismDate = selectedMember?.dataBatismo ? format(selectedMember.dataBatismo.toDate ? selectedMember.dataBatismo.toDate() : new Date(selectedMember.dataBatismo), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : '___/___/______';

            // DYNAMIC FONT SIZE FOR NAME
            const memberName = selectedMember?.nome || 'NOME DO MEMBRO';
            const formattedName = toTitleCase(memberName);
            let nameFontSize = 48; // Default size
            if (formattedName.length > 20) nameFontSize = 40;
            if (formattedName.length > 25) nameFontSize = 34;
            if (formattedName.length > 30) nameFontSize = 28;
            if (formattedName.length > 35) nameFontSize = 24;

            initialElements['Logo'].src = churchInfo.baptismCertLogoUrl || churchInfo.conventionLogo1Url || PlaceHolderImages.find(p => p.id === 'church-logo')?.imageUrl || '';
            initialElements['NomeMembro'].text = formattedName;
            initialElements['NomeMembro'].size.fontSize = nameFontSize; // Apply dynamic size
            initialElements['TextoPrincipal'].text = `Crendo e obedecendo nas sagradas Escrituras e as doutrinas ensinadas por Jesus Cristo, foi ${genderTerm} sob profissão de fé em nome do Pai, do Filho e do Espírito Santo, no dia ${baptismDate} na Assembleia de Deus Kairós congregação de ${selectedMember?.congregacao || '____________'}.`;
            initialElements['AssinaturaPresidente'].src = churchInfo.pastorSignatureUrl || '';
            initialElements['NomePresidente'].text = churchInfo.pastorSignatureName || '____________________';
            initialElements['NomePastorLocal'].text = localPastorName;

            setElements(initialElements);

        } else if (!isChurchInfoLoading) {
            // Handle case where churchInfo is not loaded or doesn't exist
            setElements(defaultElements);
        }
    }, [churchInfo, isChurchInfoLoading, selectedMember, localPastorName]);

    const handlePositionChange = useCallback((property: 'position', step: number, direction: 'up' | 'down' | 'left' | 'right') => {
        if (!selectedElement) return;

        setElements(prev => {
            const currentElement = prev[selectedElement];
            if (!currentElement) return prev;

            const newElements = { ...prev };
            const newElementStyle = { ...currentElement };
            const newPosition = { ...newElementStyle.position };

            if (direction === 'up') newPosition.top -= step;
            if (direction === 'down') newPosition.top += step;
            if (direction === 'left') newPosition.left -= step;
            if (direction === 'right') newPosition.left += step;
            newElementStyle.position = newPosition;
            
            newElements[selectedElement] = newElementStyle;
            return newElements;
        });
    }, [selectedElement]);

    const startMoving = (property: 'position', step: number, direction: 'up' | 'down' | 'left' | 'right') => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handlePositionChange(property, step, direction); // Move once immediately
        intervalRef.current = setInterval(() => {
            handlePositionChange(property, step, direction);
        }, 100);
    };

    const stopMoving = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };
    
    const handleSaveChanges = async () => {
        if (!churchInfoRef) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Referência de ChurchInfo não encontrada.' });
            return;
        };
        setIsSaving(true);
        try {
            await setDoc(churchInfoRef, { baptismCertElements: elements }, { merge: true });
            toast({ title: 'Sucesso!', description: 'Layout do certificado salvo com sucesso.' });
        } catch (error) {
            console.error("Error saving layout:", error);
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar o layout.' });
        } finally {
            setIsSaving(false);
        }
    };


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
            pdf.save(`certificado-batismo-${selectedMember?.nome.replace(/ /g, '_') || 'membro'}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
             alert('Não foi possível gerar o arquivo.');
        } finally {
            scaledParent.className = originalClasses;
            scaledParent.style.transform = '';
            setIsGeneratingPdf(false);
        }
    };
    
    const isLoading = isAuthUserLoading || isUserDataLoading || isLoadingMembers || isChurchInfoLoading;

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
                    <CardDescription>Selecione o membro para gerar o documento.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-w-sm">
                        <Label>Selecione o Membro</Label>
                        <Select onValueChange={setSelectedMemberId} disabled={!members}><SelectTrigger><SelectValue placeholder={isLoadingMembers ? "Carregando..." : "Escolha um membro"} /></SelectTrigger><SelectContent>{members?.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent></Select>
                    </div>
                </CardContent>
            </Card>

            {userData?.cargo && ['Administrador', 'Pastor/dirigente'].includes(userData.cargo) && (
                <Card>
                    <CardHeader><CardTitle>Ajustar Layout</CardTitle><CardDescription>Selecione um elemento e use os botões para ajustar sua posição.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Selecione o Elemento</Label>
                                <Select onValueChange={setSelectedElement}>
                                    <SelectTrigger><SelectValue placeholder="Escolha um elemento para ajustar"/></SelectTrigger>
                                    <SelectContent>{Object.keys(elements).map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div className='flex flex-col items-center gap-2'>
                                <p className="text-sm font-medium">Posição do Elemento: <span className='font-bold text-primary'>{selectedElement || 'Nenhum'}</span></p>
                                <div className='flex items-center gap-2'>
                                    <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'up')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowUp className="w-4 h-4" /></Button>
                                    <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'down')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowDown className="w-4 h-4" /></Button>
                                    <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'left')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowLeft className="w-4 h-4" /></Button>
                                    <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'right')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowRight className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        </div>
                         <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="p-4 bg-muted/50 rounded-lg w-full flex justify-center items-start overflow-x-auto">
                <div className="origin-top transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-[0.8] transition-transform duration-300">
                    <DocumentRenderer 
                        ref={documentRef}
                        elements={elements}
                        bgImage={churchInfo?.baptismCertBgUrl}
                        onElementClick={setSelectedElement}
                        selectedElementId={selectedElement}
                    />
                </div>
            </div>
        </div>
    );
}
