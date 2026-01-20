
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
  CardFooter,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Upload, ShieldAlert, Trash2, ChevronRight, User, LayoutGrid, CreditCard, MessageSquare, ArrowLeft, LogOut, Mail, Paperclip, Inbox, Share2, Download, BookOpen } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDoc, useFirestore, useMemoFirebase, useUser, useAuth, useCollection } from "@/firebase";
import { doc, collection, getDoc, serverTimestamp, query, orderBy, Timestamp, where, getDocs, arrayUnion, arrayRemove } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { addMessage, updateMember } from "@/firebase/firestore/mutations";
import { deleteUser } from '@/ai/flows/delete-user-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { uploadArquivo } from "@/lib/cloudinary";
import { bibleVerses } from "@/data/bible-verses";
import { Textarea } from "@/components/ui/textarea";
import { signOut } from "firebase/auth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import html2canvas from 'html2canvas';
import jsPDF from "jspdf";
import bibleReadingPlan from '@/data/bible-plan.json';
import bibleReadingPlanGrid from '@/data/bible-plan-grid.json';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FirestorePermissionError } from "@/firebase";
import { Slider } from "@/components/ui/slider";

// --- Types ---
type ElementStyle = { position: { top: number; left: number }; size: { width?: number; height?: number; fontSize?: number }; text?: string; fontWeight?: 'normal' | 'bold'; src?: string; textAlign?: 'left' | 'center' | 'right'; };
type CardElements = { [key: string]: ElementStyle };
type CardTemplateData = { elements: CardElements; cardStyles: { frontBackground: string; backBackground: string; frontBackgroundImage: string; backBackgroundImage: string; }; textColors: { title: string; personalData: string; backText: string; }; };
interface Member { id: string; nome: string; email?: string; avatar?: string; recordNumber?: string; status: 'Ativo' | 'Inativo' | 'Pendente'; gender?: 'Masculino' | 'Feminino'; dataNascimento?: string | { seconds: number; nanoseconds: number }; dataBatismo?: string | { seconds: number; nanoseconds: number }; maritalStatus?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)'; cpf?: string; rg?: string; naturalness?: string; nationality?: string; phone?: string; whatsapp?: string; cargo: string; dataMembro?: string | { seconds: number; nanoseconds: number }; cep?: string; logradouro?: string; numero?: string; bairro?: string; cidade?: string; estado?: string; complemento?: string; congregacao?: string; responsiblePastor?: string; bibleReadingProgress?: number[]; messageIds?: string[] }
type Congregacao = { id: string; nome: string; pastorId?: string; pastorName?: string; };
type Post = { id: string; title: string; content: string; authorId: string; authorName: string; authorAvatar?: string; imageUrl?: string; createdAt: Timestamp; };
type ChurchInfo = { radioUrl?: string; fichaLogoUrl?: string; };
type Reply = { authorId: string; authorName: string; body: string; attachmentUrl?: string; createdAt: Timestamp; };
type Message = { id: string; userId: string; senderName: string; recipientId: string; recipientName: string; subject: string; body: string; attachmentUrl?: string; createdAt: Timestamp; replies?: Reply[]; };


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

const calculateValidityDate = (memberSince?: string | { seconds: number; nanoseconds: number } | Date): string => {
    if (!memberSince) return '__/__/____';

    let memberSinceDate: Date;
    if (typeof memberSince === 'object' && memberSince !== null && 'seconds' in memberSince) {
        memberSinceDate = new Date(memberSince.seconds * 1000);
    } else if (memberSince instanceof Date) {
        memberSinceDate = memberSince;
    } else if (typeof memberSince === 'string') {
        const dateString = memberSince.includes('T') ? dateValue : dateValue.replace(/-/g, '/');
        memberSinceDate = new Date(dateString);
    } else {
        return '__/__/____';
    }

    if (isNaN(memberSinceDate.getTime())) {
        return '__/__/____';
    }

    const today = new Date();
    // Assuming today is in 2026 for testing as per user request
    const currentYear = new Date().getFullYear();
    
    // Check if the membership anniversary for the current year has already passed
    const anniversaryThisYear = new Date(currentYear, memberSinceDate.getMonth(), memberSinceDate.getDate());
    
    const validityYear = today > anniversaryThisYear ? currentYear + 1 : currentYear;

    const expiryMonth = memberSinceDate.getMonth();
    const expiryDay = memberSinceDate.getDate();

    return format(new Date(validityYear, expiryMonth, expiryDay), 'dd/MM/yyyy');
};


// CORRECTED CARD RENDERING COMPONENT
const MemberCardFace = ({ isFront, currentMember, templateData }: { isFront: boolean, currentMember: Member | null, templateData: CardTemplateData | null }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        if (currentMember?.id && typeof window !== 'undefined') {
            const verificationUrl = `${window.location.origin}/verify/${currentMember.id}`;
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`);
        }
    }, [currentMember?.id]);
    
    if (!templateData || !currentMember) { return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>; }

    const renderElement = (id: string, el: ElementStyle) => {
        const isImage = 'src' in el;
        
        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${el.position.top}%`,
            left: `${el.position.left}%`,
            lineHeight: 1.2,
        };

        if (el.textAlign === 'center') style.transform = 'translateX(-50%)';
        else if (el.textAlign === 'right') style.transform = 'translateX(-100%)';

        if (isImage) {
            style.width = el.size.width ? `${el.size.width}px` : 'auto';
            style.height = el.size.height ? `${el.size.height}px` : 'auto';

            let src = el.src;
            if (id === 'Foto do Membro' && currentMember.avatar) {
                src = currentMember.avatar;
            }
            if (id === 'QR Code') {
                src = qrCodeUrl;
            }

            if (!src) {
                 return <div key={id} style={{...style, border: '1px dashed #ccc'}} className="bg-gray-200/50 flex items-center justify-center text-xs text-gray-500">{id}</div>;
            } else {
                return (
                    <div key={id} style={style} className={cn("relative", {'rounded-md overflow-hidden': id !== 'Assinatura' })}>
                         <img src={src} alt={id} style={{
                            width: '100%',
                            height: '100%',
                            objectFit: id === 'Foto do Membro' ? 'cover' : 'contain'
                         }} crossOrigin="anonymous" />
                    </div>
                );
            }
        }
        
        let textContent: string | undefined = el.text;

        switch(id) {
            case 'Nome':
                if (currentMember.nome) textContent = `Nome: ${currentMember.nome}`;
                else return null;
                break;
            case 'Registro':
                if (currentMember.recordNumber) textContent = `Nº Reg.: ${currentMember.recordNumber}`;
                else return null;
                break;
            case 'Nascimento':
                if (currentMember.dataNascimento) textContent = `Nasc: ${formatDate(currentMember.dataNascimento, 'dd/MM/yyyy')}`;
                else return null;
                break;
            case 'RG':
                if (currentMember.rg) textContent = `RG: ${currentMember.rg}`;
                else return null;
                break;
            case 'CPF':
                if (currentMember.cpf) textContent = `CPF: ${currentMember.cpf}`;
                else return null;
                break;
            case 'Cargo':
                if (currentMember.cargo) textContent = `Cargo: ${currentMember.cargo}`;
                else return null;
                break;
            case 'Congregação':
                if (currentMember.congregacao) textContent = currentMember.congregacao;
                else if (el.text) textContent = el.text; // Fallback to template text for congregation
                else return null;
                break;
            case 'Membro Desde':
                if (currentMember.dataMembro) textContent = `Membro desde: ${formatDate(currentMember.dataMembro, 'dd/MM/yyyy')}`;
                else return null;
                break;
            case 'Validade':
                textContent = `Validade: ${calculateValidityDate(currentMember.dataMembro)}`;
                break;
        }

        if (textContent === undefined) {
             return null;
        }
        
        const { textColors } = templateData;
        let color = textColors.personalData;
        const isTitle = id.includes('Título') || id === 'Congregação' || id === 'Endereço';
        const isBackText = id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde');
        
        if (isTitle) color = textColors.title;
        else if (isBackText) color = textColors.backText;

        style.fontSize = el.size.fontSize ? `${el.size.fontSize}px` : undefined;
        style.color = color;
        style.fontWeight = el.fontWeight;
        style.textAlign = el.textAlign;
        
        style.whiteSpace = 'pre-wrap';
        if (id.includes('Título') || id === 'Assinatura Pastor' || id === 'Membro Desde' || id === 'Validade') {
            style.whiteSpace = 'nowrap';
        }

        return <p key={id} style={style}>{textContent}</p>;
    };

    const { elements, cardStyles } = templateData;
    const backgroundStyle = {
        backgroundColor: isFront ? cardStyles.frontBackground : cardStyles.backBackground,
        backgroundImage: `url(${isFront ? cardStyles.frontBackgroundImage : cardStyles.backBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    const frontElements = Object.keys(elements).filter(id => !id.includes('Convenção') && !id.includes('QR Code') && !id.includes('Assinatura') && !id.includes('Validade') && !id.includes('Membro Desde') && !id.includes('Assinatura Pastor'));
    const backElements = Object.keys(elements).filter(id => id.includes('Convenção') || id.includes('QR Code') || id.includes('Assinatura') || id.includes('Validade') || id.includes('Membro Desde') || id.includes('Assinatura Pastor'));
    const signatureLineElement = elements['Assinatura Pastor'];

    return (
        <div className="h-full w-full overflow-hidden shadow-lg relative" style={backgroundStyle}>
            {isFront ? (
                frontElements.map(id => elements[id] ? renderElement(id, elements[id]) : null)
            ) : (
                <>
                    {backElements.map(id => elements[id] ? renderElement(id, elements[id]) : null)}
                    {signatureLineElement && (
                         <div 
                            style={{
                                position: 'absolute', 
                                borderTop: '1px solid black', 
                                width: '40%', 
                                top: `calc(${signatureLineElement.position.top}% - 2px)`,
                                left: `${signatureLineElement.position.left}%`,
                                transform: 'translateX(-50%)'
                            }}
                        />
                    )}
                </>
            )}
        </div>
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
  
  const [activeView, setActiveView] = useState<'panel' | 'profile' | 'mural' | 'card' | 'contact' | 'my-messages' | 'reading-plan'>('panel');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, setPermission] = useState<{ canView: boolean, canEdit: boolean, canManage: boolean, hasChecked: boolean }>({ canView: false, canEdit: false, canManage: false, hasChecked: true, });
  const isOwner = authUser?.uid === memberId;

  // State for image cropping
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [imageToCrop, setImageToCrop] = useState('');
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  // State for inner components
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [verse, setVerse] = useState<(typeof bibleVerses)[0] | null>(null);
  const promiseCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);


  // Data
  const currentUserRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
  const { data: currentUserData, isLoading: isCurrentUserLoading } = useDoc<Member>(currentUserRef);
  
  const memberRef = useMemoFirebase(
    () => (firestore && authUser && memberId ? doc(firestore, 'users', memberId) : null),
    [firestore, authUser, memberId]
  );
  const { data: member, isLoading: memberLoading } = useDoc<Member>(memberRef);

  const templateRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'cardTemplates', 'default') : null), [firestore, authUser]);
  const { data: templateData, isLoading: isTemplateLoading } = useDoc<CardTemplateData>(templateRef);
  const { data: congregacoes, isLoading: loadingCongregacoes } = useCollection<Congregacao>(useMemoFirebase(() => (firestore ? collection(firestore, 'congregacoes') : null), [firestore]));
  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(useMemoFirebase(() => (firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null), [firestore]));
  const { data: churchInfo, isLoading: loadingChurchInfo } = useDoc<ChurchInfo>(useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]));

  // State for location dropdowns
  const [brazilianStates, setBrazilianStates] = useState<{ sigla: string; nome: string }[]>([]);
  const [cities, setCities] = useState<{ nome: string }[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [addressState, setAddressState] = useState('');
  const [addressCities, setAddressCities] = useState<{ nome: string }[]>([]);
  const [isLoadingAddressCities, setIsLoadingAddressCities] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  // Form handling
  const memberForm = useForm<MemberFormData>({ resolver: zodResolver(memberFormSchema), defaultValues: { nome: '', email: '', phone: '', whatsapp: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', avatar: '', dataNascimento: '', rg: '', cpf: '', gender: 'Masculino', maritalStatus: 'Solteiro(a)', naturalness: '', nationality: '', cargo: '', status: 'Pendente', congregacao: '', dataBatismo: '', dataMembro: '', recordNumber: '', responsiblePastor: '' }, });

  // --- Effects ---
  useEffect(() => {
    const verseIndex = Math.floor(Math.random() * bibleVerses.length);
    setVerse(bibleVerses[verseIndex]);
  }, []);

  useEffect(() => { setIsLoadingStates(true); fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(res => res.json()).then(setBrazilianStates).catch(err => console.error("Failed to fetch states", err)).finally(() => setIsLoadingStates(false)); }, []);
  useEffect(() => { if (!selectedState) { setCities([]); return; } setIsLoadingCities(true); fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`).then(res => res.json()).then(setCities).catch(err => console.error("Failed to fetch cities", err)).finally(() => setIsLoadingCities(false)); }, [selectedState]);
  useEffect(() => { if (!addressState) { setAddressCities([]); return; } setIsLoadingAddressCities(true); fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${addressState}/municipios?orderBy=nome`).then(res => res.json()).then(setAddressCities).catch(err => console.error("Failed to fetch address cities", err)).finally(() => setIsLoadingAddressCities(false)); }, [addressState]);
  
  useEffect(() => {
    if (isUserLoading || isCurrentUserLoading || !authUser) return;
  
    // Wait until the member data is also loaded before checking permissions
    if (memberLoading) return;
    
    // Once both user and member are loaded (or failed to load), proceed.
    if (!currentUserData || !member) {
      // If either is missing after loading, deny access.
      setPermission({ canView: false, canEdit: false, canManage: false, hasChecked: true });
      return;
    }
  
    const isAdmin = currentUserData.cargo === 'Administrador';
    const isUserOwner = authUser.uid === member.id;
    const isPastorOfCongregation = currentUserData.cargo === 'Pastor/dirigente' && currentUserData.congregacao === member.congregacao;
  
    const canView = isUserOwner || isAdmin || isPastorOfCongregation;
    const canEdit = isUserOwner || isAdmin || isPastorOfCongregation;
    const canManage = isAdmin || isPastorOfCongregation;
  
    setPermission({ canView, canEdit, canManage, hasChecked: true });
  
  }, [authUser, currentUserData, member, isUserLoading, isCurrentUserLoading, memberLoading]);

  useEffect(() => { if (member) { memberForm.reset({ nome: member.nome || '', email: member.email || '', phone: member.phone || '', whatsapp: member.whatsapp || '', cep: member.cep || '', logradouro: member.logradouro || '', numero: member.numero || '', complemento: member.complemento || '', bairro: member.bairro || '', cidade: member.cidade || '', estado: member.estado || '', avatar: member.avatar || '', dataNascimento: formatDate(member.dataNascimento) || '', rg: member.rg || '', cpf: member.cpf || '', gender: 'Masculino', maritalStatus: 'Solteiro(a)', naturalness: '', nationality: '', cargo: member.cargo || '', status: 'Pendente', congregacao: member.congregacao || '', dataBatismo: formatDate(member.dataBatismo) || '', dataMembro: formatDate(member.dataMembro) || '', recordNumber: member.recordNumber || '', responsiblePastor: member.responsiblePastor || '', }); if (member.naturalness && member.naturalness.includes('/')) { const [city, state] = member.naturalness.split('/'); setSelectedState(state); setSelectedCity(city); } else { setSelectedState(''); setSelectedCity(''); } if (member.estado) { setAddressState(member.estado); } else { setAddressState(''); } } }, [member, memberForm]);
  useEffect(() => { if (member?.naturalness && cities.length > 0) { const [city] = member.naturalness.split('/'); const cityExists = cities.some(c => c.nome === city); if (cityExists) { setSelectedCity(city); } } }, [cities, member]);

  function setCanvasPreview(
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: PixelCrop,
    scale = 1,
    rotate = 0
  ) {
    const ctx = canvas.getContext("2d");
  
    if (!ctx) {
      throw new Error("No 2d context");
    }
  
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;
  
    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);
  
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
  
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
  
    const rotateRads = (rotate * Math.PI) / 180;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;
  
    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.rotate(rotateRads);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight
    );
  
    ctx.restore();
  }

  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      setCanvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        scale,
        rotate
      );
    }
  }, [completedCrop, scale, rotate]);

  // --- Handlers ---
  const onMemberSubmit: SubmitHandler<MemberFormData> = async (data) => {
    if (!firestore || !memberId) return;
    setIsSubmitting(true);
    try {
        const dataToUpdate = { ...data };
        // If the current member data from Firestore doesn't have a record number, generate one.
        if (!member?.recordNumber) {
            dataToUpdate.recordNumber = Math.floor(1000 + Math.random() * 9000).toString();
        }
        await updateMember(firestore, memberId, dataToUpdate);
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

  const getAvatar = useCallback(
    (avatarId?: any): { imageUrl: string } | undefined => {
        // Default avatar
        if (!avatarId || typeof avatarId !== 'string') {
            return PlaceHolderImages.find((p) => p.id === 'member-avatar-1');
        }

        // External URL
        if (avatarId.startsWith('http')) {
            return { imageUrl: avatarId };
        }

        // Local placeholder ID
        return PlaceHolderImages.find((p) => p.id === avatarId);
    },
    []
  );

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const photoElement = templateData?.elements?.['Foto do Membro'];
      const photoAspect = (photoElement?.size?.width && photoElement?.size?.height)
        ? photoElement.size.width / photoElement.size.height
        : 4 / 5; // Default aspect ratio for member photo (e.g. 80x100px -> 0.8)
      setAspect(photoAspect);
      
      setCrop(undefined);
      setScale(1);
      setRotate(0);
      setCurrentFile(file);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result?.toString() || '');
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
      if (aspect) {
          const { width, height } = e.currentTarget;
          setCrop(centerAspectCrop(width, height, aspect));
      }
  }

  const saveCroppedImage = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !currentFile) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível processar a imagem.' });
      return;
    }
    setIsUploading(true);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Could not create blob' });
        setIsUploading(false);
        return;
      }
      try {
        const croppedFile = new File([blob], currentFile.name, { type: 'image/png' });
        const src = await uploadArquivo(croppedFile);
        memberForm.setValue('avatar', src);
        await onMemberSubmit(memberForm.getValues());
        toast({ title: 'Sucesso', description: 'Foto de perfil atualizada!' });
        setIsCropping(false);
        setImageToCrop('');
        setCurrentFile(null);
      } catch (error: any) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro de Upload', description: `Não foi possível enviar a imagem. Erro: ${'\'\''\''}${error.message}${'\'\''\''}` });
      } finally {
        setIsUploading(false);
      }
    }, 'image/png');
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

    const handleDownloadImage = async () => {
        const cardElement = promiseCardRef.current;
        if (!cardElement || !verse) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Aguarde o carregamento da promessa para baixar.',
            });
            return;
        }

        const buttonsContainer = cardElement.querySelector('[data-id="promise-buttons-container"]');
        if (!buttonsContainer) return;

        setIsDownloading(true);
        (buttonsContainer as HTMLElement).style.visibility = 'hidden';

        try {
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(cardElement, {
                useCORS: true,
                backgroundColor: null,
                scale: 2,
            });
            
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = 'promessa-do-dia.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error downloading image:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao baixar imagem',
                description: 'Não foi possível gerar a imagem. Tente novamente.',
            });
        } finally {
            (buttonsContainer as HTMLElement).style.visibility = 'visible';
            setIsDownloading(false);
        }
    };
  
  const handleShare = async () => {
    if (!verse) return;
    const shareText = `Promessa do Dia (A.D. Kairós Connect):\n\n"${verse.text}"\n(${verse.book} ${verse.chapter}:${verse.verse})\n\n${verse.devotional}`;
    const shareData = {
        title: 'Promessa do Dia - A.D. Kairós Connect',
        text: shareText,
        url: window.location.origin,
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            toast({
                title: "Copiado!",
                description: "A promessa do dia foi copiada para você colar.",
            });
        } catch (err) {
            console.error("Error copying to clipboard:", err);
            toast({
                variant: 'destructive',
                title: "Erro ao copiar",
                description: "Não foi possível copiar a mensagem.",
            });
        }
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                return;
            }
            console.error("Web Share API failed, falling back to clipboard:", err);
            await copyToClipboard();
        }
    } else {
        await copyToClipboard();
    }
  };


  // --- Loading and Permission ---
  const isLoading = isUserLoading || isCurrentUserLoading || memberLoading || !permission.hasChecked;
  

  if (isLoading) { return ( <div className="flex-1 h-screen flex items-center justify-center bg-secondary"> <Loader2 className="h-16 w-16 animate-spin" /> </div> ) }
  if (permission.hasChecked && !permission.canView) { return ( <div className="flex-1 space-y-4 p-4 md:p-8 pt-6"><Card className="border-destructive"><CardHeader className="items-center text-center"><ShieldAlert className="h-12 w-12 text-destructive mb-4" /><CardTitle className="text-destructive">Acesso Negado</CardTitle></CardHeader><CardContent className='pt-4 text-center'><p>Você não tem permissão para acessar esta página ou o membro não foi encontrado.</p><Button onClick={() => router.back()} className="mt-6">Voltar</Button></CardContent></Card></div> ); }
  if (!member) { return notFound(); }
  
  const avatar = getAvatar(member.avatar);
  
  const promiseBg = PlaceHolderImages.find((p) => p.id === 'promise-card-bg');


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
              <div onClick={() => setActiveView('reading-plan')} className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-4"><BookOpen className="h-6 w-6 text-primary" /><p className="font-semibold">Plano de Leitura Bíblica</p></div>
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
              {isOwner && (
                <div onClick={() => setActiveView('my-messages')} className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-4"><Mail className="h-6 w-6 text-primary" /><p className="font-semibold">Minhas Mensagens</p></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
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
      case 'my-messages': return <MyMessagesView />;
      case 'reading-plan': return <ReadingPlanView />;
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
                <div className="flex items-center gap-6">
                    <div className="space-y-2">
                         <FormLabel>Foto de Perfil</FormLabel>
                         <label
                            htmlFor="avatar-upload"
                            className={cn(
                                "relative group rounded-full w-24 h-24 flex items-center justify-center border",
                                permission.canEdit ? "cursor-pointer" : "cursor-not-allowed"
                            )}
                        >
                            <Avatar className="h-full w-full">
                                {avatar && <AvatarImage src={avatar.imageUrl} alt={member.nome} className="object-cover" />}
                                <AvatarFallback className="text-3xl">{member.nome.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {permission.canEdit && (
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="h-8 w-8" />
                                </div>
                            )}
                        </label>
                        <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={onSelectFile} disabled={!permission.canEdit} />
                    </div>
                    <div className="flex-grow">
                         <FormField control={memberForm.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Dados de Acesso</h3>
                <FormField control={memberForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormDescription>O e-mail não pode ser alterado.</FormDescription><FormMessage /></FormItem>)} />
            </div>
            {permission.canView && (
                <div className="space-y-4">
                    <h3 className="font-medium text-lg border-b pb-2">Dados Eclesiásticos</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField control={memberForm.control} name="recordNumber" render={({ field }) => (<FormItem><FormLabel>Nº da Ficha</FormLabel><FormControl><Input {...field} disabled={!permission.canManage} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="cargo" render={({ field }) => (<FormItem><FormLabel>Cargo Ministerial</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={loadingCongregacoes || !permission.canManage}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Membro">Membro</SelectItem><SelectItem value="Cooperador(a)">Cooperador(a)</SelectItem><SelectItem value="Diácono(a)">Diácono(a)</SelectItem><SelectItem value="Presbítero">Presbítero</SelectItem><SelectItem value="Evangelista">Evangelista</SelectItem><SelectItem value="Missionário(a)">Missionário(a)</SelectItem><SelectItem value="Pastor(a)">Pastor(a)</SelectItem><SelectItem value="Pastor/dirigente">Pastor/dirigente</SelectItem><SelectItem value="Administrador">Administrador</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!permission.canManage}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem><SelectItem value="Pendente">Pendente</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={memberForm.control} name="congregacao" render={({ field }) => (<FormItem><FormLabel>Congregação</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={loadingCongregacoes || !permission.canManage}><FormControl><SelectTrigger><SelectValue placeholder={loadingCongregacoes ? "Carregando..." : "Selecione a congregação"} /></SelectTrigger></FormControl><SelectContent>{congregacoes?.map((c: Congregacao) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
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
                 <div className="grid md:grid-cols-2 gap-4">
                    <FormField name="cep" control={memberForm.control} render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="logradouro" control={memberForm.control} render={({ field }) => (<FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} disabled={!permission.canEdit} /></FormControl><FormMessage /></FormItem>)} />
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
            : posts && posts.length > 0 ? (posts.map((post) => { const avatar = getAvatar(post); return (
                <Card key={post.id}>
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10 border">{avatar && <AvatarImage src={avatar.imageUrl} alt={post.authorName} />}<AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback></Avatar>
                            <div className="grid gap-0.5 flex-1"><CardTitle>{post.title}</CardTitle><CardDescription>Por {post.authorName} em {post.createdAt?.toDate().toLocaleDateString('pt-BR')}</CardDescription></div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {post.imageUrl && (<div className="mb-4 relative aspect-video w-full rounded-md overflow-hidden bg-muted/30"><Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="contain" /></div>)}
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
                    <div className="flip-card-front"><MemberCardFace isFront={true} currentMember={member} templateData={templateData} /></div>
                    <div className="flip-card-back"><MemberCardFace isFront={false} currentMember={member} templateData={templateData} /></div>
                </div>
            </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">Clique na carteirinha para ver o verso.</p>
    </ViewContainer>
  );

  const ContactView = () => {
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firestore || !authUser || !currentUserData) return;
      if (!recipient || !subject.trim() || !body.trim()) { toast({ variant: 'destructive', title: 'Erro', description: 'Destinatário, assunto e mensagem são obrigatórios.' }); return; }
      setIsSending(true);
      try {
        let attachmentUrl: string | undefined = undefined;
        if (attachment) {
            attachmentUrl = await uploadArquivo(attachment);
        }

        let recipientId: string;
        let recipientName: string;

        if (recipient === 'ADMIN') {
            recipientId = 'ADMIN_GROUP';
            recipientName = 'Administração Geral';
        } else {
            const selectedCongregacao = (congregacoes as Congregacao[])?.find(c => c.id === recipient);
            if (selectedCongregacao) {
                if (selectedCongregacao.pastorId) {
                    recipientId = selectedCongregacao.pastorId;
                    recipientName = selectedCongregacao.pastorName || selectedCongregacao.nome;
                } else {
                    recipientId = 'ADMIN_GROUP';
                    recipientName = `Administração (p/ ${selectedCongregacao.nome})`;
                }
            } else {
                recipientId = 'ADMIN_GROUP';
                recipientName = 'Administração Geral';
            }
        }
        
        await addMessage(firestore, { 
            userId: authUser.uid, 
            senderName: currentUserData.nome, 
            recipientId,
            recipientName, 
            subject, 
            body,
            attachmentUrl,
        });

        toast({ title: 'Sucesso!', description: 'Sua mensagem foi enviada.' });
        setRecipient(''); 
        setSubject(''); 
        setBody('');
        setAttachment(null);
        if (attachmentInputRef.current) {
            attachmentInputRef.current.value = '';
        }
      } catch (error) { console.error("Error sending message:", error); toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar a mensagem.' }); }
      finally { setIsSending(false); }
    }

    return (
      <ViewContainer title="Fale Conosco">
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Para quem você quer enviar?</Label>
            <Select value={recipient} onValueChange={setRecipient} disabled={loadingCongregacoes}>
              <SelectTrigger id="recipient"><SelectValue placeholder="Selecione o destinatário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administração Geral</SelectItem>
                {(congregacoes as Congregacao[])?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
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
           <div className="space-y-2">
              <Label htmlFor="attachment">Anexo (Opcional)</Label>
              <Input 
                  id="attachment" 
                  type="file" 
                  ref={attachmentInputRef}
                  onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)}
              />
              {attachment && <p className='text-sm text-muted-foreground pt-1'>Arquivo selecionado: {attachment.name}</p>}
            </div>
          <Button type="submit" disabled={isSending}>{isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Enviar Mensagem</Button>
        </form>
      </ViewContainer>
    );
  };

  const MyMessagesView = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!firestore || !authUser) {
                setIsLoadingMessages(false);
                return;
            }

            setIsLoadingMessages(true);
            setError(null);
            try {
                const q = query(collection(firestore, "messages"), where("userId", "==", authUser.uid), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const fetchedMessages: Message[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
                setMessages(fetchedMessages);
            } catch (err: any) {
                console.error("Error fetching member messages:", err);
                if (err.code === 'permission-denied') {
                    setError("Você não tem permissão para ver estas mensagens.");
                } else {
                    setError("Não foi possível carregar suas mensagens.");
                }
            } finally {
                setIsLoadingMessages(false);
            }
        };

        if (isOwner) {
            fetchMessages();
        } else {
            setIsLoadingMessages(false);
        }
    }, [firestore, authUser, isOwner]);


    return (
        <ViewContainer title="Minhas Mensagens">
            <div className="space-y-4">
                {isLoadingMessages ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : error ? (
                     <Card><CardContent className="p-8 text-center text-destructive">{error}</CardContent></Card>
                ) : messages && messages.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {messages.map(message => {
                             const messageDate = message.createdAt && typeof message.createdAt.toDate === 'function' 
                                ? message.createdAt.toDate() 
                                : new Date();

                            return (
                            <AccordionItem value={message.id} key={message.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-4 text-left w-full">
                                        <div className="grid gap-1 flex-1">
                                            <p className="font-medium truncate">{message.subject}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Para: <span className="font-semibold">{message.recipientName}</span>
                                            </p>
                                        </div>
                                        <div className="text-sm text-muted-foreground text-right ml-4">
                                            <p>{formatDistanceToNow(messageDate, { addSuffix: true, locale: ptBR })}</p>
                                            {message.replies && message.replies.length > 0 && (
                                                <Badge variant="secondary" className="mt-1">
                                                    {message.replies.length} {message.replies.length === 1 ? 'Resposta' : 'Respostas'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                    <p className="text-muted-foreground whitespace-pre-wrap">{message.body}</p>
                                    
                                    {message.attachmentUrl && (
                                        <div className="pt-2">
                                            <p className="text-sm font-semibold mb-1">Anexo enviado:</p>
                                            <Button asChild variant="link" className="p-0 h-auto text-left">
                                                <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate">
                                                    <Paperclip className="mr-2 h-4 w-4 shrink-0" /> <span className="truncate">{message.attachmentUrl.split('/').pop()?.split('?')[0]}</span>
                                                </a>
                                            </Button>
                                        </div>
                                    )}

                                    {message.replies && message.replies.length > 0 ? (
                                        <div className="space-y-4 pt-4 border-t">
                                            <h4 className="text-sm font-semibold">Respostas</h4>
                                            {message.replies.map((reply, index) => {
                                                const replyDate = reply.createdAt && typeof reply.createdAt.toDate === 'function'
                                                    ? reply.createdAt.toDate()
                                                    : new Date();

                                                return (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{reply.authorName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-semibold text-sm">{reply.authorName}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDistanceToNow(replyDate, { addSuffix: true, locale: ptBR })}
                                                                </p>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{reply.body}</p>
                                                            {reply.attachmentUrl && (
                                                                <div className="pt-2">
                                                                    <Button asChild variant="link" className="p-0 h-auto text-left text-xs">
                                                                        <a href={reply.attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate">
                                                                            <Paperclip className="mr-2 h-3 w-3 shrink-0" /> 
                                                                            <span className="truncate">{reply.attachmentUrl.split('/').pop()?.split('?')[0]}</span>
                                                                        </a>
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                                            Nenhuma resposta ainda.
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )})}
                    </Accordion>
                ) : (
                    <Card><CardContent className="p-8 text-center text-muted-foreground"><Inbox className="mx-auto h-12 w-12" /><p className="mt-4">Você ainda não enviou nenhuma mensagem.</p></CardContent></Card>
                )}
            </div>
        </ViewContainer>
    );
  };

  const PrintableReadingPlan = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
    const { data: churchInfo } = useDoc<{ baptismCertLogoUrl?: string }>(useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]));
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    return (
        <div ref={ref} className="bg-white p-6 text-black w-[297mm]">
            <div className="flex justify-between items-start mb-4">
                {churchInfo?.baptismCertLogoUrl ? (
                    <img src={churchInfo.baptismCertLogoUrl} alt="Logo da Igreja" className="h-20 w-auto" crossOrigin="anonymous"/>
                ) : <div className="h-20 w-20"></div>}
                
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-blue-700" style={{fontFamily: "'Great Vibes', cursive"}}>Plano de Leitura Bíblica Anual</h1>
                    <p className="text-xs italic text-blue-800 mt-2">"Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça, para que o homem de Deus seja apto e plenamente preparado para toda boa obra." (2 Timóteo 3:16-17)</p>
                </div>

                <div className="h-20 w-20"></div> 
            </div>

            <table className="w-full text-[7px] border-collapse border border-blue-300">
                <thead>
                    <tr className="bg-blue-100 text-blue-800 font-bold">
                        <th className="border border-blue-300 p-1 w-[2%]"></th>
                        {months.map((month, index) => (
                            <th key={month} className="border border-blue-300 p-1">{`${(index + 1).toString().padStart(2, '0')} ${month}`}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {bibleReadingPlanGrid.map(row => (
                        <tr key={row.day} className="even:bg-blue-50">
                            <td className="border border-blue-300 p-1 font-bold text-center">{row.day}</td>
                            {months.map(month => (
                                <td key={`${row.day}-${month}`} className="border border-blue-300 p-1 text-center">
                                    {(row as any)[month.toLowerCase()] || ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  });
  PrintableReadingPlan.displayName = 'PrintableReadingPlan';

  const ReadingPlanView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);
    const printablePlanRef = useRef<HTMLDivElement>(null);

    if (!member) return <Loader2 className="animate-spin" />;

    const handleProgressChange = async (day: number, checked: boolean) => {
        if (!firestore || !authUser) return;
        
        try {
            await updateMember(firestore, authUser.uid, {
                bibleReadingProgress: checked ? arrayUnion(day) : arrayRemove(day),
            });
            toast({
                title: "Progresso salvo!",
                description: `Sua leitura do dia ${day} foi atualizada.`
            });
        } catch (error) {
            console.error("Failed to save reading progress", error);
            toast({
                variant: 'destructive',
                title: "Erro",
                description: "Não foi possível salvar seu progresso."
            });
        }
    };
    
    const handleDownloadPlan = async () => {
        const input = printablePlanRef.current;
        if (!input) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Elemento do plano não encontrado para gerar o PDF.' });
            return;
        }
        setIsDownloadingPlan(true);
        try {
            const canvas = await html2canvas(input, { scale: 3, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
            pdf.save('plano-leitura-biblica-anual.pdf');
        } catch (e) {
            console.error("Error generating PDF:", e);
            toast({ variant: 'destructive', title: 'Erro ao gerar PDF', description: 'Ocorreu um problema ao tentar criar o arquivo.' });
        } finally {
           setIsDownloadingPlan(false);
        }
    };

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const currentMonthName = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    const readingsForMonth = bibleReadingPlan.filter(r => r.date.startsWith(currentMonthName.substring(0, 3)));

    return (
        <ViewContainer title="Plano de Leitura Bíblica Anual">
            <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-xl font-bold">{currentMonthName} {currentYear}</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1)))}>Anterior</Button>
                        <Button variant="outline" onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1)))}>Próximo</Button>
                    </div>
                </div>
                <Button onClick={handleDownloadPlan} disabled={isDownloadingPlan}>
                    {isDownloadingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                    Baixar Plano Completo (PDF)
                </Button>
                <Card>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[100px]">Data</TableHead>
                              <TableHead>Leitura</TableHead>
                              <TableHead className="text-right w-[80px]">Lido</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {readingsForMonth.map(reading => {
                              const isRead = member.bibleReadingProgress?.includes(reading.day);
                              return (
                                  <TableRow key={reading.day} className={cn(isRead && "bg-green-100 dark:bg-green-900/20")}>
                                      <TableCell className="font-medium">{reading.date}</TableCell>
                                      <TableCell>{reading.reading}</TableCell>
                                      <TableCell className="text-right">
                                          <Checkbox 
                                              checked={isRead}
                                              onCheckedChange={(checked) => handleProgressChange(reading.day, !!checked)}
                                          />
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                      </TableBody>
                  </Table>
                </Card>
            </div>
            
            <div className="absolute -left-[9999px] top-auto">
                 <PrintableReadingPlan ref={printablePlanRef} />
            </div>
        </ViewContainer>
    );
  }


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
                    aspect={aspect}
                    className='max-w-full'
                    scale={scale}
                    rotate={rotate}
                  >
                    <Image 
                      ref={imgRef} 
                      alt="Recortar imagem" 
                      src={imageToCrop} 
                      onLoad={onImageLoad} 
                      width={400} 
                      height={400}
                      className="max-h-[60vh] object-contain" />
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
                  {isUploading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>}
                  {isUploading ? 'Salvando...' : 'Salvar Foto'}
                </Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>
        <canvas ref={previewCanvasRef} style={{ display: 'none', objectFit: 'contain' }} />

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
            {verse ? (
                <Card className="relative overflow-hidden text-white" ref={promiseCardRef}>
                    {promiseBg ? (
                        <Image
                            src={promiseBg.imageUrl}
                            alt={promiseBg.description}
                            data-ai-hint={promiseBg.imageHint}
                            fill
                            className="object-cover z-0"
                            unoptimized
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gray-500 z-0" />
                    )}
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <div className="relative z-20 flex flex-col" style={{minHeight: '350px'}}>
                        <CardHeader>
                            <CardTitle className="text-center text-lg font-script tracking-wider">Promessa do Dia</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center flex-grow">
                            <blockquote className="text-xl font-serif italic text-white/90">"{verse.text}"</blockquote>
                            <p className="text-sm text-white/70 mt-2">{verse.book} {verse.chapter}:{verse.verse}</p>
                            <p className="text-sm text-white/70 mt-4 pt-4 border-t border-white/20 font-sans">
                                {verse.devotional}
                            </p>
                        </CardContent>
                        <CardFooter className="flex-col justify-center gap-4 pt-2">
                             <p className="text-xs text-white/70 font-sans">ADKAIROS CONNECT</p>
                            <div className="flex flex-wrap gap-2 justify-center" data-id="promise-buttons-container">
                                <Button variant="secondary" onClick={handleShare} disabled={!verse}>
                                    {!verse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                                    {!verse ? 'Carregando...' : 'Compartilhar Promessa'}
                                </Button>
                                <Button variant="secondary" onClick={handleDownloadImage} disabled={!verse || isDownloading}>
                                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    {isDownloading ? 'Baixando...' : 'Baixar PNG'}
                                </Button>
                            </div>
                        </CardFooter>
                    </div>
                </Card>
            ) : (
                 <Card className="relative overflow-hidden text-white h-[350px]">
                    <div className="absolute inset-0 bg-gray-500 z-0 animate-pulse" />
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <div className="relative z-20 flex flex-col items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </Card>
            )}
            
            {renderView()}
      </div>
    </div>
  );
}

    