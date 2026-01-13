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
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Cake, History, Users } from "lucide-react";
import { AppLogo } from "@/components/icons";

export default function MemberProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const member = members.find((m) => m.id === params.id);

  if (!member) {
    notFound();
  }

  const avatar = PlaceHolderImages.find((p) => p.id === member.avatar);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Perfil do Membro</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Digital ID Card */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden shadow-lg">
            <div className="bg-primary p-4 text-center text-primary-foreground">
              <div className="flex justify-center mb-2">
                <AppLogo className="h-8 w-8"/>
              </div>
              <h3 className="font-semibold text-lg">ADKAIROS CONNECT</h3>
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
