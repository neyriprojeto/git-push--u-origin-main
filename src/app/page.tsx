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
import { AppLogo } from "@/components/icons";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Share2, Radio } from "lucide-react";

export default function Home() {
  const churchBanner = PlaceHolderImages.find((p) => p.id === "church-banner");
  const pastorPhoto = PlaceHolderImages.find((p) => p.id === "pastor-photo");

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <AppLogo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">A.D.KAIROS CONNECT</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-4 justify-end">
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
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-64 w-full text-white">
          {churchBanner && (
            <Image
              src={churchBanner.imageUrl}
              alt={churchBanner.description}
              fill
              className="object-cover"
              data-ai-hint={churchBanner.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
            <AppLogo className="h-16 w-16 mb-4" />
            <h1 className="text-4xl font-bold">Bem-vindo a AD Kairós</h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="container -mt-20 z-10 relative px-4 md:px-6">
          <div className="flex justify-center mb-6">
            {pastorPhoto ? (
              <Avatar className="size-40 border-8 border-background bg-background shadow-lg">
                <AvatarImage
                  src={pastorPhoto.imageUrl}
                  alt={pastorPhoto.description}
                  data-ai-hint={pastorPhoto.imageHint}
                />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="size-40 border-4 border-background bg-muted shadow-lg">
                <AvatarFallback className="bg-slate-300">
                  <Users className="h-24 w-24 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <div className="max-w-4xl mx-auto grid gap-8">
            {/* Sobre */}
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Pastor Presidente</CardTitle>
                <CardDescription>Nome do Pastor</CardDescription>
              </CardHeader>
              <CardContent>
                <h2 className="text-2xl font-bold mt-4 mb-2">
                  Sobre a nossa Igreja
                </h2>
                <p className="text-muted-foreground">
                  A Igreja Evangélica AD Kairós é um lugar de adoração, comunhão e serviço. 
                  Nossa missão é levar a palavra de Deus a todos, transformando vidas e comunidades.
                </p>
                <p className="text-muted-foreground mt-2">Endereço não informado</p>
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
                <p className="text-muted-foreground text-center">
                  Aqui você encontrará uma mensagem de fé e esperança do nosso pastor. 
                  Brevemente, este espaço será preenchido com palavras que edificarão a sua vida.
                </p>
              </CardContent>
            </Card>
            
            {/* Congregações e Comissão */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Congregações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Nossas congregações são pontos de luz em diversas comunidades. 
                    Encontre a mais próxima de você e venha nos visitar.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Comissão Executiva</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Conheça os líderes que servem e guiam nossa igreja com dedicação e compromisso, 
                    trabalhando para o crescimento do Reino de Deus.
                  </p>
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
