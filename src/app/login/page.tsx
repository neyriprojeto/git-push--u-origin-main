import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
       <div className="w-full max-w-md">
        <div className="mx-auto flex justify-center mb-6">
            <Link href="/" className="flex items-center space-x-2 text-foreground">
                <AppLogo className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">AdKairos Connect</span>
            </Link>
        </div>
        <Card>
            <CardHeader className="text-center">
            <CardTitle>Área de Membros</CardTitle>
            <CardDescription>Faça login para acessar o painel</CardDescription>
            </CardHeader>
            <CardContent>
            <form className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="membro@email.com" required />
                </div>
                <div className="space-y-2">
                <div className="flex items-center">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="#" className="ml-auto inline-block text-sm underline">
                    Esqueceu sua senha?
                    </Link>
                </div>
                <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" asChild>
                    <Link href="/dashboard">Entrar</Link>
                </Button>
            </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
