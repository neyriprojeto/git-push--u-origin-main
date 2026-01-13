
'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    src?: string; // Para imagens
};

type CardElements = {
    [key: string]: ElementStyle;
};

export default function CardStudioPage() {
    const member = members[0]; // Using a sample member
    const avatarPlaceholder = PlaceHolderImages.find((p) => p.id === member.avatar);
    const qrCodePlaceholder = PlaceHolderImages.find((p) => p.id === 'qr-code-placeholder');
    const [isFront, setIsFront] = useState(true);

    // Refs para os inputs de arquivo
    const fileInputRefs = {
        'Fundo (Frente)': useRef<HTMLInputElement>(null),
        'Fundo (Verso)': useRef<HTMLInputElement>(null),
        'Logo Igreja': useRef<HTMLInputElement>(null),
        'Logo Convenção 1': useRef<HTMLInputElement>(null),
        'Logo Convenção 2': useRef<HTMLInputElement>(null),
        'Assinatura': useRef<HTMLInputElement>(null),
    };

    const [cardStyles, setCardStyles] = useState({
        frontBackground: '#F3F4F6',
        backBackground: '#F3F4F6',
        frontBackgroundImage: '',
        backBackgroundImage: '',
    });


    const [elements, setElements] = useState<CardElements>({
        // --- Frente ---
        'Título 1': { position: { top: 5, left: 0 }, size: { fontSize: 20 }, text: 'ASSEMBLEIA DE DEUS', color: '#000000', fontWeight: 'bold' },
        'Título 2': { position: { top: 12, left: 0 }, size: { fontSize: 16 }, text: 'MINISTÉRIO KAIRÓS', color: '#000000', fontWeight: 'bold' },
        'Endereço': { position: { top: 18, left: 0 }, size: { fontSize: 8 }, text: 'Rua Presidente Prudente, N°28\nEldorado, Diadema-SP', color: '#333333' },
        'Foto do Membro': { position: { top: 30, left: 5 }, size: { width: 80, height: 100 }, src: avatarPlaceholder?.imageUrl },
        'Nome': { position: { top: 60, left: 30 }, size: { fontSize: 11 }, text: member.name, color: '#333333', fontWeight: 'bold' },
        'RG': { position: { top: 70, left: 30 }, size: { fontSize: 10 }, text: `RG: ${member.rg}`, color: '#333333', fontWeight: 'bold' },
        'CPF': { position: { top: 70, left: 55 }, size: { fontSize: 10 }, text: `CPF: ${member.cpf}`, color: '#333333', fontWeight: 'bold' },
        'Cargo': { position: { top: 80, left: 30 }, size: { fontSize: 10 }, text: `Cargo: ${member.role}`, color: '#333333', fontWeight: 'bold' },
        'Logo Igreja': { position: { top: 25, left: 75 }, size: { width: 60, height: 60 }, src: '' },
        
        // --- Verso ---
        'Logo Convenção 1': { position: { top: 5, left: 15 }, size: { width: 60, height: 60 }, src: '' },
        'Logo Convenção 2': { position: { top: 5, left: 85 }, size: { width: 60, height: 60 }, src: '' },
        'QR Code': { position: { top: 30, left: 15 }, size: { width: 70, height: 70 }, src: qrCodePlaceholder?.imageUrl },
        'Assinatura': { position: { top: 65, left: 50 }, size: { width: 120, height: 40 }, src: '' },
        'Assinatura Pastor': { position: { top: 78, left: 50 }, size: { fontSize: 10 }, text: 'Assinatura Pastor Presidente', color: '#333333' },
        'Validade': { position: { top: 85, left: 50 }, size: { fontSize: 10 }, text: 'Validade: 01/01/2026', color: '#333333', fontWeight: 'bold' },
        'Membro Desde': { position: { top: 90, left: 50 }, size: { fontSize: 10 }, text: `Membro desde: ${new Date(member.memberSince).toLocaleDateString()}`, color: '#333333', fontWeight: 'bold' },
    });
    
    const [selectedElement, setSelectedElement] = useState<string | null>(null);

    // Handlers para as cores
    const handleColorChange = (target: 'title' | 'text' | 'bg', value: string) => {
        if (target === 'bg') {
             if (isFront) {
                setCardStyles(prev => ({ ...prev, frontBackground: value }));
            } else {
                setCardStyles(prev => ({ ...prev, backBackground: value }));
            }
        } else {
            const elementsToUpdate = target === 'title' 
                ? ['Título 1', 'Título 2'] 
                : ['Endereço', 'Nome', 'RG', 'CPF', 'Cargo', 'Assinatura Pastor', 'Validade', 'Membro Desde'];
            
            setElements(prev => {
                const newElements = { ...prev };
                elementsToUpdate.forEach(id => {
                    if (newElements[id]) {
                        newElements[id] = { ...newElements[id], color: value };
                    }
                });
                return newElements;
            });
        }
    };
    
    // Handler para upload de imagem
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                if (id === 'Fundo (Frente)') {
                    setCardStyles(prev => ({...prev, frontBackgroundImage: src}));
                } else if (id === 'Fundo (Verso)') {
                    setCardStyles(prev => ({...prev, backBackgroundImage: src}));
                } else {
                    setElements(prev => ({
                        ...prev,
                        [id]: { ...prev[id], src }
                    }));
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
     const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

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

    const renderElement = (id: string) => {
        const el = elements[id];
        if (!el) return null;
        
        const isImage = 'src' in el;
        const isText = 'text' in el;

        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${el.position.top}%`,
            left: `${el.position.left}%`,
            width: el.size.width ? `${el.size.width}px` : 'auto',
            height: el.size.height ? `${el.size.height}px` : 'auto',
            transform: 'translateX(-50%)',
        };
        
        if (id.includes('Título') || id.includes('Endereço') || id.includes('Assinatura Pastor') || id.includes('Validade') || id.includes('Membro Desde')) {
            style.left = '50%';
            style.width = '90%';
            style.textAlign = 'center';
        }
        
         if (isText) {
            style.fontSize = el.size.fontSize ? `${el.size.fontSize}px` : undefined;
            style.color = el.color;
            style.fontWeight = el.fontWeight;
            if (id === 'Endereço') {
                style.whiteSpace = 'pre-wrap';
            }
            if (id.startsWith('Nome') || id.startsWith('RG') || id.startsWith('CPF') || id.startsWith('Cargo')) {
                 style.transform = 'none';
            }
        }
        
        const className = cn(
            "cursor-pointer",
            { "ring-2 ring-blue-500 rounded p-0.5": selectedElement === id },
        );

        if (isImage) {
            // Renderiza placeholder se não houver src
             if (!el.src) {
                return (
                    <div
                        style={style}
                        onClick={() => setSelectedElement(id)}
                        className={cn(className, "border-2 border-dashed bg-gray-200/50 flex items-center justify-center")}
                    >
                       <span className='text-xs text-gray-500 text-center p-1'>{id}</span>
                    </div>
                )
            }
            return (
                 <div
                    style={style}
                    onClick={() => setSelectedElement(id)}
                    className={cn(className, "relative")}
                >
                    <Image
                        src={el.src}
                        alt={id}
                        layout="fill"
                        objectFit={id === 'Foto do Membro' ? "cover" : "contain"}
                        className={cn({ 'rounded-md': id !== 'Assinatura'})}
                    />
                </div>
            )
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
        if (!selectedElement) return 'N/A';
        const size = elements[selectedElement]?.size.fontSize || elements[selectedElement]?.size.width;
        if (!size) return 'auto';
        return `${size} ${elements[selectedElement]?.size.fontSize ? 'px' : 'px'}`
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
        
        <div className="space-y-4">
             <Card className='overflow-hidden'>
                <CardContent className='p-2 bg-muted/30'>
                    <div className='flex items-center justify-center flex-wrap gap-2 p-2 rounded-md bg-background border mb-2'>
                        <p className="text-sm font-medium mr-2">
                            Ajustando: <span className={cn("font-bold", { "text-primary": selectedElement })}>{selectedElement || "Nenhum"}</span>
                        </p>
                        <Separator orientation='vertical' className='h-6 mx-2'/>
                        <p className="text-sm font-medium mr-2">Posição:</p>
                        <Button variant="outline" size="icon" onClick={() => handleStyleChange('position', 1, 'up')} disabled={!selectedElement}><ArrowUp className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handleStyleChange('position', 1, 'down')} disabled={!selectedElement}><ArrowDown className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handleStyleChange('position', 1, 'left')} disabled={!selectedElement}><ArrowLeft className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handleStyleChange('position', 1, 'right')} disabled={!selectedElement}><ArrowRight className="w-4 h-4" /></Button>
                        <Separator orientation='vertical' className='h-6 mx-2'/>
                         <p className="text-sm font-medium mr-2">Tamanho:</p>
                         <Button variant="outline" size="icon" onClick={() => handleStyleChange('size', 1, 'decrease')} disabled={!selectedElement}><Minus className="w-4 h-4" /></Button>
                         <span className="text-sm font-semibold w-16 text-center">{getSelectedElementSize()}</span>
                         <Button variant="outline" size="icon" onClick={() => handleStyleChange('size', 1, 'increase')} disabled={!selectedElement}><Plus className="w-4 h-4" /></Button>
                    </div>
                     <div 
                        className="aspect-[85.6/54] w-full max-w-lg mx-auto rounded-lg shadow-md relative"
                         style={{ 
                            backgroundColor: isFront ? cardStyles.frontBackground : cardStyles.backBackground,
                            backgroundImage: `url(${isFront ? cardStyles.frontBackgroundImage : cardStyles.backBackgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                         }}
                    >
                        {isFront ? (
                            // Frente da Carteirinha
                            <div className='relative h-full w-full'>
                                {renderElement('Título 1')}
                                {renderElement('Título 2')}
                                {renderElement('Endereço')}
                                {renderElement('Foto do Membro')}
                                {renderElement('Logo Igreja')}
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
                                {renderElement('Logo Convenção 1')}
                                {renderElement('Logo Convenção 2')}
                                {renderElement('QR Code')}
                                {renderElement('Assinatura')}
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
                                        <Input id="color-title" type="color" defaultValue={elements['Título 1'].color} onChange={(e) => handleColorChange('title', e.target.value)} className="col-span-2 h-8 p-1" />
                                    </div>
                                     <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="color-text">Cor do Texto</Label>
                                        <Input id="color-text" type="color" defaultValue={elements['Nome'].color} onChange={(e) => handleColorChange('text', e.target.value)} className="col-span-2 h-8 p-1" />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="color-bg">Cor do Fundo</Label>
                                        <Input id="color-bg" type="color" defaultValue={isFront ? cardStyles.frontBackground : cardStyles.backBackground} onChange={(e) => handleColorChange('bg', e.target.value)} className="col-span-2 h-8 p-1" />
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
                                 {Object.keys(fileInputRefs).map((key) => (
                                     <React.Fragment key={key}>
                                         <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRefs[key as keyof typeof fileInputRefs]}
                                            onChange={(e) => handleImageUpload(e, key)}
                                            className="hidden"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => triggerFileInput(fileInputRefs[key as keyof typeof fileInputRefs])}
                                        >
                                            <Upload className="mr-2 h-4 w-4"/> {key}
                                        </Button>
                                     </React.Fragment>
                                 ))}
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

    