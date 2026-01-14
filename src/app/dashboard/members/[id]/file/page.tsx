
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

const DetailItem = ({ label, value, className }: { label: string; value?: string | null, className?: string }) => (
    <div className={cn("border-b border-gray-300 py-1 break-inside-avoid", className)}>
        <span className="text-xs font-semibold text-gray-600">{label}:</span>
        <span className="text-sm ml-2">{value || 'Não informado'}</span>
    </div>
);

const DetailItemGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:gap-x-4">{children}</div>
);

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
                className="w-full max-w-2xl flip-card-container cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={cn("flip-card w-full aspect-[1/1.41]", { 'flipped': isFlipped })}>
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

                            <div className="space-y-2 text-sm">
                                <DetailItem label="Nome" value={member.name} />
                                <DetailItemGroup>
                                    <DetailItem label="Naturalidade" value={member.naturalness} className="flex-1" />
                                    <DetailItem label="Nacionalidade" value={member.nationality} className="flex-1" />
                                </DetailItemGroup>
                                <DetailItemGroup>
                                    <DetailItem label="Data Nasc" value={member.birthDate ? format(new Date(member.birthDate), 'dd/MM/yyyy') : ''} className="flex-1" />
                                    <DetailItem label="Gênero" value={member.gender} className="flex-1"/>
                                    <DetailItem label="Est. Civil" value={member.maritalStatus} className="flex-1"/>
                                </DetailItemGroup>
                                <DetailItemGroup>
                                    <DetailItem label="RG" value={member.rg} className="flex-1"/>
                                    <DetailItem label="CPF" value={member.cpf} className="flex-1"/>
                                </DetailItemGroup>
                                <DetailItem label="E-mail" value={member.email} />
                                 <DetailItemGroup>
                                    <DetailItem label="Tel" value={member.phone} className="flex-1"/>
                                    <DetailItem label="Whatsapp" value={member.whatsapp} className="flex-1"/>
                                </DetailItemGroup>
                                <DetailItem label="End" value={`${member.address}, ${member.addressNumber}`} />
                                 <DetailItemGroup>
                                    <DetailItem label="Bairro" value={member.addressDistrict} className="flex-1"/>
                                    <DetailItem label="CEP" value={member.addressCep} className="flex-1"/>
                                </DetailItemGroup>
                                 <DetailItemGroup>
                                    <DetailItem label="Cidade" value={member.addressCity} className="flex-1"/>
                                    <DetailItem label="Estado" value={member.addressState} className="flex-1"/>
                                </DetailItemGroup>
                            </div>
                        </Card>
                    </div>
                    {/* Back Side */}
                    <div className="flip-card-back">
                        <Card className="h-full w-full p-4 md:p-6 flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-center mb-6">Dados Eclesiásticos</h2>
                                <div className="space-y-3">
                                     <DetailItemGroup>
                                        <DetailItem label="Data de Batismo" value={member.baptismDate ? format(new Date(member.baptismDate), 'dd/MM/yyyy') : ''} className="flex-1"/>
                                        <DetailItem label="Data de Membresia" value={member.memberSince ? format(new Date(member.memberSince), 'dd/MM/yyyy') : ''} className="flex-1"/>
                                    </DetailItemGroup>
                                    <DetailItem label="Congregação" value={member.congregation} />
                                    <DetailItem label="Igreja de Origem" value={member.originChurch} />
                                    <DetailItem label="Pastor Responsável" value={member.responsiblePastor} />
                                </div>

                                <div className="mt-6">
                                     <h3 className="text-lg font-bold text-center mb-2">Observações</h3>
                                     <div className="h-32 border border-gray-300 rounded-md p-2 text-sm bg-gray-50 overflow-y-auto">
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
