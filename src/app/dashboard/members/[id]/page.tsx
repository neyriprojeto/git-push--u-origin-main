
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
import { cn } from "@/lib/utils";

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
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const selectRandomVerse = useCallback(() => {
    const randomVerse = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
    setVerse(randomVerse);
  }, []);

  useEffect(() => {
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
              <div 
                className="max-w-lg mx-auto flip-card-container cursor-pointer" 
                style={{ height: '390px' }} 
                onClick={() => setIsCardFlipped(!isCardFlipped)}
              >
                  <div className={cn("flip-card w-full h-full", { 'flipped': isCardFlipped })}>
                      {/* Card Front */}
                      <div className="flip-card-front">
                        <Card className="h-full w-full overflow-hidden shadow-lg bg-[#0a2749] text-white flex flex-col">
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
                            <div className="bg-white text-gray-800 p-4 space-y-3 flex-1">
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
                                      <Label className="text-xs text-muted-foreground">CARGO</Label>
                                      <p className="font-bold text-sm">{member.role}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                      </div>

                      {/* Card Back */}
                      <div className="flip-card-back">
                          <Card className="h-full w-full overflow-hidden shadow-lg bg-[#0a2749] text-white flex flex-col justify-between">
                            <div className="p-4">
                               <p className="text-xs text-center text-white/80">Válido em todo o território nacional.</p>
                            </div>
                            <div className="p-4 bg-white text-gray-800 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">ASSINATURA DO PASTOR</Label>
                                    <div className="h-10 border-b border-gray-400"></div>
                                </div>
                                 <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">ASSINATURA DO MEMBRO</Label>
                                    <div className="h-10 border-b border-gray-400"></div>
                                </div>
                                <div className="text-center pt-4">
                                    <p className="text-sm font-semibold">"Se o filho vos libertar, verdadeiramente sereis livres."</p>
                                    <p className="text-xs text-muted-foreground">João 8:36</p>
                                </div>
                            </div>
                          </Card>
                      </div>
                  </div>
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Nome Completo</p>
                      <p>{member.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Email</p>
                      <p>{member.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Telefone</p>
                      <p>{member.phone}</p>
                    </div>
                     <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">WhatsApp</p>
                      <p>{member.whatsapp || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Endereço</p>
                      <p>{member.address}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Gênero</p>
                      <p>{member.gender || 'Não informado'}</p>
                    </div>
                     <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Estado Civil</p>
                      <p>{member.maritalStatus || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">RG</p>
                      <p>{member.rg || 'Não informado'}</p>
                    </div>
                     <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">CPF</p>
                      <p>{member.cpf || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Naturalidade</p>
                      <p>{member.naturalness || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Nacionalidade</p>
                      <p>{member.nationality || 'Não informado'}</p>
                    </div>
                     <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Nº da Ficha</p>
                      <p>{member.recordNumber}</p>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

    