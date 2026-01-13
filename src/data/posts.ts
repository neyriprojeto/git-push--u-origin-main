
export type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  date: string;
};

export const posts: Post[] = [
  {
    id: '1',
    title: 'Culto de Domingo',
    content: 'Não se esqueça do nosso culto de celebração neste Domingo às 18h. Teremos um momento especial de louvor e adoração. Convide um amigo!',
    author: 'Pastor Carlos',
    authorAvatar: 'member-avatar-3',
    date: '2024-07-20T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'Reunião de Oração',
    content: 'Nossa reunião de oração semanal acontecerá na Quarta-feira, às 19h30. Vamos juntos buscar a face do Senhor.',
    author: 'Líder Maria',
    authorAvatar: 'member-avatar-2',
    date: '2024-07-18T15:30:00.000Z',
  },
    {
    id: '3',
    title: 'Campanha do Agasalho',
    content: 'Estamos arrecadando agasalhos e cobertores para doar a quem precisa. As doações podem ser entregues na secretaria da igreja até o final do mês. Participe!',
    author: 'Ação Social',
    authorAvatar: 'member-avatar-1',
    date: '2024-07-15T09:00:00.000Z',
  },
];
