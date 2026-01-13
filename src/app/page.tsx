import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/icons";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

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
            {/* Nav links can be added here if needed */}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative w-full h-64 text-white">
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

      <main className="flex-1 flex flex-col items-center p-4 -mt-16 z-10">
        <div className="w-full max-w-md">
          {/* Pastor Photo */}
          <div className="flex flex-col items-center mb-8">
            {pastorPhoto ? (
              <Avatar className="w-32 h-32 border-4 border-background bg-background shadow-lg">
                <AvatarImage src={pastorPhoto.imageUrl} alt={pastorPhoto.description} data-ai-hint={pastorPhoto.imageHint} />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
            ) : (
                <Avatar className="w-32 h-32 border-4 border-background bg-muted shadow-lg">
                    <AvatarFallback className="bg-slate-300">
                        <Users className="h-16 w-16 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
            )}
            <h2 className="text-xl font-semibold mt-4">Pastor Presidente</h2>
            <p className="text-muted-foreground">Nome do Pastor</p>
          </div>

          {/* Sobre */}
          <Card className="mb-8 bg-card">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Sobre a nossa Igreja</h2>
              <p className="text-muted-foreground">
                Endereço não informado
              </p>
            </CardContent>
          </Card>

          {/* Login */}
          <div className="mb-8">
            <Card className="bg-card">
                <CardContent className="p-6 text-center">
                    <h2 className="text-2xl font-bold mb-2">Acessar o Sistema</h2>
                    <p className="text-muted-foreground mb-4">Acesse o sistema para conectar-se.</p>
                    <Button asChild className="w-full" size="lg">
                        <Link href="/login">Login</Link>
                    </Button>
                </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} A.D.KAIROS CONNECT. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
           <Link className="text-xs hover:underline underline-offset-4" href="#">
            Palavra Pastoral
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Congregações
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Comissão Coordenação
          </Link>
        </nav>
      </footer>
    </div>
  );
}
