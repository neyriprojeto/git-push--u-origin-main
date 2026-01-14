
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
  role: 'Membro' | 'Líder' | 'Pastor' | 'Diácono' | 'Admin' | 'Administrador' | 'Pastor(a)'; // Cargo
  memberSince: string; // Data de Membresia
  baptismDate?: string; // Data de Batismo
  history: { date: string; event: string }[];
  participation: { group: string; role: string }[];
  address: string;
  addressNumber?: string;
  addressDistrict?: string;
  addressCity?: string;
  addressState?: string;
  addressCep?: string;
  congregation?: string;
  originChurch?: string;
  responsiblePastor?: string;
  observations?: string;
};

export const members: Member[] = [
  {
    id: '1',
    name: 'Jonatas Peres Galarce',
    avatar: 'member-avatar-1',
    role: 'Pastor(a)',
    status: 'Ativo',
    memberSince: '2019-01-08',
    baptismDate: '2007-01-08',
    email: 'jonatasgalrce@hotmail.com',
    recordNumber: '001',
    phone: '5499170-1536',
    whatsapp: '5499170-1536',
    address: 'Capitao Pelegrino Guzzo',
    addressNumber: '534',
    addressDistrict: 'Santo Antônio',
    addressCity: 'Veranópolis',
    addressState: 'RS',
    addressCep: '95330-000',
    birthDate: '1988-04-15',
    maritalStatus: 'Casado(a)',
    gender: 'Masculino',
    rg: '6092271995',
    cpf: '015.932.700-89',
    naturalness: 'Veranópolis/RS',
    nationality: 'Brasileira',
    congregation: 'A.D. Kairós Veranópolis - Bairro Santo Antônio',
    responsiblePastor: 'Jonatas Peres',
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
    naturalness: 'Rio de Janeiro/RJ',
    nationality: 'Brasileira',
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
    naturalness: 'Belo Horizonte/MG',
    nationality: 'Brasileira',
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
    naturalness: 'Salvador/BA',
    nationality: 'Brasileira',
    history: [
        { date: '2021-02-19', event: 'Tornou-se membro' },
    ],
    participation: []
  }
];
