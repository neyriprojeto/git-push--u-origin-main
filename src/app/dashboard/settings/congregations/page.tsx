
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, addCongregacao, deleteCongregacao } from '@/firebase';
import { Trash2 } from 'lucide-react';
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

type Congregacao = {
  id: string;
  nome: string;
};

export default function CongregationsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { data: congregacoes, loading } = useCollection<Congregacao>('congregacoes');
  const [newCongregacao, setNewCongregacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            <CardDescription>Adicione ou remova congregações da sua igreja.</CardDescription>
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
                {isSubmitting ? 'Adicionando...' : 'Adicionar'}
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
              <p>Carregando congregações...</p>
            ) : congregacoes.length === 0 ? (
                <p>Nenhuma congregação cadastrada.</p>
            ) : (
              <ul className="space-y-2">
                {congregacoes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{c.nome}</span>
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
