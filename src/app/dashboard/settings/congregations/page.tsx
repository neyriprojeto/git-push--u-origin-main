'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addCongregacao, deleteCongregacao, updateCongregacao } from '@/firebase/firestore/mutations';
import { Trash2, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

type Congregacao = {
  id: string;
  nome: string;
  endereco?: string;
};

export default function CongregationsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [newCongregacao, setNewCongregacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const congregacoesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'congregacoes') : null),
    [firestore]
  );
  const { data: congregacoes, isLoading: loading } = useCollection<Congregacao>(congregacoesCollection);
  
  // State to hold addresses being edited
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  const handleAddressChange = (id: string, value: string) => {
    setAddresses(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAddress = async (id: string) => {
    if (!firestore) return;
    const address = addresses[id];
    if (typeof address === 'undefined') return; // Nothing to save

    try {
      await updateCongregacao(firestore, id, { endereco: address });
      toast({
        title: 'Sucesso!',
        description: 'Endereço da congregação atualizado.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar o endereço.',
      });
    }
  };

  const handleAddCongregacao = async () => {
    if (!firestore || newCongregacao.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O nome da congregação não pode estar vazio.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addCongregacao(firestore, newCongregacao);
      setNewCongregacao('');
      toast({
        title: 'Sucesso!',
        description: 'Nova congregação adicionada.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar',
        description: error.message || 'Não foi possível adicionar a congregação.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCongregacao = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteCongregacao(firestore, id);
      toast({
        title: 'Sucesso!',
        description: 'Congregação removida.',
      });
    } catch (error: any) {
         toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: error.message || 'Não foi possível remover a congregação.',
      });
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Congregações</CardTitle>
            <CardDescription>Adicione ou remova congregações da sua igreja e gerencie seus endereços para a página inicial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="text"
                placeholder="Nome da nova congregação"
                value={newCongregacao}
                onChange={(e) => setNewCongregacao(e.target.value)}
                disabled={isSubmitting}
              />
              <Button onClick={handleAddCongregacao} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Adicionar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Congregações Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : congregacoes && congregacoes.length === 0 ? (
                <p className="text-muted-foreground text-center p-4">Nenhuma congregação cadastrada.</p>
            ) : (
              <ul className="space-y-4">
                {congregacoes?.map((c) => (
                  <li key={c.id} className="flex flex-col gap-2 p-4 border rounded-md">
                    <div className='flex items-center justify-between'>
                      <span className="font-medium">{c.nome}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Isso removerá permanentemente a congregação.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCongregacao(c.id)} className="bg-destructive hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                     <div className="space-y-2">
                        <Textarea
                          placeholder="Digite o endereço da congregação..."
                          value={addresses[c.id] ?? c.endereco ?? ''}
                          onChange={(e) => handleAddressChange(c.id, e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleSaveAddress(c.id)} disabled={typeof addresses[c.id] === 'undefined'}>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Endereço
                        </Button>
                      </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
