
'use client';

import { members, Member } from "@/data/members";
import { bibleVerses } from "@/data/bible-verses";
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
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Cake, History, Users, Edit, BookOpen } from "lucide-react";
import { AppLogo } from "@/components/icons";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function MemberProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [member, setMember] = useState<Member | undefined>(members.find((m) => m.id === params.id));
  const [verse, setVerse] = useState<{ book: string; chapter: number; verse: number; text: string; } | null>(null);
  
  useEffect(() => {
    // This runs only on the client, after hydration
    const randomVerse = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
    setVerse(randomVerse);
  }, []);

  if (!member) {
    notFound();
  }

  const avatar = PlaceHolderImages.find((p) => p.id === member.avatar);

  const handleSaveChanges = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedMember = {
      ...member,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
    };
    // Here you would typically update the state or call an API
    setMember(updatedMember as Member);
    // Note: This won't persist changes as we are using static data.
    // To persist, we'd need to update the source of `members`.
    // For now, we just close the dialog.
    document.getElementById('close-dialog')?.click();
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Perfil do Membro</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveChanges} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input id="name" name="name" defaultValue={member.name} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" name="email" defaultValue={member.email} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Telefone
                </Label>
                <Input id="phone" name="phone" defaultValue={member.phone} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Endereço
                </Label>
                <Textarea id="address" name="address" defaultValue={member.address} className="col-span-3" />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
               <DialogClose id="close-dialog" className="hidden"/>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Verse of the day */}
      {verse && (
          <Card className="bg-accent text-accent-foreground">
              <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <BookOpen className="h-6 w-6"/>
                    <div>
                      <p className="text-sm font-light italic">"{verse.text}"</p>
                      <p className="text-right font-semibold mt-2">{verse.book} {verse.chapter}:{verse.verse}</p>
                    </div>
                  </div>
              </CardContent>
          </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Digital ID Card */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden shadow-lg">
            <div className="bg-primary p-4 text-center text-primary-foreground">
              <div className="flex justify-center mb-2">
                <AppLogo className="h-8 w-8"/>
              </div>
              <h3 className="font-semibold text-lg">A.D.KAIROS CONNECT</h3>
              <p className="text-sm opacity-90">Igreja Evangélica AdKairos</p>
            </div>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-4 border-accent">
                {avatar && <AvatarImage src={avatar.imageUrl} alt={avatar.description} data-ai-hint={avatar.imageHint} />}
                <AvatarFallback className="text-4xl">
                  {member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{member.name}</h2>
              <p className="text-muted-foreground">{member.role}</p>
              <Separator className="my-4" />
              <div className="w-full text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Membro desde:</span>
                  <span>{new Date(member.memberSince).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Status:</span>
                  <span>{member.status}</span>
                </div>
              </div>
              <div className="mt-4">
                {/* Placeholder for QR Code */}
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16h.01"/><path d="M16 12h.01"/><path d="M21 12h.01"/><path d="M12 21h.01"/></svg>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Details */}
        <div className="md:col-span-2">
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Informações</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="participation">Participação</TabsTrigger>
            </TabsList>
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{member.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Cake className="h-5 w-5 text-muted-foreground" />
                    <span>{new Date(member.birthDate).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico na Igreja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.history.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <History className="h-5 w-5 text-accent" />
                        {index < member.history.length - 1 && <div className="w-px h-8 bg-border" />}
                      </div>
                      <div>
                        <p className="font-semibold">{item.event}</p>
                        <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="participation">
              <Card>
                <CardHeader>
                  <CardTitle>Participação em Ministérios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.participation.length > 0 ? (
                    member.participation.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-secondary rounded-md">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{item.group}</p>
                                <p className="text-sm text-muted-foreground">{item.role}</p>
                            </div>
                        </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Nenhuma participação registrada.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
