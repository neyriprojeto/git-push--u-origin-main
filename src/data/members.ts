
export type Member = {
  id: string; // Identificador único do usuário
  name: string; // Nome Completo
  avatar: string; // Foto do Perfil (URL)
  email: string; // Usado para login e contato
  recordNumber: string; // Número da Ficha
  status: 'Ativo' | 'Inativo' | 'Pendente'; // Situação
  gender?: 'Masculino' | 'Feminino';
  birthDate: string;
  maritalStatus?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)';
  cpf?: string;
  rg?: string;
  nationality?: string;
  naturalness?: string; // Naturalidade (cidade/estado de nascimento)
  phone: string;
  whatsapp?: string;
  role: 'Membro' | 'Líder' | 'Pastor' | 'Diácono' | 'Admin' | 'Administrador'; // Cargo
  memberSince: string;
  history: { date: string; event: string }[];
  participation: { group: string; role: string }[];
  address: string;
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
    recordNumber: '001',
    phone: '(11) 98765-4321',
    address: 'Rua das Flores, 123, São Paulo, SP',
    birthDate: '1985-07-20',
    maritalStatus: 'Casado(a)',
    rg: '12.345.678-9',
    cpf: '123.456.789-00',
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
    recordNumber: '002',
    phone: '(21) 91234-5678',
    address: 'Avenida Copacabana, 456, Rio de Janeiro, RJ',
    birthDate: '1992-11-30',
    maritalStatus: 'Solteiro(a)',
    rg: '23.456.789-0',
    cpf: '234.567.890-11',
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
    recordNumber: '003',
    phone: '(31) 99999-8888',
    address: 'Praça da Liberdade, 789, Belo Horizonte, MG',
    birthDate: '1978-02-14',
    maritalStatus: 'Casado(a)',
    rg: '34.567.890-1',
    cpf: '345.678.901-22',
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
    recordNumber: '004',
    phone: '(71) 98888-7777',
    address: 'Rua do Pelourinho, 321, Salvador, BA',
    birthDate: '2001-09-03',
    maritalStatus: 'Solteiro(a)',
    rg: '45.678.901-2',
    cpf: '456.789.012-33',
    history: [
        { date: '2021-02-19', event: 'Tornou-se membro' },
    ],
    participation: []
  },
  {
    id: '5',
    name: 'AD Kairós',
    avatar: 'church-banner',
    role: 'Administrador',
    status: 'Ativo',
    memberSince: '2000-01-01',
    email: 'admin@adkairos.com',
    recordNumber: '000',
    phone: '(11) 1234-5678',
    address: 'Rua Presidente Prudente, 28, Eldorado, Diadema - SP, 09972-300',
    birthDate: '2000-01-01',
    maritalStatus: 'N/A',
    rg: '5528207',
    cpf: '023.482.291-02',
    history: [],
    participation: []
  },
];

    