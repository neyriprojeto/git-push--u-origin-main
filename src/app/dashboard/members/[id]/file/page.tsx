
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Printer, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';


// Define a interface para o objeto de membro para garantir a tipagem
interface Member {
    id: string;
    nome: string;
    avatar?: string;
    recordNumber?: string;
    dataNascimento?: string | Date;
    naturalness?: string;
    nationality?: string;
    maritalStatus?: string;
    gender?: string;
    rg?: string;
    cpf?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    cep?: string;
    dataBatismo?: string | Date;
    dataMembro?: string | Date;
    congregacao?: string;
    responsiblePastor?: string;
    cargo?: string;
}


const DetailItem = ({ label, value }: { label: string; value?: string | null | Date }) => {
    let displayValue: string | null = 'Não informado';

    if (value) {
        if (value instanceof Date) {
            displayValue = format(value, 'dd/MM/yyyy');
        } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
            // Trata strings que são datas (ex: '1988-04-15')
            const date = new Date(value);
            date.setDate(date.getDate() + 1); // Adjust for timezone issues
            displayValue = format(date, 'dd/MM/yyyy');
        } else {
            displayValue = value;
        }
    }

    return (
        <div className="flex items-baseline border-b border-dotted border-gray-500 pb-1">
            <span className="font-bold whitespace-nowrap mr-2">{label}:</span>
            <span className="break-words">{displayValue}</span>
        </div>
    );
};


export default function MemberFilePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const memberId = params.id as string;
    const firestore = useFirestore();
    const { user: authUser, isUserLoading } = useUser();
    
    const [isFront, setIsFront] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);

    const memberRef = useMemoFirebase(() => (firestore ? doc(firestore, 'users', memberId) : null), [firestore, memberId]);
    const { data: member, isLoading: memberLoading } = useDoc<Member>(memberRef);
    
    const currentUserRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: currentUser, isLoading: currentUserLoading } = useDoc<Member>(currentUserRef);
    
    const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
    const { data: churchInfo, isLoading: churchInfoLoading } = useDoc<{ fichaLogoUrl?: string }>(churchInfoRef);
    
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        if (currentUserLoading || memberLoading) return;

        if (!currentUser || !member) {
            setHasAccess(false);
            return;
        }

        if (currentUser.cargo === 'Administrador') {
            setHasAccess(true);
        } else if (currentUser.cargo === 'Pastor/dirigente' && currentUser.congregacao === member.congregacao) {
            setHasAccess(true);
        } else {
            setHasAccess(false);
        }

    }, [currentUser, member, currentUserLoading, memberLoading]);
    
    const handleGeneratePdf = async () => {
        const frontElement = frontRef.current;
        const backElement = backRef.current;

        if (!frontElement || !backElement || !member) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível encontrar os elementos para gerar o PDF.',
            });
            return;
        }

        setIsGeneratingPdf(true);

        try {
            const pdf = new jsPDF('l', 'mm', 'a4'); // A4 landscape
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // --- Capture Front Page ---
            const frontCanvas = await html2canvas(frontElement, { scale: 3, useCORS: true });
            const frontImgData = frontCanvas.toDataURL('image/png');
            pdf.addImage(frontImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // --- Capture Back Page ---
            pdf.addPage();
            const backCanvas = await html2canvas(backElement, { scale: 3, useCORS: true });
            const backImgData = backCanvas.toDataURL('image/png');
            pdf.addImage(backImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            pdf.save(`ficha-membro-${member.nome.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao gerar PDF',
                description: 'Houve um problema ao criar o arquivo PDF. Tente novamente.',
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    const isLoading = memberLoading || churchInfoLoading || isUserLoading || currentUserLoading || hasAccess === null;

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-secondary p-4 flex justify-center items-center">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        )
    }
    
    if (!member) {
        notFound();
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
                        <p>Você não tem permissão para visualizar esta ficha.</p>
                        <Button onClick={() => router.back()} className='w-full mt-6'>Voltar</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const avatar = member.avatar?.startsWith('http')
        ? { imageUrl: member.avatar }
        : PlaceHolderImages.find((p) => p.id === member.avatar);
        
    const defaultFichaLogo = PlaceHolderImages.find((p) => p.id === 'church-logo');
    const fichaLogoUrl = churchInfo?.fichaLogoUrl || defaultFichaLogo?.imageUrl;

    const FichaFrente = () => (
        <div className="bg-white shadow-lg p-8 flex flex-col h-full font-sans">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-black gap-4">
                <div className="w-24 h-32 border border-gray-300 flex items-center justify-center shrink-0 bg-gray-100">
                    {avatar ? (
                        <Image src={avatar.imageUrl} alt={member.nome} width={96} height={128} className="object-cover w-full h-full" />
                    ) : (
                        <span className="text-xs text-gray-400 text-center">Foto 3x4</span>
                    )}
                </div>
                <div className="text-center flex-grow px-4">
                    <h1 className="text-3xl font-bold">Ficha de Membro</h1>
                    <p className="text-lg">Nº: {member.recordNumber}</p>
                </div>
                <div className="w-24 h-24 flex items-center justify-center shrink-0">
                    {fichaLogoUrl ? (
                        <Image src={fichaLogoUrl} alt="Logo da Ficha" width={96} height={96} className="object-contain p-1" />
                    ) : (
                        <span className="text-xs text-gray-500">Logo</span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow pt-6 grid grid-cols-12 gap-x-8 gap-y-4 text-sm">
                <div className="col-span-8"><DetailItem label="Nome" value={member.nome} /></div>
                <div className="col-span-4"><DetailItem label="Data Nasc" value={member.dataNascimento} /></div>

                <div className="col-span-4"><DetailItem label="Naturalidade" value={member.naturalness} /></div>
                <div className="col-span-4"><DetailItem label="Nacionalidade" value={member.nationality} /></div>
                <div className="col-span-4"><DetailItem label="Est. Civil" value={member.maritalStatus} /></div>
                
                <div className="col-span-4"><DetailItem label="Gênero" value={member.gender} /></div>
                <div className="col-span-4"><DetailItem label="RG" value={member.rg} /></div>
                <div className="col-span-4"><DetailItem label="CPF" value={member.cpf} /></div>

                <div className="col-span-12"><DetailItem label="E-mail" value={member.email} /></div>
                
                <div className="col-span-6"><DetailItem label="Tel" value={member.phone} /></div>
                <div className="col-span-6"><DetailItem label="Whatsapp" value={member.whatsapp} /></div>

                <div className="col-span-8"><DetailItem label="End" value={member.logradouro} /></div>
                <div className="col-span-4"><DetailItem label="Nº" value={member.numero} /></div>

                <div className="col-span-5"><DetailItem label="Bairro" value={member.bairro} /></div>
                <div className="col-span-4"><DetailItem label="Cidade" value={member.cidade} /></div>
                <div className="col-span-3"><DetailItem label="CEP" value={member.cep} /></div>
            </div>
        </div>
    );

    const FichaVerso = () => (
         <div className="bg-white shadow-lg p-8 flex flex-col h-full font-sans">
           <div className="flex flex-col h-full">
                {/* Header */}
                <div className="text-center pb-4 border-b border-black">
                    <h1 className="text-3xl font-bold">Dados Eclesiásticos</h1>
                </div>

                {/* Content */}
                <div className="flex-grow pt-6 grid grid-cols-12 gap-x-8 gap-y-4 text-sm">
                    <div className="col-span-6"><DetailItem label="Data de Membresia" value={member.dataMembro} /></div>
                    <div className="col-span-6"><DetailItem label="Data de Batismo" value={member.dataBatismo} /></div>
                    
                    <div className="col-span-12"><DetailItem label="Congregação" value={member.congregacao}/></div>
                    
                    <div className="col-span-12"><DetailItem label="Pastor Responsável" value={member.responsiblePastor} /></div>
                    
                    <div className="col-span-12 pt-8">
                        <h2 className="text-lg font-bold text-center mb-4">Observações</h2>
                        <div className="space-y-6 mt-4">
                            <div className="border-b border-dotted border-gray-400"></div>
                            <div className="border-b border-dotted border-gray-400"></div>
                            <div className="border-b border-dotted border-gray-400"></div>
                            <div className="border-b border-dotted border-gray-400"></div>
                            <div className="border-b border-dotted border-gray-400"></div>
                        </div>
                    </div>
                </div>

                {/* Footer com assinaturas */}
                <div className="flex justify-around mt-auto pt-8">
                    <div className="text-center w-1/2">
                        <div className="border-t border-black mt-8 w-full max-w-xs mx-auto"></div>
                        <p className="mt-2 text-sm">Assinatura do Membro</p>
                    </div>
                    <div className="text-center w-1/2">
                        <div className="border-t border-black mt-8 w-full max-w-xs mx-auto"></div>
                        <p className="mt-2 text-sm">Assinatura do Pastor</p>
                    </div>
                </div>
           </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen bg-secondary p-4 flex flex-col justify-center items-center font-serif">
            <div className="w-full max-w-4xl mb-4 flex justify-end">
                <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    Gerar PDF
                </Button>
            </div>
            
            {/* Flip container for screen view */}
            <div 
                className="w-full max-w-4xl cursor-pointer"
                onClick={() => setIsFront(!isFront)}
            >
                 <div className="origin-top transform scale-[0.35] sm:scale-[0.5] md:scale-[0.7] lg:scale-[0.8] xl:scale-100 transition-transform duration-300 aspect-[297/210]">
                    <div className={cn("flip-card w-full h-full transition-transform duration-700", { 'flipped': !isFront })} style={{ transformStyle: 'preserve-3d' }}>
                        <div className="flip-card-front">
                            <FichaFrente />
                        </div>
                        <div className="flip-card-back">
                            <FichaVerso />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className='flex gap-2 justify-center mt-4'>
                <Button variant={isFront ? 'default' : 'outline'} onClick={() => setIsFront(true)}>Frente</Button>
                <Button variant={!isFront ? 'default' : 'outline'} onClick={() => setIsFront(false)}>Verso</Button>
            </div>

            {/* Hidden container for PDF generation */}
            <div className="absolute -left-[9999px] top-auto">
                <div ref={frontRef} className="w-[297mm] h-[210mm] bg-white">
                   <FichaFrente />
                </div>
                <div ref={backRef} className="w-[297mm] h-[210mm] bg-white">
                   <FichaVerso />
                </div>
            </div>
        </div>
    );
}

    