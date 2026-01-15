
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
import { Users, Share2, Radio, Menu, Instagram, Youtube, Globe, Loader2, MapPin } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, getDocs, QuerySnapshot, DocumentData, query, where } from "firebase/firestore";


type Congregacao = {
  id: string;
  nome: string;
  endereco?: string;
};

type ChurchInfo = {
  pastorName?: string;
  pastoralMessage?: string;
  aboutUs?: string;
  bannerImageUrl?: string;
  pastorImageUrl?: string;
}

type Member = {
    id: string;
    nome: string;
    avatar?: string;
    cargo: string;
}


export default function Home() {
  const churchBannerPlaceholder = PlaceHolderImages.find((p) => p.id === "church-banner");
  const pastorPhotoPlaceholder = PlaceHolderImages.find((p) => p.id === "pastor-photo");

  const firestore = useFirestore();
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([]);
  const [loadingCongregacoes, setLoadingCongregacoes] = useState(true);

  const [leaders, setLeaders] = useState<Member[]>([]);
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
            const leaderRoles = ['Pastor(a)', 'Pastor/dirigente', 'Diácono(a)', 'Presbítero', 'Evangelista', 'Missionário(a)'];
            const leadersQuery = query(collection(firestore, 'users'), where('cargo', 'in', leaderRoles));
            const snapshot = await getDocs(leadersQuery);
            const leadersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
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

  const getLeaderAvatar = (leader: Member) => {
    if (leader.avatar?.startsWith('http')) {
        return leader.avatar;
    }
    const placeholder = PlaceHolderImages.find((p) => p.id === leader.avatar);
    return placeholder?.imageUrl || '';
  }


  // Dynamic values or fallbacks
  const bannerUrl = churchInfo?.bannerImageUrl || churchBannerPlaceholder?.imageUrl || '';
  const pastorPhotoUrl = churchInfo?.pastorImageUrl || pastorPhotoPlaceholder?.imageUrl || '';
  const pastorName = churchInfo?.pastorName || 'Pastor Presidente';
  const aboutUs = churchInfo?.aboutUs || 'A Igreja Evangélica AD Kairós é um lugar de adoração, comunhão e serviço. Nossa missão é levar a palavra de Deus a todos, transformando vidas e comunidades.';
  const pastoralMessage = churchInfo?.pastoralMessage || 'Aqui você encontrará uma mensagem de fé e esperança do nosso pastor. Brevemente, este espaço será preenchido com palavras que edificarão a sua vida.';


  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>
                        <Link href="/" className="flex items-center space-x-2">
                            <AppLogo className="h-6 w-6 text-primary" />
                            <span className="font-bold sm:inline-block">A.D.KAIROS CONNECT</span>
                        </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-2 py-4">
                    <Button variant="ghost" className="justify-start">
                        <Instagram className="mr-2 h-4 w-4"/>
                        Instagram
                    </Button>
                     <Button variant="ghost" className="justify-start">
                        <Youtube className="mr-2 h-4 w-4"/>
                        YouTube
                    </Button>
                     <Button variant="ghost" className="justify-start">
                        <Globe className="mr-2 h-4 w-4"/>
                        Site
                    </Button>
                    <Button variant="ghost" className="justify-start">
                        <Radio className="mr-2 h-4 w-4"/>
                        Rádio
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
               <Link href="/" className="mr-6 flex items-center space-x-2">
                <AppLogo className="h-6 w-6 text-primary" />
                <span className="font-bold sm:inline-block">A.D.KAIROS CONNECT</span>
              </Link>
          </div>
         
          <nav className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="#">Redes Sociais</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#">Rádio</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </nav>
           <div className="md:hidden">
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
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-start pt-12 text-center p-4">
            <AppLogo className="h-16 w-16 mb-4" />
            <h1 className="text-2xl font-bold md:text-4xl">Bem-vindo a AD Kairós</h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="container -mt-20 z-10 relative px-4 md:px-6">
          <div className="flex justify-center mb-6">
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

          <div className="max-w-4xl mx-auto grid gap-8">
            {/* Sobre */}
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-primary">{pastorName}</CardTitle>
                <CardDescription>Pastor Presidente</CardDescription>
              </CardHeader>
              <CardContent>
                <h2 className="text-2xl font-bold mt-4 mb-2">
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
                <h2 className="text-2xl font-bold mb-2">Acessar o Sistema</h2>
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
                <CardTitle className="text-center">Palavra Pastoral</CardTitle>
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
                  <CardTitle className="text-center">Nossas Congregações</CardTitle>
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
                  <CardTitle className="text-center">Comissão Executiva</CardTitle>
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
                                    <AvatarFallback>{leader.nome.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{leader.nome}</p>
                                    <p className="text-sm text-muted-foreground">{leader.cargo}</p>
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
