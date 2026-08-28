import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

type RiskType = 'falls' | 'pressure_ulcer' | 'dvt' | 'malnutrition';
type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';

interface RiskAssessment {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  bedNumber: string;
  assessmentDate: string;
  assessedBy: string;
  riskType: RiskType;
  score: number;
  maxScore: number;
  riskLevel: RiskLevel;
  factors: string[];
  interventions: string[];
  nextAssessment: string;
}

const RISK_TYPE_CONFIG: Record<RiskType, { label: string; icon: string; color: string; scale: string }> = {
  falls: { label: 'Falls Risk', icon: '⚠️', color: 'text-orange-600', scale: 'Morse Falls Scale (0-125)' },
  pressure_ulcer: { label: 'Pressure Ulcer Risk', icon: '🩹', color: 'text-purple-600', scale: 'Braden Scale (6-23)' },
  dvt: { label: 'DVT Risk', icon: '🩸', color: 'text-red-600', scale: 'Padua Prediction Score (0-20)' },
  malnutrition: { label: 'Malnutrition Risk', icon: '🍽️', color: 'text-amber-600', scale: 'MUST Score (0-6)' }
};

const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low: { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  moderate: { label: 'Moderate Risk', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  high: { label: 'High Risk', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  very_high: { label: 'Very High Risk', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
};

const ASSESSMENTS: RiskAssessment[] = [
  {
    id: 'RA001', patientId: 'P001', patientName: 'Kwame Mensah', ward: 'Medical', bedNumber: 'M-12',
    assessmentDate: '2024-01-16', assessedBy: 'Nurse Ama', riskType: 'falls', score: 75, maxScore: 125,
    riskLevel: 'high',
    factors: ['History of falls', 'Use of assistive device', 'Impaired gait', 'Environmental hazards'],
    interventions: ['Bed alarm activated', 'Fall risk bracelet', 'Hourly rounding', 'Non-slip footwear'],
    nextAssessment: '2024-01-17'
  },
  {
    id: 'RA002', patientId: 'P002', patientName: 'Ama Darko', ward: 'Surgical', bedNumber: 'S-08',
    assessmentDate: '2024-01-16', assessedBy: 'Nurse Kofi', riskType: 'pressure_ulcer', score: 14, maxScore: 23,
    riskLevel: 'moderate',
    factors: ['Immobility', 'Moisture', 'Poor nutrition', 'Age > 65'],
    interventions: ['Reposition Q2H', 'Pressure-relieving mattress', 'Skin care protocol', 'Nutritional support'],
    nextAssessment: '2024-01-17'
  },
  {
    id: 'RA003', patientId: 'P003', patientName: 'Yaw Boateng', ward: 'Medical', bedNumber: 'M-05',
    assessmentDate: '2024-01-16', assessedBy: 'Nurse Ama', riskType: 'dvt', score: 8, maxScore: 20,
    riskLevel: 'high',
    factors: ['Active cancer', 'Immobility', 'History of DVT', 'Obesity'],
    interventions: ['LMWH prophylaxis', 'Compression stockings', 'Ambulation assistance', 'Fluid hydration'],
    nextAssessment: '2024-01-18'
  },
  {
    id: 'RA004', patientId: 'P004', patientName: 'Efua Ansah', ward: 'Paediatrics', bedNumber: 'P-03',
    assessmentDate: '2024-01-16', assessedBy: 'Nurse Esi', riskType: 'malnutrition', score: 1, maxScore: 6,
    riskLevel: 'low',
    factors: ['Adequate oral intake', 'No weight loss', 'No acute disease'],
    interventions: ['Monitor dietary intake', 'Weekly weight', 'Nutritional education'],
    nextAssessment: '2024-01-23'
  },
  {
    id: 'RA005', patientId: 'P005', patientName: 'Abena Pokua', ward: 'ICU', bedNumber: 'ICU-02',
    assessmentDate: '2024-01-16', assessedBy: 'Nurse Akua', riskType: 'pressure_ulcer', score: 10, maxScore: 23,
    riskLevel: 'very_high',
    factors: ['Immobile', 'Incontinent', 'Poor nutrition', 'Altered sensory', 'Critical illness'],
    interventions: ['Q1H repositioning', 'Specialty mattress', 'Barrier cream', 'Enteral nutrition', 'Skin inspection'],
    nextAssessment: '2024-01-17'
  },
  {
    id: 'RA006', patientId: 'P006', patientName: 'Kofi Amoako', ward: 'Surgical', bedNumber: 'S-15',
    assessmentDate: '2024-01-15', assessedBy: 'Nurse Kofi', riskType: 'falls', score: 30, maxScore: 125,
    riskLevel: 'low',
    factors: ['Independent mobility', 'Alert and oriented', 'No assistive devices'],
    interventions: ['Standard fall precautions', 'Call bell within reach', 'Environment assessment'],
    nextAssessment: '2024-01-18'
  },
  {
    id: 'RA007', patientId: 'P007', patientName: 'Adwoa Frema', ward: 'Maternity', bedNumber: 'MAT-06',
    assessmentDate: '2024-01-16', assessedBy: 'Nurse Akua', riskType: 'dvt', score: 3, maxScore: 20,
    riskLevel: 'low',
    factors: ['Post-partum', 'Ambulatory', 'No thrombophilia history'],
    interventions: ['Early mobilization', 'Hydration', 'Compression stockings'],
    nextAssessment: '2024-01-18'
  },
  {
    id: 'RA008', patientId: 'P008', patientName: 'Nana Agyeman', ward: 'Medical', bedNumber: 'M-20',
    assessmentDate: '2024-01-16', assessedBy: 'Nurse Ama', riskType: 'malnutrition', score: 4, maxScore: 6,
    riskLevel: 'high',
    factors: ['BMI < 20', 'Unintentional weight loss > 10%', 'Acute disease effect'],
    interventions: ['Dietitian referral', 'Oral nutritional supplements', 'Fortified meals', 'Daily weight'],
    nextAssessment: '2024-01-18'
  }
];

export default function PatientRiskAssessment() {
  const [activeTab, setActiveTab] = useState<'assessments' | 'risk_matrix' | 'analytics' | 'guidelines'>('assessments');
  const [riskFilter, setRiskFilter] = useState<RiskType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<RiskLevel | 'all'>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  const filtered = ASSESSMENTS.filter(a => {
    if (riskFilter !== 'all' && a.riskType !== riskFilter) return false;
    if (levelFilter !== 'all' && a.riskLevel !== levelFilter) return false;
    return true;
  });

  const stats = {
    total: ASSESSMENTS.length,
    highVeryHigh: ASSESSMENTS.filter(a => a.riskLevel === 'high' || a.riskLevel === 'very_high').length,
    falls: ASSESSMENTS.filter(a => a.riskType === 'falls').length,
    pressure: ASSESSMENTS.filter(a => a.riskType === 'pressure_ulcer').length,
    dvt: ASSESSMENTS.filter(a => a.riskType === 'dvt').length,
    malnutrition: ASSESSMENTS.filter(a => a.riskType === 'malnutrition').length
  };

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Risk Assessment"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Risk Assessment</h1>
          <p className="text-gray-500">Falls, pressure ulcer, DVT, and malnutrition risk scoring</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Assessment</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-500' },
          { label: 'High/Very High', value: stats.highVeryHigh, color: 'bg-red-500' },
          { label: 'Falls', value: stats.falls, color: 'bg-orange-500' },
          { label: 'Pressure Ulcer', value: stats.pressure, color: 'bg-purple-500' },
          { label: 'DVT', value: stats.dvt, color: 'bg-red-600' },
          { label: 'Malnutrition', value: stats.malnutrition, color: 'bg-amber-500' }
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white p-3 rounded-xl text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs opacity-90">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['assessments', 'risk_matrix', 'analytics', 'guidelines'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab === 'assessments' ? 'Assessments' : tab === 'risk_matrix' ? 'Risk Matrix' : tab === 'analytics' ? 'Analytics' : 'Guidelines'}
          </button>
        ))}
      </div>

      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as RiskType | 'all')}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="all">All Risk Types</option>
              <option value="falls">Falls</option>
              <option value="pressure_ulcer">Pressure Ulcer</option>
              <option value="dvt">DVT</option>
              <option value="malnutrition">Malnutrition</option>
            </select>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value as RiskLevel | 'all')}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
            </select>
          </div>

          <div className="space-y-3">
            {filtered.map(assessment => {
              const riskType = RISK_TYPE_CONFIG[assessment.riskType];
              const riskLevel = RISK_LEVEL_CONFIG[assessment.riskLevel];
              const isSelected = selectedAssessment === assessment.id;
              const scorePercent = (assessment.score / assessment.maxScore) * 100;
              return (
                <div key={assessment.id} className={`border ${riskLevel.bg} rounded-xl p-4 transition-all ${isSelected ? 'ring-2 ring-blue-300' : ''}`}
                  onClick={() => setSelectedAssessment(isSelected ? null : assessment.id)}>
                  <div className="flex items-start justify-between cursor-pointer">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{riskType.icon}</span>
                        <span className="font-bold">{assessment.patientName}</span>
                        <Badge className={`${riskType.color} bg-white border`}>{riskType.label}</Badge>
                        <Badge className={`${riskLevel.color} bg-white border`}>{riskLevel.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Ward: {assessment.ward} | Bed: {assessment.bedNumber} | Assessed by: {assessment.assessedBy}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-sm text-gray-600">Score:</span>
                        <div className="w-40 h-3 bg-white rounded-full overflow-hidden border">
                          <div className={`h-full rounded-full transition-all ${
                            assessment.riskLevel === 'very_high' ? 'bg-red-500' :
                            assessment.riskLevel === 'high' ? 'bg-orange-500' :
                            assessment.riskLevel === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} style={{ width: `${scorePercent}%` }} />
                        </div>
                        <span className="font-bold">{assessment.score}/{assessment.maxScore}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{assessment.assessmentDate}</span>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Risk Factors:</p>
                        <div className="flex flex-wrap gap-1">
                          {assessment.factors.map((f, i) => (
                            <Badge key={i} className="bg-white border text-gray-600 text-xs">{f}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Interventions:</p>
                        <div className="flex flex-wrap gap-1">
                          {assessment.interventions.map((int, i) => (
                            <Badge key={i} className="bg-blue-50 border-blue-200 text-blue-600 text-xs">{int}</Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Next Assessment: {assessment.nextAssessment}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Matrix Tab */}
      {activeTab === 'risk_matrix' && (
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(RISK_TYPE_CONFIG).map(([type, config]) => {
            const typeAssessments = ASSESSMENTS.filter(a => a.riskType === type);
            return (
              <div key={type} className="border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{config.icon}</span>
                  <h3 className="font-bold text-lg">{config.label}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">{config.scale}</p>
                <div className="space-y-2">
                  {typeAssessments.map(a => {
                    const level = RISK_LEVEL_CONFIG[a.riskLevel];
                    return (
                      <div key={a.id} className={`p-2 rounded-lg border ${level.bg}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{a.patientName}</span>
                          <span className={`text-sm font-bold ${level.color}`}>{a.score}/{a.maxScore}</span>
                        </div>
                        <p className="text-xs text-gray-500">{a.ward} - Bed {a.bedNumber}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Risk Level Distribution</h4>
            <div className="space-y-3">
              {(['very_high', 'high', 'moderate', 'low'] as const).map(level => {
                const count = ASSESSMENTS.filter(a => a.riskLevel === level).length;
                const config = RISK_LEVEL_CONFIG[level];
                return (
                  <div key={level} className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${config.color} w-24`}>{config.label}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        level === 'very_high' ? 'bg-red-500' : level === 'high' ? 'bg-orange-500' : level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} style={{ width: `${(count / ASSESSMENTS.length) * 100}%` }} />
                    </div>
                    <span className="font-bold text-sm">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Ward Distribution</h4>
            <div className="space-y-3">
              {Object.entries(ASSESSMENTS.reduce<Record<string, number>>((acc, a) => {
                acc[a.ward] = (acc[a.ward] || 0) + 1;
                return acc;
              }, {})).map(([ward, count]) => (
                <div key={ward} className="flex items-center justify-between">
                  <span className="text-gray-600">{ward}</span>
                  <Badge className="bg-blue-50 text-blue-600">{count} patients</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guidelines Tab */}
      {activeTab === 'guidelines' && (
        <div className="space-y-4">
          {Object.entries(RISK_TYPE_CONFIG).map(([type, config]) => (
            <div key={type} className="border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{config.icon}</span>
                <h3 className="font-bold text-lg">{config.label}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-2">{config.scale}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-bold text-gray-700 mb-1">Scoring Criteria:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {type === 'falls' && <>
                      <li>Fall history within 3 months</li>
                      <li>Secondary diagnosis (2+ medical conditions)</li>
                      <li>Ambulatory aid use</li>
                      <li>IV/Heparin lock</li>
                      <li>Gait type and mental status</li>
                    </>}
                    {type === 'pressure_ulcer' && <>
                      <li>Sensory perception</li>
                      <li>Moisture</li>
                      <li>Activity</li>
                      <li>Mobility</li>
                      <li>Nutrition and friction/shear</li>
                    </>}
                    {type === 'dvt' && <>
                      <li>Active or metastatic cancer</li>
                      <li>Complete immobilization</li>
                      <li>Known thrombophilia</li>
                      <li>Recent surgery/trauma</li>
                      <li>Age, BMI, DVT history</li>
                    </>}
                    {type === 'malnutrition' && <>
                      <li>BMI score</li>
                      <li>Unintentional weight loss</li>
                      <li>Acute disease effect</li>
                      <li>Overall risk categories</li>
                    </>}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-gray-700 mb-1">Required Interventions:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {type === 'falls' && <>
                      <li>Fall risk bracelet</li>
                      <li>Bed alarm (if available)</li>
                      <li>Non-slip footwear</li>
                      <li>Hourly rounding</li>
                      <li>Environment assessment</li>
                    </>}
                    {type === 'pressure_ulcer' && <>
                      <li>Reposition every 2 hours</li>
                      <li>Pressure-relieving device</li>
                      <li>Skin care protocol</li>
                      <li>Nutritional support</li>
                      <li>Moisture management</li>
                    </>}
                    {type === 'dvt' && <>
                      <li>Pharmacological prophylaxis</li>
                      <li>Compression stockings</li>
                      <li>Early ambulation</li>
                      <li>Hydration</li>
                      <li>Patient education</li>
                    </>}
                    {type === 'malnutrition' && <>
                      <li>Dietitian referral</li>
                      <li>Oral nutritional supplements</li>
                      <li>Fortified meals</li>
                      <li>Daily weight monitoring</li>
                      <li>Nutritional education</li>
                    </>}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
