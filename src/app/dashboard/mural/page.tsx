
'use client'

import { useState } from 'react';
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
import { posts as initialPosts, Post } from '@/data/posts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PlusCircle } from 'lucide-react';

export default function MuralPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const handleAddPost = () => {
    if (newPostTitle.trim() === '' || newPostContent.trim() === '') return;

    const newPost: Post = {
      id: `${posts.length + 1}`,
      title: newPostTitle,
      content: newPostContent,
      author: 'Admin', // This would be dynamic in a real app
      authorAvatar: 'member-avatar-1', // Placeholder
      date: new Date().toISOString(),
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
  };

  const getAvatar = (avatarId: string) => {
    return PlaceHolderImages.find((p) => p.id === avatarId);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mural de Avisos</h2>
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </div>

      {/* Form to add new post - This would be visible only to admins */}
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea 
              id="content" 
              placeholder="Escreva sua mensagem aqui..." 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddPost}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Publicar
          </Button>
        </CardFooter>
      </Card>

      {/* List of posts */}
      <div className="space-y-4">
        {posts.map((post) => {
          const avatar = getAvatar(post.authorAvatar);
          return (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border">
                     {avatar && <AvatarImage src={avatar.imageUrl} alt={avatar.description} />}
                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5">
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>
                      Por {post.author} em {new Date(post.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
