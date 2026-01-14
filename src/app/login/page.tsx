
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/icons";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@adkairos.com");
  const [password, setPassword] = useState("adk123");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Serviço de autenticação não disponível. Tente novamente mais tarde.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Firebase Auth Error:", error.code, error.message);
      let description = "Verifique suas credenciais e tente novamente.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "E-mail ou senha incorretos. Por favor, verifique e tente novamente.";
      } else if (error.code === 'auth/invalid-credential') {
          description = "As credenciais fornecidas são inválidas.";
      } else if (error.code === 'auth/configuration-not-found') {
        description = "A configuração de autenticação não foi encontrada. Por favor, contate o suporte.";
      }
      
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
       <div className="w-full max-w-md">
        <div className="mx-auto flex justify-center mb-6">
            <Link href="/" className="flex items-center space-x-2 text-foreground">
                <AppLogo className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">A.D.KAIROS CONNECT</span>
            </Link>
        </div>
        <Card>
            <CardHeader className="text-center">
            <CardTitle>Área de Membros</CardTitle>
            <CardDescription>Faça login para acessar o painel</CardDescription>
            </CardHeader>
            <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="membro@email.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                </div>
                <div className="space-y-2">
                <div className="flex items-center">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="#" className="ml-auto inline-block text-sm underline">
                    Esqueceu sua senha?
                    </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
            </form>
             <Separator className="my-6" />
              <div className="text-center">
                <p className="text-sm">
                  Ainda não é membro?{" "}
                  <Link href="/register" className="underline">
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
