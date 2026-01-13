import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Church, BookOpenText } from "lucide-react";
import { AppLogo } from "@/components/icons";

export default function Home() {
  const churchBanner = PlaceHolderImages.find(p => p.id === 'church-banner');
  const pastorPhoto = PlaceHolderImages.find(p => p.id === 'pastor-photo');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <AppLogo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">A.D.KAIROS CONNECT</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-4 sm:justify-end">
            <Button asChild>
              <Link href="/login">Área de Membros</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative h-[50vh] w-full">
          {churchBanner && (
             <Image
              src={churchBanner.imageUrl}
              alt={churchBanner.description}
              fill
              className="object-cover"
              data-ai-hint={churchBanner.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-primary-foreground">
             <Avatar className="w-32 h-32 border-4 border-accent mb-4">
                {pastorPhoto && <AvatarImage src={pastorPhoto.imageUrl} alt={pastorPhoto.description} data-ai-hint={pastorPhoto.imageHint} />}
                <AvatarFallback>PP</AvatarFallback>
            </Avatar>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
              Bem-vindo à AdKairos
            </h1>
            <p className="max-w-[700px] text-lg md:text-xl mt-4">
              Conectando corações, fortalecendo a fé.
            </p>
          </div>
        </section>

        <section id="about" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Sobre Nós
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
                  Nossa Comunidade
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Somos uma comunidade de fé dedicada a seguir os ensinamentos de Cristo, amando a Deus e ao próximo. Nossa missão é ser uma luz em nossa cidade, oferecendo esperança, apoio e um lugar para todos que buscam um relacionamento mais profundo com Deus.
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Palavra Pastoral
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
                  Uma Mensagem de Esperança
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e te conceda graça; o Senhor volte para ti o seu rosto e te dê paz." (Números 6:24-26). Que a paz de Cristo, que excede todo entendimento, guarde seus corações e suas mentes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Recursos para Membros
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Acesse sua carteirinha digital, atualize seu perfil e fique conectado com a comunidade.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
               <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Carteirinha Digital</CardTitle>
                    <Church className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                    Acesse sua identidade de membro a qualquer momento, em qualquer lugar.
                    </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Perfil de Membro</CardTitle>
                    <BookOpenText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                    Mantenha suas informações atualizadas e conecte-se com outros membros.
                    </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} A.D.KAIROS CONNECT. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Termos de Serviço
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  );
}
