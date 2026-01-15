
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


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
        date.setDate(date.getDate() + 1); // Adjust for timezone issues
        return format(date, outputFormat);
    } catch {
        return '';
    }
};


const CardView = React.forwardRef<HTMLDivElement, { member: Member; templateData: CardTemplateData | null }>(({ member, templateData }, ref) => {
    const [isFront, setIsFront] = useState(true);

    if (!templateData) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Template da carteirinha não encontrado.</p>
            </div>
        );
    }
    
    const getMemberDataForField = (fieldId: string) => {
        const valueKey = fieldId.replace('Valor ', '');
        switch (valueKey) {
            case 'Nome': return member.nome || '';
            case 'Nº Reg.': return member.recordNumber || '';
            case 'CPF': return member.cpf || '';
            case 'Data de Batismo': return formatDate(member.dataBatismo) || '';
            case 'Cargo': return member.cargo || '';
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
                 const objectFitStyle: React.CSSProperties = {
                    objectFit: id === 'Foto do Membro' ? 'cover' : 'contain'
                };
                elementContent = (
                    <div style={style} className="relative">
                        <Image src={src} alt={id} fill style={objectFitStyle} className={cn({ 'rounded-md': id !== 'Assinatura'})} />
                    </div>
                );
            }
        } else if (isText) {
            style.fontSize = el.size.fontSize ? `${el.size.fontSize}px` : undefined;
            style.color = color;
            style.fontWeight = el.fontWeight;
            style.textAlign = el.textAlign;
            style.whiteSpace = 'pre-wrap';

            let dynamicText = el.text;
            if (id.startsWith('Valor')) {
                 dynamicText = getMemberDataForField(id) ?? el.text;
            } else if (id === 'Congregação') {
                dynamicText = member.congregacao || el.text;
            } else if (id === 'Membro Desde') {
                dynamicText = `Membro desde: ${formatDate(member.dataMembro) || ''}`;
            }

            if (id.includes('Título') || id.includes('Label') || id.includes('Valor') || id.includes('Assinatura Pastor') || id.includes('Validade') || id.includes('Membro Desde')) {
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

    const frontElements = Object.keys(elements).filter(id => !id.includes('Convenção') && !id.includes('QR Code') && !id.includes('Assinatura') && !id.includes('Validade') && !id.includes('Membro Desde'));
    const backElements = Object.keys(elements).filter(id => id.includes('Convenção') || id.includes('QR Code') || id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde'));
    const signatureLineElement = elements['Assinatura Pastor'];


    const CardFace = ({ isFrontFace }: { isFrontFace: boolean }) => (
        <Card
            className="h-full w-full overflow-hidden shadow-lg relative"
            style={backgroundStyle(isFrontFace)}
        >
            {isFrontFace ? (
                frontElements.map(id => elements[id] ? renderElement(id, elements[id]) : null)
            ) : (
                <>
                    {backElements.map(id => elements[id] ? renderElement(id, elements[id]) : null)}
                    {signatureLineElement && (
                        <div style={{
                            position: 'absolute', borderTop: '1px solid black', width: '40%',
                            top: `calc(${signatureLineElement.position.top}% - 2px)`,
                            left: `${signatureLineElement.position.left}%`,
                            transform: 'translateX(-50%)'
                        }} />
                    )}
                </>
            )}
        </Card>
    );
    
    // This is the component that will be printed
    const PrintableComponent = () => (
      <div className="w-full h-full bg-white flex flex-col justify-center items-center p-4">
        <div className="w-[85.6mm] h-[54mm]"><CardFace isFrontFace={true} /></div>
        <div className="w-[85.6mm] h-[54mm] mt-8"><CardFace isFrontFace={false} /></div>
      </div>
    );
    
    // Assign the printable component to the ref
    useEffect(() => {
        if (ref && typeof ref !== 'function') {
            const node = (ref as React.RefObject<HTMLDivElement>).current;
            if (node) {
                 const container = node.querySelector('.printable-container');
                 if(container) {
                    // Logic to render PrintableComponent into container if needed,
                    // but for now, the structure is separate.
                 }
            }
        }
    }, [ref]);


    return (
        <>
            {/* For screen view with flip */}
            <div className='print:hidden w-[85.6mm] h-[54mm] scale-100 origin-top cursor-pointer' onClick={() => setIsFront(!isFront)}>
                <div className={cn("flip-card w-full h-full", {'flipped': !isFront})}>
                    <div className="flip-card-front"><CardFace isFrontFace={true} /></div>
                    <div className="flip-card-back"><CardFace isFrontFace={false} /></div>
                </div>
            </div>
            
            {/* For printing - hidden by default */}
            <div ref={ref} className="hidden print:block">
               <PrintableComponent />
            </div>
        </>
    );
});
CardView.displayName = 'CardView';


export default function MemberCardPage() {
    const params = useParams();
    const router = useRouter();
    const memberId = params.id as string;
    const firestore = useFirestore();
    const { user: authUser, isUserLoading } = useUser();
    const printRef = useRef<HTMLDivElement>(null);

    const memberRef = useMemoFirebase(() => (firestore ? doc(firestore, 'users', memberId) : null), [firestore, memberId]);
    const { data: member, isLoading: memberLoading } = useDoc<Member>(memberRef);

    const currentUserRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: currentUser, isLoading: currentUserLoading } = useDoc<Member>(currentUserRef);
    
    const templateRef = useMemoFirebase(() => firestore ? doc(firestore, 'cardTemplates', 'default') : null, [firestore]);
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
        const isPastorOfCongregation = currentUser.cargo === 'Pastor Dirigente' && currentUser.congregacao === member.congregacao;

        if (isOwner || isAdmin || isPastorOfCongregation) {
            setHasAccess(true);
        } else {
            setHasAccess(false);
        }
    }, [currentUser, member, currentUserLoading, memberLoading, authUser, memberId]);

    const handlePrint = () => {
        window.print();
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
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir / Salvar PDF
                </Button>
                 <Button onClick={() => router.back()} variant="outline">Voltar</Button>
            </div>
             <div className="flex justify-center items-start print:hidden">
                <CardView member={member} templateData={templateData} />
            </div>
            {/* The printable content is now inside CardView and managed by its ref */}
            <div className="hidden print:block">
                <CardView member={member} templateData={templateData} ref={printRef} />
            </div>
        </div>
    );
}

    