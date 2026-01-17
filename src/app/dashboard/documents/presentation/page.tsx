
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Types ---
type UserData = { nome: string; cargo?: string; congregacao?: string; };

type ElementStyle = {
    position: { top: number; left: number };
    size: { fontSize: number; width?: number; height?: number; };
    text?: string;
    src?: string;
    fontWeight?: 'normal' | 'bold';
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    letterSpacing?: string;
    lineHeight?: number;
    fontStyle?: 'normal' | 'italic';
};
type DocElements = { [key: string]: ElementStyle };

type ChurchInfo = { 
    pastorSignatureName?: string; 
    pastorSignatureUrl?: string; 
    presentationCertBgUrl?: string;
    presentationCertElements?: DocElements;
    presentationCertLogoUrl?: string;
    conventionLogo1Url?: string;
};

const defaultElements: DocElements = {
    'Logo': { position: { top: 7, left: 10 }, size: { width: 120, height: 120, fontSize: 12 }, src: '' },
    'Titulo1': { position: { top: 15, left: 50 }, size: { fontSize: 16 }, text: 'CERTIFICADO', letterSpacing: '0.2em', fontWeight: 'bold', textAlign: 'center', color: '#333' },
    'Titulo2': { position: { top: 20, left: 50 }, size: { fontSize: 16 }, text: 'DE APRESENTAÇÃO', letterSpacing: '0.2em', fontWeight: 'bold', textAlign: 'center', color: '#333' },
    'Certificamos': { position: { top: 30, left: 50 }, size: { fontSize: 12 }, text: 'CERTIFICAMOS QUE', textAlign: 'center', color: '#333' },
    'NomeCrianca': { position: { top: 40, left: 50 }, size: { fontSize: 36 }, text: 'Nome da Criança', fontFamily: "'Great Vibes', cursive", textAlign: 'center', color: 'black' },
    'Detalhes': { position: { top: 55, left: 50 }, size: { fontSize: 11 }, text: 'Detalhes da criança...', textAlign: 'center', color: '#333', lineHeight: 1.5, width: 600 },
    'Versiculo': { position: { top: 70, left: 50 }, size: { fontSize: 9 }, text: '“E, cumprindo-se os dias da purificação dela, segundo a lei de Moisés, o levaram a Jerusalém,\npara o apresentarem ao Senhor.” (Lucas 2:22)', textAlign: 'center', color: '#333', fontStyle: 'italic', width: 500 },
    'AssinaturaPresidente': { position: { top: 82, left: 25 }, size: { width: 180, height: 50, fontSize: 12 }, src: '' },
    'LinhaPresidente': { position: { top: 90, left: 25 }, size: { fontSize: 12, width: 250, height: 2 } },
    'NomePresidente': { position: { top: 92, left: 25 }, size: { fontSize: 9 }, text: 'Pastor Presidente', textAlign: 'center' },
    'CargoPresidente': { position: { top: 95, left: 25 }, size: { fontSize: 7 }, text: 'Pastor Presidente', textAlign: 'center', fontStyle: 'italic' },
    'LinhaPastorDirigente': { position: { top: 90, left: 75 }, size: { fontSize: 12, width: 250, height: 2 } },
    'NomePastorDirigente': { position: { top: 92, left: 75 }, size: { fontSize: 9 }, text: 'Pastor Dirigente', textAlign: 'center' },
    'CargoPastorDirigente': { position: { top: 95, left: 75 }, size: { fontSize: 7 }, text: 'Pastor Dirigente', textAlign: 'center', fontStyle: 'italic' },
};


// --- Document Renderer ---
const DocumentRenderer = React.forwardRef<HTMLDivElement, {
    elements: DocElements;
    bgImage?: string;
    onElementClick: (id: string) => void;
    selectedElementId: string | null;
}>(({ elements, bgImage, onElementClick, selectedElementId }, ref) => {
    
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
            fontStyle: el.fontStyle,
            // Only apply width for images and lines, not text
            width: (el.src || id.includes('Linha')) && el.size.width ? `${el.size.width}px` : 'auto',
        };
        
        if (id.includes('Linha')) {
            return <div key={id} style={style} onClick={(e) => { e.stopPropagation(); onElementClick(id); }} className={cn('border-b-2 border-black', { 'ring-2 ring-blue-500': selectedElementId === id })}></div>
        }

        if (el.src) {
            return <div key={id} style={style} onClick={(e) => { e.stopPropagation(); onElementClick(id); }} className={cn({ 'ring-2 ring-blue-500': selectedElementId === id })}><img src={el.src} alt={id} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/></div>;
        }

        return (
             <p key={id} style={style} onClick={(e) => { e.stopPropagation(); onElementClick(id); }} 
                className={cn(
                    // Apply nowrap for the name to prevent line breaks
                    id === 'NomeCrianca' ? 'whitespace-nowrap' : 'whitespace-pre-wrap', 
                    { 'ring-2 ring-blue-500 p-1': selectedElementId === id }
                )}
            >
                {el.text}
            </p>
        );
    };
    
    return (
        <div 
            ref={ref} 
            className="w-[297mm] h-[210mm] bg-white text-black relative font-body"
            style={{
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: 'cover',
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
export default function PresentationCertificatePage() {
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
    const documentRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // States
    const [childName, setChildName] = useState('');
    const [childDetails, setChildDetails] = useState('');
    const [localPastor, setLocalPastor] = useState('');
    const [presentationDate, setPresentationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    const [elements, setElements] = useState<DocElements>(defaultElements);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Data fetching
    const userRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);
    
    const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
    const { data: churchInfo, isLoading: isChurchInfoLoading } = useDoc<ChurchInfo>(churchInfoRef);
    
    useEffect(() => {
        if (userData?.cargo === 'Pastor/dirigente') {
            setLocalPastor(userData.nome);
        }
    }, [userData]);

    useEffect(() => {
        const formattedDate = presentationDate 
            ? format(new Date(presentationDate.replace(/-/g, '/')), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) 
            : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
        
        const initialElements = churchInfo?.presentationCertElements ? { ...defaultElements, ...churchInfo.presentationCertElements } : defaultElements;
        
        // DYNAMIC FONT SIZE LOGIC
        const name = childName || '________________';
        let nameFontSize = 36;
        if (name.length > 20) nameFontSize = 32;
        if (name.length > 25) nameFontSize = 28;
        if (name.length > 30) nameFontSize = 22;


        initialElements['Logo'].src = churchInfo?.presentationCertLogoUrl || churchInfo?.conventionLogo1Url || PlaceHolderImages.find(p => p.id === 'church-logo')?.imageUrl || '';
        initialElements['NomeCrianca'].text = name;
        initialElements['NomeCrianca'].size.fontSize = nameFontSize;

        initialElements['Detalhes'].text = `${childDetails || 'Nascida no dia ___ de ________ de _____, filha(o) de ______________ e ______________'}\nfoi apresentada oficialmente ao SENHOR JESUS CRISTO,\nna Igreja Evangélica Assembleia de Deus Ministério Kairós.\nNo dia ${formattedDate}`;
        initialElements['Versiculo'].text = "“E, cumprindo-se os dias da purificação dela, segundo a lei de Moisés, o levaram a Jerusalém,\npara o apresentarem ao Senhor.” (Lucas 2:22)";
        initialElements['AssinaturaPresidente'].src = churchInfo?.pastorSignatureUrl || '';
        initialElements['NomePresidente'].text = churchInfo?.pastorSignatureName || '____________________';
        initialElements['NomePastorDirigente'].text = localPastor || '____________________';

        setElements(initialElements);

    }, [churchInfo, childName, childDetails, localPastor, presentationDate]);

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
        handlePositionChange(property, step, direction);
        intervalRef.current = setInterval(() => handlePositionChange(property, step, direction), 100);
    };

    const stopMoving = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleSaveChanges = async () => {
        if (!churchInfoRef) return;
        setIsSaving(true);
        try {
            await setDoc(churchInfoRef, { presentationCertElements: elements }, { merge: true });
            toast({ title: 'Sucesso!', description: 'Layout do certificado salvo.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o layout.' });
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
                <h2 className="text-3xl font-bold tracking-tight">Gerar Certificado de Apresentação</h2>
                <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf || !childName}><Printer className="mr-2 h-4 w-4" />{isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}</Button>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Configurar Certificado</CardTitle><CardDescription>Preencha os dados da criança para gerar o documento.</CardDescription></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="child-name">Nome da Criança</Label><Input id="child-name" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Ex: Helena Victoria" /></div>
                    <div className="space-y-2"><Label htmlFor="local-pastor">Pastor Dirigente</Label><Input id="local-pastor" value={localPastor} onChange={(e) => setLocalPastor(e.target.value)} placeholder="Nome do pastor local" /></div>
                    <div className="space-y-2"><Label htmlFor="presentation-date">Data da Apresentação</Label><Input id="presentation-date" type="date" value={presentationDate} onChange={(e) => setPresentationDate(e.target.value)} /></div>
                    <div className="space-y-2 md:col-span-2"><Label htmlFor="child-details">Detalhes (Nascimento e Filiação)</Label><Textarea id="child-details" value={childDetails} onChange={(e) => setChildDetails(e.target.value)} placeholder="Ex: Nascida no dia 22 de Dezembro 2023, filha de Diego Preste e Natasha Soares da Rosa" /></div>
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
                                    <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'down')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowDown className="w-4 w-4" /></Button>
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
                        bgImage={churchInfo?.presentationCertBgUrl || PlaceHolderImages.find(p => p.id === 'presentation-certificate-bg')?.imageUrl}
                        onElementClick={setSelectedElement}
                        selectedElementId={selectedElement}
                    />
                </div>
            </div>
        </div>
    );
}
