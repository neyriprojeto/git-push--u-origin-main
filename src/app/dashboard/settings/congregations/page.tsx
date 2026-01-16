'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { addCongregacao, deleteCongregacao, updateCongregacao, addLeader, updateLeader, deleteLeader } from '@/firebase/firestore/mutations';
import { Trash2, Save, Loader2, Upload, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, doc, setDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import Image from 'next/image';
import 'react-image-crop/dist/ReactCrop.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';

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
    pastorSignatureUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    websiteUrl?: string;
    radioUrl?: string;
    radioPageUrl?: string;
    conventionLogo1Url?: string;
    conventionLogo2Url?: string;
    baptismCertBgUrl?: string;
    baptismCertLogoUrl?: string;
    presentationCertBgUrl?: string;
    presentationCertLogoUrl?: string;
}

type Leader = {
  id: string;
  name: string;
  role: string;
  email?: string;
  imageUrl?: string;
  order?: number;
};


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
  
  const congregacoesCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'congregacoes') : null), [firestore]);
  const { data: congregacoes, isLoading: loadingCongregacoes } = useCollection<Congregacao>(congregacoesCollection);
  
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  // Church Info State
  const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
  const { data: churchInfoData, isLoading: loadingChurchInfo } = useDoc<ChurchInfo>(churchInfoRef);
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>({});
  const [isSavingChurchInfo, setIsSavingChurchInfo] = useState(false);
  const [isSavingLetterConfig, setIsSavingLetterConfig] = useState(false);

  // Leader State
  const leadersCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'leaders') : null), [firestore]);
  const { data: leadersData, isLoading: loadingLeaders } = useCollection<Leader>(leadersCollection);
  const [displayLeaders, setDisplayLeaders] = useState<Leader[]>([]);
  const [newLeader, setNewLeader] = useState({ name: '', role: '', email: '' });
  const [isAddLeaderOpen, setIsAddLeaderOpen] = useState(false);
  const [savingLeaderId, setSavingLeaderId] = useState<string | null>(null);

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
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  useEffect(() => {
    if (churchInfoData) setChurchInfo(churchInfoData);
  }, [churchInfoData]);

  useEffect(() => {
    if (leadersData) {
      const sorted = [...leadersData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setDisplayLeaders(sorted);
    }
  }, [leadersData]);

  const handleAddressChange = (id: string, value: string) => {
    setAddresses(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAddress = async (id: string) => {
    if (!firestore) return;
    const address = addresses[id];
    if (typeof address === 'undefined') return;

    try {
      await updateCongregacao(firestore, id, { endereco: address });
      toast({ title: 'Sucesso!', description: 'Endereço da congregação atualizado.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message || 'Não foi possível salvar o endereço.' });
    }
  };

  const handleAddCongregacao = async () => {
    if (!firestore || newCongregacao.trim() === '') {
      toast({ variant: 'destructive', title: 'Erro', description: 'O nome da congregação não pode estar vazio.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addCongregacao(firestore, newCongregacao);
      setNewCongregacao('');
      toast({ title: 'Sucesso!', description: 'Nova congregação adicionada.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar', description: error.message || 'Não foi possível adicionar a congregação.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCongregacao = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteCongregacao(firestore, id);
      toast({ title: 'Sucesso!', description: 'Congregação removida.' });
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Erro ao remover', description: error.message || 'Não foi possível remover a congregação.' });
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
  
  const handleSaveLetterConfig = async () => {
    if (!churchInfoRef) return;
    setIsSavingLetterConfig(true);
    try {
        // Save logos and signature to churchInfo
        await setDoc(churchInfoRef, churchInfo, { merge: true });

        toast({ title: 'Sucesso!', description: 'Configurações da carta atualizadas.' });
    } catch (error) {
        console.error("Error saving letter config:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar as configurações.' });
    } finally {
        setIsSavingLetterConfig(false);
    }
  };


  const handleLeaderFieldChange = (id: string, field: keyof Omit<Leader, 'id' | 'imageUrl'>, value: string | number) => {
    setDisplayLeaders(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSaveLeader = async (id: string) => {
    if (!firestore) return;
    const leaderData = displayLeaders.find(l => l.id === id);
    if (!leaderData) return;
    
    setSavingLeaderId(id);
    try {
        const { id: leaderId, ...dataToSave } = leaderData;
        await updateLeader(firestore, leaderId, {
            ...dataToSave,
            order: Number(dataToSave.order) || 0,
        });
        toast({ title: 'Sucesso!', description: 'Líder atualizado.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o líder.' });
    } finally {
        setSavingLeaderId(null);
    }
  };

  const handleAddNewLeader = async () => {
    if (!firestore || !newLeader.name || !newLeader.role) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nome e Cargo são obrigatórios.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addLeader(firestore, { ...newLeader, order: displayLeaders.length });
      setNewLeader({ name: '', role: '', email: '' });
      setIsAddLeaderOpen(false);
      toast({ title: 'Sucesso!', description: 'Novo líder adicionado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar', description: 'Não foi possível adicionar o líder.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteLeader = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteLeader(firestore, id);
      toast({ title: 'Sucesso!', description: 'Líder removido.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: 'Não foi possível remover o líder.' });
    }
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
    if (!image || !canvas || !completedCrop || !firestore) {
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
    
            if (croppingId.startsWith('leader-')) {
                const leaderId = croppingId.substring('leader-'.length);
                await updateLeader(firestore, leaderId, { imageUrl: src });
                toast({ title: 'Sucesso!', description: 'Foto do líder atualizada.' });
            } else {
                 setChurchInfo(prev => ({...prev, [croppingId]: src }));
                 toast({ title: 'Sucesso', description: 'Imagem enviada! Clique no botão de salvar correspondente para aplicar.' });
            }

            setIsCropping(false);
            setImageToCrop('');
            setCroppingId('');
            setCurrentFile(null);
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erro de Upload', description: `Não foi possível enviar a imagem. Erro: ${error.message}` });
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
                    <CardDescription>Edite os textos e imagens que aparecem na página de entrada do seu site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingChurchInfo ? (
                         <div className="flex justify-center p-8"> <Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 gap-4 items-start">
                                <div className="space-y-2">
                                    <Label htmlFor="pastorName">Nome do Pastor Presidente</Label>
                                    <Input id="pastorName" name="pastorName" value={churchInfo.pastorName || ''} onChange={handleChurchInfoChange} />
                                </div>
                                <div className="space-y-2">
                                     <Label>Assinatura Digital</Label>
                                    <div className='flex items-center gap-4'>
                                        <Button variant="outline" onClick={() => triggerFileInput('pastorSignatureUrl', undefined)}>
                                            <Upload className="mr-2 h-4 w-4"/> Assinatura Pr. Presidente
                                        </Button>
                                        {churchInfo.pastorSignatureUrl && <div className="h-[60px] w-[120px] rounded-md border p-1 bg-slate-100"><Image src={churchInfo.pastorSignatureUrl} alt="Assinatura" width={120} height={60} className="object-contain"/></div>}
                                    </div>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-2">
                                <Label htmlFor="aboutUs">Sobre a Nossa Igreja</Label>
                                <Textarea id="aboutUs" name="aboutUs" value={churchInfo.aboutUs || ''} onChange={handleChurchInfoChange} placeholder="Fale um pouco sobre a missão e visão da igreja..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pastoralMessage">Palavra Pastoral</Label>
                                <Textarea id="pastoralMessage" name="pastoralMessage" value={churchInfo.pastoralMessage || ''} onChange={handleChurchInfoChange} placeholder="Deixe uma mensagem de fé e esperança..." />
                            </div>
                             <Separator className="my-4" />
                            <div className="space-y-2">
                                <Label>Imagens da Igreja e Convenções</Label>
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
                                {isSavingChurchInfo ? 'Salvando...' : 'Salvar Informações da Página'}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Links e Mídia</CardTitle>
                    <CardDescription>Configure os links para redes sociais e rádio que aparecem no site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingChurchInfo ? (
                        <div className="flex justify-center p-8"> <Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className='space-y-4'>
                            <div className="space-y-2">
                                <Label htmlFor="instagramUrl">Link do Instagram</Label>
                                <Input id="instagramUrl" name="instagramUrl" value={churchInfo.instagramUrl || ''} onChange={handleChurchInfoChange} placeholder="https://instagram.com/seu_perfil" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="youtubeUrl">Link do YouTube</Label>
                                <Input id="youtubeUrl" name="youtubeUrl" value={churchInfo.youtubeUrl || ''} onChange={handleChurchInfoChange} placeholder="https://youtube.com/seu_canal" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="websiteUrl">Link do Site</Label>
                                <Input id="websiteUrl" name="websiteUrl" value={churchInfo.websiteUrl || ''} onChange={handleChurchInfoChange} placeholder="https://seu_site.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="radioUrl">Link do Player da Rádio (embutido)</Label>
                                <Input id="radioUrl" name="radioUrl" value={churchInfo.radioUrl || ''} onChange={handleChurchInfoChange} placeholder="https://link_do_player_embutido" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="radioPageUrl">Link da Página da Rádio (nova aba)</Label>
                                <Input id="radioPageUrl" name="radioPageUrl" value={churchInfo.radioPageUrl || ''} onChange={handleChurchInfoChange} placeholder="https://link_da_pagina_da_radio" />
                            </div>
                            <Button onClick={handleSaveChurchInfo} disabled={isSavingChurchInfo}>
                                {isSavingChurchInfo ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {isSavingChurchInfo ? 'Salvando...' : 'Salvar Links'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configurações da Carta de Recomendação</CardTitle>
                    <CardDescription>Configure os logos para a carta de recomendação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingChurchInfo ? (
                         <div className="flex justify-center p-8"> <Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Imagens do Documento</Label>
                                <div className='flex flex-wrap gap-2'>
                                    <Button variant="outline" onClick={() => triggerFileInput('conventionLogo1Url', undefined)}>
                                        <Upload className="mr-2 h-4 w-4"/> Logo Esquerda (Cabeçalho)
                                    </Button>
                                    <Button variant="outline" onClick={() => triggerFileInput('conventionLogo2Url', undefined)}>
                                        <Upload className="mr-2 h-4 w-4"/> Logo Direita (Cabeçalho)
                                    </Button>
                                </div>
                            </div>
                             <div className='flex flex-wrap gap-4 mt-4'>
                                {churchInfo.conventionLogo1Url && <div><Label className='text-xs'>Logo Esquerda</Label><Image src={churchInfo.conventionLogo1Url} alt="Logo Convenção 1" width={100} height={100} className="rounded-md border object-contain p-2"/></div>}
                                {churchInfo.conventionLogo2Url && <div><Label className='text-xs'>Logo Direita</Label><Image src={churchInfo.conventionLogo2Url} alt="Logo Convenção 2" width={100} height={100} className="rounded-md border object-contain p-2"/></div>}
                            </div>
                             <Button onClick={handleSaveChurchInfo} disabled={isSavingChurchInfo}>
                                {isSavingChurchInfo ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {isSavingChurchInfo ? 'Salvando...' : 'Salvar Configurações da Carta'}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configurações do Certificado de Batismo</CardTitle>
                    <CardDescription>Configure o fundo e o logo para o certificado de batismo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingChurchInfo ? (
                        <div className="flex justify-center p-8"> <Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Imagens do Certificado</Label>
                                <div className='flex flex-wrap gap-2'>
                                    <Button variant="outline" onClick={() => triggerFileInput('baptismCertBgUrl', 297/210)}>
                                        <Upload className="mr-2 h-4 w-4"/> Trocar Fundo
                                    </Button>
                                    <Button variant="outline" onClick={() => triggerFileInput('baptismCertLogoUrl', undefined)}>
                                        <Upload className="mr-2 h-4 w-4"/> Trocar Logo
                                    </Button>
                                </div>
                            </div>
                                <div className='flex flex-wrap gap-4 mt-4'>
                                {churchInfo.baptismCertBgUrl && <div><Label className='text-xs'>Fundo Atual</Label><Image src={churchInfo.baptismCertBgUrl} alt="Fundo do Certificado" width={297/2} height={210/2} className="rounded-md border object-cover p-2"/></div>}
                                {churchInfo.baptismCertLogoUrl && <div><Label className='text-xs'>Logo Atual</Label><Image src={churchInfo.baptismCertLogoUrl} alt="Logo do Certificado" width={100} height={100} className="rounded-md border object-contain p-2"/></div>}
                            </div>
                                <Button onClick={handleSaveChurchInfo} disabled={isSavingChurchInfo}>
                                {isSavingChurchInfo ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {isSavingChurchInfo ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configurações do Certificado de Apresentação</CardTitle>
                    <CardDescription>Configure o fundo e o logo para o certificado de apresentação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingChurchInfo ? (
                        <div className="flex justify-center p-8"> <Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Imagens do Certificado</Label>
                                <div className='flex flex-wrap gap-2'>
                                    <Button variant="outline" onClick={() => triggerFileInput('presentationCertBgUrl', 297/210)}>
                                        <Upload className="mr-2 h-4 w-4"/> Fundo do Certificado
                                    </Button>
                                    <Button variant="outline" onClick={() => triggerFileInput('presentationCertLogoUrl', undefined)}>
                                        <Upload className="mr-2 h-4 w-4"/> Logo do Certificado
                                    </Button>
                                </div>
                            </div>
                            <div className='flex flex-wrap gap-4 mt-4'>
                                {churchInfo.presentationCertBgUrl && <div><Label className='text-xs'>Fundo Atual</Label><Image src={churchInfo.presentationCertBgUrl} alt="Fundo do Certificado de Apresentação" width={297/2} height={210/2} className="rounded-md border object-cover p-2"/></div>}
                                {churchInfo.presentationCertLogoUrl && <div><Label className='text-xs'>Logo Atual</Label><Image src={churchInfo.presentationCertLogoUrl} alt="Logo do Certificado de Apresentação" width={100} height={100} className="rounded-md border object-contain p-2"/></div>}
                            </div>
                            <Button onClick={handleSaveChurchInfo} disabled={isSavingChurchInfo}>
                                {isSavingChurchInfo ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {isSavingChurchInfo ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Comissão Executiva</CardTitle>
                    <CardDescription>Adicione, edite ou remova os líderes exibidos na página inicial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Dialog open={isAddLeaderOpen} onOpenChange={setIsAddLeaderOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Adicionar Líder</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Adicionar Novo Líder</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-leader-name">Nome</Label>
                                    <Input id="new-leader-name" value={newLeader.name} onChange={(e) => setNewLeader(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-leader-role">Cargo / Função</Label>
                                    <Input id="new-leader-role" value={newLeader.role} onChange={(e) => setNewLeader(p => ({ ...p, role: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-leader-email">Email (Opcional)</Label>
                                    <Input id="new-leader-email" type="email" value={newLeader.email || ''} onChange={(e) => setNewLeader(p => ({ ...p, email: e.target.value }))} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddLeaderOpen(false)}>Cancelar</Button>
                                <Button onClick={handleAddNewLeader} disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {loadingLeaders ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : displayLeaders && displayLeaders.length > 0 ? (
                        <ul className="space-y-4 pt-4">
                            {displayLeaders.map(leader => (
                                <li key={leader.id} className="p-4 border rounded-md space-y-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="w-16 h-16 border">
                                            <AvatarImage src={leader.imageUrl || PlaceHolderImages.find(p => p.id === 'member-avatar-1')?.imageUrl} />
                                            <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow space-y-2">
                                            <Input value={leader.name} onChange={(e) => handleLeaderFieldChange(leader.id, 'name', e.target.value)} placeholder="Nome do Líder"/>
                                            <Input value={leader.role} onChange={(e) => handleLeaderFieldChange(leader.id, 'role', e.target.value)} placeholder="Cargo / Função"/>
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <Input value={leader.email || ''} onChange={(e) => handleLeaderFieldChange(leader.id, 'email', e.target.value)} placeholder="email@opcional.com" className="sm:col-span-2" />
                                        <Input type="number" value={leader.order ?? ''} onChange={(e) => handleLeaderFieldChange(leader.id, 'order', Number(e.target.value))} placeholder="Ordem" />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => triggerFileInput(`leader-${leader.id}`, 1/1)}><Upload className="mr-2 h-4 w-4"/> Foto</Button>
                                        <Button size="sm" onClick={() => handleSaveLeader(leader.id)} disabled={savingLeaderId === leader.id}>
                                            {savingLeaderId === leader.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                            Salvar
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Remover Líder?</AlertDialogTitle><AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteLeader(leader.id)}>Remover</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center p-4">Nenhum líder cadastrado.</p>
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
                 {loadingCongregacoes ? (
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
          <DialogContent className="w-full max-w-sm sm:max-w-lg md:max-w-xl max-h-[90dvh] overflow-y-auto">
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
