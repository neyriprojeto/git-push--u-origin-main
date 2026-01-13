import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/icons";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

      <main className="flex-1 flex flex-col items-center p-4 text-center">
        {/* Banner da Igreja */}
        <div className="w-full max-w-4xl mb-8">
          {churchBanner && (
            <Image
              src={churchBanner.imageUrl}
              alt={churchBanner.description}
              width={1200}
              height={400}
              className="w-full h-auto rounded-lg shadow-lg object-cover"
              data-ai-hint={churchBanner.imageHint}
            />
          )}
        </div>

        <div className="w-full max-w-md">
          {/* Foto do Pastor */}
          <div className="flex flex-col items-center mb-8">
            {pastorPhoto && (
              <Avatar className="w-32 h-32 mb-4 border-4 border-primary shadow-md">
                <AvatarImage src={pastorPhoto.imageUrl} alt={pastorPhoto.description} data-ai-hint={pastorPhoto.imageHint} />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
            )}
            <h2 className="text-xl font-semibold">Pastor Presidente</h2>
            <p className="text-muted-foreground">Nome do Pastor</p>
          </div>

          {/* Sobre */}
          <Card className="mb-8 bg-background/80 backdrop-blur">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Sobre Nós</h2>
              <p className="text-muted-foreground">
                A A.D.KAIROS CONNECT é uma comunidade de fé com o propósito de conectar pessoas a Deus e umas às outras. Nossos valores são baseados no amor, serviço e na palavra de Deus.
              </p>
            </CardContent>
          </Card>

          {/* Login */}
          <div className="mb-8">
            <Card className="bg-background/80 backdrop-blur">
                <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-2">Área de Membros</h2>
                    <p className="text-muted-foreground mb-4">Acesse o sistema para conectar-se.</p>
                    <Button asChild className="w-full" size="lg">
                        <Link href="/login">Acessar o Sistema</Link>
                    </Button>
                </CardContent>
            </Card>
          </div>

          {/* Palavra Pastoral */}
          <Card className="mb-8 bg-background/80 backdrop-blur">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Palavra Pastoral</h2>
              <p className="text-muted-foreground">
                "Uma mensagem de fé e esperança para a sua semana. Que a graça de Deus ilumine seus passos e fortaleça seu coração em todos os momentos."
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} A.D.KAIROS CONNECT. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
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
