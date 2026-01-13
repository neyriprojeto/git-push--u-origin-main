import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin } from "lucide-react";
import { AppLogo } from "@/components/icons";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <AppLogo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">A.D.KAIROS CONNECT</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-4 justify-end">
            {/* O botão de login principal agora está no centro da página. 
                Este pode ser um link para outra seção se necessário. */}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center p-4 text-center">
        <div className="w-full max-w-md">
            <div className="bg-background/80 backdrop-blur rounded-lg p-8 shadow-lg">
                <Users className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
                <h1 className="text-3xl font-bold tracking-tighter mb-2">
                  Bem-vindo à AD Kairos
                </h1>

                <div className="text-left mt-6">
                    <h2 className="text-xl font-semibold">Sobre a nossa Igreja</h2>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                        <MapPin className="h-5 w-5 text-primary"/>
                        <span>Endereço não informado</span>
                    </div>
                </div>

                <Button asChild className="w-full mt-8" size="lg">
                    <Link href="/login">Acessar o Sistema</Link>
                </Button>
            </div>
        </div>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} A.D.KAIROS CONNECT. Todos os direitos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Congregações
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Coordenação
          </Link>
        </nav>
      </footer>
    </div>
  );
}
