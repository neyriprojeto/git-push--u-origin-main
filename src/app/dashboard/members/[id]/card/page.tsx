
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Save, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Tipos para a Carteirinha do Studio ---
type ElementStyle = {
    position: { top: number; left: number };
    size: { width?: number; height?: number; fontSize?: number };
    text?: string;
    fontWeight?: 'normal' | 'bold';
    src?: string;
    textAlign?: 'left' | 'center' | 'right';
};

type CardElements = { [key: string]: ElementStyle };

type CardTemplateData = {
    elements: CardElements;
    cardStyles: {
        frontBackground: string;
        backBackground: string;
        frontBackgroundImage: string;
        backBackgroundImage: string;
    };
    textColors: {
        title: string;
        personalData: string;
        backText: string;
    };
};

// --- Tipos para Dados do Membro ---
interface Member {
    id: string;
    nome: string;
    avatar?: string;
    recordNumber?: string;
    rg?: string;
    cpf?: string;
    cargo: string;
    dataNascimento?: string | { seconds: number; nanoseconds: number };
    dataMembro?: string | { seconds: number; nanoseconds: number };
    dataBatismo?: string | { seconds: number; nanoseconds: number };
    congregacao?: string;
}

const formatDate = (dateValue?: string | { seconds: number; nanoseconds: number } | Date, outputFormat: string = 'dd/MM/yyyy') => {
    if (!dateValue) return '';
    try {
        let date;
        if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            date = new Date(dateValue.seconds * 1000);
        } else {
           return '';
        }
        // Ajuste para problemas de fuso horário que podem fazer a data voltar um dia
        const timeZoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + timeZoneOffset);

        return format(adjustedDate, outputFormat);
    } catch {
        return '';
    }
};


const CardView = React.forwardRef<HTMLDivElement, { member: Member; templateData: CardTemplateData | null; isPrinting?: boolean }>(({ member, templateData, isPrinting = false }, ref) => {
    const [isFront, setIsFront] = useState(true);
    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);
    
     React.useImperativeHandle(ref, () => ({
        getFrontCanvas: async () => {
            if (!frontRef.current) return null;
            return html2canvas(frontRef.current, { 
                scale: 4, // Increase scale for better quality
                useCORS: true, // Allow cross-origin images
                backgroundColor: null, // Use transparent background
             });
        },
        getBackCanvas: async () => {
            if (!backRef.current) return null;
            return html2canvas(backRef.current, { 
                scale: 4, // Increase scale for better quality
                useCORS: true, // Allow cross-origin images
                backgroundColor: null, // Use transparent background
             });
        },
    } as any));


    if (!templateData) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Template da carteirinha não encontrado.</p>
            </div>
        );
    }
    
    const getMemberDataForField = (fieldId: string) => {
        switch (fieldId) {
            case 'Valor Nome': return `Nome: ${member.nome || ''}`;
            case 'Valor Nº Reg.': return `Nº Reg.: ${member.recordNumber || ''}`;
            case 'Valor CPF': return `CPF: ${member.cpf || ''}`;
            case 'Valor Cargo': return `Cargo: ${member.cargo || ''}`;
            case 'Valor Data de Batismo': return `Data de Batismo: ${formatDate(member.dataBatismo) || ''}`;
            case 'Membro Desde': return `Membro desde: ${formatDate(member.dataMembro) || ''}`;
            default: return null;
        }
    };


    const renderElement = (id: string, el: ElementStyle) => {
        const isImage = 'src' in el;
        const isText = 'text' in el;

        let color = '#000000';
        if (isText && templateData) {
            const { textColors } = templateData;
            const isTitle = id.includes('Título') || id === 'Congregação' || id === 'Endereço';
            const isBackText = id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde');
            
            if (isTitle) color = textColors.title;
            else if (isBackText) color = textColors.backText;
            else color = textColors.personalData;
        }

        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${el.position.top}%`,
            left: `${el.position.left}%`,
            lineHeight: 1.2
        };
        
        if (el.textAlign === 'center') style.transform = 'translateX(-50%)';
        else if (el.textAlign === 'right') style.transform = 'translateX(-100%)';
        
        let elementContent: React.ReactNode;

        if (isImage) {
            style.width = el.size.width ? `${el.size.width}px` : 'auto';
            style.height = el.size.height ? `${el.size.height}px` : 'auto';

            let src = el.src;
            if (id === 'Foto do Membro' && member.avatar) {
                src = member.avatar;
            }

            if (!src) {
                 elementContent = <div style={{...style, border: '1px dashed #ccc'}} className="bg-gray-200/50 flex items-center justify-center text-xs text-gray-500">{id}</div>;
            } else {
                elementContent = (
                    <div style={style} className={cn("relative", {'rounded-md overflow-hidden': id !== 'Assinatura' })}>
                         <img src={src} alt={id} style={{
                            width: '100%',
                            height: '100%',
                            objectFit: id === 'Foto do Membro' ? 'cover' : 'contain'
                         }} crossOrigin="anonymous" />
                    </div>
                );
            }
        } else if (isText) {
            style.fontSize = el.size.fontSize ? `${el.size.fontSize}px` : undefined;
            style.color = color;
            style.fontWeight = el.fontWeight;
            style.textAlign = el.textAlign;
            style.whiteSpace = 'pre-wrap';

            let dynamicText = getMemberDataForField(id) ?? el.text;

            if (id === 'Congregação') dynamicText = member.congregacao || el.text;

            if (id.includes('Título') || id.includes('Valor') || id.includes('Assinatura Pastor') || id.includes('Validade') || id.includes('Membro Desde')) {
                style.whiteSpace = 'nowrap';
            }


            elementContent = <p style={style}>{dynamicText}</p>;
        }

        return <React.Fragment key={id}>{elementContent}</React.Fragment>;
    };

    const { elements, cardStyles } = templateData;
    const backgroundStyle = (isFrontView: boolean): React.CSSProperties => ({
        backgroundColor: isFrontView ? cardStyles.frontBackground : cardStyles.backBackground,
        backgroundImage: `url(${isFrontView ? cardStyles.frontBackgroundImage : cardStyles.backBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    });

    const frontElements = Object.keys(elements).filter(id => !id.includes('Convenção') && !id.includes('QR Code') && !id.includes('Assinatura') && !id.includes('Validade') && !id.includes('Membro Desde') && !id.includes('Assinatura Pastor'));
    const backElements = Object.keys(elements).filter(id => id.includes('Convenção') || id.includes('QR Code') || id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde') || id.includes('Assinatura Pastor'));
    const signatureTextElement = elements['Assinatura Pastor'];


    const CardFace = ({ isFrontFace, fRef }: { isFrontFace: boolean, fRef: React.RefObject<HTMLDivElement> }) => (
        <div
            ref={fRef}
            className="h-full w-full overflow-hidden shadow-lg relative bg-white"
            style={backgroundStyle(isFrontFace)}
        >
            {isFrontFace ? (
                frontElements.map(id => elements[id] ? renderElement(id, elements[id]) : null)
            ) : (
                <>
                    {backElements.map(id => elements[id] ? renderElement(id, elements[id]) : null)}
                    {signatureTextElement && (
                         <div 
                            style={{
                                position: 'absolute', 
                                borderTop: '1px solid black', 
                                width: '40%', 
                                top: `calc(${signatureTextElement.position.top}% - 2px)`,
                                left: `${signatureTextElement.position.left}%`,
                                transform: 'translateX(-50%)'
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
    
    // This is for the interactive view on screen
    if (!isPrinting) {
        return (
            <div className='w-[85.6mm] h-[54mm] scale-100 origin-top cursor-pointer' onClick={() => setIsFront(!isFront)}>
                <div className={cn("flip-card w-full h-full", {'flipped': !isFront})}>
                    <div className="flip-card-front"><CardFace isFrontFace={true} fRef={frontRef} /></div>
                    <div className="flip-card-back"><CardFace isFrontFace={false} fRef={backRef} /></div>
                </div>
            </div>
        );
    }
    
    // This is for the hidden div used for PDF generation
    return (
        <div className="absolute -left-[9999px] top-auto">
            <div className="w-[85.6mm] h-[54mm]"><CardFace isFrontFace={true} fRef={frontRef} /></div>
            <div className="w-[85.6mm] h-[54mm] mt-2"><CardFace isFrontFace={false} fRef={backRef} /></div>
        </div>
    )
});
CardView.displayName = 'CardView';


export default function MemberCardPage() {
    const params = useParams();
    const router = useRouter();
    const memberId = params.id as string;
    const firestore = useFirestore();
    const { user: authUser, isUserLoading } = useUser();
    const cardViewRef = useRef<{ getFrontCanvas: () => Promise<HTMLCanvasElement | null>, getBackCanvas: () => Promise<HTMLCanvasElement | null> }>(null);
    const [isSavingPdf, setIsSavingPdf] = useState(false);

    const memberRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', memberId) : null), [firestore, authUser, memberId]);
    const { data: member, isLoading: memberLoading } = useDoc<Member>(memberRef);

    const currentUserRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: currentUser, isLoading: currentUserLoading } = useDoc<Member>(currentUserRef);
    
    const templateRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'cardTemplates', 'default') : null), [firestore, authUser]);
    const { data: templateData, isLoading: isTemplateLoading } = useDoc<CardTemplateData>(templateRef);

    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

     useEffect(() => {
        if (currentUserLoading || memberLoading) return;

        if (!currentUser || !member) {
            setHasAccess(false);
            return;
        }
        
        const isOwner = authUser?.uid === memberId;
        const isAdmin = currentUser.cargo === 'Administrador';
        const isPastorOfCongregation = currentUser.cargo === 'Pastor/dirigente' && currentUser.congregacao === member.congregacao;

        if (isOwner || isAdmin || isPastorOfCongregation) {
            setHasAccess(true);
        } else {
            setHasAccess(false);
        }
    }, [currentUser, member, currentUserLoading, memberLoading, authUser, memberId]);

    const handleSavePdf = async () => {
        if (!cardViewRef.current || !member) return;
        setIsSavingPdf(true);

        const frontCanvas = await cardViewRef.current.getFrontCanvas();
        const backCanvas = await cardViewRef.current.getBackCanvas();

        if (frontCanvas && backCanvas) {
            const cardWidthMM = 85.6;
            const cardHeightMM = 54;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [210, 297] // A4
            });

            const frontData = frontCanvas.toDataURL('image/png');
            const backData = backCanvas.toDataURL('image/png');

            // Center on A4 page
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const x = (pageWidth - cardWidthMM) / 2;

            pdf.addImage(frontData, 'PNG', x, 20, cardWidthMM, cardHeightMM);
            pdf.addImage(backData, 'PNG', x, 20 + cardHeightMM + 10, cardWidthMM, cardHeightMM);
            
            pdf.save(`carteirinha-${member.nome.toLowerCase().replace(/ /g, '-')}.pdf`);
        }

        setIsSavingPdf(false);
    };

    const isLoading = memberLoading || currentUserLoading || isUserLoading || isTemplateLoading || hasAccess === null;
    
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
    
    if (!templateData) {
        return (
            <div className="w-full min-h-screen bg-secondary p-4 flex justify-center items-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>Template Não Encontrado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>O template da carteirinha ainda não foi configurado.</p>
                        <p>Por favor, peça a um administrador para ir ao <strong className='text-primary'>Estúdio de Carteirinha</strong> para criá-lo.</p>
                        <Button onClick={() => router.back()} className='w-full mt-6'>Voltar</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 min-h-screen print:bg-white flex flex-col justify-center items-center p-4 gap-8">
             <div className="w-full max-w-sm flex flex-col gap-2 print:hidden">
                 <Button onClick={handleSavePdf} disabled={isSavingPdf}>
                    {isSavingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSavingPdf ? 'Salvando...' : 'Salvar PDF'}
                </Button>
                 <Button onClick={() => router.back()} variant="outline">Voltar</Button>
            </div>
             <div className="flex justify-center items-start print:hidden">
                <CardView member={member} templateData={templateData} />
            </div>
             {/* This component is hidden and used only to generate the canvas for the PDF */}
            <CardView member={member} templateData={templateData} ref={cardViewRef} isPrinting={true} />
        </div>
    );
}
