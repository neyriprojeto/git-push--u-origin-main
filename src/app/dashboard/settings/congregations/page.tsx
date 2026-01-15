
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { addCongregacao, deleteCongregacao, updateCongregacao } from '@/firebase/firestore/mutations';
import { Trash2, Save, Loader2, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, doc, setDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import Image from 'next/image';
import 'react-image-crop/dist/ReactCrop.css';
import { uploadArquivo } from '@/lib/cloudinary';

type Congregacao = {
  id: string;
  nome: string;
  endereco?: string;
};

type ChurchInfo = {
    id?: string;
    pastorName?: string;
    pastoralMessage?: string;
    aboutUs?: string;
    bannerImageUrl?: string;
    pastorImageUrl?: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

export default function CongregationsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [newCongregacao, setNewCongregacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const congregacoesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'congregacoes') : null),
    [firestore]
  );
  const { data: congregacoes, isLoading: loading } = useCollection<Congregacao>(congregacoesCollection);
  
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  // Church Info State
  const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
  const { data: churchInfoData, isLoading: loadingChurchInfo } = useDoc<ChurchInfo>(churchInfoRef);
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>({});
  const [isSavingChurchInfo, setIsSavingChurchInfo] = useState(false);

  // Image Cropping State
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [imageToCrop, setImageToCrop] = useState('');
  const [croppingId, setCroppingId] = useState('');
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (churchInfoData) {
      setChurchInfo(churchInfoData);
    }
  }, [churchInfoData]);


  const handleAddressChange = (id: string, value: string) => {
    setAddresses(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAddress = async (id: string) => {
    if (!firestore) return;
    const address = addresses[id];
    if (typeof address === 'undefined') return;

    try {
      await updateCongregacao(firestore, id, { endereco: address });
      toast({
        title: 'Sucesso!',
        description: 'Endereço da congregação atualizado.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar o endereço.',
      });
    }
  };

  const handleAddCongregacao = async () => {
    if (!firestore || newCongregacao.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O nome da congregação não pode estar vazio.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addCongregacao(firestore, newCongregacao);
      setNewCongregacao('');
      toast({
        title: 'Sucesso!',
        description: 'Nova congregação adicionada.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar',
        description: error.message || 'Não foi possível adicionar a congregação.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCongregacao = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteCongregacao(firestore, id);
      toast({
        title: 'Sucesso!',
        description: 'Congregação removida.',
      });
    } catch (error: any) {
         toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: error.message || 'Não foi possível remover a congregação.',
      });
    }
  }

  const handleSaveChurchInfo = async () => {
    if (!churchInfoRef) return;
    setIsSavingChurchInfo(true);
    try {
        await setDoc(churchInfoRef, churchInfo, { merge: true });
        toast({ title: 'Sucesso!', description: 'Informações da igreja atualizadas.' });
    } catch (error) {
        console.error("Error saving church info:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar as informações.' });
    } finally {
        setIsSavingChurchInfo(false);
    }
  };

  const handleChurchInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChurchInfo(prev => ({ ...prev, [name]: value }));
  }

  const triggerFileInput = (id: string, cropAspect: number | undefined) => {
    setCroppingId(id);
    setAspect(cropAspect);
    fileInputRef.current?.click();
  }

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setCrop(undefined)
        setCurrentFile(file);
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setImageToCrop(reader.result?.toString() || '')
            setIsCropping(true);
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
      toast({ variant: 'destructive', title: 'Erro de Corte' });
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
    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, canvas.width, canvas.height);
    
   canvas.toBlob(async (blob) => {
        if (!blob || !currentFile) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Could not create blob' });
            setIsUploading(false);
            return;
        }
        try {
            const croppedFile = new File([blob], currentFile.name, { type: blob.type });
            const src = await uploadArquivo(croppedFile);
    
            setChurchInfo(prev => ({...prev, [croppingId]: src }));

            toast({ title: 'Sucesso', description: 'Imagem enviada! Clique em "Salvar Informações" para aplicar.' });
            setIsCropping(false);
            setImageToCrop('');
            setCroppingId('');
            setCurrentFile(null);
        } catch (error: any) {
            console.error(error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro de Upload', 
                description: `Não foi possível enviar a imagem. Erro: ${error.message}`
            });
        } finally {
            setIsUploading(false);
        }
   }, 'image/png');
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                    <CardDescription>Gerencie as informações e aparências da sua igreja.</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Informações da Página Inicial</CardTitle>
                    <CardDescription>Edite os textos que aparecem na página de entrada do seu site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingChurchInfo ? (
                         <div className="flex justify-center p-8"> <Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="pastorName">Nome do Pastor Presidente</Label>
                                <Input id="pastorName" name="pastorName" value={churchInfo.pastorName || ''} onChange={handleChurchInfoChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="aboutUs">Sobre a Nossa Igreja</Label>
                                <Textarea id="aboutUs" name="aboutUs" value={churchInfo.aboutUs || ''} onChange={handleChurchInfoChange} placeholder="Fale um pouco sobre a missão e visão da igreja..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pastoralMessage">Palavra Pastoral</Label>
                                <Textarea id="pastoralMessage" name="pastoralMessage" value={churchInfo.pastoralMessage || ''} onChange={handleChurchInfoChange} placeholder="Deixe uma mensagem de fé e esperança..." />
                            </div>
                             <div className="space-y-2">
                                <Label>Imagens Principais</Label>
                                <div className='flex flex-wrap gap-2'>
                                    <input type="file" ref={fileInputRef} onChange={onSelectFile} className="hidden" accept="image/*"/>
                                    <Button variant="outline" onClick={() => triggerFileInput('bannerImageUrl', 16/9)}>
                                        <Upload className="mr-2 h-4 w-4"/> Banner da Igreja
                                    </Button>
                                    <Button variant="outline" onClick={() => triggerFileInput('pastorImageUrl', 1/1)}>
                                        <Upload className="mr-2 h-4 w-4"/> Foto do Pastor
                                    </Button>
                                </div>
                                <div className='flex flex-wrap gap-4 mt-4'>
                                    {churchInfo.bannerImageUrl && <div><Label className='text-xs'>Banner Atual</Label><Image src={churchInfo.bannerImageUrl} alt="Banner" width={200} height={112} className="rounded-md border object-cover"/></div>}
                                    {churchInfo.pastorImageUrl && <div><Label className='text-xs'>Foto Atual</Label><Image src={churchInfo.pastorImageUrl} alt="Pastor" width={100} height={100} className="rounded-full border object-cover"/></div>}
                                </div>
                            </div>
                            <Button onClick={handleSaveChurchInfo} disabled={isSavingChurchInfo}>
                                {isSavingChurchInfo ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {isSavingChurchInfo ? 'Salvando...' : 'Salvar Informações'}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Gerenciar Congregações</CardTitle>
                <CardDescription>Adicione ou remova congregações e gerencie seus endereços.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Nome da nova congregação"
                    value={newCongregacao}
                    onChange={(e) => setNewCongregacao(e.target.value)}
                    disabled={isSubmitting}
                />
                <Button onClick={handleAddCongregacao} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Adicionar'}
                </Button>
                </div>
                 {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                    ) : congregacoes && congregacoes.length === 0 ? (
                        <p className="text-muted-foreground text-center p-4">Nenhuma congregação cadastrada.</p>
                    ) : (
                    <ul className="space-y-4 pt-4">
                        {congregacoes?.map((c) => (
                        <li key={c.id} className="flex flex-col gap-2 p-4 border rounded-md">
                            <div className='flex items-center justify-between'>
                            <span className="font-medium">{c.nome}</span>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso removerá permanentemente a congregação.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCongregacao(c.id)} className="bg-destructive hover:bg-destructive/90">
                                    Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </div>
                            <div className="space-y-2">
                                <Textarea
                                placeholder="Digite o endereço da congregação..."
                                value={addresses[c.id] ?? c.endereco ?? ''}
                                onChange={(e) => handleAddressChange(c.id, e.target.value)}
                                />
                                <Button size="sm" onClick={() => handleSaveAddress(c.id)} disabled={typeof addresses[c.id] === 'undefined'}>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Endereço
                                </Button>
                            </div>
                        </li>
                        ))}
                    </ul>
                    )}
            </CardContent>
            </Card>
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
                                onLoad={onImageLoad}
                                width={800}
                                height={600}
                                className="max-h-[60vh] object-contain"
                            />
                        </ReactCrop>
                    )}
                </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCropping(false)}>Cancelar</Button>
                  <Button onClick={saveCroppedImage} disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin mr-2"/> : null}
                    {isUploading ? 'Enviando...' : 'Salvar Imagem'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
    </>
  );
}
