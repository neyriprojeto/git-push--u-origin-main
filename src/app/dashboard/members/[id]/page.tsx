
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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Upload, ShieldAlert, Trash2, ChevronRight, User, LayoutGrid, CreditCard, MessageSquare, ArrowLeft, LogOut } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser, useAuth } from "@/firebase";
import { doc, collection, getDoc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { addMessage, updateMember } from "@/firebase/firestore/mutations";
import { deleteUser } from '@/ai/flows/delete-user-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { uploadArquivo } from "@/lib/cloudinary";
import { bibleVerses } from "@/data/bible-verses";
import { Textarea } from "@/components/ui/textarea";
import { signOut } from "firebase/auth";

// --- Types ---
type ElementStyle = { position: { top: number; left: number }; size: { width?: number; height?: number; fontSize?: number }; text?: string; fontWeight?: 'normal' | 'bold'; src?: string; textAlign?: 'left' | 'center' | 'right'; };
type CardElements = { [key: string]: ElementStyle };
type CardTemplateData = { elements: CardElements; cardStyles: { frontBackground: string; backBackground: string; frontBackgroundImage: string; backBackgroundImage: string; }; textColors: { title: string; personalData: string; backText: string; }; };
interface Member { id: string; nome: string; email?: string; avatar?: string; recordNumber?: string; status: 'Ativo' | 'Inativo' | 'Pendente'; gender?: 'Masculino' | 'Feminino'; dataNascimento?: string | { seconds: number; nanoseconds: number }; dataBatismo?: string | { seconds: number; nanoseconds: number }; maritalStatus?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)'; cpf?: string; rg?: string; naturalness?: string; nationality?: string; phone?: string; whatsapp?: string; cargo: string; dataMembro?: string | { seconds: number; nanoseconds: number }; cep?: string; logradouro?: string; numero?: string; bairro?: string; cidade?: string; estado?: string; complemento?: string; congregacao?: string; responsiblePastor?: string; }
type Congregacao = { id: string; nome: string; };
type Post = { id: string; title: string; content: string; authorId: string; authorName: string; authorAvatar?: string; imageUrl?: string; createdAt: Timestamp; };
type ChurchInfo = { radioUrl?: string };

// --- Helper Functions (moved to top level) ---
const formatDate = (dateValue?: string | { seconds: number; nanoseconds: number } | Date, outputFormat: string = 'yyyy-MM-dd') => {
    if (!dateValue) return '';
    try {
        let date: Date;
        if (typeof dateValue === 'object' && dateValue !== null && 'seconds' in dateValue) {
            date = new Date(dateValue.seconds * 1000);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'string') {
            const dateString = dateValue.includes('T') ? dateValue : dateValue.replace(/-/g, '/');
            date = new Date(dateString);
        } else {
           return '';
        }
        
        if (isNaN(date.getTime())) return '';
        
        return format(date, outputFormat, { locale: ptBR });
    } catch {
        return '';
    }
};

const getMemberDataForField = (currentMember: Member, fieldId: string): string | null => {
    const dataMap: Record<string, string | undefined> = {
        'Valor Nome': `Nome: ${currentMember.nome || ''}`,
        'Valor Nº Reg.': `Nº Reg.: ${currentMember.recordNumber || ''}`,
        'Valor CPF': `CPF: ${currentMember.cpf || ''}`,
        'Valor Cargo': `Cargo: ${currentMember.cargo || ''}`,
        'Membro Desde': `Membro desde: ${formatDate(currentMember.dataMembro, 'dd/MM/yyyy') || ''}`,
        'Congregação': currentMember.congregacao
    };

    return dataMap[fieldId] ?? null;
};


const renderElement = (currentMember: Member, id: string, el: ElementStyle, textColors: CardTemplateData['textColors'], getAvatarFn: (avatarId?: string) => { imageUrl: string } | undefined): React.ReactNode => {
    if (!el) return null;
    const isImage = 'src' in el;
    const isText = 'text' in el;
    let color = '#000000';
    if (isText && textColors) {
        const isTitle = id.includes('Título') || id === 'Congregação' || id === 'Endereço';
        const isBackText = id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde');
        if (isTitle) color = textColors.title;
        else if (isBackText) color = textColors.backText;
        else color = textColors.personalData;
    }
    const style: React.CSSProperties = { position: 'absolute', top: `${el.position.top}%`, left: `${el.position.left}%`, };
    if (el.textAlign === 'center') style.transform = 'translateX(-50%)';
    else if (el.textAlign === 'right') style.transform = 'translateX(-100%)';
    if (isImage) {
        style.width = el.size.width ? `${el.size.width}px` : 'auto';
        style.height = el.size.height ? `${el.size.height}px` : 'auto';
        let src = el.src;
        if (id === 'Foto do Membro') { const memberAvatar = getAvatarFn(currentMember.avatar); if (memberAvatar?.imageUrl) src = memberAvatar.imageUrl; }
        if (!src) { return <div key={id} style={{...style, border: '1px dashed #ccc'}} className="bg-gray-200/50 flex items-center justify-center text-xs text-gray-500">{id}</div>; } 
        else { const objectFitStyle: React.CSSProperties = { objectFit: id === 'Foto do Membro' ? 'cover' : 'contain' }; return ( <div key={id} style={style} className="relative"> <Image src={src} alt={id} fill style={objectFitStyle} className={cn({ 'rounded-md': id !== 'Assinatura'})} /> </div> ); }
    } 
    if (isText) {
        style.fontSize = el.size.fontSize ? `${el.size.fontSize}px` : undefined;
        style.color = color;
        style.fontWeight = el.fontWeight;
        style.textAlign = el.textAlign;
        style.whiteSpace = 'pre-wrap';
        
        let dynamicText;
        if (id.includes('Valor') || id.includes('Membro Desde') || id === 'Congregação') {
            dynamicText = getMemberDataForField(currentMember, id);
        } else {
            dynamicText = el.text;
        }

        if (id.includes('Título') || id.includes('Valor') || id.includes('Assinatura Pastor') || id.includes('Validade') || id.includes('Membro Desde')) { style.whiteSpace = 'nowrap'; }
        return <p key={id} style={style}>{dynamicText ?? el.text}</p>;
    }
    return null;
};

const StudioCard = ({ isFront, currentMember, templateData, getAvatarFn }: { isFront: boolean, currentMember: Member | null, templateData: CardTemplateData | null, getAvatarFn: (avatarId?: string) => { imageUrl: string } | undefined }) => {
    if (!templateData || !currentMember) { return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>; }
    const { elements = {}, cardStyles = { frontBackground: '#F3F4F6', backBackground: '#F3F4F6', frontBackgroundImage: '', backBackgroundImage: '' }, textColors = { title: '#000000', personalData: '#333333', backText: '#333333' } } = templateData;
    const backgroundStyle: React.CSSProperties = { backgroundColor: isFront ? cardStyles.frontBackground : cardStyles.backBackground, backgroundImage: `url(${isFront ? cardStyles.frontBackgroundImage : cardStyles.backBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', };
    const frontElements = Object.keys(elements).filter(id => !id.includes('Convenção') && !id.includes('QR Code') && !id.includes('Assinatura') && !id.includes('Validade') && !id.includes('Membro Desde') && !id.includes('Assinatura Pastor'));
    const backElements = Object.keys(elements).filter(id => id.includes('Convenção') || id.includes('QR Code') || id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde') || id.includes('Assinatura Pastor'));
    const signatureLineElement = elements['Assinatura Pastor'];
    return (
        <Card className="h-full w-full overflow-hidden shadow-lg relative" style={backgroundStyle}>
            {isFront ? ( frontElements.map(id => elements[id] ? renderElement(currentMember, id, elements[id], textColors, getAvatarFn) : null) ) : (
                <>
                    {backElements.map(id => elements[id] ? renderElement(currentMember, id, elements[id], textColors, getAvatarFn) : null)}
                    {signatureLineElement && ( <div style={{ position: 'absolute', borderTop: '1px solid black', width: '40%', top: '85%', left: '50%', transform: 'translateX(-50%)' }} /> )}
                </>
            )}
        </Card>
    );
};

const memberFormSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido").optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  avatar: z.string().optional(),
  dataNascimento: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  gender: z.enum(['Masculino', 'Feminino']).optional(),
  maritalStatus: z.enum(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)']).optional(),
  naturalness: z.string().optional(),
  nationality: z.string().optional(),
  cargo: z.string().optional(),
  status: z.enum(['Ativo', 'Inativo', 'Pendente']).optional(),
  congregacao: z.string().optional(),
  dataBatismo: z.string().optional(),
  dataMembro: z.string().optional(),
  recordNumber: z.string().optional(),
  responsiblePastor: z.string().optional(),
});
type MemberFormData = z.infer<typeof memberFormSchema>;


function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) { return centerCrop(makeAspectCrop({ unit: '%', width: 90, }, aspect, mediaWidth, mediaHeight), mediaWidth, mediaHeight); }


export default function MemberProfilePage() {
  const params = useParams();
  const memberId = params.id as string;
  const firestore = useFirestore();
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeView, setActiveView] = useState<'panel' | 'profile' | 'mural' | 'card' | 'contact'>('panel');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, setPermission] = useState<{ canView: boolean, canEdit: boolean, canManage: boolean, hasChecked: boolean }>({ canView: false, canEdit: false, canManage: false, hasChecked: false, });

  // State for image cropping
  const [crop, setCrop] = useState<Crop>();
  const [imageToCrop, setImageToCrop] = useState('');
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // State for inner components
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Data
  const currentUserRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
  const { data: currentUserData, isLoading: isCurrentUserLoading } = useDoc<Member>(currentUserRef);
  const memberRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', memberId) : null), [firestore, authUser, memberId]);
  const { data: member, isLoading: memberLoading } = useDoc<Member>(memberRef);
  const templateRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'cardTemplates', 'default') : null), [firestore, authUser]);
  const { data: templateData, isLoading: isTemplateLoading } = useDoc<CardTemplateData>(templateRef);
  const congregacoesCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'congregacoes') : null), [firestore]);
  const { data: congregacoes, isLoading: loadingCongregacoes } = useCollection<Congregacao>(congregacoesCollection);
  const postsCollection = useMemoFirebase(() => (firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null), [firestore]);
  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsCollection);
  const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
  const { data: churchInfo, isLoading: loadingChurchInfo } = useDoc<ChurchInfo>(churchInfoRef);

  // State for location dropdowns
  const [brazilianStates, setBrazilianStates] = useState<{ sigla: string; nome: string }[]>([]);
  const [cities, setCities] = useState<{ nome: string }[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [addressState, setAddressState] = useState('');
  const [addressCities, setAddressCities] = useState<{ nome: string }[]>([]);
  const [isLoadingAddressCities, setIsLoadingAddressCities] = useState(false);

  // Form handling
  const memberForm = useForm<MemberFormData>({ resolver: zodResolver(memberFormSchema), defaultValues: { nome: '', email: '', phone: '', whatsapp: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', avatar: '', dataNascimento: '', rg: '', cpf: '', gender: 'Masculino', maritalStatus: 'Solteiro(a)', naturalness: '', nationality: '', cargo: '', status: 'Pendente', congregacao: '', dataBatismo: '', dataMembro: '', recordNumber: '', responsiblePastor: '' }, });

  // --- Effects ---
  useEffect(() => { setIsLoadingStates(true); fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(res => res.json()).then(setBrazilianStates).catch(err => console.error("Failed to fetch states", err)).finally(() => setIsLoadingStates(false)); }, []);
  useEffect(() => { if (!selectedState) { setCities([]); return; } setIsLoadingCities(true); fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`).then(res => res.json()).then(setCities).catch(err => console.error("Failed to fetch cities", err)).finally(() => setIsLoadingCities(false)); }, [selectedState]);
  useEffect(() => { if (!addressState) { setAddressCities([]); return; } setIsLoadingAddressCities(true); fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${addressState}/municipios?orderBy=nome`).then(res => res.json()).then(setAddressCities).catch(err => console.error("Failed to fetch address cities", err)).finally(() => setIsLoadingAddressCities(false)); }, [addressState]);
  
  useEffect(() => {
    // While any data is loading, don't make a decision.
    if (isUserLoading || isCurrentUserLoading || memberLoading) {
      return;
    }

    // If there is no authenticated user, or their data is missing, deny all permissions.
    if (!authUser || !currentUserData) {
      setPermission({ canView: false, canEdit: false, canManage: false, hasChecked: true });
      return;
    }

    // If we can't find the member being requested, deny permissions.
    if (!member) {
        setPermission({ canView: false, canEdit: false, canManage: false, hasChecked: true });
        return;
    }

    // Now we have all the data, determine permissions.
    const isAdmin = currentUserData.cargo === 'Administrador';
    const isUserOwner = authUser.uid === member.id;
    const isPastorOfCongregation = currentUserData.cargo === 'Pastor/dirigente' && currentUserData.congregacao === member.congregacao;

    const canView = isUserOwner || isAdmin || isPastorOfCongregation;
    const canEdit = isUserOwner || isAdmin || isPastorOfCongregation;
    const canManage = isAdmin || isPastorOfCongregation;

    setPermission({ canView, canEdit, canManage, hasChecked: true });

  }, [authUser, currentUserData, member, isUserLoading, isCurrentUserLoading, memberLoading]);

  useEffect(() => { if (member) { memberForm.reset({ nome: member.nome || '', email: member.email || '', phone: member.phone || '', whatsapp: member.whatsapp || '', cep: member.cep || '', logradouro: member.logradouro || '', numero: member.numero || '', complemento: member.complemento || '', bairro: member.bairro || '', cidade: member.cidade || '', estado: member.estado || '', avatar: member.avatar || '', dataNascimento: formatDate(member.dataNascimento) || '', rg: member.rg || '', cpf: member.cpf || '', gender: member.gender || 'Masculino', maritalStatus: member.maritalStatus || 'Solteiro(a)', naturalness: member.naturalness || '', nationality: member.nationality || '', cargo: member.cargo || '', status: member.status || 'Pendente', congregacao: member.congregacao || '', dataBatismo: formatDate(member.dataBatismo) || '', dataMembro: formatDate(member.dataMembro) || '', recordNumber: member.recordNumber || '', responsiblePastor: member.responsiblePastor || '', }); if (member.naturalness && member.naturalness.includes('/')) { const [city, state] = member.naturalness.split('/'); setSelectedState(state); setSelectedCity(city); } else { setSelectedState(''); setSelectedCity(''); } if (member.estado) { setAddressState(member.estado); } else { setAddressState(''); } } }, [member, memberForm]);
  useEffect(() => { if (member?.naturalness && cities.length > 0) { const [city] = member.naturalness.split('/'); const cityExists = cities.some(c => c.nome === city); if (cityExists) { setSelectedCity(city); } } }, [cities, member]);

  // --- Handlers ---
  const onMemberSubmit: SubmitHandler<MemberFormData> = async (data) => {
    if (!firestore || !memberId) return;
    setIsSubmitting(true);
    try { 
        await updateMember(firestore, memberId, data); 
        toast({ title: "Sucesso!", description: "Os dados do membro foram atualizados." }); 
    } 
    catch (error) { 
        console.error("Update error: ", error); 
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar os dados do membro." }); 
    } 
    finally { setIsSubmitting(false); }
  };
  
  const handleDelete = async () => {
    if (!memberId) return;
    const deletingToast = toast({ title: "Excluindo...", description: "Aguarde enquanto o membro é removido do sistema." });
    try { const result = await deleteUser({ userId: memberId }); deletingToast.dismiss(); if (result.success) { toast({ title: "Sucesso!", description: "O membro foi excluído permanentemente." }); router.push('/dashboard/members'); } else { throw new Error(result.message); } }
    catch (error: any) { deletingToast.dismiss(); console.error("Delete error: ", error); toast({ variant: "destructive", title: "Erro ao Excluir", description: error.message || "Não foi possível excluir o membro.", duration: 9000 }); }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firestore || !authUser || !currentUserData) return;
      if (!recipient || !subject.trim() || !body.trim()) { toast({ variant: 'destructive', title: 'Erro', description: 'Todos os campos são obrigatórios.' }); return; }
      setIsSending(true);
      try {
        await addMessage(firestore, { senderId: authUser.uid, senderName: currentUserData.nome, recipient, subject, body });
        toast({ title: 'Sucesso!', description: 'Sua mensagem foi enviada.' });
        setRecipient(''); setSubject(''); setBody('');
      } catch (error) { console.error("Error sending message:", error); toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar a mensagem.' }); }
      finally { setIsSending(false); }
    }

  const getAvatar = useCallback((avatarId?: string): { imageUrl: string } | undefined => { if (!avatarId) { return PlaceHolderImages.find((p) => p.id === 'member-avatar-1'); } if(avatarId.startsWith('http')) { return { imageUrl: avatarId }; } return PlaceHolderImages.find((p) => p.id === avatarId); }, []);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setCrop(undefined); setCurrentFile(file); const reader = new FileReader(); reader.addEventListener('load', () => { setImageToCrop(reader.result?.toString() || ''); setIsCropping(true); }); reader.readAsDataURL(file) } }
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) { const aspect = 1; const { width, height } = e.currentTarget; setCrop(centerAspectCrop(width, height, aspect)) }
  const saveCroppedImage = async () => {
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    if (!image || !canvas || !crop || !firestore) {
      toast({ variant: 'destructive', title: 'Erro de Corte', description: 'Não foi possível processar a imagem.' });
      return;
    }
    setIsUploading(true);
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Could not get 2d context' });
      setIsUploading(false);
      return;
    }
    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob || !currentFile) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Could not create blob' });
        setIsUploading(false);
        return;
      }
      try {
        const croppedFile = new File([blob], currentFile.name, { type: blob.type });
        const src = await uploadArquivo(croppedFile);
        memberForm.setValue('avatar', src);
        await onMemberSubmit(memberForm.getValues());
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
  };

  const handleLogout = async () => {
    if (!auth) return;
    setPermission({ canView: false, canEdit: false, canManage: false, hasChecked: true });
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao Sair",
        description: "Não foi possível encerrar a sessão.",
      });
    }
  };

  // --- Loading and Permission ---
  const isLoading = isUserLoading || isCurrentUserLoading || memberLoading || !permission.hasChecked;
  if (isLoading) { return ( <div className="flex-1 h-screen flex items-center justify-center bg-secondary"> <Loader2 className="h-16 w-16 animate-spin" /> </div> ) }
  if (permission.hasChecked && !permission.canView) { return ( <div className="flex-1 space-y-4 p-4 md:p-8 pt-6"><Card className="border-destructive"><CardHeader className="items-center text-center"><ShieldAlert className="h-12 w-12 text-destructive mb-4" /><CardTitle className="text-destructive">Acesso Negado</CardTitle></CardHeader><CardContent className='pt-4 text-center'><p>Você não tem permissão para acessar esta página ou o membro não foi encontrado.</p><Button onClick={() => router.back()} className="mt-6">Voltar</Button></CardContent></Card></div> ); }
  if (!member) { return notFound(); }
  
  const avatar = getAvatar(member.avatar);
  const verse = bibleVerses[new Date().getDate() % bibleVerses.length];


  const renderPanel = () => (
    <div className="space-y-4">
      <Card>
          <CardHeader>
              <CardTitle className="text-xl">Painel do Membro</CardTitle>
              <CardDescription>Acesse as principais seções do seu perfil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
              <div onClick={() => setActiveView('profile')} className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-4"><User className="h-6 w-6 text-primary" /><p className="font-semibold">Meu Perfil</p></div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div onClick={() => setActiveView('mural')} className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-4"><LayoutGrid className="h-6 w-6 text-primary" /><p className="font-semibold">Mural de Avisos</p></div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
               <div onClick={() => setActiveView('card')} className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-4"><CreditCard className="h-6 w-6 text-primary" /><p className="font-semibold">Minha Carteirinha</p></div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div onClick={() => setActiveView('contact')} className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-4"><MessageSquare className="h-6 w-6 text-primary" /><p className="font-semibold">Fale Conosco</p></div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
          </CardContent>
      </Card>
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case 'profile': return <ProfileView />;
      case 'mural': return <MuralView />;
      case 'card': return <CardView />;
      case 'contact': return <ContactView />;
      default: return renderPanel();
    }
  };
  
  const ViewContainer = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setActiveView('panel')}><ArrowLeft className="h-5 w-5" /></Button>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const ProfileView = () => (
    <ViewContainer title="Meus Dados">
      <Form {...memberForm}>
        <form onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border">
                        {avatar && <AvatarImage src={avatar.imageUrl} alt={member.nome} />}
                        <AvatarFallback className="text-3xl">{member.nome.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-2">
                        <Label>Foto de Perfil</Label>
                        <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={onSelectFile} disabled={!permission.canEdit} />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={!permission.canEdit}>
                            <Upload className="mr-2 h-4 w-4" /> Alterar Foto
                        </Button>
                    </div>
                </div>
                <FormField control={memberForm.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Dados de Acesso</h3>
                <FormField control={memberForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormDescription>O e-mail não pode ser alterado.</FormDescription><FormMessage /></FormItem>)} />
            </div>
            {permission.canManage && (
                <div className="space-y-4">
                    <h3 className="font-medium text-lg border-b pb-2">Dados Eclesiásticos</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={memberForm.control} name="recordNumber" render={({ field }) => (<FormItem><FormLabel>Nº da Ficha</FormLabel><FormControl><Input {...field} disabled={!permission.canManage} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="cargo" render={({ field }) => (<FormItem><FormLabel>Cargo Ministerial</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!permission.canManage}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Membro">Membro</SelectItem><SelectItem value="Cooperador(a)">Cooperador(a)</SelectItem><SelectItem value="Diácono(a)">Diácono(a)</SelectItem><SelectItem value="Presbítero">Presbítero</SelectItem><SelectItem value="Evangelista">Evangelista</SelectItem><SelectItem value="Missionário(a)">Missionário(a)</SelectItem><SelectItem value="Pastor(a)">Pastor(a)</SelectItem><SelectItem value="Pastor/dirigente">Pastor/dirigente</SelectItem><SelectItem value="Administrador">Administrador</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!permission.canManage}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem><SelectItem value="Pendente">Pendente</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="congregacao" render={({ field }) => (<FormItem><FormLabel>Congregação</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={loadingCongregacoes || !permission.canManage}><FormControl><SelectTrigger><SelectValue placeholder={loadingCongregacoes ? "Carregando..." : "Selecione a congregação"} /></SelectTrigger></FormControl><SelectContent>{congregacoes?.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="dataMembro" render={({ field }) => (<FormItem><FormLabel>Data de Membresia</FormLabel><FormControl><Input type="date" {...field} disabled={!permission.canManage} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="dataBatismo" render={({ field }) => (<FormItem><FormLabel>Data de Batismo</FormLabel><FormControl><Input type="date" {...field} disabled={!permission.canManage} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="responsiblePastor" render={({ field }) => (<FormItem><FormLabel>Pastor Responsável</FormLabel><FormControl><Input {...field} placeholder="Nome do pastor" disabled={!permission.canManage} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            )}
            <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Dados Pessoais</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={memberForm.control} name="dataNascimento" render={({ field }) => (<FormItem><FormLabel>Data de Nascimento</FormLabel><FormControl><Input type="date" {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={memberForm.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={memberForm.control} name="rg" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={memberForm.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gênero</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!permission.canEdit}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={memberForm.control} name="maritalStatus" render={({ field }) => (<FormItem><FormLabel>Estado Civil</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!permission.canEdit}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem><SelectItem value="Casado(a)">Casado(a)</SelectItem><SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem><SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <div className="grid md:grid-cols-2 gap-4 items-start">
                    <FormItem><FormLabel>Estado de Nascimento</FormLabel><Select value={selectedState} onValueChange={(value) => { setSelectedState(value); setSelectedCity(''); memberForm.setValue('naturalness', ''); }} disabled={isLoadingStates || !permission.canEdit}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingStates ? "Carregando..." : "Selecione o estado"} /></SelectTrigger></FormControl><SelectContent>{brazilianStates.map((state) => ( <SelectItem key={state.sigla} value={state.sigla}> {state.nome} </SelectItem> ))}</SelectContent></Select></FormItem>
                    <FormField control={memberForm.control} name="naturalness" render={({ field }) => ( <FormItem><FormLabel>Cidade de Nascimento</FormLabel><Select value={selectedCity} onValueChange={(cityValue) => { setSelectedCity(cityValue); field.onChange(`${cityValue}/${selectedState}`); }} disabled={isLoadingCities || !selectedState || !permission.canEdit}><FormControl><SelectTrigger><SelectValue placeholder={ !selectedState ? "Selecione um estado" : isLoadingCities ? "Carregando..." : "Selecione a cidade" } /></SelectTrigger></FormControl><SelectContent>{cities.map((city) => ( <SelectItem key={city.nome} value={city.nome}> {city.nome} </SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )} />
                    <FormField control={memberForm.control} name="nationality" render={({ field }) => (<FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Contato</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={memberForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={memberForm.control} name="whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Endereço</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <FormField name="cep" control={memberForm.control} render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="logradouro" control={memberForm.control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField name="numero" control={memberForm.control} render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="complemento" control={memberForm.control} render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="bairro" control={memberForm.control} render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={memberForm.control} name="estado" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={(value) => { field.onChange(value); setAddressState(value); memberForm.setValue('cidade', ''); }} value={field.value} disabled={isLoadingStates || !permission.canEdit}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingStates ? "Carregando..." : "Selecione o estado"} /></SelectTrigger></FormControl><SelectContent>{brazilianStates.map((state) => ( <SelectItem key={state.sigla} value={state.sigla}>{state.nome}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={memberForm.control} name="cidade" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isLoadingAddressCities || !addressState || !permission.canEdit}><FormControl><SelectTrigger><SelectValue placeholder={!addressState ? "Selecione um estado" : isLoadingAddressCities ? "Carregando..." : "Selecione a cidade"} /></SelectTrigger></FormControl><SelectContent>{addressCities.map((city) => ( <SelectItem key={city.nome} value={city.nome}>{city.nome}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {permission.canEdit && (<Button type="submit" disabled={isSubmitting || isUploading}>{isSubmitting || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSubmitting || isUploading ? 'Salvando...' : 'Salvar Alterações'}</Button>)}
                {currentUserData?.cargo === 'Administrador' && (<AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4" /> Excluir Membro</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação é permanente e não pode ser desfeita. O cadastro de dados e a conta de login do membro serão removidos permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir Permanentemente</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
            </div>
        </form>
      </Form>
    </ViewContainer>
  );

  const MuralView = () => (
    <ViewContainer title="Mural de Avisos">
        <div className="space-y-4">
            {isLoadingPosts ? (<div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>) 
            : posts && posts.length > 0 ? (posts.map((post) => { const avatar = getAvatar(post.authorAvatar); return (
                <Card key={post.id}>
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10 border">{avatar && <AvatarImage src={avatar.imageUrl} alt={post.authorName} />}<AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback></Avatar>
                            <div className="grid gap-0.5 flex-1"><CardTitle>{post.title}</CardTitle><CardDescription>Por {post.authorName} em {post.createdAt?.toDate().toLocaleDateString('pt-BR')}</CardDescription></div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {post.imageUrl && (<div className="mb-4 relative aspect-video w-full rounded-md overflow-hidden"><Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="cover" /></div>)}
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                    </CardContent>
                </Card>
            )})) : (<Card><CardContent className="p-8 text-center text-muted-foreground"><p>Nenhuma postagem no mural ainda.</p></CardContent></Card>)}
        </div>
    </ViewContainer>
  );

  const CardView = () => (
    <ViewContainer title="Minha Carteirinha Digital">
        <div className="flex justify-center items-center">
            <div className="w-full max-w-lg mx-auto flip-card-container cursor-pointer aspect-[85.6/54]" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                <div className={cn("flip-card w-full h-full", { 'flipped': isCardFlipped })}>
                    <div className="flip-card-front"><StudioCard isFront={true} currentMember={member} templateData={templateData} getAvatarFn={getAvatar} /></div>
                    <div className="flip-card-back"><StudioCard isFront={false} currentMember={member} templateData={templateData} getAvatarFn={getAvatar} /></div>
                </div>
            </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">Clique na carteirinha para ver o verso.</p>
    </ViewContainer>
  );

  const ContactView = () => {
    return (
      <ViewContainer title="Fale Conosco">
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Para quem você quer enviar?</Label>
            <Select value={recipient} onValueChange={setRecipient} disabled={loadingCongregacoes}>
              <SelectTrigger id="recipient"><SelectValue placeholder="Selecione o destinatário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Administração Geral">Administração Geral</SelectItem>
                {congregacoes?.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto da mensagem" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Mensagem</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva sua mensagem aqui..." rows={5}/>
          </div>
          <Button type="submit" disabled={isSending}>{isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Enviar Mensagem</Button>
        </form>
      </ViewContainer>
    );
  };


  return (
    <div className="flex-1 space-y-4 bg-secondary">
       <Dialog open={isCropping} onOpenChange={setIsCropping}>
            <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Editar Foto de Perfil</DialogTitle></DialogHeader><div className='flex items-center justify-center p-4 bg-muted/20'>{!!imageToCrop && (<ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => memberForm.setValue('avatar', c.width > 0 ? 'new' : '')} aspect={1} className='max-w-full'><Image ref={imgRef} alt="Recortar imagem" src={imageToCrop} onLoad={onImageLoad} width={400} height={400} className="max-h-[60vh] object-contain" /></ReactCrop>)}</div><DialogFooter><Button variant="outline" onClick={() => setIsCropping(false)}>Cancelar</Button><Button onClick={saveCroppedImage} disabled={isUploading}>{isUploading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>}{isUploading ? 'Salvando...' : 'Salvar Foto'}</Button></DialogFooter></DialogContent>
        </Dialog>
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

      <div className="bg-card p-4 shadow-sm border-b">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4"> <SidebarTrigger className="md:hidden" /> <h1 className="text-xl font-semibold text-primary">A.D.KAIROS CONNECT</h1> </div>
          <div className="flex items-center gap-4">
            <Avatar>{avatar && <AvatarImage src={avatar.imageUrl} />}<AvatarFallback>{member.nome.charAt(0)}</AvatarFallback></Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto space-y-6 pb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-center text-lg">Promessa do Dia</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-xl font-script text-blue-600">"{verse.text}"</p>
                    <p className="text-sm font-bold mt-2">{verse.book} {verse.chapter}:{verse.verse}</p>
                </CardContent>
            </Card>

            {loadingChurchInfo ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /> : churchInfo?.radioUrl && (
                <Card>
                    <CardHeader><CardTitle className="text-center text-lg">Rádio Kairós</CardTitle></CardHeader>
                    <CardContent>
                        <audio controls className="w-full">
                            <source src={churchInfo.radioUrl} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                    </CardContent>
                </Card>
            )}
            
            {renderView()}
      </div>
    </div>
  );
}
