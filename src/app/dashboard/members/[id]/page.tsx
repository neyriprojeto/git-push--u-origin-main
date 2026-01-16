
'use client';

import { notFound, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppLogo } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, FileText, MessageSquare, BookOpen, RefreshCw, Loader2, LayoutGrid, Save, Upload, ShieldAlert, Trash2, Instagram, Youtube, Globe, Radio } from "lucide-react";
import { bibleVerses } from "@/data/bible-verses";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser } from "@/firebase";
import { doc, collection, getDoc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { posts as initialPosts, Post } from '@/data/posts';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateMember, deleteMember } from "@/firebase/firestore/mutations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { uploadArquivo } from '@/lib/cloudinary';
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


type Verse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

// --- Tipos para a Carteirinha do Studio ---
type ElementStyle = {
    position: { top: number; left: number };
    size: { width?: number; height?: number; fontSize?: number };
    text?: string;
    fontWeight?: 'normal' | 'bold';
    src?: string; 
    textAlign?: 'left' | 'center' | 'right';
};

type CardElements = { [key: string]: ElementStyle };

type CardTemplateData = {
    elements: CardElements;
    cardStyles: {
        frontBackground: string;
        backBackground: string;
        frontBackgroundImage: string;
        backBackgroundImage: string;
    };
    textColors: {
        title: string;
        personalData: string;
        backText: string;
    };
};

// --- Tipos para Dados do Membro ---
interface Member {
    id: string;
    nome: string;
    email?: string;
    avatar?: string;
    recordNumber?: string;
    status: 'Ativo' | 'Inativo' | 'Pendente';
    gender?: 'Masculino' | 'Feminino';
    dataNascimento?: string | { seconds: number; nanoseconds: number };
    dataBatismo?: string | { seconds: number; nanoseconds: number };
    maritalStatus?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)';
    cpf?: string;
    rg?: string;
    naturalness?: string;
    nationality?: string;
    phone?: string;
    whatsapp?: string;
    cargo: string;
    dataMembro?: string | { seconds: number; nanoseconds: number };
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    complemento?: string;
    congregacao?: string;
    responsiblePastor?: string;
}

interface ChurchInfo {
  instagramUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  radioPageUrl?: string;
}

const formSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido").optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  
  // Endereço
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  
  avatar: z.string().optional(),

  // Dados Pessoais
  dataNascimento: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  gender: z.enum(['Masculino', 'Feminino']).optional(),
  maritalStatus: z.enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)']).optional(),
  naturalness: z.string().optional(),
  nationality: z.string().optional(),

  // Dados de Membro (apenas admins e pastores podem editar)
  cargo: z.string().optional(),
  status: z.enum(['Ativo', 'Inativo', 'Pendente']).optional(),
  congregacao: z.string().optional(),
  dataBatismo: z.string().optional(),
  dataMembro: z.string().optional(),
  recordNumber: z.string().optional(),
  responsiblePastor: z.string().optional(),
});

type MemberFormData = z.infer<typeof formSchema>;

type Congregacao = {
    id: string;
    nome: string;
}

const formatDate = (dateValue?: string | { seconds: number; nanoseconds: number } | Date, outputFormat: string = 'yyyy-MM-dd') => {
    if (!dateValue) return '';
    try {
        let date;
        if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            date = new Date(dateValue.seconds * 1000);
        } else {
           return '';
        }
        
        // Adiciona um dia para corrigir o problema de fuso horário
        date.setDate(date.getDate() + 1);

        if (outputFormat === 'dd/MM/yyyy') {
            return format(date, 'dd/MM/yyyy');
        }
        
        return format(date, outputFormat);

    } catch {
        return '';
    }
}

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

export default function MemberProfilePage() {
  const params = useParams();
  const memberId = params.id as string;
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const isOwner = authUser?.uid === memberId;
  
  const currentUserRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
  const { data: currentUserData, isLoading: isCurrentUserLoading } = useDoc<Member>(currentUserRef);

  const memberRef = useMemoFirebase(() => (firestore ? doc(firestore, 'users', memberId) : null), [firestore, memberId]);
  const { data: member, isLoading: memberLoading } = useDoc<Member>(memberRef);
  
  const templateRef = useMemoFirebase(() => firestore ? doc(firestore, 'cardTemplates', 'default') : null, [firestore]);
  const { data: templateData, isLoading: isTemplateLoading } = useDoc<CardTemplateData>(templateRef);

  const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
  const { data: churchInfo, isLoading: isChurchInfoLoading } = useDoc<ChurchInfo>(churchInfoRef);

  const congregacoesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'congregacoes') : null),
    [firestore]
  );
  const { data: congregacoes, isLoading: loadingCongregacoes } = useCollection<Congregacao>(congregacoesCollection);

  const [verse, setVerse] = useState<Verse | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [permission, setPermission] = useState<{ canView: boolean, canEdit: boolean, canManage: boolean, hasChecked: boolean }>({
    canView: false,
    canEdit: false,
    canManage: false,
    hasChecked: false,
  });


  // State for image cropping
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [imageToCrop, setImageToCrop] = useState('');
    const [isCropping, setIsCropping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '', email: '', phone: '', whatsapp: '', cep: '',
      logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
      avatar: '', dataNascimento: '', rg: '', cpf: '', gender: 'Masculino',
      maritalStatus: 'Solteiro(a)', naturalness: '', nationality: '',
      cargo: '', status: 'Pendente', congregacao: '', dataBatismo: '',
      dataMembro: '', recordNumber: '', responsiblePastor: ''
    },
  });

  // Effect to check permissions
  useEffect(() => {
    if (isCurrentUserLoading || !authUser) return;

    if (currentUserData) {
      const isAdmin = currentUserData.cargo === 'Administrador';
  
      if (memberLoading) return;
  
      if (member) {
        const isUserOwner = authUser.uid === member.id;
        const isPastorOfCongregation = currentUserData.cargo === 'Pastor/dirigente' && currentUserData.congregacao === member.congregacao;
  
        const canView = isUserOwner || isAdmin || isPastorOfCongregation;
        const canEdit = isUserOwner || isAdmin || isPastorOfCongregation;
        const canManage = isAdmin || isPastorOfCongregation;
  
        setPermission({ canView, canEdit, canManage, hasChecked: true });
      } else if (!memberLoading) {
        setPermission({ canView: false, canEdit: false, canManage: false, hasChecked: true });
      }
    } else if (!isCurrentUserLoading) {
      setPermission({ canView: false, canEdit: false, canManage: false, hasChecked: true });
    }
  }, [authUser, currentUserData, member, isCurrentUserLoading, memberLoading]);


  // Effect to reset form when member data is loaded
  useEffect(() => {
    if (member) {
      form.reset({
        nome: member.nome || '',
        email: member.email || '',
        phone: member.phone || '',
        whatsapp: member.whatsapp || '',
        cep: member.cep || '',
        logradouro: member.logradouro || '',
        numero: member.numero || '',
        complemento: member.complemento || '',
        bairro: member.bairro || '',
        cidade: member.cidade || '',
        estado: member.estado || '',
        avatar: member.avatar || '',
        dataNascimento: formatDate(member.dataNascimento) || '',
        rg: member.rg || '',
        cpf: member.cpf || '',
        gender: member.gender || 'Masculino',
        maritalStatus: member.maritalStatus || 'Solteiro(a)',
        naturalness: member.naturalness || '',
        nationality: member.nationality || '',
        cargo: member.cargo || '',
        status: member.status || 'Pendente',
        congregacao: member.congregacao || '',
        dataBatismo: formatDate(member.dataBatismo) || '',
        dataMembro: formatDate(member.dataMembro) || '',
        recordNumber: member.recordNumber || '',
        responsiblePastor: member.responsiblePastor || '',
      });
    }
  }, [member, form]);


  const onSubmit: SubmitHandler<MemberFormData> = async (data) => {
    if (!firestore || !memberId) return;
    setIsSubmitting(true);
    try {
        await updateMember(firestore, memberId, data);
        toast({ title: "Sucesso!", description: "Os dados do membro foram atualizados." });
    } catch (error) {
        console.error("Update error: ", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar os dados do membro." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !memberId) return;
    router.push('/dashboard/members'); 
    try {
      await deleteMember(firestore, memberId);
      toast({ title: "Sucesso!", description: "Membro excluído com sucesso." });
    } catch (error) {
      console.error("Delete error: ", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o membro." });
    } 
  }


  const selectRandomVerse = useCallback(() => {
    const randomVerse = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
    setVerse(randomVerse);
  }, []);

  useEffect(() => {
    selectRandomVerse();
  }, [selectRandomVerse]);

  const getAvatar = (avatarId?: string) => {
    if (!avatarId || !member?.avatar) {
      const placeholder = PlaceHolderImages.find((p) => p.id === 'member-avatar-1');
      return placeholder;
    }
    if(member.avatar.startsWith('http')) {
        return { imageUrl: member.avatar };
    }
    return PlaceHolderImages.find((p) => p.id === avatarId);
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
      const aspect = 1; // Square aspect for avatar
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
  }

  const saveCroppedImage = async () => {
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    if (!image || !canvas || !completedCrop || !firestore) {
      toast({ variant: 'destructive', title: 'Erro de Corte', description: 'Não foi possível processar a imagem.' });
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
            form.setValue('avatar', src);
            await onSubmit(form.getValues());
            toast({ title: 'Sucesso', description: 'Foto de perfil atualizada!' });
            setIsCropping(false);
            setImageToCrop('');
            setCurrentFile(null);
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erro de Upload', description: `Não foi possível enviar a imagem. Erro: ${error.message}` });
        } finally {
            setIsUploading(false);
        }
    }, 'image/jpeg');
  }


  const isLoading = isUserLoading || isCurrentUserLoading || memberLoading || isTemplateLoading || !permission.hasChecked || isChurchInfoLoading;

  if (isLoading) {
      return (
          <div className="flex-1 h-screen flex items-center justify-center bg-secondary">
              <Loader2 className="h-16 w-16 animate-spin" />
          </div>
      )
  }

  // After loading, if permission has been checked and is still false, deny access.
  if (permission.hasChecked && !permission.canView) {
       return (
           <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <Card className="border-destructive">
                    <CardHeader className="items-center text-center">
                        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
                        <CardTitle className="text-destructive">Acesso Negado</CardTitle>
                    </CardHeader>
                    <CardContent className='pt-4 text-center'>
                        <p>Você não tem permissão para acessar esta página ou o membro não foi encontrado.</p>
                        <Button onClick={() => router.back()} className="mt-6">Voltar</Button>
                    </CardContent>
                </Card>
            </div>
      );
  }

  // Handle case where member doc does not exist but user might have permission to view it (e.g. broken link)
  if (!member) {
     return notFound();
  }
  
  if (!templateData) {
        return (
            <div className="flex-1 h-screen flex items-center justify-center bg-secondary">
                <Card>
                    <CardHeader>
                        <CardTitle>Template Não Encontrado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>O template da carteirinha ainda não foi configurado.</p>
                        <p>Por favor, vá para o <Link href="/dashboard/card-studio" className="underline text-primary">Estúdio de Carteirinha</Link> para criá-lo.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

  const avatar = getAvatar(member.avatar);

  const getMemberDataForField = (fieldId: string) => {
    switch (fieldId) {
        case 'Valor Nome': return `Nome: ${member.nome || ''}`;
        case 'Valor Nº Reg.': return `Nº Reg.: ${member.recordNumber || ''}`;
        case 'Valor CPF': return `CPF: ${member.cpf || ''}`;
        case 'Valor Data de Batismo': return `Data de Batismo: ${formatDate(member.dataBatismo, 'dd/MM/yyyy') || ''}`;
        case 'Valor Cargo': return `Cargo: ${member.cargo || ''}`;
        case 'Membro Desde': return `Membro desde: ${formatDate(member.dataMembro, 'dd/MM/yyyy') || ''}`;
        default: return null;
    }
  };

  const renderElement = (id: string, el: ElementStyle) => {
    if (!el) return null;
    
    const isImage = 'src' in el;
    const isText = 'text' in el;

    let color = '#000000';
    if (isText && templateData) {
        const { textColors } = templateData;
        const isTitle = id.includes('Título') || id === 'Congregação' || id === 'Endereço';
        const isBackText = id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde');
        
        if (isTitle) color = textColors.title;
        else if (isBackText) color = textColors.backText;
        else color = textColors.personalData;
    }

    const style: React.CSSProperties = {
        position: 'absolute',
        top: `${el.position.top}%`,
        left: `${el.position.left}%`,
    };
    
    if (el.textAlign === 'center') style.transform = 'translateX(-50%)';
    else if (el.textAlign === 'right') style.transform = 'translateX(-100%)';
    
    let elementContent: React.ReactNode;

    if (isImage) {
        style.width = el.size.width ? `${el.size.width}px` : 'auto';
        style.height = el.size.height ? `${el.size.height}px` : 'auto';

        let src = el.src;
        if (id === 'Foto do Membro' && avatar) {
            src = avatar.imageUrl;
        }

        if (!src) {
             elementContent = <div style={{...style, border: '1px dashed #ccc'}} className="bg-gray-200/50 flex items-center justify-center text-xs text-gray-500">{id}</div>;
        } else {
             const objectFitStyle: React.CSSProperties = {
                objectFit: id === 'Foto do Membro' ? 'cover' : 'contain'
            };
            elementContent = (
                <div style={style} className="relative">
                    <Image
                        src={src}
                        alt={id}
                        fill
                        style={objectFitStyle}
                        className={cn({ 'rounded-md': id !== 'Assinatura'})}
                    />
                </div>
            );
        }
    } else if (isText) {
        style.fontSize = el.size.fontSize ? `${el.size.fontSize}px` : undefined;
        style.color = color;
        style.fontWeight = el.fontWeight;
        style.textAlign = el.textAlign;
        style.whiteSpace = 'pre-wrap';

        let dynamicText = el.text;
        if (id.startsWith('Valor')) {
            dynamicText = getMemberDataForField(id) ?? el.text;
        } else if (id === 'Congregação') {
            dynamicText = member.congregacao || el.text;
        } else if (id === 'Membro Desde') {
            dynamicText = `Membro desde: ${formatDate(member.dataMembro, 'dd/MM/yyyy') || ''}`;
        }
        
        if (id.includes('Título') || id.includes('Valor') || id.includes('Assinatura Pastor') || id.includes('Validade') || id.includes('Membro Desde')) {
            style.whiteSpace = 'nowrap';
        }
        
        elementContent = <p style={style}>{dynamicText}</p>;
    }

    return <div key={id}>{elementContent}</div>;
};

const StudioCard = ({ isFront }: { isFront: boolean }) => {
    if (isTemplateLoading || !templateData || !member) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
    }

    const { elements, cardStyles } = templateData;

    const backgroundStyle: React.CSSProperties = {
        backgroundColor: isFront ? cardStyles.frontBackground : cardStyles.backBackground,
        backgroundImage: `url(${isFront ? cardStyles.frontBackgroundImage : cardStyles.backBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    const frontElements = Object.keys(elements)
        .filter(id => !id.includes('Convenção') && !id.includes('QR Code') && !id.includes('Assinatura') && !id.includes('Validade') && !id.includes('Membro Desde') && !id.includes('Assinatura Pastor'));
    
    const backElements = Object.keys(elements)
        .filter(id => id.includes('Convenção') || id.includes('QR Code') || id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde') || id.includes('Assinatura Pastor'));

    const signatureLineElement = elements['Assinatura Pastor'];

    return (
        <Card 
            className="h-full w-full overflow-hidden shadow-lg relative"
            style={backgroundStyle}
        >
            {isFront ? (
                frontElements.map(id => renderElement(id, elements[id]))
            ) : (
                <>
                {backElements.map(id => renderElement(id, elements[id]))}
                {signatureLineElement && (
                     <div 
                        style={{
                            position: 'absolute', 
                            borderTop: '1px solid black', 
                            width: '40%', 
                            top: '85%',
                            left: '50%',
                            transform: 'translateX(-50%)'
                        }}
                    />
                )}
                </>
            )}
        </Card>
    );
};


  return (
    <div className="flex-1 space-y-4 bg-secondary">
       <Dialog open={isCropping} onOpenChange={setIsCropping}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Foto de Perfil</DialogTitle>
                </DialogHeader>
                <div className='flex items-center justify-center p-4 bg-muted/20'>
                    {!!imageToCrop && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            className='max-w-full'
                        >
                            <Image
                                ref={imgRef}
                                alt="Recortar imagem"
                                src={imageToCrop}
                                onLoad={onImageLoad}
                                width={400}
                                height={400}
                                className="max-h-[60vh] object-contain"
                            />
                        </ReactCrop>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCropping(false)}>Cancelar</Button>
                    <Button onClick={saveCroppedImage} disabled={isUploading}>
                        {isUploading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>}
                        {isUploading ? 'Salvando...' : 'Salvar Foto'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

      <div className="bg-card p-4 shadow-sm border-b">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold text-primary">AD Kairós</h1>
          </div>
          <Avatar>
             {avatar && <AvatarImage src={avatar.imageUrl} />}
            <AvatarFallback>{member.nome.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="container mx-auto space-y-6 pb-8">
        <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle>Bem-vindo(a), {member.nome.split(' ')[0]}!</CardTitle>
                      <CardDescription>
                          Este é o seu espaço central para interagir com as funcionalidades da igreja. Use o menu de navegação para explorar.
                      </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                      {isChurchInfoLoading ? <Loader2 className="h-4 w-4 animate-spin"/> :
                      <>
                        {churchInfo?.instagramUrl && <Button asChild variant="ghost" size="icon"><Link href={churchInfo.instagramUrl} target="_blank"><Instagram className="h-4 w-4"/></Link></Button>}
                        {churchInfo?.youtubeUrl && <Button asChild variant="ghost" size="icon"><Link href={churchInfo.youtubeUrl} target="_blank"><Youtube className="h-4 w-4"/></Link></Button>}
                        {churchInfo?.websiteUrl && <Button asChild variant="ghost" size="icon"><Link href={churchInfo.websiteUrl} target="_blank"><Globe className="h-4 w-4"/></Link></Button>}
                        {churchInfo?.radioPageUrl && <Button asChild variant="ghost" size="icon"><Link href={churchInfo.radioPageUrl} target="_blank"><Radio className="h-4 w-4"/></Link></Button>}
                      </>
                      }
                  </div>
              </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mt-1">
                <Badge variant="secondary">{member.cargo}</Badge>
                <Badge variant={member.status === "Ativo" ? "default" : member.status === 'Pendente' ? 'outline' : "destructive"}>{member.status}</Badge>
                </div>
                {permission.canManage && (
                    <div className="flex gap-2 mt-4">
                         <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/members/${member.id}/file`}>
                                <FileText className="mr-2 h-4 w-4"/>
                                Ver Ficha
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/members/${member.id}/card`}>
                                <CreditCard className="mr-2 h-4 w-4"/>
                                Ver Carteirinha
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>

        <Tabs defaultValue="carteirinha" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="carteirinha">Minha Carteirinha</TabsTrigger>
                <TabsTrigger value="dados">Meus Dados</TabsTrigger>
            </TabsList>
            <TabsContent value="carteirinha">
                <div className="space-y-4 pt-4">
                    <p className="text-center text-sm text-muted-foreground">
                    Clique na carteirinha para visualizar o verso.
                    </p>

                    <div 
                        className="max-w-lg mx-auto flip-card-container cursor-pointer aspect-[85.6/54]"
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                    >
                        <div className={cn("flip-card w-full h-full", { 'flipped': isCardFlipped })}>
                            <div className="flip-card-front">
                                <StudioCard isFront={true} />
                            </div>
                            <div className="flip-card-back">
                                 <StudioCard isFront={false} />
                            </div>
                        </div>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="dados">
                <Card>
                    <CardHeader>
                        <CardTitle>Meus Dados</CardTitle>
                        <CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                
                                {/* --- Foto e Nome --- */}
                                <div className="space-y-4">
                                     <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20 border">
                                            {avatar && <AvatarImage src={avatar.imageUrl} alt={member.nome} />}
                                            <AvatarFallback className="text-3xl">
                                                {member.nome.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-2">
                                            <Label>Foto de Perfil</Label>
                                            <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={onSelectFile} disabled={!permission.canEdit} />
                                            <Button type="button" variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={!permission.canEdit}>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Alterar Foto
                                            </Button>
                                        </div>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="nome"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome Completo</FormLabel>
                                                <FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                {/* --- Dados de Acesso --- */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-lg border-b pb-2">Dados de Acesso</h3>
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input {...field} disabled /></FormControl>
                                                <FormDescription>O e-mail não pode ser alterado.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* --- Dados Eclesiásticos --- */}
                                {permission.canManage && (
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-lg border-b pb-2">Dados Eclesiásticos</h3>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                             <FormField control={form.control} name="recordNumber" render={({ field }) => (<FormItem><FormLabel>Nº da Ficha</FormLabel><FormControl><Input {...field} disabled={!permission.canManage} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="cargo" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cargo Ministerial</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!permission.canManage}>
                                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Membro">Membro</SelectItem>
                                                            <SelectItem value="Cooperador(a)">Cooperador(a)</SelectItem>
                                                            <SelectItem value="Diácono(a)">Diácono(a)</SelectItem>
                                                            <SelectItem value="Presbítero">Presbítero</SelectItem>
                                                            <SelectItem value="Evangelista">Evangelista</SelectItem>
                                                            <SelectItem value="Missionário(a)">Missionário(a)</SelectItem>
                                                            <SelectItem value="Pastor(a)">Pastor(a)</SelectItem>
                                                            <SelectItem value="Pastor/dirigente">Pastor/dirigente</SelectItem>
                                                            <SelectItem value="Administrador">Administrador</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="status" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Status</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!permission.canManage}>
                                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Ativo">Ativo</SelectItem>
                                                            <SelectItem value="Inativo">Inativo</SelectItem>
                                                            <SelectItem value="Pendente">Pendente</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="congregacao" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Congregação</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={loadingCongregacoes || !permission.canManage}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder={loadingCongregacoes ? "Carregando..." : "Selecione a congregação"} /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {congregacoes?.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                             <FormField control={form.control} name="dataMembro" render={({ field }) => (<FormItem><FormLabel>Data de Membresia</FormLabel><FormControl><Input type="date" {...field} disabled={!permission.canManage} /></FormControl><FormMessage /></FormItem>)} />
                                             <FormField control={form.control} name="dataBatismo" render={({ field }) => (<FormItem><FormLabel>Data de Batismo</FormLabel><FormControl><Input type="date" {...field} disabled={!permission.canManage} /></FormControl><FormMessage /></FormItem>)} />
                                             <FormField
                                                control={form.control}
                                                name="responsiblePastor"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Pastor Responsável</FormLabel>
                                                        <FormControl><Input {...field} placeholder="Nome do pastor" disabled={!permission.canManage} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                {/* --- Dados Pessoais --- */}
                                <div className="space-y-4">
                                     <h3 className="font-medium text-lg border-b pb-2">Dados Pessoais</h3>
                                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <FormField control={form.control} name="dataNascimento" render={({ field }) => (<FormItem><FormLabel>Data de Nascimento</FormLabel><FormControl><Input type="date" {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="rg" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gênero</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={!permission.canEdit}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                                        <SelectItem value="Feminino">Feminino</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                         <FormField control={form.control} name="maritalStatus" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado Civil</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={!permission.canEdit}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                                                        <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                                                        <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                                                        <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="naturalness" render={({ field }) => (<FormItem><FormLabel>Naturalidade</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={form.control} name="nationality" render={({ field }) => (<FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>

                                {/* --- Contato --- */}
                                <div className="space-y-4">
                                     <h3 className="font-medium text-lg border-b pb-2">Contato</h3>
                                     <div className="grid md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={form.control} name="whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>

                                {/* --- Endereço --- */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-lg border-b pb-2">Endereço</h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <FormField name="cep" control={form.control} render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField name="logradouro" control={form.control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <FormField name="numero" control={form.control} render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField name="complemento" control={form.control} render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField name="bairro" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField name="cidade" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField name="estado" control={form.control} render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                  {permission.canEdit && (
                                      <Button type="submit" disabled={isSubmitting || isUploading}>
                                          {isSubmitting || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                          {isSubmitting || isUploading ? 'Salvando...' : 'Salvar Alterações'}
                                      </Button>
                                  )}
                                  {currentUserData?.cargo === 'Administrador' && (
                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                              <Button type="button" variant="destructive" disabled={isSubmitting}>
                                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Membro
                                              </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                              <AlertDialogHeader>
                                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                      Esta ação é permanente e não pode ser desfeita. O cadastro do membro será removido do banco de dados, mas a conta de autenticação (login e senha) precisará ser removida manually no console do Firebase, se necessário.
                                                  </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                                      Excluir Permanentemente
                                                  </AlertDialogAction>
                                              </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                  )}
                                </div>
                            </form>
                         </Form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        {verse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Promessa do Dia
                </div>
                 <Button variant="ghost" size="icon" onClick={selectRandomVerse} className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Nova Promessa</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <blockquote className="border-l-4 border-primary pl-4 italic">
                <p className="mb-2">"{verse.text}"</p>
                <footer className="text-sm font-semibold not-italic">
                  - {verse.book} {verse.chapter}:{verse.verse}
                </footer>
              </blockquote>
            </CardContent>
          </Card>
        )}


        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><LayoutGrid /> Mural de Avisos</h2>
            {posts.map((post) => {
            const avatarMural = getAvatar(post.authorAvatar);
            return (
                <Card key={post.id}>
                <CardHeader>
                    <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border">
                        {avatarMural && <AvatarImage src={avatarMural.imageUrl} alt={avatarMural.description} />}
                        <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                        <CardTitle>{post.title}</CardTitle>
                        <CardDescription>
                        Por {post.author} em {new Date(post.date).toLocaleDateString('pt-BR')}
                        </CardDescription>
                    </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                </CardContent>
                </Card>
            )
            })}
        </div>

        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5"/>
                Fale com a Administração
            </CardTitle>
            <CardDescription>Envie sua mensagem, dúvida, ou anexe um documento.</CardDescription>
        </CardHeader>
        <CardContent>
            <form className="space-y-4">
                 <div>
                    <Label htmlFor="destinatario">Enviar para</Label>
                    <Select>
                        <SelectTrigger id="destinatario">
                            <SelectValue placeholder="Selecione o destinatário" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Administração Geral</SelectItem>
                            {congregacoes?.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="assunto">Assunto</Label>
                    <Input id="assunto" placeholder="Sobre o que você quer falar?" />
                </div>
                <div>
                        <Label htmlFor="mensagem">Mensagem</Label>
                        <Textarea id="mensagem" placeholder="Digite sua mensagem aqui..." />
                </div>
                <Button>Enviar Mensagem</Button>
            </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
