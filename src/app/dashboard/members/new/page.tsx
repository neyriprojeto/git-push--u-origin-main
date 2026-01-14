'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addMember } from '@/firebase/firestore/mutations';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection } from 'firebase/firestore';

const formSchema = z.object({
  // Dados Pessoais
  nome: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  rg: z.string().min(1, { message: 'O RG é obrigatório.' }),
  cpf: z.string().min(11, { message: 'O CPF deve ter 11 caracteres.' }).max(14, { message: 'O CPF deve ter no máximo 14 caracteres.' }),
  dataNascimento: z.date().optional(),
  
  // Dados de Membro
  cargo: z.string({ required_error: 'O cargo é obrigatório.' }),
  congregacao: z.string({ required_error: 'A congregação é obrigatória.' }),
  dataBatismo: z.date().optional(),

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

export default function NewMemberPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const congregacoesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'congregacoes') : null),
    [firestore]
  );
  const { data: congregacoes, isLoading: loadingCongregacoes } = useCollection<Congregacao>(congregacoesCollection);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      rg: '',
      cpf: '',
      cargo: 'Membro',
      congregacao: '',
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
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Erro de conexão', description: 'Não foi possível conectar ao banco de dados.' });
        return;
    }
    setIsSubmitting(true);
    try {
      const memberData = {
        ...values,
      }
      await addMember(firestore, memberData);
      toast({
        title: 'Sucesso!',
        description: 'Novo membro cadastrado com sucesso.',
      });
      router.push('/dashboard/members');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao cadastrar',
            description: 'Não foi possível salvar o membro. Tente novamente.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
      <div className="w-full min-h-screen flex justify-center bg-secondary p-4 md:p-8 pt-6">
        <div className="w-full max-w-4xl">
            <Card>
                <CardHeader>
                <CardTitle>Cadastro de Novo Membro</CardTitle>
                <CardDescription>Preencha os dados abaixo para cadastrar um novo membro.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
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
                                    <Input placeholder="Nome completo do membro" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                                control={form.control}
                                name="dataNascimento"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col pt-2">
                                    <FormLabel>Data de Nascimento</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? (
                                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                            ) : (
                                                <span>Escolha uma data</span>
                                            )}
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                captionLayout="dropdown-nav"
                                                fromYear={1920}
                                                toYear={new Date().getFullYear()}
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                                    <SelectItem value="Pastor Dirigente/Local">Pastor Dirigente/Local</SelectItem>
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
                                        {congregacoes && congregacoes.map((c) => (
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
                                    <FormItem className="flex flex-col pt-2">
                                    <FormLabel>Data de Batismo</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? (
                                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                            ) : (
                                                <span>Escolha uma data</span>
                                            )}
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                captionLayout="dropdown-nav"
                                                fromYear={1920}
                                                toYear={new Date().getFullYear()}
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                        {isSubmitting ? 'Cadastrando...' : 'Cadastrar Membro'}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
             <div className="pb-8"/>
        </div>
    </div>
  );
}
