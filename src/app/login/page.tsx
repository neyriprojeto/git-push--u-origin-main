
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/icons";
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useAuth, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { doc, getDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Serviço de autenticação não disponível. Tente novamente mais tarde.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After successful authentication, check the user's status in Firestore.
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === 'Pendente') {
          // If status is pending, sign the user out and show a specific message.
          await signOut(auth);
          toast({
            variant: "default",
            title: "Cadastro em Análise",
            description: "Seu cadastro está em análise. Você receberá um e-mail quando for aprovado.",
            duration: 9000,
          });
        } else if (userData.status === 'Inativo') {
          // If status is inactive, sign out and inform the user.
          await signOut(auth);
          toast({
            variant: "destructive",
            title: "Conta Inativa",
            description: "Sua conta está inativa. Entre em contato com a administração da igreja.",
            duration: 9000,
          });
        } else if (userData.status === 'Ativo') {
          // If status is active, proceed to dashboard.
          router.push("/dashboard");
        } else {
            // Fallback for unknown status
            await signOut(auth);
            toast({
                variant: "destructive",
                title: "Status Desconhecido",
                description: "O status da sua conta é desconhecido. Entre em contato com a administração.",
                duration: 9000,
            });
        }
      } else {
        // This case is unlikely if registration always creates a user doc, but it's good practice to handle it.
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Erro de Cadastro",
          description: "Não foi possível encontrar seus dados de membro. Por favor, entre em contato com a administração.",
        });
      }
    } catch (error: any) {
      console.error("Firebase Auth Error:", error.code, error.message);
      let description = "Verifique suas credenciais e tente novamente.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "E-mail ou senha incorretos. Por favor, verifique e tente novamente.";
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
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
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
