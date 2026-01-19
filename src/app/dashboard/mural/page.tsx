
'use client'

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PlusCircle, Loader2, Upload, Trash2 } from 'lucide-react';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { addPost, deletePost } from '@/firebase/firestore/mutations';
import { useToast } from '@/hooks/use-toast';
import { uploadArquivo } from '@/lib/cloudinary';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


interface UserData {
  cargo?: string;
  nome: string;
  avatar?: string;
}

type Post = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  imageUrl?: string;
  createdAt: Timestamp;
};


export default function MuralPage() {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const userRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userRef);

  const postsCollection = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsCollection);


  const canPost = userData?.cargo === 'Administrador';

  const handleAddPost = async () => {
    if (!firestore || !user || !userData) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para postar.' });
      return;
    }
    if (newPostTitle.trim() === '' || newPostContent.trim() === '') {
      toast({ variant: 'destructive', title: 'Erro', description: 'Título e conteúdo são obrigatórios.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl: string | undefined = undefined;
      if (newPostImage) {
        imageUrl = await uploadArquivo(newPostImage);
      }

      const postData = {
        title: newPostTitle,
        content: newPostContent,
        authorId: user.uid,
        authorName: userData.nome,
        authorAvatar: userData.avatar || '',
        imageUrl: imageUrl,
      };

      await addPost(firestore, postData);
      
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostImage(null);
      if(imageInputRef.current) imageInputRef.current.value = '';

      toast({ title: 'Sucesso!', description: 'Sua postagem foi publicada no mural.' });
    } catch (error) {
      console.error("Error adding post: ", error);
      toast({ variant: 'destructive', title: 'Erro ao postar', description: 'Não foi possível publicar sua postagem.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeletePost = async (postId: string) => {
    if (!firestore) return;
    try {
      await deletePost(firestore, postId);
      toast({ title: 'Sucesso', description: 'Postagem removida.' });
    } catch (error) {
      console.error("Error deleting post: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover a postagem.' });
    }
  };

  const getAvatar = (post: Post) => {
    if (post.authorAvatar && post.authorAvatar.startsWith('http')) {
        return { imageUrl: post.authorAvatar };
    }
    return PlaceHolderImages.find((p) => p.id === post.authorAvatar);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mural de Avisos</h2>
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </div>

      {canPost && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Postagem</CardTitle>
            <CardDescription>Crie um novo aviso para todos os membros.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                placeholder="Título do aviso" 
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea 
                id="content" 
                placeholder="Escreva sua mensagem aqui..." 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Imagem (Opcional)</Label>
              <Input 
                id="image" 
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={(e) => setNewPostImage(e.target.files ? e.target.files[0] : null)}
                disabled={isSubmitting}
              />
              {newPostImage && <p className="text-sm text-muted-foreground">Arquivo selecionado: {newPostImage.name}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddPost} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="space-y-4">
        {isLoadingPosts ? (
           <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => {
            const avatar = getAvatar(post);
            return (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border">
                       {avatar && <AvatarImage src={avatar.imageUrl} alt={post.authorName} />}
                      <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5 flex-1">
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription>
                        Por {post.authorName} em {post.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    {canPost && (
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePost(post.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {post.imageUrl && (
                    <div className="mb-4 relative aspect-video w-full rounded-md overflow-hidden bg-muted/30">
                      <Image src={post.imageUrl} alt={post.title} layout="fill" objectFit="contain" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Nenhuma postagem no mural ainda.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
