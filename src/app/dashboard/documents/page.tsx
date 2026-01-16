'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const documents = [
    {
        title: "Carta de Recomendação",
        description: "Gere uma carta de recomendação ou mudança para um membro.",
        href: "/dashboard/documents/recommendation",
    },
    {
        title: "Certificado de Batismo",
        description: "Gere um certificado de batismo para um membro.",
        href: "/dashboard/documents/baptism",
    },
    {
        title: "Certificado de Apresentação",
        description: "Gere um certificado de apresentação de criança.",
        href: "/dashboard/documents/presentation",
    },
    {
        title: "Estatuto da Igreja",
        description: "Visualize ou baixe o estatuto oficial da igreja.",
        href: "/dashboard/documents/statute",
    },
];

export default function DocumentsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Gerador de Documentos</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Documentos Disponíveis</CardTitle>
                    <CardDescription>Selecione um documento para começar a gerar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {documents.map((doc) => (
                            <Link href={doc.href} key={doc.title}>
                                <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
                                    <div className="space-y-1">
                                        <p className="font-semibold">{doc.title}</p>
                                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
