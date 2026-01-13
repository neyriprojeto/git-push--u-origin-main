
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Minus, Plus, Palette, Image as ImageIcon, Type, Upload } from 'lucide-react';
import { members } from '@/data/members';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

export default function CardStudioPage() {
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const member = members[0]; // Using a sample member
    const avatar = PlaceHolderImages.find((p) => p.id === member.avatar);
    const qrCodePlaceholder = PlaceHolderImages.find((p) => p.id === 'qr-code-placeholder');
    const [isFront, setIsFront] = useState(true);

    const [title1, setTitle1] = useState('ASSEMBLEIA DE DEUS');
    const [title2, setTitle2] = useState('MINISTÉRIO KAIRÓS');
    const [address, setAddress] = useState('Rua Presidente Prudente, N°28, Eldorado, Diadema-SP');

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
                    <CardTitle>Elementos</CardTitle>
                </CardHeader>
                <CardContent>
                   {selectedElement && <p className="text-sm">Ajustando: <span className="font-bold text-primary">{selectedElement}</span></p>}
                </CardContent>
            </Card>
        </div>

        {/* Preview da Carteirinha */}
        <div className="lg:col-span-2 space-y-4">
             <Card className='overflow-hidden'>
                <CardContent className='p-2 bg-muted/30'>
                    <div className='flex items-center justify-center flex-wrap gap-2 p-2 rounded-md bg-background border mb-2'>
                        <p className="text-sm font-medium mr-2">Posição:</p>
                        <Button variant="outline" size="icon"><ArrowUp className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon"><ArrowDown className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon"><ArrowRight className="w-4 h-4" /></Button>
                        <Separator orientation='vertical' className='h-6 mx-2'/>
                         <p className="text-sm font-medium mr-2">Tamanho:</p>
                         <Button variant="outline" size="icon"><Minus className="w-4 h-4" /></Button>
                         <span className="text-sm font-semibold w-16 text-center">100%</span>
                         <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                    </div>
                     <div className="aspect-[85.6/54] w-full max-w-lg mx-auto rounded-lg shadow-md relative bg-gray-100 dark:bg-gray-800">
                        {isFront ? (
                            // Frente da Carteirinha
                            <div className='p-4 h-full flex flex-col'>
                                <div className="text-center mb-2">
                                    <input type="text" value={title1} onChange={(e) => setTitle1(e.target.value)} className="font-serif text-xl font-bold bg-transparent text-center w-full" onClick={() => setSelectedElement('Título 1')} />
                                    <input type="text" value={title2} onChange={(e) => setTitle2(e.target.value)} className="font-serif text-lg font-semibold bg-transparent text-center w-full" onClick={() => setSelectedElement('Título 2')} />
                                     <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="text-xs bg-transparent text-center w-full" onClick={() => setSelectedElement('Endereço')} />
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
            <div className='flex flex-col items-center gap-4 pt-2'>
                <div className='flex gap-2'>
                    <Button variant={isFront ? 'default' : 'outline'} onClick={() => setIsFront(true)}>Frente</Button>
                    <Button variant={!isFront ? 'default' : 'outline'} onClick={() => setIsFront(false)}>Verso</Button>
                </div>
                <div className='flex flex-wrap gap-2 justify-center'>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline"><Type className="mr-2 h-4 w-4"/> Texto</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Editar Textos</h4>
                                    <p className="text-sm text-muted-foreground">
                                    Altere os textos principais da carteirinha.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="title1">Título 1</Label>
                                        <Input id="title1" value={title1} onChange={(e) => setTitle1(e.target.value)} className="col-span-2 h-8" />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="title2">Título 2</Label>
                                        <Input id="title2" value={title2} onChange={(e) => setTitle2(e.target.value)} className="col-span-2 h-8" />
                                    </div>
                                     <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="address">Endereço</Label>
                                        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-2 h-8" />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline"><Palette className="mr-2 h-4 w-4"/> Cores</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                             <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Editar Cores</h4>
                                    <p className="text-sm text-muted-foreground">
                                    Escolha as cores dos elementos.
                                    </p>
                                </div>
                                 <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="color-title">Cor do Título</Label>
                                        <Input id="color-title" type="color" defaultValue="#000000" className="col-span-2 h-8 p-1" />
                                    </div>
                                     <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="color-text">Cor do Texto</Label>
                                        <Input id="color-text" type="color" defaultValue="#333333" className="col-span-2 h-8 p-1" />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="color-bg">Cor do Fundo</Label>
                                        <Input id="color-bg" type="color" defaultValue="#F3F4F6" className="col-span-2 h-8 p-1" />
                                    </div>
                                </div>
                             </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                             <Button variant="outline"><ImageIcon className="mr-2 h-4 w-4"/> Imagens</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="flex flex-col gap-2">
                                 <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Fundo (Frente)</Button>
                                 <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Fundo (Verso)</Button>
                                 <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Logo Igreja</Button>
                                 <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Logo Conv. 1</Button>
                                 <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Logo Conv. 2</Button>
                                 <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Assinatura</Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

    