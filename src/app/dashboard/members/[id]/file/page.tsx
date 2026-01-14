
'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { members } from '@/data/members';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


const DetailItem = ({ label, value }: { label: string; value?: string | null }) => {
    return (
        <div className="flex items-baseline border-b border-dotted border-gray-500 pb-1">
            <span className="font-bold whitespace-nowrap mr-2">{label}:</span>
            <span className="break-words">{value || 'Não informado'}</span>
        </div>
    );
};


export default function MemberFilePage({ params }: { params: { id: string } }) {
    const member = members.find((m) => m.id === params.id);
    const [isFlipped, setIsFlipped] = useState(false);
    const firestore = useFirestore();
    
    const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
    const { data: churchInfo } = useDoc<{ fichaLogoUrl?: string }>(churchInfoRef);
    
    if (!member) {
        notFound();
    }
    
    const avatar = PlaceHolderImages.find((p) => p.id === member.avatar);
    const defaultFichaLogo = PlaceHolderImages.find((p) => p.id === 'church-logo');
    const fichaLogoUrl = churchInfo?.fichaLogoUrl || defaultFichaLogo?.imageUrl;

    return (
        <div className="w-full min-h-screen bg-secondary p-4 flex justify-center items-center font-serif">
            <div 
              className="w-full max-w-5xl cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Usando aspect-ratio para manter a proporção de uma folha A5 em paisagem (1.414/1) */}
                <div className={cn("relative w-full aspect-[1.414/1]")} style={{ perspective: '1000px' }}>
                    <div className={cn("relative w-full h-full transition-transform duration-700", { '[transform:rotateY(180deg)]': isFlipped })} style={{ transformStyle: 'preserve-3d' }}>
                        
                        {/* Container da Ficha - Frente */}
                        <div className="absolute w-full h-full bg-white shadow-lg p-[2vw] md:p-8 flex flex-col" style={{ backfaceVisibility: 'hidden' }}>
                            {/* Header */}
                            <div className="flex justify-between items-start pb-[1vw] md:pb-4 border-b border-black gap-4">
                                <div className="w-[12vw] h-[16vw] md:w-24 md:h-32 border border-gray-300 flex items-center justify-center shrink-0 bg-gray-100">
                                    {avatar ? (
                                        <Image src={avatar.imageUrl} alt={member.name} width={96} height={128} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-[1.2vw] md:text-xs text-gray-400 text-center">Foto 3x4</span>
                                    )}
                                </div>
                                <div className="text-center flex-grow px-4">
                                    <h1 className="text-[2.5vw] md:text-3xl font-bold">Ficha de Membro</h1>
                                    <p className="text-[1.8vw] md:text-lg font-sans">Nº: {member.recordNumber}</p>
                                </div>
                                <div className="w-[12vw] h-[12vw] md:w-24 md:h-24 border border-gray-300 flex items-center justify-center shrink-0 bg-gray-100">
                                    {fichaLogoUrl ? (
                                        <Image src={fichaLogoUrl} alt="Logo da Ficha" width={96} height={96} className="object-contain p-1" />
                                    ) : (
                                        <span className="text-[1.2vw] md:text-xs text-gray-500">Logo</span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-grow pt-[2vw] md:pt-6 grid grid-cols-12 gap-x-[2vw] md:gap-x-8 gap-y-[1vw] md:gap-y-4 font-sans text-[1.5vw] md:text-sm">
                                <div className="col-span-8"><DetailItem label="Nome" value={member.name} /></div>
                                <div className="col-span-4"><DetailItem label="Data Nasc" value={member.birthDate ? format(new Date(member.birthDate), 'dd/MM/yyyy') : ''} /></div>

                                <div className="col-span-4"><DetailItem label="Naturalidade" value={member.naturalness} /></div>
                                <div className="col-span-4"><DetailItem label="Nacionalidade" value={member.nationality} /></div>
                                <div className="col-span-4"><DetailItem label="Est. Civil" value={member.maritalStatus} /></div>
                                
                                <div className="col-span-4"><DetailItem label="Gênero" value={member.gender} /></div>
                                <div className="col-span-4"><DetailItem label="RG" value={member.rg} /></div>
                                <div className="col-span-4"><DetailItem label="CPF" value={member.cpf} /></div>

                                <div className="col-span-12"><DetailItem label="E-mail" value={member.email} /></div>
                                
                                <div className="col-span-6"><DetailItem label="Tel" value={member.phone} /></div>
                                <div className="col-span-6"><DetailItem label="Whatsapp" value={member.whatsapp} /></div>

                                <div className="col-span-8"><DetailItem label="End" value={member.address} /></div>
                                <div className="col-span-4"><DetailItem label="Nº" value={member.addressNumber} /></div>

                                <div className="col-span-5"><DetailItem label="Bairro" value={member.addressDistrict} /></div>
                                <div className="col-span-4"><DetailItem label="Cidade" value={member.addressCity} /></div>
                                <div className="col-span-3"><DetailItem label="CEP" value={member.addressCep} /></div>

                            </div>
                        </div>

                        {/* Container da Ficha - Verso */}
                        <div className="absolute w-full h-full bg-white shadow-lg p-[2vw] md:p-8 flex flex-col" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                           <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="text-center pb-[1vw] md:pb-4 border-b border-black">
                                    <h1 className="text-[2.5vw] md:text-3xl font-bold">Dados Eclesiásticos</h1>
                                </div>

                                {/* Content */}
                                <div className="flex-grow pt-[2vw] md:pt-6 grid grid-cols-12 gap-x-[2vw] md:gap-x-8 gap-y-[1vw] md:gap-y-4 font-sans text-[1.5vw] md:text-sm">
                                    <div className="col-span-6"><DetailItem label="Data de Batismo" value={member.baptismDate ? format(new Date(member.baptismDate), 'dd/MM/yyyy') : ''} /></div>
                                    <div className="col-span-6"><DetailItem label="Data de Membresia" value={member.memberSince ? format(new Date(member.memberSince), 'dd/MM/yyyy') : ''} /></div>
                                    
                                    <div className="col-span-12"><DetailItem label="Congregação" value={member.congregation}/></div>
                                    
                                    <div className="col-span-12"><DetailItem label="Igreja de Origem" value={member.originChurch} /></div>
                                    <div className="col-span-12"><DetailItem label="Pastor Responsável" value={member.responsiblePastor} /></div>
                                    
                                    <div className="col-span-12 pt-[2vw] md:pt-8">
                                        <h2 className="text-[2vw] md:text-lg font-bold text-center mb-4 font-serif">Observações</h2>
                                        <div className="space-y-[1.5vw] md:space-y-6 mt-4">
                                            <div className="border-b border-dotted border-gray-400"></div>
                                            <div className="border-b border-dotted border-gray-400"></div>
                                            <div className="border-b border-dotted border-gray-400"></div>
                                        </div>
                                    </div>
                                </div>


                                {/* Footer com assinaturas */}
                                <div className="flex justify-around mt-auto pt-4 md:pt-8">
                                    <div className="text-center w-1/2">
                                        <div className="border-t border-black mt-8 w-full max-w-xs mx-auto"></div>
                                        <p className="mt-2 text-[1.5vw] md:text-sm font-sans">Assinatura do Membro</p>
                                    </div>
                                    <div className="text-center w-1/2">
                                        <div className="border-t border-black mt-8 w-full max-w-xs mx-auto"></div>
                                        <p className="mt-2 text-[1.5vw] md:text-sm font-sans">Assinatura do Pastor</p>
                                    </div>
                                </div>
                           </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
