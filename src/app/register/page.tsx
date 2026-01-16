
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addMember } from '@/firebase/firestore/mutations';
import { useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useState, useEffect } from 'react';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { AppLogo } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  // Dados Pessoais
  nome: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  rg: z.string().min(1, { message: 'O RG é obrigatório.' }),
  cpf: z.string().min(11, { message: 'O CPF deve ter 11 caracteres.' }).max(14, { message: 'O CPF deve ter no máximo 14 caracteres.' }),
  dataNascimento: z.string().optional(),
  
  // Dados de Membro
  cargo: z.string({ required_error: 'O cargo é obrigatório.' }),
  congregacao: z.string({ required_error: 'A congregação é obrigatória.' }),
  dataBatismo: z.string().optional(),
  responsiblePastor: z.string().optional(),

  // Endereço
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

type Congregacao = {
    id: string;
    nome: string;
}

export default function RegisterPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([]);
  const [loadingCongregacoes, setLoadingCongregacoes] = useState(true);

  useEffect(() => {
    const fetchCongregacoes = async () => {
      if (!firestore) return;
      try {
        setLoadingCongregacoes(true);
        const congregacoesCollection = collection(firestore, 'congregacoes');
        const snapshot = await getDocs(congregacoesCollection);
        const congregacoesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Congregacao));
        setCongregacoes(congregacoesData);
      } catch (error) {
        console.error("Erro ao buscar congregações:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar a lista de congregações.'
        });
      } finally {
        setLoadingCongregacoes(false);
      }
    };

    fetchCongregacoes();
  }, [firestore, toast]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      rg: '',
      cpf: '',
      dataNascimento: '',
      cargo: 'Membro',
      congregacao: '',
      dataBatismo: '',
      responsiblePastor: '',
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
    },
  });

  const handleCepBlur = async (cep: string) => {
    if (cep && cep.length >= 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          form.setValue('logradouro', data.logradouro);
          form.setValue('bairro', data.bairro);
          form.setValue('cidade', data.localidade);
          form.setValue('estado', data.uf);
        } else {
          toast({ variant: 'destructive', title: 'CEP não encontrado' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao buscar CEP' });
      }
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !auth) {
        toast({ variant: 'destructive', title: 'Erro de conexão', description: 'Não foi possível conectar aos serviços. Tente novamente.' });
        return;
    }
    setIsSubmitting(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Prepare data for Firestore (excluding password)
      const { password, ...memberData } = values;

      // 3. Save member data to Firestore using the UID from Auth
      await addMember(firestore, user.uid, memberData);
      
      setIsSubmitted(true);
    } catch (error: any) {
        let description = 'Não foi possível salvar o cadastro. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este e-mail já está em uso. Por favor, utilize outro e-mail.';
        }
        toast({
            variant: 'destructive',
            title: 'Erro ao cadastrar',
            description: description,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleGoogleSignUp = async () => {
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Serviço de autenticação não disponível.",
      });
      return;
    }
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await signOut(auth); 
        toast({
          title: "Conta já existente",
          description: "Já existe uma conta com este e-mail do Google. Por favor, faça login.",
          duration: 9000,
        });
        router.push('/login');
      } else {
        // This is a new user, create their document.
        const newMemberData = {
          nome: user.displayName || 'Nome não informado',
          email: user.email,
          avatar: user.photoURL || '',
          status: 'Pendente',
          cargo: 'Membro',
          criadoEm: serverTimestamp(),
        };
        await setDoc(userDocRef, newMemberData);
        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.error("Google Sign-Up Error:", error);
      toast({
        variant: "destructive",
        title: "Falha no Cadastro com Google",
        description: "Não foi possível se cadastrar com o Google. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSubmitted) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
              <Card className="w-full max-w-lg">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Cadastro Enviado para Análise!</h2>
                    <p className="text-muted-foreground mb-6">
                        Obrigado por se cadastrar. Seus dados foram enviados para aprovação. Assim que seu cadastro for aprovado, você receberá uma notificação em seu e-mail.
                    </p>
                    <Button asChild>
                        <Link href="/login">Voltar para o Login</Link>
                    </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="w-full min-h-screen flex justify-center bg-secondary p-4">
        <div className="w-full max-w-4xl space-y-6">
            <div className="flex justify-center pt-8">
                <Link href="/" className="flex items-center space-x-2 text-foreground">
                    <AppLogo className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold">A.D.KAIROS CONNECT</span>
                </Link>
            </div>
            <Card>
                <CardHeader>
                <CardTitle>Cadastro de Novo Membro</CardTitle>
                <CardDescription>Preencha os dados abaixo para se cadastrar.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dados de Acesso</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="seuemail@exemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Senha</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showPassword ? "text" : "password"} placeholder="******" {...field} />
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
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dados Pessoais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-2">
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Seu nome completo" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={form.control}
                                name="dataNascimento"
                                render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Data de Nascimento</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                            control={form.control}
                            name="rg"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>RG</FormLabel>
                                <FormControl>
                                    <Input placeholder="00.000.000-0" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="cpf"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl>
                                    <Input placeholder="000.000.000-00" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dados de Membro</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                            control={form.control}
                            name="cargo"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cargo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cargo" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Membro">Membro</SelectItem>
                                    <SelectItem value="Cooperador(a)">Cooperador(a)</SelectItem>
                                    <SelectItem value="Diácono(a)">Diácono(a)</SelectItem>
                                    <SelectItem value="Presbítero">Presbítero</SelectItem>
                                    <SelectItem value="Evangelista">Evangelista</SelectItem>
                                    <SelectItem value="Missionário(a)">Missionário(a)</SelectItem>
                                    <SelectItem value="Pastor(a)">Pastor(a)</SelectItem>
                                    <SelectItem value="Pastor/dirigente">Pastor/dirigente</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="congregacao"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Congregação</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCongregacoes}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingCongregacoes ? "Carregando..." : "Selecione a congregação"} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {congregacoes?.map((c) => (
                                            <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                                control={form.control}
                                name="dataBatismo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Batismo</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="responsiblePastor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pastor Responsável</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome do pastor responsável" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="cep"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>CEP</FormLabel>
                                    <FormControl>
                                        <Input placeholder="00000-000" {...field} onBlur={(e) => handleCepBlur(e.target.value)} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="logradouro"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                    <FormLabel>Logradouro</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Rua, Avenida, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="numero"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Número</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bairro"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Seu bairro" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cidade"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Sua cidade" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estado"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <FormControl>
                                        <Input placeholder="UF" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>


                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando Cadastro...' : 'Enviar Cadastro'}
                    </Button>
                    </form>
                     <Separator className="my-6" />
                      <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={isSubmitting}>
                        {isSubmitting ? 'Aguarde...' : 'Cadastrar com Google'}
                      </Button>
                      <div className="mt-4 text-center text-sm">
                          Já tem uma conta?{" "}
                          <Link href="/login" className="underline">
                              Fazer Login
                          </Link>
                      </div>
                </Form>
                </CardContent>
            </Card>
            <div className="pb-8"/>
        </div>
    </div>
  );
}
