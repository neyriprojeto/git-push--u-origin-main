
'use client';

import { notFound } from 'next/navigation';
import { members } from '@/data/members';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';


const DetailItem = ({ label, value, className }: { label: string; value?: string | null, className?: string }) => {
    return (
        <div className={cn("flex items-end border-b border-dotted border-gray-400 pb-1", className)}>
            <span className="text-sm font-bold whitespace-nowrap mr-2">{label}:</span>
            <span className="text-sm">{value || 'Não informado'}</span>
            <span className="flex-grow"></span>
        </div>
    );
};


export default function MemberFilePage({ params }: { params: { id: string } }) {
    const member = members.find((m) => m.id === params.id);
    const [isFlipped, setIsFlipped] = useState(false);
    
    if (!member) {
        notFound();
    }
    
    const avatar = PlaceHolderImages.find((p) => p.id === member.avatar);
    const churchLogo = PlaceHolderImages.find((p) => p.id === 'church-banner');

    return (
        <div className="w-full min-h-screen bg-secondary p-4 md:p-8 flex justify-center items-center">
            <div 
              className="w-full max-w-5xl cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
                 {/* The outer container uses a class to maintain the aspect ratio */}
                <div className={cn("flip-card-container w-full aspect-[1.414/1] mx-auto")}>
                    <div className={cn("flip-card w-full h-full", { 'flipped': isFlipped })}>
                        
                        {/* Container da Ficha - Frente */}
                        <div className="flip-card-front w-full h-full">
                            <div className="bg-white shadow-lg w-full h-full p-8 md:p-12 font-serif flex flex-col">
                                {/* Header */}
                                <div className="flex justify-between items-start pb-4 border-b border-black">
                                    <div className="w-24 h-32 border border-gray-300 flex items-center justify-center shrink-0 bg-gray-100">
                                        {avatar ? (
                                            <Image src={avatar.imageUrl} alt={member.name} width={96} height={128} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-xs text-gray-400">Foto 3x4</span>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <h1 className="text-4xl font-bold">Ficha de Membro</h1>
                                        <p className="text-lg font-sans">Nº: {member.recordNumber}</p>
                                    </div>
                                    <div className="w-24 h-24 border border-gray-300 flex items-center justify-center shrink-0 bg-gray-100">
                                        {churchLogo ? (
                                            <Image src={churchLogo.imageUrl} alt="Logo" width={96} height={96} className="object-contain p-1" />
                                        ) : (
                                            <span className="text-sm text-gray-500">Logo</span>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-grow pt-8 grid grid-cols-12 gap-x-8 gap-y-4 font-sans">
                                    <div className="col-span-12"><DetailItem label="Nome" value={member.name} /></div>

                                    <div className="col-span-7"><DetailItem label="Naturalidade" value={member.naturalness} /></div>
                                    <div className="col-span-5"><DetailItem label="Nacionalidade" value={member.nationality} /></div>

                                    <div className="col-span-4"><DetailItem label="Data Nasc" value={member.birthDate ? format(new Date(member.birthDate), 'dd/MM/yyyy') : ''} /></div>
                                    <div className="col-span-4"><DetailItem label="Gênero" value={member.gender} /></div>
                                    <div className="col-span-4"><DetailItem label="Est. Civil" value={member.maritalStatus} /></div>
                                    
                                    <div className="col-span-6"><DetailItem label="RG" value={member.rg} /></div>
                                    <div className="col-span-6"><DetailItem label="CPF" value={member.cpf} /></div>

                                    <div className="col-span-12"><DetailItem label="E-mail" value={member.email} /></div>
                                    
                                    <div className="col-span-6"><DetailItem label="Tel" value={member.phone} /></div>
                                    <div className="col-span-6"><DetailItem label="Whatsapp" value={member.whatsapp} /></div>

                                    <div className="col-span-9"><DetailItem label="End" value={member.address} /></div>
                                    <div className="col-span-3"><DetailItem label="Nº" value={member.addressNumber} /></div>

                                    <div className="col-span-8"><DetailItem label="Bairro" value={member.addressDistrict} /></div>
                                    <div className="col-span-4"><DetailItem label="CEP" value={member.addressCep} /></div>

                                    <div className="col-span-8"><DetailItem label="Cidade" value={member.addressCity} /></div>
                                    <div className="col-span-4"><DetailItem label="Estado" value={member.addressState} /></div>
                                </div>
                            </div>
                        </div>

                        {/* Container da Ficha - Verso */}
                        <div className="flip-card-back w-full h-full">
                            <div className="bg-white shadow-lg w-full h-full p-8 md:p-12 font-serif flex flex-col">
                                {/* Header */}
                                <div className="text-center pb-4 border-b border-black">
                                    <h1 className="text-4xl font-bold">Dados Eclesiásticos</h1>
                                </div>

                                {/* Content */}
                                <div className="flex-grow pt-8 grid grid-cols-12 gap-x-8 gap-y-4 font-sans">
                                    <div className="col-span-6"><DetailItem label="Data de Batismo" value={member.baptismDate ? format(new Date(member.baptismDate), 'dd/MM/yyyy') : ''} /></div>
                                    <div className="col-span-6"><DetailItem label="Data de Membresia" value={member.memberSince ? format(new Date(member.memberSince), 'dd/MM/yyyy') : ''} /></div>
                                    
                                    <div className="col-span-12"><DetailItem label="Congregação" value={member.congregation}/></div>
                                    
                                    <div className="col-span-12"><DetailItem label="Igreja de Origem" value={member.originChurch} /></div>
                                    <div className="col-span-12"><DetailItem label="Pastor Responsável" value={member.responsiblePastor} /></div>
                                    
                                    <div className="col-span-12 pt-8">
                                        <h2 className="text-2xl font-bold text-center mb-4 font-serif">Observações</h2>
                                        <div className="space-y-6 mt-4">
                                            <div className="border-b border-dotted border-gray-400"></div>
                                            <div className="border-b border-dotted border-gray-400"></div>
                                            <div className="border-b border-dotted border-gray-400"></div>
                                        </div>
                                    </div>
                                </div>


                                {/* Footer com assinaturas */}
                                <div className="flex justify-around pt-12 mt-auto">
                                    <div className="text-center w-1/2">
                                        <div className="border-t border-black mt-8 w-full max-w-xs mx-auto"></div>
                                        <p className="mt-2 text-sm font-sans">Assinatura do Membro</p>
                                    </div>
                                    <div className="text-center w-1/2">
                                        <div className="border-t border-black mt-8 w-full max-w-xs mx-auto"></div>
                                        <p className="mt-2 text-sm font-sans">Assinatura do Pastor</p>
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
