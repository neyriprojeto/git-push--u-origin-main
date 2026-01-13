
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Minus, Plus, Palette, Image as ImageIcon, Eye, MessageSquare } from 'lucide-react';
import { members } from '@/data/members';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function CardStudioPage() {
    const [selectedElement, setSelectedElement] = useState('SEDE');
    const member = members[0]; // Using a sample member
    const avatar = PlaceHolderImages.find((p) => p.id === member.avatar);
    const [isFront, setIsFront] = useState(true);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className='flex items-center gap-2'>
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-3xl font-bold tracking-tight">Carteirinhas</h2>
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
                             <span className="text-sm font-semibold w-16 text-center">Tamanho</span>
                             <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Preview da Carteirinha */}
        <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden">
                <CardContent className="p-4">
                     <div className="aspect-[85.6/54] w-full max-w-lg mx-auto bg-white rounded-lg shadow-md p-4 relative">
                        {/* Elementos da carteirinha aqui */}
                        <div className="text-center">
                            <p className="font-serif text-xl font-bold">ASSEMBLEIA DE DEUS</p>
                            <p className="text-xs">Rua Presidente Prudente, N°28, Eldorado, Diadema-SP</p>
                            <p className="font-serif text-lg font-semibold mt-2">MINISTÉRIO KAIRÓS</p>
                            <span className="inline-block border border-blue-500 text-blue-500 text-xs font-semibold px-2 py-0.5 rounded mt-1">SEDE</span>
                        </div>
                        <div className="absolute bottom-4 left-4">
                             {avatar && (
                                <Image
                                    src={avatar.imageUrl}
                                    alt="Foto do Membro"
                                    width={80}
                                    height={80}
                                    className="rounded-md border-2 border-gray-300 object-cover"
                                />
                             )}
                        </div>
                     </div>
                </CardContent>
            </Card>
            <div className='flex flex-col sm:flex-row gap-2 justify-center'>
                <div className='flex gap-2'>
                    <Button variant={isFront ? 'default' : 'outline'} onClick={() => setIsFront(true)}>Frente</Button>
                    <Button variant={!isFront ? 'default' : 'outline'} onClick={() => setIsFront(false)}>Verso</Button>
                </div>
                 <div className='flex gap-2'>
                    <Button variant="outline"><Palette className="mr-2 h-4 w-4"/> Cores</Button>
                    <Button variant="outline"><ImageIcon className="mr-2 h-4 w-4"/> Imagens</Button>
                </div>
                 <div className='flex gap-2'>
                     <Button variant="secondary"><Eye className="mr-2 h-4 w-4"/> Preview</Button>
                    <Button variant="secondary"><MessageSquare className="mr-2 h-4 w-4"/> Chat</Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
