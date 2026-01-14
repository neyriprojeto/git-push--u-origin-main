
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Minus, Plus, Palette, Image as ImageIcon, Type, Upload, Save, Loader2 } from 'lucide-react';
import { members } from '@/data/members';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { uploadArquivo } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';


type ElementStyle = {
    position: { top: number; left: number };
    size: { width?: number; height?: number; fontSize?: number };
    text?: string;
    fontWeight?: 'normal' | 'bold';
    src?: string; // Para imagens
    textAlign?: 'left' | 'center' | 'right';
};

type CardElements = {
    [key: string]: ElementStyle;
};

// This is to demonstate how to make and center a % aspect crop
// which is a good starting default.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const churchLogoPlaceholder = PlaceHolderImages.find((p) => p.id === 'church-banner');

const defaultElements: CardElements = {
    // --- Frente ---
    'Título 1': { position: { top: 5, left: 50 }, size: { fontSize: 20 }, text: 'ASSEMBLEIA DE DEUS', fontWeight: 'bold', textAlign: 'center' },
    'Título 2': { position: { top: 12, left: 50 }, size: { fontSize: 16 }, text: 'MINISTÉRIO KAIRÓS', fontWeight: 'bold', textAlign: 'center' },
    'Congregação': { position: { top: 18, left: 50 }, size: { fontSize: 14 }, text: 'SEDE', fontWeight: 'normal', textAlign: 'center' },
    'Endereço': { position: { top: 23, left: 50 }, size: { fontSize: 8 }, text: 'Rua Presidente Prudente, N°28\nEldorado, Diadema-SP', textAlign: 'center' },
    'Foto do Membro': { position: { top: 40, left: 15 }, size: { width: 80, height: 100 }, src: '' },
    'Nome': { position: { top: 60, left: 40 }, size: { fontSize: 11 }, text: `Nome: ${members[0].name}`, fontWeight: 'bold', textAlign: 'left' },
    'Nº Reg.': { position: { top: 68, left: 40 }, size: { fontSize: 10 }, text: `Nº Reg.: ${members[0].recordNumber}`, textAlign: 'left' },
    'RG': { position: { top: 68, left: 75 }, size: { fontSize: 10 }, text: `RG: ${members[0].rg}`, textAlign: 'left' },
    'CPF': { position: { top: 74, left: 40 }, size: { fontSize: 10 }, text: `CPF: ${members[0].cpf}`, textAlign: 'left' },
    'Data de Nascimento': { position: { top: 74, left: 75 }, size: { fontSize: 10 }, text: `Nasc: ${new Date(members[0].birthDate).toLocaleDateString('pt-BR')}`, textAlign: 'left' },
    'Cargo': { position: { top: 80, left: 40 }, size: { fontSize: 10 }, text: `Cargo: ${members[0].role}`, textAlign: 'left' },
    'Logo Igreja': { position: { top: 38, left: 80 }, size: { width: 70, height: 70 }, src: churchLogoPlaceholder?.imageUrl || '' },
    
    // --- Verso ---
    'Logo Convenção 1': { position: { top: 15, left: 25 }, size: { width: 80, height: 80 }, src: '' },
    'Logo Convenção 2': { position: { top: 15, left: 75 }, size: { width: 80, height: 80 }, src: '' },
    'QR Code': { position: { top: 45, left: 25 }, size: { width: 80, height: 80 }, src: '' },
    'Assinatura': { position: { top: 70, left: 65 }, size: { width: 150, height: 60 }, src: '' },
    'Assinatura Pastor': { position: { top: 82, left: 50 }, size: { fontSize: 10 }, text: 'Assinatura Pastor Presidente', textAlign: 'center' },
    'Validade': { position: { top: 88, left: 50 }, size: { fontSize: 10 }, text: 'Validade: 01/01/2026', fontWeight: 'bold', textAlign: 'center' },
    'Membro Desde': { position: { top: 93, left: 50 }, size: { fontSize: 10 }, text: `Membro desde: ${new Date(members[0].memberSince).toLocaleDateString('pt-BR')}`, fontWeight: 'bold', textAlign: 'center' },
};


export default function CardStudioPage() {
    const member = members[0]; // Using a sample member
    const { toast } = useToast();
    const firestore = useFirestore();
    const avatarPlaceholder = PlaceHolderImages.find((p) => p.id === member.avatar);
    const qrCodePlaceholder = PlaceHolderImages.find((p) => p.id === 'qr-code-placeholder');

    const templateRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'cardTemplates', 'default') : null),
        [firestore]
    );

    const { data: templateData, isLoading: isTemplateLoading } = useDoc(templateRef);

    const [isFront, setIsFront] = useState(true);

    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [aspect, setAspect] = useState<number | undefined>(undefined);
    const [imageToCrop, setImageToCrop] = useState('');
    const [croppingId, setCroppingId] = useState('');
    const [isCropping, setIsCropping] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    const fileInputRefs = {
        'Fundo (Frente)': useRef<HTMLInputElement>(null),
        'Fundo (Verso)': useRef<HTMLInputElement>(null),
        'Logo Igreja': useRef<HTMLInputElement>(null),
        'Logo Convenção 1': useRef<HTMLInputElement>(null),
        'Logo Convenção 2': useRef<HTMLInputElement>(null),
        'Assinatura': useRef<HTMLInputElement>(null),
        'Foto do Membro': useRef<HTMLInputElement>(null),
    };

    const [cardStyles, setCardStyles] = useState({
        frontBackground: '#F3F4F6',
        backBackground: '#F3F4F6',
        frontBackgroundImage: '',
        backBackgroundImage: '',
    });

     const [textColors, setTextColors] = useState({
        title: '#000000',
        personalData: '#333333',
        backText: '#333333',
    });


    const [elements, setElements] = useState<CardElements>(() => {
        const initialElements = {...defaultElements};
        if(initialElements['Foto do Membro']) {
            initialElements['Foto do Membro'].src = avatarPlaceholder?.imageUrl;
        }
        if(initialElements['QR Code']) {
            initialElements['QR Code'].src = qrCodePlaceholder?.imageUrl;
        }
        return initialElements;
    });
    
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef({ isDragging: false, elementId: '', initialMousePos: { x: 0, y: 0 }, initialElementPos: { top: 0, left: 0 } });
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (templateData) {
            setElements(templateData.elements || defaultElements);
            setCardStyles(templateData.cardStyles || { frontBackground: '#F3F4F6', backBackground: '#F3F4F6', frontBackgroundImage: '', backBackgroundImage: '' });
            setTextColors(templateData.textColors || { title: '#000000', personalData: '#333333', backText: '#333333' });
        }
    }, [templateData]);


    const handleSaveTemplate = async () => {
        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Erro de Conexão',
                description: 'Não foi possível conectar ao banco de dados. Tente novamente.',
            });
            return;
        }
        setIsSaving(true);
        try {
            const templateDataToSave = {
                elements,
                cardStyles,
                textColors,
                updatedAt: new Date().toISOString(),
            };
            if (templateRef) {
                await setDoc(templateRef, templateDataToSave);
                toast({
                    title: 'Sucesso!',
                    description: 'O template da carteirinha foi salvo com sucesso.',
                });
            }
        } catch (error) {
            console.error("Error saving template: ", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar o template. Verifique sua conexão e tente novamente.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleColorChange = (target: keyof typeof textColors | 'bg', value: string) => {
        if (target === 'bg') {
             if (isFront) {
                setCardStyles(prev => ({ ...prev, frontBackground: value }));
            } else {
                setCardStyles(prev => ({ ...prev, backBackground: value }));
            }
        } else {
            setTextColors(prev => ({ ...prev, [target]: value }));
        }
    };
    
    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const file = e.target.files?.[0];
        if (file) {
            setCrop(undefined) // Makes crop preview update between images.
            setScale(1);
            setRotate(0);
            setCurrentFile(file);
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageToCrop(reader.result?.toString() || '')
                setCroppingId(id);
                setIsCropping(true);

                if (id.startsWith('Fundo')) {
                    setAspect(85.6 / 54);
                } else if (id === 'Foto do Membro') {
                    const elSize = elements[id]?.size;
                    if (elSize?.width && elSize?.height) {
                        setAspect(elSize.width / elSize.height);
                    } else {
                        setAspect(1); // Square aspect for member photo
                    }
                }
                 else {
                    setAspect(undefined); // Free crop for logos and signature
                }
            })
            reader.readAsDataURL(file)
        }
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect) {
            const { width, height } = e.currentTarget
            setCrop(centerAspectCrop(width, height, aspect))
        }
    }

    const saveCroppedImage = async () => {
        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        if (!image || !canvas || !completedCrop) {
          toast({
            variant: 'destructive',
            title: 'Erro de Corte',
            description: 'Não foi possível processar a imagem cortada. Tente novamente.',
          });
          return;
        }

        setIsUploading(true);

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = Math.floor(completedCrop.width * scaleX);
        canvas.height = Math.floor(completedCrop.height * scaleY);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Could not get 2d context' });
          setIsUploading(false);
          return;
        }

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        ctx.drawImage(
            image,
            cropX,
            cropY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.restore();
        
       canvas.toBlob(async (blob) => {
            if (!blob || !currentFile) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Could not create blob' });
                setIsUploading(false);
                return;
            }
            try {
                const croppedFile = new File([blob], currentFile.name, { type: blob.type });
                const src = await uploadArquivo(croppedFile);
        
                if (croppingId === 'Fundo (Frente)') {
                    setCardStyles(prev => ({...prev, frontBackgroundImage: src}));
                } else if (croppingId === 'Fundo (Verso)') {
                    setCardStyles(prev => ({...prev, backBackgroundImage: src}));
                } else {
                    setElements(prev => ({
                        ...prev,
                        [croppingId]: { ...prev[croppingId], src }
                    }));
                }

                toast({ title: 'Sucesso', description: 'Imagem enviada com sucesso!' });
                setIsCropping(false);
                setImageToCrop('');
                setCroppingId('');
                setCurrentFile(null);
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Erro de Upload', description: 'Não foi possível enviar a imagem. Verifique seu `Cloud Name` e `Upload Preset` no Cloudinary.' });
            } finally {
                setIsUploading(false);
            }
       }, 'image/png');
    }

    
     const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleElementChange = (id: string, newText: string) => {
        setElements(prev => ({
            ...prev,
            [id]: { ...prev[id], text: newText }
        }));
    };
    
    const handleStyleChange = useCallback((property: 'position' | 'size', step: number, direction: 'up' | 'down' | 'left' | 'right' | 'increase' | 'decrease') => {
        if (!selectedElement) return;

        setElements(prev => {
            const currentElement = prev[selectedElement];
            if (!currentElement) return prev;

            const newElements = { ...prev };
            const newElementStyle = { ...currentElement };

            if (property === 'position') {
                const newPosition = { ...newElementStyle.position };
                if (direction === 'up') newPosition.top -= step;
                if (direction === 'down') newPosition.top += step;
                if (direction === 'left') newPosition.left -= step;
                if (direction === 'right') newPosition.left += step;
                newElementStyle.position = newPosition;
            } else if (property === 'size') {
                const newSize = { ...newElementStyle.size };
                const change = direction === 'increase' ? step : -step;
                
                if (newSize.fontSize) newSize.fontSize = Math.max(1, newSize.fontSize + change);
                if (newSize.width) newSize.width = Math.max(10, newSize.width + (change * 5));
                if (newSize.height) newSize.height = Math.max(10, newSize.height + (change * 5));
                newElementStyle.size = newSize;
            }
            
            newElements[selectedElement] = newElementStyle;
            return newElements;
        });
    }, [selectedElement]);

    const handleMouseDownOnElement = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedElement(id);

        if (cardRef.current) {
            const cardRect = cardRef.current.getBoundingClientRect();
            dragInfo.current = {
                isDragging: true,
                elementId: id,
                initialMousePos: { x: e.clientX, y: e.clientY },
                initialElementPos: { ...elements[id].position },
            };
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragInfo.current.isDragging || !cardRef.current) return;

        const { elementId, initialMousePos, initialElementPos } = dragInfo.current;
        const cardRect = cardRef.current.getBoundingClientRect();

        const deltaX = e.clientX - initialMousePos.x;
        const deltaY = e.clientY - initialMousePos.y;

        const deltaTop = (deltaY / cardRect.height) * 100;
        const deltaLeft = (deltaX / cardRect.width) * 100;

        setElements(prev => {
            const newElements = { ...prev };
            const currentElement = newElements[elementId];
            if (!currentElement) return prev;

            const newPosition = {
                top: initialElementPos.top + deltaTop,
                left: initialElementPos.left + deltaLeft,
            };

            newElements[elementId] = { ...currentElement, position: newPosition };
            return newElements;
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        dragInfo.current.isDragging = false;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    const startMoving = (property: 'position' | 'size', step: number, direction: 'up' | 'down' | 'left' | 'right' | 'increase' | 'decrease') => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleStyleChange(property, step, direction); // Move once immediately
        intervalRef.current = setInterval(() => {
            handleStyleChange(property, step, direction);
        }, 100);
    };

    const stopMoving = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };


    const renderElement = (id: string) => {
        const el = elements[id];
        if (!el) return null;
        
        const isImage = 'src' in el;
        const isText = 'text' in el;

        let color = '#000000';
        if (isText) {
            const isTitle = id.includes('Título') || id === 'Congregação' || id === 'Endereço';
            const isBackText = id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde');
            
            if (isTitle) {
                color = textColors.title;
            } else if (isBackText) {
                color = textColors.backText;
            } else {
                color = textColors.personalData;
            }
        }


        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${el.position.top}%`,
            left: `${el.position.left}%`,
            userSelect: 'none', // Prevent text selection while dragging
        };

        if (el.textAlign === 'center') {
             style.transform = 'translateX(-50%)';
        } else if (el.textAlign === 'right') {
            style.transform = 'translateX(-100%)';
             style.paddingRight = '10px';
        } else {
            // No transform for left-aligned text, it starts at the 'left' value
        }
        
        if (isText) {
            style.fontSize = el.size.fontSize ? `${el.size.fontSize}px` : undefined;
            style.color = color;
            style.fontWeight = el.fontWeight;
            style.textAlign = el.textAlign;
            style.whiteSpace = 'pre-wrap';

            if (id.includes('Título') || id === 'Nome' || id.includes('Assinatura Pastor') || id.includes('Validade') || id.includes('Membro Desde')) {
                style.whiteSpace = 'nowrap';
            }
        } else { // isImage
             style.width = el.size.width ? `${el.size.width}px` : 'auto';
             style.height = el.size.height ? `${el.size.height}px` : 'auto';
        }
        
        const className = cn(
            "cursor-grab active:cursor-grabbing",
            { "ring-2 ring-blue-500 rounded p-0.5": selectedElement === id },
        );

        if (isImage) {
             if (!el.src) {
                return (
                    <div
                        style={style}
                        onMouseDown={(e) => handleMouseDownOnElement(e, id)}
                        draggable={false}
                        className={cn(className, "border-2 border-dashed bg-gray-200/50 flex items-center justify-center")}
                    >
                       <span className='text-xs text-gray-500 text-center p-1'>{id}</span>
                    </div>
                )
            }
            const objectFitStyle: React.CSSProperties = {
                objectFit: id === 'Foto do Membro' ? 'cover' : 'contain'
            };
            return (
                 <div
                    style={style}
                    onMouseDown={(e) => handleMouseDownOnElement(e, id)}
                    draggable={false}
                    className={cn(className, "relative")}
                >
                    <Image
                        src={el.src}
                        alt={id}
                        fill
                        style={objectFitStyle}
                        className={cn({ 'rounded-md': id !== 'Assinatura'})}
                        draggable={false}
                    />
                </div>
            )
        }

        return (
            <p
                onMouseDown={(e) => handleMouseDownOnElement(e, id)}
                draggable={false}
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
        return `${size.toFixed(0)} ${elements[selectedElement]?.size.fontSize ? 'px' : 'px'}`
    }


  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className='flex items-center gap-2'>
              <SidebarTrigger className="md:hidden" />
              <h2 className="text-3xl font-bold tracking-tight">Estúdio de Carteirinha</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveTemplate} disabled={isSaving || isTemplateLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
              <CardContent className='p-4 bg-muted/30'>
                  <div className='flex flex-col items-center gap-4'>
                      {/* Adjustment Controls */}
                      <div className='w-full max-w-lg flex flex-col items-center gap-4 p-4 border rounded-lg bg-background'>
                          <p className="text-sm font-medium text-center">
                              Ajustando: <span className={cn("font-bold", { "text-primary": selectedElement })}>{selectedElement || "Nenhum"}</span>
                          </p>
                          <Separator />
                           <div className='flex flex-col sm:flex-row items-center gap-4'>
                                <div className='flex flex-col items-center gap-2'>
                                  <p className="text-sm font-medium">Posição</p>
                                  <div className='flex items-center gap-2'>
                                      <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'up')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowUp className="w-4 h-4" /></Button>
                                      <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'down')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowDown className="w-4 h-4" /></Button>
                                      <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'left')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowLeft className="w-4 h-4" /></Button>
                                      <Button variant="outline" size="icon" onMouseDown={() => startMoving('position', 1, 'right')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><ArrowRight className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                                <Separator orientation='vertical' className='h-16 hidden sm:block'/>
                                <div className='flex flex-col items-center gap-2'>
                                  <p className="text-sm font-medium">Tamanho</p>
                                  <div className='flex items-center gap-2'>
                                      <Button variant="outline" size="icon" onMouseDown={() => startMoving('size', 1, 'decrease')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><Minus className="w-4 h-4" /></Button>
                                      <span className="text-sm font-semibold w-16 text-center">{getSelectedElementSize()}</span>
                                      <Button variant="outline" size="icon" onMouseDown={() => startMoving('size', 1, 'increase')} onMouseUp={stopMoving} onMouseLeave={stopMoving} disabled={!selectedElement}><Plus className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                           </div>
                      </div>

                      {isTemplateLoading ? (
                        <div className="aspect-[85.6/54] w-full max-w-lg mx-auto rounded-lg shadow-md relative bg-gray-200 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div 
                            ref={cardRef}
                            className="aspect-[85.6/54] w-full max-w-lg mx-auto rounded-lg shadow-md relative"
                            style={{ 
                                backgroundColor: isFront ? cardStyles.frontBackground : cardStyles.backBackground,
                                backgroundImage: `url(${isFront ? cardStyles.frontBackgroundImage : cardStyles.backBackgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                            onMouseDown={() => setSelectedElement(null)} // Deselect when clicking on the card background
                        >
                            {isFront ? (
                                <div className='relative h-full w-full'>
                                    {/* Render all front elements individually */}
                                    {Object.keys(elements)
                                        .filter(id => !id.includes('Convenção') && !id.includes('QR Code') && !id.includes('Assinatura') && !id.includes('Validade') && !id.includes('Membro Desde'))
                                        .map(id => <React.Fragment key={id}>{renderElement(id)}</React.Fragment>)}
                                </div>
                            ) : (
                                <div className='relative h-full w-full'>
                                    {/* Render all back elements individually */}
                                    {Object.keys(elements)
                                        .filter(id => id.includes('Convenção') || id.includes('QR Code') || id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde'))
                                        .map(id => <React.Fragment key={id}>{renderElement(id)}</React.Fragment>)}
                                    <div 
                                        style={{
                                            position: 'absolute', 
                                            borderTop: '1px solid black', 
                                            width: '40%', 
                                            top: `calc(${elements['Assinatura Pastor']?.position.top}% - 2px)`,
                                            left: `${elements['Assinatura Pastor']?.position.left}%`,
                                            transform: 'translateX(-50%)'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                      )}

                      <div className='flex gap-2'>
                          <Button variant={isFront ? 'default' : 'outline'} onClick={() => setIsFront(true)}>Frente</Button>
                          <Button variant={!isFront ? 'default' : 'outline'} onClick={() => setIsFront(false)}>Verso</Button>
                      </div>
                  </div>
              </CardContent>
          </Card>
          <div className='flex flex-wrap gap-2 justify-center pt-4'>
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
                                      <Input id="title1" value={elements['Título 1']?.text || ''} onChange={(e) => handleElementChange('Título 1', e.target.value)} className="col-span-2 h-8" />
                                  </div>
                                  <div className="grid grid-cols-3 items-center gap-4">
                                      <Label htmlFor="title2">Título 2</Label>
                                      <Input id="title2" value={elements['Título 2']?.text || ''} onChange={(e) => handleElementChange('Título 2', e.target.value)} className="col-span-2 h-8" />
                                  </div>
                                  <div className="grid grid-cols-3 items-center gap-4">
                                      <Label htmlFor="congregacao">Congregação</Label>
                                      <Input id="congregacao" value={elements['Congregação']?.text || ''} onChange={(e) => handleElementChange('Congregação', e.target.value)} className="col-span-2 h-8" />
                                  </div>
                                  <div className="grid grid-cols-3 items-center gap-4">
                                      <Label htmlFor="address">Endereço</Label>
                                      <Input id="address" value={elements['Endereço']?.text || ''} onChange={(e) => handleElementChange('Endereço', e.target.value)} className="col-span-2 h-8" />
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
                                  <div className="grid gap-4">
                                      <div className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor="color-title">Títulos e Endereço</Label>
                                          <Input id="color-title" type="color" value={textColors.title} onChange={(e) => handleColorChange('title', e.target.value)} className="col-span-2 h-8 p-1" />
                                      </div>
                                      <div className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor="color-personal">Dados Pessoais (Frente)</Label>
                                          <Input id="color-personal" type="color" value={textColors.personalData} onChange={(e) => handleColorChange('personalData', e.target.value)} className="col-span-2 h-8 p-1" />
                                      </div>
                                      <div className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor="color-back">Textos (Verso)</Label>
                                          <Input id="color-back" type="color" value={textColors.backText} onChange={(e) => handleColorChange('backText', e.target.value)} className="col-span-2 h-8 p-1" />
                                      </div>
                                      <Separator />
                                      <div className="grid grid-cols-3 items-center gap-4">
                                          <Label htmlFor="color-bg">Cor do Fundo</Label>
                                          <Input id="color-bg" type="color" value={isFront ? cardStyles.frontBackground : cardStyles.backBackground} onChange={(e) => handleColorChange('bg', e.target.value)} className="col-span-2 h-8 p-1" />
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
                                          onChange={(e) => onSelectFile(e, key)}
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
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
          <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Editar Imagem</DialogTitle>
              </DialogHeader>
                <div className='flex items-center justify-center p-4 bg-muted/20'>
                    {!!imageToCrop && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            className='max-w-full'
                        >
                            <Image
                                ref={imgRef}
                                alt="Crop me"
                                src={imageToCrop}
                                style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                                onLoad={onImageLoad}
                                width={800}
                                height={600}
                                className="max-h-[60vh] object-contain"
                            />
                        </ReactCrop>
                    )}
                </div>
                 <div>
                    <Label>Zoom</Label>
                    <Slider
                        defaultValue={[1]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(value) => setScale(value[0])}
                    />
                </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCropping(false)}>Cancelar</Button>
                  <Button onClick={saveCroppedImage} disabled={isUploading}>
                    {isUploading ? 'Salvando...' : 'Salvar Imagem'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {/* This canvas is not displayed and is used for image processing. */}
      <canvas
        ref={previewCanvasRef}
        style={{
            display: 'none',
            objectFit: 'contain',
        }}
      />
    </>
  );
}

    