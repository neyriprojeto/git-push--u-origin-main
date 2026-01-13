
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from '@/lib/utils';

type ElementStyle = {
    position: { top: number; left: number };
    size: { width?: number; height?: number; fontSize?: number };
    text?: string;
    color?: string;
    fontWeight?: 'normal' | 'bold';
};

type CardElements = {
    [key: string]: ElementStyle;
};


export default function CardStudioPage() {
    const member = members[0]; // Using a sample member
    const avatarPlaceholder = PlaceHolderImages.find((p) => p.id === member.avatar);
    const qrCodePlaceholder = PlaceHolderImages.find((p) => p.id === 'qr-code-placeholder');
    const [isFront, setIsFront] = useState(true);

    const [elements, setElements] = useState<CardElements>({
        // --- Frente ---
        'Título 1': { position: { top: 5, left: 0 }, size: { fontSize: 20 }, text: 'ASSEMBLEIA DE DEUS', color: '#000000', fontWeight: 'bold' },
        'Título 2': { position: { top: 12, left: 0 }, size: { fontSize: 16 }, text: 'MINISTÉRIO KAIRÓS', color: '#000000', fontWeight: 'bold' },
        'Endereço': { position: { top: 18, left: 0 }, size: { fontSize: 8 }, text: 'Rua Presidente Prudente, N°28, Eldorado, Diadema-SP', color: '#333333' },
        'Foto do Membro': { position: { top: 30, left: 5 }, size: { width: 80, height: 100 } },
        'Nome': { position: { top: 60, left: 30 }, size: { fontSize: 11 }, text: member.name, color: '#333333', fontWeight: 'bold' },
        'RG': { position: { top: 70, left: 30 }, size: { fontSize: 10 }, text: `RG: ${member.rg}`, color: '#333333', fontWeight: 'bold' },
        'CPF': { position: { top: 70, left: 55 }, size: { fontSize: 10 }, text: `CPF: ${member.cpf}`, color: '#333333', fontWeight: 'bold' },
        'Cargo': { position: { top: 80, left: 30 }, size: { fontSize: 10 }, text: `Cargo: ${member.role}`, color: '#333333', fontWeight: 'bold' },
        
        // --- Verso ---
        'Logo Convenção 1': { position: { top: 5, left: 5 }, size: { width: 60, height: 60 } },
        'Logo Convenção 2': { position: { top: 5, left: 80 }, size: { width: 60, height: 60 } },
        'QR Code': { position: { top: 40, left: 5 }, size: { width: 70, height: 70 } },
        'Assinatura Pastor': { position: { top: 60, left: 35 }, size: { fontSize: 10 }, text: 'Assinatura Pastor Presidente', color: '#333333' },
        'Validade': { position: { top: 85, left: 40 }, size: { fontSize: 10 }, text: 'Validade: 01/01/2026', color: '#333333', fontWeight: 'bold' },
        'Membro Desde': { position: { top: 90, left: 40 }, size: { fontSize: 10 }, text: `Membro desde: ${new Date(member.memberSince).toLocaleDateString()}`, color: '#333333', fontWeight: 'bold' },
    });

    const [selectedElement, setSelectedElement] = useState<string | null>(null);

    const handleElementChange = (id: string, newText: string) => {
        setElements(prev => ({
            ...prev,
            [id]: { ...prev[id], text: newText }
        }));
    };
    
    const handleStyleChange = (property: 'position' | 'size', step: number, direction: 'up' | 'down' | 'left' | 'right' | 'increase' | 'decrease') => {
        if (!selectedElement) return;

        setElements(prev => {
            const currentElement = prev[selectedElement];
            const newElements = { ...prev };

            if (property === 'position') {
                const newPosition = { ...currentElement.position };
                if (direction === 'up') newPosition.top -= step;
                if (direction === 'down') newPosition.top += step;
                if (direction === 'left') newPosition.left -= step;
                if (direction === 'right') newPosition.left += step;
                newElements[selectedElement] = { ...currentElement, position: newPosition };
            } else if (property === 'size') {
                const newSize = { ...currentElement.size };
                const change = direction === 'increase' ? step : -step;
                
                if (newSize.fontSize) {
                   newSize.fontSize = Math.max(1, newSize.fontSize + change);
                }
                if (newSize.width) {
                   newSize.width = Math.max(10, newSize.width + (change * 5));
                }
                if (newSize.height) {
                    newSize.height = Math.max(10, newSize.height + (change * 5));
                }
                newElements[selectedElement] = { ...currentElement, size: newSize };
            }

            return newElements;
        });
    };

    const renderElement = (id: string, isInput = false, children?: React.ReactNode) => {
        const el = elements[id];
        if (!el) return null;

        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${el.position.top}%`,
            left: `${el.position.left}%`,
            fontSize: el.size.fontSize ? `${el.size.fontSize}px` : undefined,
            width: el.size.width ? `${el.size.width}px` : (isInput ? '100%' : 'auto'),
            height: el.size.height ? `${el.size.height}px` : 'auto',
            color: el.color,
            fontWeight: el.fontWeight,
            transform: 'translateX(-50%)',
        };
         if (id.includes('Título') || id.includes('Endereço')) {
            style.left = '50%';
            style.width = '90%';
            style.textAlign = 'center';
        }

        const className = cn(
            "cursor-pointer",
            { "ring-2 ring-blue-500 rounded p-0.5": selectedElement === id },
            { "bg-transparent outline-none w-full text-center": isInput }
        );

        if (children) {
            return (
                <div
                    style={style}
                    onClick={() => setSelectedElement(id)}
                    className={cn(className, "relative")}
                >
                    {children}
                </div>
            )
        }

        if (isInput) {
            return (
                <input
                    type="text"
                    value={el.text}
                    onChange={(e) => handleElementChange(id, e.target.value)}
                    onClick={() => setSelectedElement(id)}
                    style={style}
                    className={className}
                />
            );
        }

        return (
            <p
                onClick={() => setSelectedElement(id)}
                style={style}
                className={className}
            >
                {el.text}
            </p>
        );
    };

    const getSelectedElementSize = () => {
        if (!selectedElement) return '100%';
        const size = elements[selectedElement]?.size.fontSize || elements[selectedElement]?.size.width;
        if (!size) return '100%';
        return `${size} ${elements[selectedElement]?.size.fontSize ? 'px' : '%'}`
    }


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

      <div className="grid grid-cols-1 gap-8">
        
        {/* Preview da Carteirinha */}
        <div className="space-y-4">
             <Card className='overflow-hidden'>
                <CardContent className='p-2 bg-muted/30'>
                    <div className='flex items-center justify-center flex-wrap gap-2 p-2 rounded-md bg-background border mb-2'>
                        <p className="text-sm font-medium mr-2">
                            Ajustando: <span className={cn("font-bold", { "text-primary": selectedElement })}>{selectedElement || "Nenhum"}</span>
                        </p>
                        <Separator orientation='vertical' className='h-6 mx-2'/>
                        <p className="text-sm font-medium mr-2">Posição:</p>
                        <Button variant="outline" size="icon" onClick={() => handleStyleChange('position', 1, 'up')}><ArrowUp className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handleStyleChange('position', 1, 'down')}><ArrowDown className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handleStyleChange('position', 1, 'left')}><ArrowLeft className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handleStyleChange('position', 1, 'right')}><ArrowRight className="w-4 h-4" /></Button>
                        <Separator orientation='vertical' className='h-6 mx-2'/>
                         <p className="text-sm font-medium mr-2">Tamanho:</p>
                         <Button variant="outline" size="icon" onClick={() => handleStyleChange('size', 1, 'decrease')}><Minus className="w-4 h-4" /></Button>
                         <span className="text-sm font-semibold w-16 text-center">{getSelectedElementSize()}</span>
                         <Button variant="outline" size="icon" onClick={() => handleStyleChange('size', 1, 'increase')}><Plus className="w-4 h-4" /></Button>
                    </div>
                     <div className="aspect-[85.6/54] w-full max-w-lg mx-auto rounded-lg shadow-md relative bg-gray-100 dark:bg-gray-800">
                        {isFront ? (
                            // Frente da Carteirinha
                            <div className='relative h-full w-full'>
                                {renderElement('Título 1', true)}
                                {renderElement('Título 2', true)}
                                {renderElement('Endereço', true)}

                                {avatarPlaceholder && renderElement('Foto do Membro', false, 
                                    <Image
                                        src={avatarPlaceholder.imageUrl}
                                        alt="Foto do Membro"
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded-md border-2 border-gray-300"
                                    />
                                )}

                                <div style={{ position: 'absolute', top: `${elements['Nome'].position.top}%`, left: `${elements['Nome'].position.left}%`, width: '65%'}}>
                                     {renderElement('Nome')}
                                     {renderElement('RG')}
                                     {renderElement('CPF')}
                                     {renderElement('Cargo')}
                                </div>
                            </div>
                        ) : (
                            // Verso da Carteirinha
                            <div className='relative h-full w-full'>
                                {renderElement('Logo Convenção 1', false, 
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span className='text-xs text-gray-500'>Conv. 1</span>
                                    </div>
                                )}
                                {renderElement('Logo Convenção 2', false, 
                                     <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span className='text-xs text-gray-500'>Conv. 2</span>
                                    </div>
                                )}
                                {qrCodePlaceholder && renderElement('QR Code', false,
                                     <Image
                                        src={qrCodePlaceholder.imageUrl}
                                        alt="QR Code"
                                        layout='fill'
                                        objectFit='contain'
                                        className="rounded-md"
                                    />
                                )}
                                {renderElement('Assinatura Pastor')}
                                {renderElement('Validade')}
                                {renderElement('Membro Desde')}
                                <div 
                                    style={{
                                        position: 'absolute', 
                                        borderTop: '1px solid black', 
                                        width: '40%', 
                                        top: `${elements['Assinatura Pastor'].position.top + 5}%`,
                                        left: `${elements['Assinatura Pastor'].position.left}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                />
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
                                        <Input id="title1" value={elements['Título 1'].text} onChange={(e) => handleElementChange('Título 1', e.target.value)} className="col-span-2 h-8" />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="title2">Título 2</Label>
                                        <Input id="title2" value={elements['Título 2'].text} onChange={(e) => handleElementChange('Título 2', e.target.value)} className="col-span-2 h-8" />
                                    </div>
                                     <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="address">Endereço</Label>
                                        <Input id="address" value={elements['Endereço'].text} onChange={(e) => handleElementChange('Endereço', e.target.value)} className="col-span-2 h-8" />
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

    