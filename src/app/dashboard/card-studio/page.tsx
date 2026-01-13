
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Minus, Plus, Palette, Image as ImageIcon, Eye, MessageSquare, Type, Upload } from 'lucide-react';
import { members } from '@/data/members';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CardStudioPage() {
    const [selectedElement, setSelectedElement] = useState('NOME');
    const member = members[0]; // Using a sample member
    const avatar = PlaceHolderImages.find((p) => p.id === member.avatar);
    const qrCodePlaceholder = PlaceHolderImages.find((p) => p.id === 'qr-code-placeholder');
    const [isFront, setIsFront] = useState(true);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className='flex items-center gap-2'>
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-3xl font-bold tracking-tight">Estúdio de Carteirinha</h2>
        </div>
        <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>A</AvatarFallback>
        </Avatar>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel de Ajuste */}
        <div className="lg:col-span-1">
            <Card className="bg-muted/40">
                <CardHeader>
                    <CardTitle>Painel de Ajuste</CardTitle>
                    <CardDescription>Ajustando: <span className="font-bold text-primary">{selectedElement}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Posição</p>
                        <div className="flex items-center justify-center gap-2">
                             <Button variant="outline" size="icon"><ArrowUp className="w-4 h-4" /></Button>
                             <Button variant="outline" size="icon"><ArrowDown className="w-4 h-4" /></Button>
                             <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                             <Button variant="outline" size="icon"><ArrowRight className="w-4 h-4" /></Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <p className="text-sm font-medium">Tamanho</p>
                        <div className="flex items-center justify-center gap-2">
                             <Button variant="outline" size="icon"><Minus className="w-4 h-4" /></Button>
                             <span className="text-sm font-semibold w-16 text-center">100%</span>
                             <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <p className="text-sm font-medium">Imagens</p>
                        <div className="grid grid-cols-2 gap-2">
                             <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Fundo (Frente)</Button>
                             <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Fundo (Verso)</Button>
                             <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Logo Igreja</Button>
                             <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Logo Conv. 1</Button>
                             <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Logo Conv. 2</Button>
                             <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Assinatura</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Preview da Carteirinha */}
        <div className="lg:col-span-2 space-y-2">
            <Card className="overflow-hidden">
                <CardContent className="p-4">
                     <div className="aspect-[85.6/54] w-full max-w-lg mx-auto rounded-lg shadow-md relative bg-gray-100 dark:bg-gray-800">
                        {isFront ? (
                            // Frente da Carteirinha
                            <div className='p-4 h-full flex flex-col'>
                                <div className="text-center mb-2">
                                    <input type="text" defaultValue="ASSEMBLEIA DE DEUS" className="font-serif text-xl font-bold bg-transparent text-center w-full" onClick={() => setSelectedElement('Título 1')} />
                                    <input type="text" defaultValue="MINISTÉRIO KAIRÓS" className="font-serif text-lg font-semibold bg-transparent text-center w-full" onClick={() => setSelectedElement('Título 2')} />
                                     <input type="text" defaultValue="Rua Presidente Prudente, N°28, Eldorado, Diadema-SP" className="text-xs bg-transparent text-center w-full" onClick={() => setSelectedElement('Endereço')} />
                                </div>
                                <div className='flex-1'></div>
                                <div className="flex items-end gap-4">
                                     {avatar && (
                                        <Image
                                            src={avatar.imageUrl}
                                            alt="Foto do Membro"
                                            width={80}
                                            height={100}
                                            className="rounded-md border-2 border-gray-300 object-cover"
                                            onClick={() => setSelectedElement('Foto do Membro')}
                                        />
                                     )}
                                     <div className='flex-1 grid gap-1 text-xs'>
                                        <p className='font-bold' onClick={() => setSelectedElement('Nome')}>{member.name}</p>
                                        <div className='flex gap-4'>
                                            <p onClick={() => setSelectedElement('RG')}>RG: {member.rg}</p>
                                            <p onClick={() => setSelectedElement('CPF')}>CPF: {member.cpf}</p>
                                        </div>
                                         <p onClick={() => setSelectedElement('Cargo')}>Cargo: {member.role}</p>
                                     </div>
                                </div>
                            </div>
                        ) : (
                            // Verso da Carteirinha
                            <div className='p-4 h-full flex flex-col justify-between'>
                                <div className='flex justify-between items-start'>
                                    <div className='w-20 h-20 bg-gray-200 flex items-center justify-center' onClick={() => setSelectedElement('Logo Convenção 1')}>
                                        <span className='text-xs text-gray-500'>Conv. 1</span>
                                    </div>
                                    <div className='w-20 h-20 bg-gray-200 flex items-center justify-center' onClick={() => setSelectedElement('Logo Convenção 2')}>
                                        <span className='text-xs text-gray-500'>Conv. 2</span>
                                    </div>
                                </div>

                                <div className='flex items-end gap-4'>
                                     {qrCodePlaceholder && (
                                        <Image
                                            src={qrCodePlaceholder.imageUrl}
                                            alt="QR Code"
                                            width={80}
                                            height={80}
                                            className="rounded-md"
                                            onClick={() => setSelectedElement('QR Code')}
                                        />
                                     )}
                                     <div className='flex-1 space-y-2 text-xs'>
                                        <div className='border-t border-gray-500 pt-1 text-center' onClick={() => setSelectedElement('Assinatura Pastor')}>Assinatura Pastor Presidente</div>
                                        <div className='flex justify-between'>
                                            <p>Validade: <span className='font-semibold'>01/01/2026</span></p>
                                            <p>Membro desde: <span className='font-semibold'>{new Date(member.memberSince).toLocaleDateString()}</span></p>
                                        </div>
                                     </div>
                                </div>

                            </div>
                        )}
                     </div>
                </CardContent>
            </Card>
            <div className='flex flex-wrap gap-2 justify-center'>
                <Button variant={isFront ? 'default' : 'outline'} onClick={() => setIsFront(true)}>Frente</Button>
                <Button variant={!isFront ? 'default' : 'outline'} onClick={() => setIsFront(false)}>Verso</Button>
                <Button variant="outline"><Type className="mr-2 h-4 w-4"/> Texto</Button>
                <Button variant="outline"><Palette className="mr-2 h-4 w-4"/> Cores</Button>
                <Button variant="outline"><ImageIcon className="mr-2 h-4 w-4"/> Imagens</Button>
                <Button variant="secondary"><Eye className="mr-2 h-4 w-4"/> Preview</Button>
                <Button variant="secondary"><MessageSquare className="mr-2 h-4 w-4"/> Chat</Button>
            </div>
        </div>
      </div>
    </div>
  );
}
