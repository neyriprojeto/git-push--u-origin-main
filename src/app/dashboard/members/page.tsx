
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { members, Member } from "@/data/members";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Eye } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function MembersPage() {
  const displayMembers = members.filter(m => m.role !== 'Administrador');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Membros</h2>
         <div className="md:hidden">
            <SidebarTrigger />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>
            Uma lista de todos os membros da igreja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Membro desde</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayMembers.map((member: Member) => {
                const avatar = PlaceHolderImages.find(
                  (p) => p.id === member.avatar
                );
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {avatar && <AvatarImage src={avatar.imageUrl} alt={avatar.description} data-ai-hint={avatar.imageHint} />}
                          <AvatarFallback>
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-xs text-muted-foreground md:hidden">{member.role}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{member.role}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={member.status === "Ativo" ? "default" : "secondary"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(member.memberSince).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dashboard/members/${member.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver Perfil</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    