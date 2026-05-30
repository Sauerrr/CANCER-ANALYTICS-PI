
var USERS = {
  'admin@ca.ai': {
    password: 'demo1234',
    name:     'Dr. Rodrigues',
    initials: 'DR',
    role:     'Hematologista'
  }
};

var PATIENTS = [
  {
    id: 'P-001', name: 'Ana Beatriz Souza', age: 34, sex: 'F',
    blood_type: 'A+', diagnosis_history: 'Anemia ferropriva (2021)',
    last_exam: '2025-05-12', status: 'danger',
    exams: [
      { id: 'E-012', date: '2025-05-12', result: 'POSITIVO',  confidence: 96.4, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v2.1' },
      { id: 'E-009', date: '2025-04-03', result: 'NEGATIVO',  confidence: 88.7, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v2.0' },
      { id: 'E-005', date: '2025-02-17', result: 'NEGATIVO',  confidence: 91.2, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v1.9' }
    ]
  },
  {
    id: 'P-002', name: 'Carlos Eduardo Lima', age: 57, sex: 'M',
    blood_type: 'O-', diagnosis_history: 'Hipertensão arterial, Diabetes tipo 2',
    last_exam: '2025-05-08', status: 'success',
    exams: [
      { id: 'E-011', date: '2025-05-08', result: 'NEGATIVO', confidence: 92.1, acc: 94.2, recall: 93.0, f1: 93.6, file: '🔬', model: 'ResNet-50 v2.1' },
      { id: 'E-007', date: '2025-03-20', result: 'NEGATIVO', confidence: 89.3, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v2.0' }
    ]
  },
  {
    id: 'P-003', name: 'Fernanda Oliveira', age: 22, sex: 'F',
    blood_type: 'B+', diagnosis_history: 'Sem histórico relevante',
    last_exam: '2025-05-01', status: 'danger',
    exams: [
      { id: 'E-010', date: '2025-05-01', result: 'POSITIVO', confidence: 98.8, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v2.1' }
    ]
  },
  {
    id: 'P-004', name: 'Marcos Henrique Dias', age: 45, sex: 'M',
    blood_type: 'AB+', diagnosis_history: 'Leucemia mieloide (remissão 2022)',
    last_exam: '2025-04-22', status: 'warning',
    exams: [
      { id: 'E-008', date: '2025-04-22', result: 'INCONCLUSIVO', confidence: 61.3, acc: 92.8, recall: 88.4, f1: 90.5, file: '🔬', model: 'ResNet-50 v2.0' },
      { id: 'E-004', date: '2025-01-10', result: 'POSITIVO',     confidence: 94.7, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v1.9' },
      { id: 'E-001', date: '2024-11-05', result: 'POSITIVO',     confidence: 97.1, acc: 94.1, recall: 97.2, f1: 95.6, file: '🔬', model: 'ResNet-50 v1.8' }
    ]
  },
  {
    id: 'P-005', name: 'Juliana Santos Freitas', age: 61, sex: 'F',
    blood_type: 'A-', diagnosis_history: 'Hipotireoidismo, artrite reumatoide',
    last_exam: '2025-03-14', status: 'success',
    exams: [
      { id: 'E-006', date: '2025-03-14', result: 'NEGATIVO', confidence: 95.6, acc: 94.2, recall: 93.0, f1: 93.6, file: '🔬', model: 'ResNet-50 v2.0' },
      { id: 'E-002', date: '2024-12-02', result: 'NEGATIVO', confidence: 90.4, acc: 93.5, recall: 91.2, f1: 92.3, file: '🔬', model: 'ResNet-50 v1.8' }
    ]
  }
];