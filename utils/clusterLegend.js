const CLUSTER_LEGEND = [
  {
    id: 'osec',
    name: 'Office of the Secretary (OSEC)',
    color: '#ef4444',
    account: {
      email: (process.env.CLUSTER_OSEC_EMAIL || 'cluster.osec@tesda.gov.ph').toLowerCase(),
      role: 'user',
      defaultPassword: process.env.CLUSTER_OSEC_PASSWORD || 'cluster123',
    },
    offices: [
      { name: 'Public Information Office (PIO)', color: '#ef4444', divisions: [] },
      { name: 'Scholarship Management Office (SMO)', color: '#ef4444', divisions: [] },
      { name: 'TESDA Board Secretariat (TBS)', color: '#ef4444', divisions: [] },
      { name: 'Internal Audit Division (IAD)', color: '#ef4444', divisions: [] },
      {
        name: 'Project Management Office (PMO) / Support to Innovations in the Philippine TVET System (SIPTVET)',
        color: '#ef4444',
        divisions: [],
      },
    ],
  },
  {
    id: 'oddg-pp',
    name: 'Office of the Deputy Director-General for Policies and Planning (ODDG-PP)',
    color: '#ec4899',
    account: {
      email: (process.env.CLUSTER_ODDG_PP_EMAIL || 'cluster.oddg.pp@tesda.gov.ph').toLowerCase(),
      role: 'user',
      defaultPassword: process.env.CLUSTER_ODDG_PP_PASSWORD || 'cluster123',
    },
    offices: [
      {
        name: 'Planning Office (PO)',
        color: '#ec4899',
        divisions: [
          'Policy Research and Evaluation Division (PRED)',
          'Policy and Planning Division (PPD)',
          'Foreign Relations and Project Development Division (FRPDD)',
          'Knowledge Management and Quality Assurance Division (KMQAD)',
          'Labor Market Information Division (LMID)',
        ],
      },
      {
        name: 'Qualifications and Standards Office (QSO)',
        color: '#ec4899',
        divisions: [
          'Competency Standards Development Division (CSDD)',
          'Competency Programs and Systems Development Division (CPSDD)',
          'Curriculum and Training Aids Development Division (CTADD)',
        ],
      },
      {
        name: 'National Institute for Technical Education and Skills Development (NITESD)',
        color: '#ec4899',
        divisions: [
          'Technology Research and Development Division (TRDD)',
          'Learning Development Division (LDD)',
        ],
      },
    ],
  },
  {
    id: 'oddg-ai',
    name: 'Office of the Deputy Director-General for Administration and Innovation (ODDG-AI)',
    color: '#06b6d4',
    account: {
      email: (process.env.CLUSTER_ODDG_AI_EMAIL || 'cluster.oddg.ai@tesda.gov.ph').toLowerCase(),
      role: 'user',
      defaultPassword: process.env.CLUSTER_ODDG_AI_PASSWORD || 'cluster123',
    },
    offices: [
      {
        name: 'Administrative Service (AS)',
        color: '#06b6d4',
        divisions: [
          'Human Resource Management Division (HRMD)',
          'Procurement Division (PD)',
          'General Services Division (GSD)',
        ],
      },
      {
        name: 'Information and Communication Technology Office (ICTO)',
        color: '#06b6d4',
        divisions: [
          'IT Operations Division (ITOD)',
          'IT Planning and Management Division (ITPMD)',
          'eTESDA Unit (e-TESDA)',
        ],
      },
    ],
  },
  {
    id: 'oddg-sc',
    name: 'Office of the Deputy Director General for Special Concerns (ODDG-SC)',
    color: '#f59e0b',
    account: {
      email: (process.env.CLUSTER_ODDG_SC_EMAIL || 'cluster.oddg.sc@tesda.gov.ph').toLowerCase(),
      role: 'user',
      defaultPassword: process.env.CLUSTER_ODDG_SC_PASSWORD || 'cluster123',
    },
    offices: [
      {
        name: 'Community and Local Government Engagement Office (CLGEO)',
        color: '#f59e0b',
        divisions: ['National Language Skills Center (NLSC)'],
      },
    ],
  },
  {
    id: 'oddg-pl',
    name: 'Office of the Deputy Director General for TVET Partnerships and Linkages (ODDG-PL)',
    color: '#8b5cf6',
    account: {
      email: (process.env.CLUSTER_ODDG_PL_EMAIL || 'cluster.oddg.pl@tesda.gov.ph').toLowerCase(),
      role: 'user',
      defaultPassword: process.env.CLUSTER_ODDG_PL_PASSWORD || 'cluster123',
    },
    offices: [
      {
        name: 'Partnership and Linkages Office (PLO)',
        color: '#8b5cf6',
        divisions: [
          'Partnership, Networking, and Assistance Division (PNAD)',
          'Partnership, Apprenticeship, and Incentives Division (PAID)',
        ],
      },
      { name: 'Enterprise-Based Education and Training Office (EBETO)', color: '#8b5cf6', divisions: [] },
    ],
  },
  {
    id: 'oddg-fla',
    name: 'Office of the Deputy Director General for Finance and Legal Affairs (ODDG-FLA)',
    color: '#22c55e',
    account: {
      email: (process.env.CLUSTER_ODDG_FLA_EMAIL || 'cluster.oddg.fla@tesda.gov.ph').toLowerCase(),
      role: 'user',
      defaultPassword: process.env.CLUSTER_ODDG_FLA_PASSWORD || 'cluster123',
    },
    offices: [
      {
        name: 'Financial and Management Service (FMS)',
        color: '#22c55e',
        divisions: [
          'Accounting Division (AD)',
          'Budget Division (BD)',
          'Legal Division (LD)',
        ],
      },
    ],
  },
  {
    id: 'oddg-tesdo',
    name: 'Office of the Deputy Director General for TESD Operations (ODDG-TESDO)',
    color: '#3b82f6',
    account: {
      email: (process.env.CLUSTER_ODDG_TESDO_EMAIL || 'cluster.oddg.tesdo@tesda.gov.ph').toLowerCase(),
      role: 'user',
      defaultPassword: process.env.CLUSTER_ODDG_TESDO_PASSWORD || 'cluster123',
    },
    offices: [
      {
        name: 'Certification Office (CO)',
        color: '#3b82f6',
        divisions: [
          'Competency Assessment Division (CAD)',
          'Program Registration Division (PRD)',
        ],
      },
      {
        name: 'Regional Operations Management Office (ROMO)',
        color: '#3b82f6',
        divisions: [
          'Regional Operations Management Division (ROMD)',
          'National Skills Olympics and WorldSkills Philippine Section (NSOWPS)',
        ],
      },
    ],
  },
];

module.exports = { CLUSTER_LEGEND };
