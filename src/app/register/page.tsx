
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
import { addMember, useFirestore } from '@/firebase';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import { AppLogo } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  // Dados Pessoais (Obrigatórios)
  nome: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  rg: z.string().min(1, { message: 'O RG é obrigatório.' }),
  cpf: z.string().min(11, { message: 'O CPF deve ter 11 caracteres.' }).max(14, { message: 'O CPF deve ter no máximo 14 caracteres.' }),
  cargo: z.string({ required_error: 'O cargo é obrigatório.' }),
  congregacao: z.string({ required_error: 'A congregação é obrigatória.' }),
  dataNascimento: z.date({ required_error: 'A data de nascimento é obrigatória.' }),
  
  // Dados de Membro
  dataBatismo: z.date().optional(),
  dataMembro: z.date().optional(),

  // Endereço
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

export default function RegisterPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      rg: '',
      cpf: '',
      cargo: 'Membro',
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
      setIsSubmitted(true);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao cadastrar',
            description: 'Não foi possível salvar o cadastro. Tente novamente.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (isSubmitted) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
              <Card className="w-full max-w-lg">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Cadastro Enviado!</h2>
                    <p className="text-muted-foreground mb-6">
                        Obrigado por se cadastrar. Seus dados foram enviados para análise. Um administrador irá revisar e aprovar seu cadastro em breve.
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
        <div className="mx-auto flex justify-center mb-6">
            <Link href="/" className="flex items-center space-x-2 text-foreground">
                <AppLogo className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">A.D.KAIROS CONNECT</span>
            </Link>
        </div>
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Cadastro de Novo Membro</CardTitle>
          <CardDescription>Preencha os dados abaixo para se cadastrar.</CardDescription>
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
                        <FormItem>
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
                              <SelectItem value="Pastor Dirigente">Pastor Dirigente</SelectItem>
                              <SelectItem value="Pastor Local">Pastor Local</SelectItem>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a congregação" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ADKAIROS SEDE">ADKAIROS SEDE</SelectItem>
                              <SelectItem value="ADKAIROS VILA CARAQUATA">ADKAIROS VILA CARAQUATA</SelectItem>
                              <SelectItem value="ADKAIROS MATA VIRGEM">ADKAIROS MATA VIRGEM</SelectItem>
                              <SelectItem value="ADKAIROS VERANÓPOLIS BAIRRO SANTO ANTÔNIO">ADKAIROS VERANÓPOLIS BAIRRO SANTO ANTÔNIO</SelectItem>
                              <SelectItem value="ADKAIROS VERANÓPOLIS BAIRRO CENTRO">ADKAIROS VERANÓPOLIS BAIRRO CENTRO</SelectItem>
                            </SelectContent>
                          </Select>
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
                     <FormField
                        control={form.control}
                        name="dataNascimento"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Data de Nascimento</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                    ) : (
                                        <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
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
                <h3 className="text-lg font-medium">Dados de Membro</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="dataBatismo"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Data de Batismo (Opcional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                    ) : (
                                        <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date()}
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
                        name="dataMembro"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Membro Desde (Opcional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                    ) : (
                                        <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date()}
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
                {isSubmitting ? 'Enviando Cadastro...' : 'Enviar Cadastro'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
