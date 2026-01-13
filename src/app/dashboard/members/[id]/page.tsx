
'use client';

import { members, Member } from "@/data/members";
import { notFound } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppLogo } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, FileText, MessageSquare, BookOpen, RefreshCw } from "lucide-react";
import { bibleVerses } from "@/data/bible-verses";
import { useState, useEffect, useCallback } from "react";

type Verse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

export default function MemberProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const member = members.find((m) => m.id === params.id);
  const [verse, setVerse] = useState<Verse | null>(null);

  const selectRandomVerse = useCallback(() => {
    const randomVerse = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
    setVerse(randomVerse);
  }, []);

  useEffect(() => {
    // Select a random verse on client side to avoid hydration errors
    selectRandomVerse();
  }, [selectRandomVerse]);

  if (!member) {
    notFound();
  }

  const avatar = PlaceHolderImages.find((p) => p.id === member.avatar);
  const churchPicture = PlaceHolderImages.find((p) => p.id === "church-banner");

  return (
    <div className="flex-1 space-y-4 bg-secondary">
      <div className="bg-card p-4 shadow-sm border-b">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold text-primary">AD Kairós</h1>
          </div>
          <Avatar>
             {avatar && <AvatarImage src={avatar.imageUrl} />}
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="container mx-auto space-y-6 pb-8">
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

        <Tabs defaultValue="carteirinha" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inicio">
              <User className="mr-2 h-4 w-4" />
              Início
            </TabsTrigger>
            <TabsTrigger value="carteirinha">
              <CreditCard className="mr-2 h-4 w-4" />
              Carteirinha
            </TabsTrigger>
            <TabsTrigger value="meus-dados">
              <FileText className="mr-2 h-4 w-4" />
              Meus Dados
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inicio">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo(a), {member.name.split(' ')[0]}!</CardTitle>
                <CardDescription>
                    Este é o seu espaço central para interagir com as funcionalidades da igreja. Use o menu de navegação para explorar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">{member.role}</Badge>
                    <Badge variant={member.status === "Ativo" ? "default" : "destructive"}>{member.status}</Badge>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carteirinha">
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Clique na carteirinha para visualizar o verso.
              </p>

              {/* Digital ID Card */}
              <Card className="max-w-lg mx-auto overflow-hidden shadow-lg bg-[#0a2749] text-white">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {churchPicture && 
                          <Image src={churchPicture.imageUrl} alt="Igreja" width={60} height={60} className="rounded-md" />
                        }
                        <div>
                          <h3 className="font-bold text-sm sm:text-base">ASSEMBLEIA DE DEUS</h3>
                          <h4 className="font-semibold text-xs sm:text-sm">MINISTÉRIO KAIRÓS</h4>
                          <p className="text-xs opacity-80">Tempo de Deus</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <AppLogo className="h-8 w-8 mx-auto" />
                        <span className="text-[10px] font-bold">A.D. K</span>
                      </div>
                    </div>
                     <p className="text-center text-xs opacity-80 mt-2">Rua Presidente Prudente, 28, Eldorado, Diadema - SP, 09972-300</p>
                  </div>
                  <div className="bg-white text-gray-800 p-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border">
                            {avatar && <AvatarImage src={avatar.imageUrl} alt={avatar.description} data-ai-hint={avatar.imageHint} />}
                            <AvatarFallback className="text-2xl">
                                {member.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="border-b pb-1 flex-1">
                            <Label className="text-xs text-muted-foreground">NOME</Label>
                            <p className="font-bold text-sm">{member.name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="border-b pb-1">
                            <Label className="text-xs text-muted-foreground">RG</Label>
                            <p className="font-bold text-sm">{member.rg || 'N/A'}</p>
                          </div>
                          <div className="border-b pb-1">
                            <Label className="text-xs text-muted-foreground">DATA NASC.</Label>
                            <p className="font-bold text-sm">{new Date(member.birthDate).toLocaleDateString()}</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div className="border-b pb-1">
                            <Label className="text-xs text-muted-foreground">CARGO</Label>
                            <p className="font-bold text-sm">{member.role}</p>
                          </div>
                          <div className="border-b pb-1">
                            <Label className="text-xs text-muted-foreground">MEMBRO DESDE</Label>
                            <p className="font-bold text-sm">{new Date(member.memberSince).toLocaleDateString()}</p>
                          </div>
                      </div>
                  </div>
              </Card>

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
          </TabsContent>
          <TabsContent value="meus-dados">
            <Card>
              <CardHeader>
                <CardTitle>Meus Dados</CardTitle>
                <CardDescription>Verifique e atualize suas informações pessoais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <strong>Email:</strong>
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <strong>Telefone:</strong>
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <strong>Endereço:</strong>
                    <span>{member.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <strong>Data de Nascimento:</strong>
                    <span>{new Date(member.birthDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <strong>Membro desde:</strong>
                    <span>{new Date(member.memberSince).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <strong>Estado Civil:</strong>
                    <span>{member.maritalStatus || 'Não informado'}</span>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
