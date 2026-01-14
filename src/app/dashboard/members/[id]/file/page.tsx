
'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { members, Member } from '@/data/members';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { AppLogo } from '@/components/icons';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';

const DetailItem = ({ label, value, colSpan = 2, className }: { label: string; value?: string | null, colSpan?: number, className?: string }) => {
    // Determine column span for the value based on the total span.
    const valueColSpan = colSpan > 1 ? `sm:col-span-${colSpan - 1}` : `sm:col-span-1`;

    return (
        <div className={cn(`grid grid-cols-1 sm:grid-cols-${colSpan} gap-x-2 py-1 border-b border-gray-300 break-inside-avoid items-center`, className)}>
            <span className="text-xs font-semibold text-gray-600 col-span-1">{label}:</span>
            <span className="text-sm col-span-1 break-words", valueColSpan}>{value || 'Não informado'}</span>
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

    return (
        <div className="w-full min-h-screen bg-secondary p-4 md:p-8 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Ficha Cadastral de Membro</h1>
            <p className="text-center text-sm text-muted-foreground mb-4">
                Clique na ficha para visualizar o verso.
            </p>

            <div 
                className="w-full max-w-4xl flip-card-container cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={cn("flip-card w-full aspect-[1.41/1]", { 'flipped': isFlipped })}>
                    {/* Front Side */}
                    <div className="flip-card-front">
                        <Card className="h-full w-full p-4 md:p-6 flex flex-col">
                             <div className="flex justify-between items-start mb-4">
                                <div className="w-24 h-32 border-2 border-gray-300 flex items-center justify-center shrink-0">
                                    {avatar ? (
                                         <Image src={avatar.imageUrl} alt={member.name} width={96} height={128} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-xs text-gray-400">Foto 3x4</span>
                                    )}
                                </div>
                                <div className="text-center px-4">
                                    <h2 className="text-xl font-bold">Ficha de Membro</h2>
                                    <p className="text-lg">Nº: {member.recordNumber}</p>
                                </div>
                                <div className="w-24 h-24 flex items-center justify-center shrink-0">
                                    <AppLogo className="w-16 h-16 text-gray-300"/>
                                </div>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-sm">
                                <div className="flex flex-col gap-1">
                                    <DetailItem label="Nome" value={member.name} colSpan={4} />
                                    <DetailItem label="Naturalidade" value={member.naturalness} colSpan={4}/>
                                    <DetailItem label="Nacionalidade" value={member.nationality} colSpan={4}/>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                        <DetailItem label="Data Nasc" value={member.birthDate ? format(new Date(member.birthDate), 'dd/MM/yyyy') : ''} colSpan={2} />
                                        <DetailItem label="Gênero" value={member.gender} colSpan={2}/>
                                    </div>
                                    <DetailItem label="Est. Civil" value={member.maritalStatus} colSpan={4}/>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                        <DetailItem label="RG" value={member.rg} colSpan={2}/>
                                        <DetailItem label="CPF" value={member.cpf} colSpan={2}/>
                                    </div>
                                    <DetailItem label="E-mail" value={member.email} colSpan={4}/>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                        <DetailItem label="Tel" value={member.phone} colSpan={2}/>
                                        <DetailItem label="Whatsapp" value={member.whatsapp} colSpan={2}/>
                                    </div>
                                    <DetailItem label="End" value={`${member.address}, ${member.addressNumber}`} colSpan={4}/>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                        <DetailItem label="Bairro" value={member.addressDistrict} colSpan={2}/>
                                        <DetailItem label="CEP" value={member.addressCep} colSpan={2}/>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                        <DetailItem label="Cidade" value={member.addressCity} colSpan={2}/>
                                        <DetailItem label="Estado" value={member.addressState} colSpan={2}/>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                    {/* Back Side */}
                    <div className="flip-card-back">
                        <Card className="h-full w-full p-4 md:p-6 flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-center mb-6">Dados Eclesiásticos</h2>
                                <div className="space-y-3">
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                        <DetailItem label="Data de Batismo" value={member.baptismDate ? format(new Date(member.baptismDate), 'dd/MM/yyyy') : ''} colSpan={2}/>
                                        <DetailItem label="Data de Membresia" value={member.memberSince ? format(new Date(member.memberSince), 'dd/MM/yyyy') : ''} colSpan={2}/>
                                    </div>
                                    <DetailItem label="Congregação" value={member.congregation} colSpan={4}/>
                                    <DetailItem label="Igreja de Origem" value={member.originChurch} colSpan={4}/>
                                    <DetailItem label="Pastor Responsável" value={member.responsiblePastor} colSpan={4}/>
                                </div>

                                <div className="mt-6">
                                     <h3 className="text-lg font-bold text-center mb-2">Observações</h3>
                                     <div className="h-24 border border-gray-300 rounded-md p-2 text-sm bg-gray-50 overflow-y-auto">
                                         {member.observations || <span className='text-gray-400'>Nenhuma observação.</span>}
                                     </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-around pt-8">
                                <div className="text-center w-1/2">
                                    <div className="border-t border-black mt-8 w-full max-w-xs mx-auto"></div>
                                    <p className="mt-2 text-sm">Assinatura do Membro</p>
                                </div>
                                <div className="text-center w-1/2">
                                    <div className="border-t border-black mt-8 w-full max-w-xs mx-auto"></div>
                                    <p className="mt-2 text-sm">Assinatura do Pastor</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
