'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AppLogo } from "@/components/icons";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Share2, Radio, Menu, Instagram, Youtube, Globe, Loader2, MapPin, Banknote, Mail, Phone } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, getDocs, QuerySnapshot, DocumentData, query, orderBy } from "firebase/firestore";
import { Separator } from "@/components/ui/separator";


type Congregacao = {
  id: string;
  nome: string;
  endereco?: string;
};

type ChurchInfo = {
  pastorDisplayName?: string;
  pastorDisplayRole?: string;
  pastorSignatureName?: string;
  pastoralMessage?: string;
  aboutUs?: string;
  bannerImageUrl?: string;
  pastorImageUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  radioUrl?: string;
  radioPageUrl?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankPixKey?: string;
  contactPhone?: string;
  contactEmail?: string;
  churchAddress?: string;
}

type Leader = {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  email?: string;
  order?: number;
};


export default function Home() {
  const churchBannerPlaceholder = PlaceHolderImages.find((p) => p.id === "church-banner");
  const pastorPhotoPlaceholder = PlaceHolderImages.find((p) => p.id === "pastor-photo");

  const firestore = useFirestore();
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([]);
  const [loadingCongregacoes, setLoadingCongregacoes] = useState(true);

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);

  // Fetch ChurchInfo
  const churchInfoRef = useMemoFirebase(() => (firestore ? doc(firestore, 'churchInfo', 'main') : null), [firestore]);
  const { data: churchInfo, isLoading: loadingChurchInfo } = useDoc<ChurchInfo>(churchInfoRef);


  useEffect(() => {
    const fetchCongregacoes = async () => {
      if (!firestore) return;
      try {
        setLoadingCongregacoes(true);
        const congregacoesCollectionRef = collection(firestore, 'congregacoes');
        const snapshot = await getDocs(congregacoesCollectionRef);
        const congregacoesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Congregacao));
        setCongregacoes(congregacoesData);
      } catch (error) {
        console.error("Erro ao buscar congregações:", error);
      } finally {
        setLoadingCongregacoes(false);
      }
    };

    const fetchLeaders = async () => {
        if (!firestore) return;
        setLoadingLeaders(true);
        try {
            const leadersQuery = query(collection(firestore, 'leaders'), orderBy('order'));
            const snapshot = await getDocs(leadersQuery);
            const leadersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leader));
            setLeaders(leadersData);
        } catch (error) {
            console.error("Erro ao buscar líderes:", error);
        } finally {
            setLoadingLeaders(false);
        }
    };

    fetchCongregacoes();
    fetchLeaders();
  }, [firestore]);

  const getLeaderAvatar = (leader: Leader) => {
    if (leader.imageUrl) return leader.imageUrl;
    // Fallback placeholder
    const placeholder = PlaceHolderImages.find((p) => p.id === 'member-avatar-1');
    return placeholder?.imageUrl || '';
  }


  // Dynamic values or fallbacks
  const bannerUrl = churchInfo?.bannerImageUrl || churchBannerPlaceholder?.imageUrl || '';
  const pastorPhotoUrl = churchInfo?.pastorImageUrl || pastorPhotoPlaceholder?.imageUrl || '';
  const pastorName = churchInfo?.pastorDisplayName || 'Pastor Presidente';
  const pastorRole = churchInfo?.pastorDisplayRole || '';
  const aboutUs = churchInfo?.aboutUs || 'A Igreja Evangélica AD Kairós é um lugar de adoração, comunhão e serviço. Nossa missão é levar a palavra de Deus a todos, transformando vidas e comunidades.';
  const pastoralMessage = churchInfo?.pastoralMessage || 'Aqui você encontrará uma mensagem de fé e esperança do nosso pastor. Brevemente, este espaço será preenchido com palavras que edificarão a sua vida.';
  const instagramUrl = churchInfo?.instagramUrl;
  const youtubeUrl = churchInfo?.youtubeUrl;
  const websiteUrl = churchInfo?.websiteUrl;
  const radioPageUrl = churchInfo?.radioPageUrl;


  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <header className="sticky top-[65px] z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-card text-card-foreground">
                  <SheetHeader>
                    <SheetTitle>
                        <Link href="/" className="flex items-center space-x-2">
                            <AppLogo className="h-6 w-6 text-primary" />
                            <span className="font-bold sm:inline-block">A.D.KAIROS CONNECT</span>
                        </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-2 py-4">
                    {instagramUrl && <Button variant="ghost" className="justify-start" asChild><Link href={instagramUrl} target="_blank"><Instagram className="mr-2 h-4 w-4"/>Instagram</Link></Button>}
                    {youtubeUrl && <Button variant="ghost" className="justify-start" asChild><Link href={youtubeUrl} target="_blank"><Youtube className="mr-2 h-4 w-4"/>YouTube</Link></Button>}
                    {websiteUrl && <Button variant="ghost" className="justify-start" asChild><Link href={websiteUrl} target="_blank"><Globe className="mr-2 h-4 w-4"/>Site</Link></Button>}
                    {radioPageUrl && <Button variant="ghost" className="justify-start" asChild><Link href={radioPageUrl} target="_blank"><Radio className="mr-2 h-4 w-4"/>Rádio</Link></Button>}
                  </div>
                    {(churchInfo?.bankPixKey || churchInfo?.contactPhone) && (
                        <>
                            <Separator className="my-2 bg-border" />
                            <div className="flex flex-col space-y-3 px-2 py-2">
                                { (churchInfo.bankName || churchInfo.bankPixKey) && (
                                    <div>
                                        <h3 className="font-semibold mb-2 text-sm text-muted-foreground px-2">Dízimos e Ofertas</h3>
                                        <div className="text-sm text-foreground space-y-1 pl-2">
                                            {churchInfo.bankName && <p className="flex items-center gap-2 font-medium"><Banknote className="h-4 w-4 shrink-0 text-muted-foreground"/> {churchInfo.bankName}</p>}
                                            {churchInfo.bankAgency && <p className="text-xs text-muted-foreground pl-6">Ag: {churchInfo.bankAgency}</p>}
                                            {churchInfo.bankAccount && <p className="text-xs text-muted-foreground pl-6">CC: {churchInfo.bankAccount}</p>}
                                            {churchInfo.bankPixKey && <p className="font-semibold text-xs pl-6">PIX: {churchInfo.bankPixKey}</p>}
                                        </div>
                                    </div>
                                )}
                                {(churchInfo.contactPhone || churchInfo.contactEmail) && (
                                    <div className="pt-2">
                                        <h3 className="font-semibold mb-2 text-sm text-muted-foreground px-2">Contato</h3>
                                        {churchInfo.contactPhone && <Button variant="ghost" className="w-full justify-start h-auto py-1.5" asChild><Link href={`tel:${churchInfo.contactPhone}`}><Phone className="mr-2 h-4 w-4 shrink-0"/>{churchInfo.contactPhone}</Link></Button>}
                                        {churchInfo.contactEmail && <Button variant="ghost" className="w-full justify-start h-auto py-1.5" asChild><Link href={`mailto:${churchInfo.contactEmail}`}><Mail className="mr-2 h-4 w-4 shrink-0"/>{churchInfo.contactEmail}</Link></Button>}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
              </Sheet>
               <Link href="/" className="mr-6 flex items-center space-x-2">
                <AppLogo className="h-6 w-6 text-primary" />
                <span className="font-bold sm:inline-block">A.D.KAIROS CONNECT</span>
              </Link>
          </div>
         
          <div className="flex items-center gap-1">
            <nav className="hidden md:flex items-center">
              {instagramUrl && <Button variant="ghost" size="icon" asChild><Link href={instagramUrl} target="_blank"><Instagram/><span className="sr-only">Instagram</span></Link></Button>}
              {youtubeUrl && <Button variant="ghost" size="icon" asChild><Link href={youtubeUrl} target="_blank"><Youtube/><span className="sr-only">YouTube</span></Link></Button>}
              {websiteUrl && <Button variant="ghost" size="icon" asChild><Link href={websiteUrl} target="_blank"><Globe/><span className="sr-only">Site</span></Link></Button>}
              {radioPageUrl && <Button variant="ghost" size="icon" asChild><Link href={radioPageUrl} target="_blank"><Radio/><span className="sr-only">Rádio</span></Link></Button>}
            </nav>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-64 w-full text-white">
          {loadingChurchInfo ? (
            <div className='w-full h-full bg-gray-300 animate-pulse' />
          ) : (
            <Image
              src={bannerUrl}
              alt={"Banner da Igreja"}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4 pb-20">
            <AppLogo className="h-12 w-12" />
            <h1 className="text-xl md:text-2xl font-bold">Bem-vindo a A.D.KAIROS CONNECT</h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="container -mt-32 z-10 relative px-4 md:px-6">
          <div className="flex justify-center mb-4">
              <Avatar className="size-40 border-8 border-background bg-background shadow-lg">
                <AvatarImage
                  src={pastorPhotoUrl}
                  alt={pastorName}
                />
                <AvatarFallback>
                    {loadingChurchInfo ? <Loader2 className='animate-spin'/> : <Users className="h-24 w-24 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
          </div>

          <div className="max-w-4xl mx-auto grid gap-8 -mt-24">
            {/* Sobre */}
            <Card className="text-center pt-24">
              <CardHeader className='pt-8'>
                <CardTitle className="text-primary text-2xl">{pastorName}</CardTitle>
                {pastorRole && <CardDescription>{pastorRole}</CardDescription>}
              </CardHeader>
              <CardContent>
                <h2 className="text-2xl font-bold mt-4 mb-2 text-primary">
                  Sobre a nossa Igreja
                </h2>
                 {loadingChurchInfo ? (
                    <p className="text-muted-foreground">Carregando...</p>
                 ): (
                    <p className="text-muted-foreground">{aboutUs}</p>
                 )}
              </CardContent>
            </Card>

            {/* Login */}
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-2xl font-bold mb-2 text-primary">Acessar o Sistema</h2>
                <p className="text-muted-foreground mb-4">
                  Membros podem acessar o painel para informações e gerenciamento.
                </p>
                <Button asChild className="w-full max-w-sm mx-auto" size="lg">
                  <Link href="/login">Área de Membros</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Palavra Pastoral */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-primary">Palavra Pastoral</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingChurchInfo ? (
                    <p className="text-muted-foreground text-center">Carregando...</p>
                 ): (
                    <p className="text-muted-foreground text-center">{pastoralMessage}</p>
                 )}
              </CardContent>
            </Card>
            
            {/* Congregações e Comissão */}
            <div className="grid md:grid-cols-2 gap-8">
               <Card>
                <CardHeader>
                  <CardTitle className="text-center text-primary">Nossas Congregações</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCongregacoes ? (
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : congregacoes && congregacoes.length > 0 ? (
                    <ul className="space-y-4">
                      {congregacoes.map((c) => (
                        <li key={c.id} className="flex flex-col items-center text-center">
                          <p className="font-semibold">{c.nome}</p>
                          {c.endereco ? (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {c.endereco}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Endereço não informado</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center">Nenhuma congregação cadastrada.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-primary">Comissão Executiva</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLeaders ? (
                        <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : leaders.length > 0 ? (
                        <ul className="space-y-4">
                        {leaders.map((leader) => {
                            const avatarUrl = getLeaderAvatar(leader);
                            return (
                                <li key={leader.id} className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{leader.name}</p>
                                    <p className="text-sm text-muted-foreground">{leader.role}</p>
                                    {leader.email && <p className="text-xs text-muted-foreground">{leader.email}</p>}
                                </div>
                                </li>
                            );
                        })}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center">
                            Conheça os líderes que servem e guiam nossa igreja com dedicação e compromisso.
                        </p>
                    )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-primary">Dízimos, Ofertas e Contato</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                  {loadingChurchInfo ? (
                      <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                      <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                              <h3 className="font-bold text-lg">Dados Bancários</h3>
                              <p className="text-muted-foreground">Sua contribuição ajuda a manter a obra.</p>
                              {churchInfo?.bankName && <p className="font-semibold">{churchInfo.bankName}</p>}
                              {churchInfo?.bankAgency && <p>Agência: {churchInfo.bankAgency}</p>}
                              {churchInfo?.bankAccount && <p>Conta Corrente: {churchInfo.bankAccount}</p>}
                              {churchInfo?.bankPixKey && <p className="font-bold pt-2">PIX: {churchInfo.bankPixKey}</p>}
                          </div>
                          <div className="space-y-2">
                              <h3 className="font-bold text-lg">Fale Conosco</h3>
                              <p className="text-muted-foreground">Estamos aqui para ouvir você.</p>
                              {churchInfo?.contactPhone && <p className="flex items-center justify-center gap-2"><Phone className="h-4 w-4"/> {churchInfo.contactPhone}</p>}
                              {churchInfo?.contactEmail && <p className="flex items-center justify-center gap-2"><Mail className="h-4 w-4"/> {churchInfo.contactEmail}</p>}
                              {churchInfo?.churchAddress && <p className="flex items-center justify-center gap-2 mt-2"><MapPin className="h-4 w-4"/> {churchInfo.churchAddress}</p>}
                          </div>
                      </div>
                  )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      <footer className="mt-12 flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} A.D.KAIROS CONNECT. Todos os
          direitos reservados.
        </p>
      </footer>
    </div>
  );
}
