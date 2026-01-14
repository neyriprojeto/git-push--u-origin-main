
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

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="border-b border-gray-300 py-1">
        <span className="text-xs font-semibold text-gray-600">{label}:</span>
        <span className="text-sm ml-2">{value || 'Não informado'}</span>
    </div>
);

const DetailItemGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">{children}</div>
);

export default function MemberFilePage({ params }: { params: { id: string } }) {
    const member = members.find((m) => m.id === params.id);
    const [isFlipped, setIsFlipped] = useState(false);
    
    const churchLogo = PlaceHolderImages.find((p) => p.id === 'church-banner'); // Using a placeholder

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
                style={{ height: '1100px' }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={cn("flip-card w-full h-full", { 'flipped': isFlipped })}>
                    {/* Front Side */}
                    <div className="flip-card-front">
                        <Card className="h-full w-full p-6 md:p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-24 h-32 border-2 border-gray-300 flex items-center justify-center">
                                    {avatar ? (
                                         <Image src={avatar.imageUrl} alt={member.name} width={96} height={128} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-xs text-gray-400">Foto 3x4</span>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h2 className="text-xl font-bold">Ficha de Membro</h2>
                                    <p className="text-lg">Nº: {member.recordNumber}</p>
                                </div>
                                <div className="w-24 h-24 flex items-center justify-center">
                                    <AppLogo className="w-16 h-16 text-gray-300"/>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <DetailItem label="Nome" value={member.name} />
                                <DetailItemGroup>
                                    <DetailItem label="Naturalidade" value={member.naturalness} />
                                    <DetailItem label="Nacionalidade" value={member.nationality} />
                                </DetailItemGroup>
                                <DetailItemGroup>
                                    <DetailItem label="Data Nasc" value={member.birthDate ? format(new Date(member.birthDate), 'dd/MM/yyyy') : ''} />
                                    <DetailItem label="Gênero" value={member.gender} />
                                    <DetailItem label="Est. Civil" value={member.maritalStatus} />
                                </DetailItemGroup>
                                <DetailItemGroup>
                                    <DetailItem label="RG" value={member.rg} />
                                    <DetailItem label="CPF" value={member.cpf} />
                                </DetailItemGroup>
                                <DetailItem label="E-mail" value={member.email} />
                                 <DetailItemGroup>
                                    <DetailItem label="Tel" value={member.phone} />
                                    <DetailItem label="Whatsapp" value={member.whatsapp} />
                                </DetailItemGroup>
                                <DetailItemGroup>
                                    <DetailItem label="End" value={member.address} />
                                    <DetailItem label="Nº" value={member.addressNumber} />
                                </DetailItemGroup>
                                 <DetailItemGroup>
                                    <DetailItem label="Bairro" value={member.addressDistrict} />
                                    <DetailItem label="CEP" value={member.addressCep} />
                                </DetailItemGroup>
                                 <DetailItemGroup>
                                    <DetailItem label="Cidade" value={member.addressCity} />
                                    <DetailItem label="Estado" value={member.addressState} />
                                </DetailItemGroup>
                            </div>
                        </Card>
                    </div>
                    {/* Back Side */}
                    <div className="flip-card-back">
                        <Card className="h-full w-full p-6 md:p-8 flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-center mb-8">Dados Eclesiásticos</h2>
                                <div className="space-y-4">
                                     <DetailItemGroup>
                                        <DetailItem label="Data de Batismo" value={member.baptismDate ? format(new Date(member.baptismDate), 'dd/MM/yyyy') : ''} />
                                        <DetailItem label="Data de Membresia" value={member.memberSince ? format(new Date(member.memberSince), 'dd/MM/yyyy') : ''} />
                                    </DetailItemGroup>
                                    <DetailItem label="Congregação" value={member.congregation} />
                                    <DetailItem label="Igreja de Origem" value={member.originChurch} />
                                    <DetailItem label="Pastor Responsável" value={member.responsiblePastor} />
                                </div>

                                <div className="mt-8">
                                     <h3 className="text-lg font-bold text-center mb-2">Observações</h3>
                                     <div className="h-32 border border-gray-300 rounded-md p-2 text-sm">
                                         {member.observations}
                                     </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-around pt-12">
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
