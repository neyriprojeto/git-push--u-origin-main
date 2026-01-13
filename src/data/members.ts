export type Member = {
  id: string;
  name: string;
  avatar: string;
  role: 'Membro' | 'Líder' | 'Pastor' | 'Diácono';
  status: 'Ativo' | 'Inativo';
  memberSince: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  history: { date: string; event: string }[];
  participation: { group: string; role: string }[];
};

export const members: Member[] = [
  {
    id: '1',
    name: 'João da Silva',
    avatar: 'member-avatar-1',
    role: 'Líder',
    status: 'Ativo',
    memberSince: '2015-03-12',
    email: 'joao.silva@email.com',
    phone: '(11) 98765-4321',
    address: 'Rua das Flores, 123, São Paulo, SP',
    birthDate: '1985-07-20',
    history: [
      { date: '2015-03-12', event: 'Tornou-se membro' },
      { date: '2018-01-15', event: 'Batismo' },
      { date: '2020-05-10', event: 'Assumiu liderança de grupo pequeno' },
    ],
    participation: [
      { group: 'Grupo de Louvor', role: 'Vocalista' },
      { group: 'Grupo de Jovens', role: 'Líder' },
    ],
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    avatar: 'member-avatar-2',
    role: 'Membro',
    status: 'Ativo',
    memberSince: '2018-07-22',
    email: 'maria.oliveira@email.com',
    phone: '(21) 91234-5678',
    address: 'Avenida Copacabana, 456, Rio de Janeiro, RJ',
    birthDate: '1992-11-30',
    history: [
        { date: '2018-07-22', event: 'Tornou-se membro' },
        { date: '2019-04-01', event: 'Batismo' },
    ],
    participation: [
        { group: 'Ministério Infantil', role: 'Professora' },
    ]
  },
  {
    id: '3',
    name: 'Pedro Santos',
    avatar: 'member-avatar-3',
    role: 'Diácono',
    status: 'Ativo',
    memberSince: '2010-01-05',
    email: 'pedro.santos@email.com',
    phone: '(31) 99999-8888',
    address: 'Praça da Liberdade, 789, Belo Horizonte, MG',
    birthDate: '1978-02-14',
    history: [
        { date: '2010-01-05', event: 'Tornou-se membro' },
        { date: '2012-06-18', event: 'Consagrado a diácono' },
    ],
    participation: [
        { group: 'Corpo Diaconal', role: 'Diácono' },
        { group: 'Ação Social', role: 'Coordenador' },
    ]
  },
  {
    id: '4',
    name: 'Ana Costa',
    avatar: 'member-avatar-4',
    role: 'Membro',
    status: 'Inativo',
    memberSince: '2021-02-19',
    email: 'ana.costa@email.com',
    phone: '(71) 98888-7777',
    address: 'Rua do Pelourinho, 321, Salvador, BA',
    birthDate: '2001-09-03',
    history: [
        { date: '2021-02-19', event: 'Tornou-se membro' },
    ],
    participation: []
  },
];
