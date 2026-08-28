import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import PortalLayout from './components/PortalLayout';
import AppLayout from './components/AppLayout';
import PageLoader from './components/PageLoader';

// Portal pages — lightweight, eagerly loaded
import Home from './pages/portal/Home';
import FindHealthcare from './pages/portal/FindHealthcare';
import FacilityProfile from './pages/portal/FacilityProfile';
import Login from './pages/portal/Login';
import ContentPage from './pages/portal/ContentPage';
import RegisterFacility from './pages/portal/RegisterFacility';
import PatientHome from './pages/patient/PatientHome';
import Purchase from './pages/portal/Purchase';
import PurchaseVerify from './pages/portal/PurchaseVerify';
import Activate from './pages/portal/Activate';

// Eagerly load the most common pages (Dashboard, Patients, Queue)
import Dashboard from './pages/app/Dashboard';
import Queue from './pages/app/Queue';
import Patients from './pages/app/Patients';
import PatientDetail from './pages/app/PatientDetail';

// Lazy-load everything else to code-split the bundle
const Register = lazy(() => import('./pages/app/Register'));
const Appointments = lazy(() => import('./pages/app/Appointments'));
const Pharmacy = lazy(() => import('./pages/app/Pharmacy'));
const Lab = lazy(() => import('./pages/app/Lab'));
const Stock = lazy(() => import('./pages/app/Stock'));
const Insurance = lazy(() => import('./pages/app/Insurance'));
const Assets = lazy(() => import('./pages/app/Assets'));
const Surveillance = lazy(() => import('./pages/app/Surveillance'));
const Admissions = lazy(() => import('./pages/app/Admissions'));
const Referrals = lazy(() => import('./pages/app/Referrals'));
const Immunizations = lazy(() => import('./pages/app/Immunizations'));
const Beds = lazy(() => import('./pages/app/Beds'));
const Ambulances = lazy(() => import('./pages/app/Ambulances'));
const BloodBank = lazy(() => import('./pages/app/BloodBank'));
const Theatre = lazy(() => import('./pages/app/Theatre'));
const Radiology = lazy(() => import('./pages/app/Radiology'));
const Telemedicine = lazy(() => import('./pages/app/Telemedicine'));
const Directorate = lazy(() => import('./pages/app/Directorate'));
const Gis = lazy(() => import('./pages/app/Gis'));
const Reports = lazy(() => import('./pages/app/Reports'));
const Integrations = lazy(() => import('./pages/app/Integrations'));
const Billing = lazy(() => import('./pages/app/Billing'));
const Ai = lazy(() => import('./pages/app/Ai'));
const DrugDatabase = lazy(() => import('./pages/app/DrugDatabase'));
const DiseaseReference = lazy(() => import('./pages/app/DiseaseReference'));
const DrAugustAI = lazy(() => import('./pages/app/DrAugustAI'));
const ClinicalGuidelines = lazy(() => import('./pages/app/ClinicalGuidelines'));
const PerformanceMonitor = lazy(() => import('./pages/app/PerformanceMonitor'));
const CacheStrategy = lazy(() => import('./pages/app/CacheStrategy'));
const Admin = lazy(() => import('./pages/app/Admin'));
const ApiConfig = lazy(() => import('./pages/app/ApiConfig'));
const SystemSettings = lazy(() => import('./pages/app/SystemSettings'));
const NotificationCenter = lazy(() => import('./pages/app/NotificationCenter'));
const StaffManagement = lazy(() => import('./pages/app/StaffManagement'));
const BulkImportExport = lazy(() => import('./pages/app/BulkImportExport'));
const SystemBackup = lazy(() => import('./pages/app/SystemBackup'));
const PatientPortal = lazy(() => import('./pages/patient/PatientPortal'));
const ClinicalDashboard = lazy(() => import('./pages/app/ClinicalDashboard'));
const DrugInteractionChecker = lazy(() => import('./pages/app/DrugInteractionChecker'));
const EmergencyAlerts = lazy(() => import('./pages/app/EmergencyAlerts'));
const EnvironmentMonitor = lazy(() => import('./pages/app/EnvironmentMonitor'));
const PatientSatisfaction = lazy(() => import('./pages/app/PatientSatisfaction'));
const DocumentManagement = lazy(() => import('./pages/app/DocumentManagement'));
const RevenueDashboard = lazy(() => import('./pages/app/RevenueDashboard'));
const BookAppointment = lazy(() => import('./pages/portal/BookAppointment'));
const BedManagement = lazy(() => import('./pages/app/BedManagement'));
const SystemGuide = lazy(() => import('./pages/app/SystemGuide'));
const Maternity = lazy(() => import('./pages/app/Maternity'));
const ClinicalNotes = lazy(() => import('./pages/app/ClinicalNotes'));
const MedicationAdministration = lazy(() => import('./pages/app/MedicationAdministration'));
const QualityAssurance = lazy(() => import('./pages/app/QualityAssurance'));
const WardRounds = lazy(() => import('./pages/app/WardRounds'));
const PatientTimeline = lazy(() => import('./pages/app/PatientTimeline'));
const SupplierProcurement = lazy(() => import('./pages/app/SupplierProcurement'));
const WasteManagement = lazy(() => import('./pages/app/WasteManagement'));
const ConsentForms = lazy(() => import('./pages/app/ConsentForms'));
const VitalRecords = lazy(() => import('./pages/app/VitalRecords'));
const EquipmentMaintenance = lazy(() => import('./pages/app/EquipmentMaintenance'));
const NutritionDiet = lazy(() => import('./pages/app/NutritionDiet'));
const HandoverNotes = lazy(() => import('./pages/app/HandoverNotes'));
const TheatreManagement = lazy(() => import('./pages/app/TheatreManagement'));
const BloodBankManagement = lazy(() => import('./pages/app/BloodBankManagement'));
const InsuranceClaims = lazy(() => import('./pages/app/InsuranceClaims'));
const MentalHealth = lazy(() => import('./pages/app/MentalHealth'));
const DentalClinic = lazy(() => import('./pages/app/DentalClinic'));
const Physiotherapy = lazy(() => import('./pages/app/Physiotherapy'));
const InfectionControl = lazy(() => import('./pages/app/InfectionControl'));
const StaffTraining = lazy(() => import('./pages/app/StaffTraining'));
const BudgetManagement = lazy(() => import('./pages/app/BudgetManagement'));
const ClinicalProtocols = lazy(() => import('./pages/app/ClinicalProtocols'));
const MedicalRecordsSummary = lazy(() => import('./pages/app/MedicalRecordsSummary'));
const PatientEducation = lazy(() => import('./pages/app/PatientEducation'));
const ServiceCharter = lazy(() => import('./pages/app/ServiceCharter'));
const NewsAnnouncements = lazy(() => import('./pages/app/NewsAnnouncements'));
const ReferralManagement = lazy(() => import('./pages/app/ReferralManagement'));
const DischargeSummary = lazy(() => import('./pages/app/DischargeSummary'));
const ClinicalAudit = lazy(() => import('./pages/app/ClinicalAudit'));
const MMReports = lazy(() => import('./pages/app/MMReports'));
const PatientComplaints = lazy(() => import('./pages/app/PatientComplaints'));
const WardManagement = lazy(() => import('./pages/app/WardManagement'));
const ApiGuide = lazy(() => import('./pages/app/ApiGuide'));
const IdCardBuilder = lazy(() => import('./pages/app/IdCardBuilder'));
const PharmacyDashboard = lazy(() => import('./pages/app/PharmacyDashboard'));
const DeveloperConsole = lazy(() => import('./pages/app/DeveloperConsole'));
const AdminHierarchy = lazy(() => import('./pages/app/AdminHierarchy'));
const Developer = lazy(() => import('./pages/app/Developer'));
const DistrictHealthDashboard = lazy(() => import('./components/DistrictHealthDashboard'));
const EnhancedPatientPortal = lazy(() => import('./pages/app/EnhancedPatientPortal'));
const TelemedicineConsult = lazy(() => import('./pages/app/TelemedicineConsult'));
const RadiologyPACS = lazy(() => import('./pages/app/RadiologyPACS'));
const LaboratoryInfoSystem = lazy(() => import('./pages/app/LaboratoryInfoSystem'));
const PharmacyDispensing = lazy(() => import('./pages/app/PharmacyDispensing'));
const PatientRiskAssessment = lazy(() => import('./pages/app/PatientRiskAssessment'));
const SurgicalSafetyChecklist = lazy(() => import('./pages/app/SurgicalSafetyChecklist'));
const SpecimenTracking = lazy(() => import('./pages/app/SpecimenTracking'));
const FacilityManagement = lazy(() => import('./pages/app/FacilityManagement'));
const PatientFlow = lazy(() => import('./pages/app/PatientFlow'));
const EmergencyDepartment = lazy(() => import('./pages/app/EmergencyDepartment'));
const BloodTransfusionService = lazy(() => import('./pages/app/BloodTransfusionService'));
const ClinicalPathwayBuilder = lazy(() => import('./pages/app/ClinicalPathwayBuilder'));
const HealthInfoExchange = lazy(() => import('./pages/app/HealthInfoExchange'));
const EmergencyPreparedness = lazy(() => import('./pages/app/EmergencyPreparedness'));
const ClinicalResearch = lazy(() => import('./pages/app/ClinicalResearch'));
const RemoteMonitoring = lazy(() => import('./pages/app/RemoteMonitoring'));
const SmartScheduling = lazy(() => import('./pages/app/SmartScheduling'));
const RevenueCycle = lazy(() => import('./pages/app/RevenueCycle'));
const HealthAnalytics = lazy(() => import('./pages/app/HealthAnalytics'));
const ICUManagement = lazy(() => import('./pages/app/ICUManagement'));
const PharmacyFormulary = lazy(() => import('./pages/app/PharmacyFormulary'));
const StaffCredentialing = lazy(() => import('./pages/app/StaffCredentialing'));
const CodeBlueEmergency = lazy(() => import('./pages/app/CodeBlueEmergency'));
const ExecutiveDashboard = lazy(() => import('./pages/app/ExecutiveDashboard'));
const FinancialDashboard = lazy(() => import('./pages/app/FinancialDashboard'));
const PatientPhoneTracking = lazy(() => import('./pages/app/PatientPhoneTracking'));
const HospitalAccreditation = lazy(() => import('./pages/app/HospitalAccreditation'));
const AuditTrail = lazy(() => import('./pages/app/AuditTrail'));
const PreAnaesthesiaAssessment = lazy(() => import('./pages/app/PreAnaesthesiaAssessment'));
const OphthalmologyClinic = lazy(() => import('./pages/app/OphthalmologyClinic'));
const ENTClinic = lazy(() => import('./pages/app/ENTClinic'));
const DermatologyClinic = lazy(() => import('./pages/app/DermatologyClinic'));
const OrthopaedicsClinic = lazy(() => import('./pages/app/OrthopaedicsClinic'));
const PaediatricGrowthCharts = lazy(() => import('./pages/app/PaediatricGrowthCharts'));
const StaffDirectory = lazy(() => import('./pages/app/StaffDirectory'));
const CardiologyClinic = lazy(() => import('./pages/app/CardiologyClinic'));
const NephrologyDialysis = lazy(() => import('./pages/app/NephrologyDialysis'));
const EndocrinologyClinic = lazy(() => import('./pages/app/EndocrinologyClinic'));
const PulmonologyClinic = lazy(() => import('./pages/app/PulmonologyClinic'));
const GastroenterologyClinic = lazy(() => import('./pages/app/GastroenterologyClinic'));
const OncologyClinic = lazy(() => import('./pages/app/OncologyClinic'));
const NeurologyClinic = lazy(() => import('./pages/app/NeurologyClinic'));
const UrologyClinic = lazy(() => import('./pages/app/UrologyClinic'));
const InfectiousDiseaseClinic = lazy(() => import('./pages/app/InfectiousDiseaseClinic'));
const RheumatologyClinic = lazy(() => import('./pages/app/RheumatologyClinic'));
const PainManagement = lazy(() => import('./pages/app/PainManagement'));
const PalliativeCare = lazy(() => import('./pages/app/PalliativeCare'));
const TransplantCoordination = lazy(() => import('./pages/app/TransplantCoordination'));
const GeriatricMedicine = lazy(() => import('./pages/app/GeriatricMedicine'));
const SpeechTherapy = lazy(() => import('./pages/app/SpeechTherapy'));
const OccupationalTherapy = lazy(() => import('./pages/app/OccupationalTherapy'));
const WoundCareClinic = lazy(() => import('./pages/app/WoundCareClinic'));
const DaySurgeryUnit = lazy(() => import('./pages/app/DaySurgeryUnit'));
const MedicalGenetics = lazy(() => import('./pages/app/MedicalGenetics'));
const RadiologyReporting = lazy(() => import('./pages/app/RadiologyReporting'));
const MicrobiologyLab = lazy(() => import('./pages/app/MicrobiologyLab'));
const FertilityCentre = lazy(() => import('./pages/app/FertilityCentre'));
const HyperbaricMedicine = lazy(() => import('./pages/app/HyperbaricMedicine'));
const SportsMedicine = lazy(() => import('./pages/app/SportsMedicine'));
const PathologyLab = lazy(() => import('./pages/app/PathologyLab'));
const NeonatalUnit = lazy(() => import('./pages/app/NeonatalUnit'));
const CardiacRehabilitation = lazy(() => import('./pages/app/CardiacRehabilitation'));
const RespiratoryRehabilitation = lazy(() => import('./pages/app/RespiratoryRehabilitation'));
const Neurorehabilitation = lazy(() => import('./pages/app/Neurorehabilitation'));
const MedicalSocialWork = lazy(() => import('./pages/app/MedicalSocialWork'));
const LactationConsultant = lazy(() => import('./pages/app/LactationConsultant'));
const ClinicalDietetics = lazy(() => import('./pages/app/ClinicalDietetics'));
const OrthoticsProsthetics = lazy(() => import('./pages/app/OrthoticsProsthetics'));
const LabQualityControl = lazy(() => import('./pages/app/LabQualityControl'));
const RiskManagement = lazy(() => import('./pages/app/RiskManagement'));
const ClinicalGovernance = lazy(() => import('./pages/app/ClinicalGovernance'));
const MedicalEducation = lazy(() => import('./pages/app/MedicalEducation'));
const PatientExperience = lazy(() => import('./pages/app/PatientExperience'));
const StaffWellnessPage = lazy(() => import('./pages/app/StaffWellness'));
const TriageAssessment = lazy(() => import('./pages/app/TriageAssessment'));
const HealthInsuranceManagement = lazy(() => import('./pages/app/HealthInsuranceManagement'));
const CommunityHealthHomeCare = lazy(() => import('./pages/app/CommunityHealthHomeCare'));
const ClinicalPharmacy = lazy(() => import('./pages/app/ClinicalPharmacy'));
const HealthScreeningProgramme = lazy(() => import('./pages/app/HealthScreeningProgramme'));
const NutritionKitchen = lazy(() => import('./pages/app/NutritionKitchen'));
const MedicalTourism = lazy(() => import('./pages/app/MedicalTourism'));
const OrganDonationRegistry = lazy(() => import('./pages/app/OrganDonationRegistry'));
const MortuaryManagement = lazy(() => import('./pages/app/MortuaryManagement'));
const LaundryHousekeeping = lazy(() => import('./pages/app/LaundryHousekeeping'));
const PorteringTransport = lazy(() => import('./pages/app/PorteringTransport'));
const MedicalLibrary = lazy(() => import('./pages/app/MedicalLibrary'));
const ConferenceBooking = lazy(() => import('./pages/app/ConferenceBooking'));
const VolunteerManagement = lazy(() => import('./pages/app/VolunteerManagement'));
const DonorRelations = lazy(() => import('./pages/app/DonorRelations'));
const PublicRelations = lazy(() => import('./pages/app/PublicRelations'));
const LegalCompliance = lazy(() => import('./pages/app/LegalCompliance'));
const MedicalEthicsCommittee = lazy(() => import('./pages/app/MedicalEthicsCommittee'));
const DeathBirthRecords = lazy(() => import('./pages/app/DeathBirthRecords'));
const CafeteriaManagement = lazy(() => import('./pages/app/CafeteriaManagement'));
const SecurityManagement = lazy(() => import('./pages/app/SecurityManagement'));
const TransportManagement = lazy(() => import('./pages/app/TransportManagement'));
const NursingCarePlans = lazy(() => import('./pages/app/NursingCarePlans'));
const InfectionControlSurveillance = lazy(() => import('./pages/app/InfectionControlSurveillance'));
const ChemotherapyDayUnit = lazy(() => import('./pages/app/ChemotherapyDayUnit'));
const StaffLeaveManagement = lazy(() => import('./pages/app/StaffLeaveManagement'));
const CapitalProjects = lazy(() => import('./pages/app/CapitalProjects'));
const PredictiveAnalytics = lazy(() => import('./pages/app/PredictiveAnalytics'));
const ClinicalDecisionSupport = lazy(() => import('./pages/app/ClinicalDecisionSupport'));
const TelehealthPlatform = lazy(() => import('./pages/app/TelehealthPlatform'));
const DataAnalyticsDashboard = lazy(() => import('./pages/app/DataAnalyticsDashboard'));
const ProcurementTendering = lazy(() => import('./pages/app/ProcurementTendering'));
const StaffPerformance = lazy(() => import('./pages/app/StaffPerformance'));
const EmergencyPreparednessTracker = lazy(() => import('./pages/app/EmergencyPreparednessTracker'));
const NursingShiftManagement = lazy(() => import('./pages/app/NursingShiftManagement'));
const DoctorOnCallRoster = lazy(() => import('./pages/app/DoctorOnCallRoster'));
const FallPreventionProgramme = lazy(() => import('./pages/app/FallPreventionProgramme'));
const MedicationReconciliation = lazy(() => import('./pages/app/MedicationReconciliation'));
const PatientFeedbackSurvey = lazy(() => import('./pages/app/PatientFeedbackSurvey'));
const IncidentReporting = lazy(() => import('./pages/app/IncidentReporting'));
const DischargePlanning = lazy(() => import('./pages/app/DischargePlanning'));
const InterpreterServices = lazy(() => import('./pages/app/InterpreterServices'));
const AdvanceDirectives = lazy(() => import('./pages/app/AdvanceDirectives'));
const WardEquipmentTracking = lazy(() => import('./pages/app/WardEquipmentTracking'));
const NutritionalScreening = lazy(() => import('./pages/app/NutritionalScreening'));
const ClinicalDocumentationAudit = lazy(() => import('./pages/app/ClinicalDocumentationAudit'));
const DVTProphylaxisTracker = lazy(() => import('./pages/app/DVTProphylaxisTracker'));
const PressureUlcerPrevention = lazy(() => import('./pages/app/PressureUlcerPrevention'));
const RootCauseAnalysis = lazy(() => import('./pages/app/RootCauseAnalysis'));
const ReadmissionPrevention = lazy(() => import('./pages/app/ReadmissionPrevention'));
const SpiritualCare = lazy(() => import('./pages/app/SpiritualCare'));
const PatientRights = lazy(() => import('./pages/app/PatientRights'));
const ConsentTracking = lazy(() => import('./pages/app/ConsentTracking'));
const TheatreSchedulingOptimisation = lazy(() => import('./pages/app/TheatreSchedulingOptimisation'));
const BloodBankInventory = lazy(() => import('./pages/app/BloodBankInventory'));
const WardHandoverProtocol = lazy(() => import('./pages/app/WardHandoverProtocol'));
const PatientSafetyCulture = lazy(() => import('./pages/app/PatientSafetyCulture'));
const PalliativeCareConsult = lazy(() => import('./pages/app/PalliativeCareConsult'));
const EthicsConsultation = lazy(() => import('./pages/app/EthicsConsultation'));
const SocialWorkServices = lazy(() => import('./pages/app/SocialWorkServices'));
const AntimicrobialStewardshipDashboard = lazy(() => import('./pages/app/AntimicrobialStewardshipDashboard'));
const ClinicalPathwayCompliance = lazy(() => import('./pages/app/ClinicalPathwayCompliance'));
const WardCensusDashboard = lazy(() => import('./pages/app/WardCensusDashboard'));
const OxygenTherapyTracker = lazy(() => import('./pages/app/OxygenTherapyTracker'));
const BloodTransfusionSafety = lazy(() => import('./pages/app/BloodTransfusionSafety'));
const ContactTracing = lazy(() => import('./pages/app/ContactTracing'));
const BloodProductIssuance = lazy(() => import('./pages/app/BloodProductIssuance'));
const NationalHealthData = lazy(() => import('./pages/app/NationalHealthData'));
const HealthFacilityProfile = lazy(() => import('./pages/app/HealthFacilityProfile'));
const TelemedicineConsultationEnhanced = lazy(() => import('./pages/app/TelemedicineConsultationEnhanced'));
const TelemedicineEnhanced = lazy(() => import("./pages/app/TelemedicineEnhanced"));
const TraditionalMedicineIntegration = lazy(() => import('./pages/app/TraditionalMedicineIntegration'));
const DrugInteractionCheckerEnhanced = lazy(() => import('./pages/app/DrugInteractionCheckerEnhanced'));
const BloodBankEnhanced = lazy(() => import('./pages/app/BloodBankEnhanced'));
const EquipmentMaintenanceEnhanced = lazy(() => import('./pages/app/EquipmentMaintenanceEnhanced'));
const NHISClaimsProcessing = lazy(() => import('./pages/app/NHISClaimsProcessing'));
const CancerRegistry = lazy(() => import('./pages/app/CancerRegistry'));
const VaccineColdChain = lazy(() => import('./pages/app/VaccineColdChain'));
const CommunityHealthWorker = lazy(() => import('./pages/app/CommunityHealthWorker'));
const MaternalDeathSurveillance = lazy(() => import('./pages/app/MaternalDeathSurveillance'));
const NeonatalDeathSurveillance = lazy(() => import('./pages/app/NeonatalDeathSurveillance'));
const DrugResistanceSurveillance = lazy(() => import('./pages/app/DrugResistanceSurveillance'));
const TraumaRegistry = lazy(() => import('./pages/app/TraumaRegistry'));
const WardCleaningAudit = lazy(() => import('./pages/app/WardCleaningAudit'));
const PatientTracking = lazy(() => import('./pages/app/PatientTracking'));
const PharmacyCompounding = lazy(() => import('./pages/app/PharmacyCompounding'));
const WardTransfer = lazy(() => import('./pages/app/WardTransfer'));
const TheatreUtilisation = lazy(() => import('./pages/app/TheatreUtilisation'));
const NICUTracking = lazy(() => import('./pages/app/NICUTracking'));
const DrugRecall = lazy(() => import('./pages/app/DrugRecall'));
const PrescriptionPrinting = lazy(() => import('./pages/app/PrescriptionPrinting'));
const LabResultAlerts = lazy(() => import('./pages/app/LabResultAlerts'));
const CrashCartTracking = lazy(() => import('./pages/app/CrashCartTracking'));
const VisitorManagement = lazy(() => import('./pages/app/VisitorManagement'));
const AntibioticStewardship = lazy(() => import('./pages/app/AntibioticStewardship'));
const InfectionControlDashboard = lazy(() => import('./pages/app/InfectionControlDashboard'));
const BedOccupancyRealTime = lazy(() => import('./pages/app/BedOccupancyRealTime'));
const StaffScheduling = lazy(() => import('./pages/app/StaffScheduling'));
const OxygenTherapyMonitor = lazy(() => import('./pages/app/OxygenTherapyMonitor'));
const PatientSatisfactionSurvey = lazy(() => import('./pages/app/PatientSatisfactionSurvey'));
const QualityIndicators = lazy(() => import('./pages/app/QualityIndicators'));
const BudgetTracking = lazy(() => import('./pages/app/BudgetTracking'));
const LaboratoryInfoSystemV2 = lazy(() => import('./pages/app/LaboratoryInfoSystem'));
const WristbandPrinting = lazy(() => import('./pages/app/WristbandPrinting'));
const DischargePlanningEnhanced = lazy(() => import('./pages/app/DischargePlanningEnhanced'));
const InsuranceClaimTracker = lazy(() => import('./pages/app/InsuranceClaimTracker'));
const EmergencyProtocolManager = lazy(() => import('./pages/app/EmergencyProtocolManager'));
const WardCensusEnhanced = lazy(() => import('./pages/app/WardCensusEnhanced'));
const StaffSchedulingEnhanced = lazy(() => import('./pages/app/StaffSchedulingEnhanced'));
const WardRoundsEnhanced = lazy(() => import('./pages/app/WardRoundsEnhanced'));
const DischargeSummaryEnhanced = lazy(() => import('./pages/app/DischargeSummaryEnhanced'));
const QueueEnhanced = lazy(() => import('./pages/app/QueueEnhanced'));
const WardTransferEnhanced = lazy(() => import('./pages/app/WardTransferEnhanced'));
const DeathBirthRecordsEnhanced = lazy(() => import('./pages/app/DeathBirthRecordsEnhanced'));
const InfectionControlDashboardEnhanced = lazy(() => import('./pages/app/InfectionControlDashboardEnhanced'));
const AntibioticStewardshipEnhanced = lazy(() => import('./pages/app/AntibioticStewardshipEnhanced'));
const OxygenTherapyMonitorEnhanced = lazy(() => import('./pages/app/OxygenTherapyMonitorEnhanced'));
const BedManagementEnhanced = lazy(() => import('./pages/app/BedManagementEnhanced'));
const VitalSignsChartingEnhanced = lazy(() => import('./pages/app/VitalSignsChartingEnhanced'));
const ConsentFormsEnhanced = lazy(() => import('./pages/app/ConsentFormsEnhanced'));
const VisitorManagementEnhanced = lazy(() => import('./pages/app/VisitorManagementEnhanced'));
const WristbandPrintingEnhanced = lazy(() => import('./pages/app/WristbandPrintingEnhanced'));
const PatientEducationEnhanced = lazy(() => import('./pages/app/PatientEducationEnhanced'));
const ServiceCharterEnhanced = lazy(() => import('./pages/app/ServiceCharterEnhanced'));
const HospitalProfileSettingsEnhanced = lazy(() => import('./pages/app/HospitalProfileSettingsEnhanced'));
const PointOfCareTestingEnhanced = lazy(() => import('./pages/app/PointOfCareTestingEnhanced'));
const PharmacyEnhanced = lazy(() => import('./pages/app/PharmacyEnhanced'));
const LabEnhanced = lazy(() => import('./pages/app/LabEnhanced'));
const BillingEnhanced = lazy(() => import('./pages/app/BillingEnhanced'));
const LabReception = lazy(() => import('./pages/app/LabReception'));
const MedicationSafety = lazy(() => import('./pages/app/MedicationSafety'));
const PatientMealTracking = lazy(() => import('./pages/app/PatientMealTracking'));
const TheatreSchedulingEnhanced = lazy(() => import('./pages/app/TheatreSchedulingEnhanced'));
const PatientPortalEnhanced = lazy(() => import('./pages/app/PatientPortalEnhanced'));
const MedicalRecordsEnhanced = lazy(() => import('./pages/app/MedicalRecordsEnhanced'));
const StaffPerformanceTracker = lazy(() => import('./pages/app/StaffPerformanceTracker'));
const VTEPreventionPage = lazy(() => import('./pages/app/VTEPrevention'));
const FallsPreventionPage = lazy(() => import('./pages/app/FallsPrevention'));
const PatientFlowBoardPage = lazy(() => import('./pages/app/PatientFlowBoard'));
const MedicationReconciliationPage = lazy(() => import('./pages/app/MedicationReconciliation'));
const PressureUlcerPreventionPage = lazy(() => import('./pages/app/PressureUlcerPrevention'));
const VitalSignsChartingPage = lazy(() => import('./pages/app/VitalSignsCharting'));
const SpecimenTrackingPage = lazy(() => import('./pages/app/SpecimenTracking'));
const ClinicalGovernancePage = lazy(() => import('./pages/app/ClinicalGovernance'));
const AmbulanceDispatchPage = lazy(() => import('./pages/app/AmbulanceDispatch'));
const MedicationAdministrationChartPage = lazy(() => import('./pages/app/MedicationAdministrationChart'));
const PointOfCareTestingPage = lazy(() => import('./pages/app/PointOfCareTesting'));
const WardBoardPage = lazy(() => import('./pages/app/WardBoard'));
const ClinicalPathwaysPage = lazy(() => import('./pages/app/ClinicalPathways'));
const PatientJourneyTrackerPage = lazy(() => import('./pages/app/PatientJourneyTracker'));
const ObstetricEmergencyPage = lazy(() => import('./pages/app/ObstetricEmergency'));
const RenalDialysisPage = lazy(() => import('./pages/app/RenalDialysis'));
const BurnUnitPage = lazy(() => import('./pages/app/BurnUnit'));
const HospitalProfileSettingsPage = lazy(() => import('./pages/app/HospitalProfileSettings'));
const SystemHealthMonitorPage = lazy(() => import('./pages/app/SystemHealthMonitor'));
const UserRolesManagerPage = lazy(() => import('./pages/app/UserRolesManager'));
const NeonatalIntensiveCarePage = lazy(() => import('./pages/app/NeonatalIntensiveCare'));
const SurgicalSafetyChecklistPage = lazy(() => import('./pages/app/SurgicalSafetyChecklist'));
const HandHygieneCompliancePage = lazy(() => import('./pages/app/HandHygieneCompliance'));
const PsychiatricAssessmentPage = lazy(() => import('./pages/app/PsychiatricAssessment'));
const NutritionAssessmentPage = lazy(() => import('./pages/app/NutritionAssessment'));
const DischargeLetterPage = lazy(() => import('./pages/app/DischargeLetter'));
const OperatingTheatreLogPage = lazy(() => import('./pages/app/OperatingTheatreLog'));
const VentilatorManagementPage = lazy(() => import('./pages/app/VentilatorManagement'));
const BloodTransfusionSafetyPage = lazy(() => import('./pages/app/BloodTransfusionSafety'));
const TuberculosisTrackerPage = lazy(() => import('./pages/app/TuberculosisTracker'));
const MalariaSurveillancePage = lazy(() => import('./pages/app/MalariaSurveillance'));
const SurgicalSiteInfectionTrackerPage = lazy(() => import('./pages/app/SurgicalSiteInfectionTracker'));
const MedicationErrorTrackerPage = lazy(() => import('./pages/app/MedicationErrorTracker'));
const PatientFallIncidentTrackerPage = lazy(() => import('./pages/app/PatientFallIncidentTracker'));
const InfectionControlAuditPage = lazy(() => import('./pages/app/InfectionControlAudit'));
const EmergencyTriageEnhancedPage = lazy(() => import('./pages/app/EmergencyTriageEnhanced'));
const LabourWardManagementPage = lazy(() => import('./pages/app/LabourWardManagement'));
const NeonatalScreeningPage = lazy(() => import("./pages/app/NeonatalScreening"));
const ImmunisationTrackerPage = lazy(() => import("./pages/app/ImmunisationTracker"));
const MentalHealthCrisisPage = lazy(() => import("./pages/app/MentalHealthCrisis"));
const PsychiatricWardManagementPage = lazy(() => import("./pages/app/PsychiatricWardManagement"));
const ConsentManagementEnhancedPage = lazy(() => import("./pages/app/ConsentManagementEnhanced"));
const PharmacyCompoundingEnhancedPage = lazy(() => import("./pages/app/PharmacyCompoundingEnhanced"));
const CommunityHealthTrackerPage = lazy(() => import("./pages/app/CommunityHealthTracker"));
const DiagnosticImagingTrackerPage = lazy(() => import("./pages/app/DiagnosticImagingTracker"));
const PathologyReportingPage = lazy(() => import("./pages/app/PathologyReporting"));
const OperatingTheatreSchedulerPage = lazy(() => import("./pages/app/OperatingTheatreScheduler"));
const PreOpAssessmentPage = lazy(() => import("./pages/app/PreOpAssessment"));
const PostOpRecoveryPage = lazy(() => import("./pages/app/PostOpRecovery"));
const WardMedicationSafetyPage = lazy(() => import("./pages/app/WardMedicationSafety"));
const OxygenTherapySafetyPage = lazy(() => import("./pages/app/OxygenTherapySafety"));
const InsulinSafetyTrackerPage = lazy(() => import("./pages/app/InsulinSafetyTracker"));
const NurseHandoverEnhancedPage = lazy(() => import("./pages/app/NurseHandoverEnhanced"));
const ClinicalResearchRegistryPage = lazy(() => import("./pages/app/ClinicalResearchRegistry"));
const WardCensusTrackerPage = lazy(() => import("./pages/app/WardCensusTracker"));
const MedicalEquipmentTrackerPage = lazy(() => import("./pages/app/MedicalEquipmentTracker"));
const PatientRiskStratificationPage = lazy(() => import("./pages/app/PatientRiskStratification"));
const DrugInteractionAlertsPage = lazy(() => import("./pages/app/DrugInteractionAlerts"));
const BloodBankEnhancedModulePage = lazy(() => import("./pages/app/BloodBankEnhancedModule"));
const EmergencyDepartmentEnhanced = lazy(() => import('./pages/app/EmergencyDepartmentEnhanced'));
const TheatreManagementEnhanced = lazy(() => import('./pages/app/TheatreManagementEnhanced'));
const RadiologyEnhanced = lazy(() => import('./pages/app/RadiologyEnhanced'));
const MaternityEnhanced = lazy(() => import('./pages/app/MaternityEnhanced'));
const ICUMonitoringEnhanced = lazy(() => import('./pages/app/ICUMonitoringEnhanced'));
const NICUTrackingEnhanced = lazy(() => import('./pages/app/NICUTrackingEnhanced'));
const AppointmentSchedulerEnhanced = lazy(() => import('./pages/app/AppointmentSchedulerEnhanced'));
const HandoverNotesEnhanced = lazy(() => import('./pages/app/HandoverNotesEnhanced'));
const RenalDialysisEnhanced = lazy(() => import('./pages/app/RenalDialysisEnhanced'));
const PhysiotherapyEnhanced = lazy(() => import('./pages/app/PhysiotherapyEnhanced'));
const COVID19Management = lazy(() => import('./pages/app/COVID19Management'));
const RadiationSafety = lazy(() => import('./pages/app/RadiationSafety'));
const CardiacCathLab = lazy(() => import('./pages/app/CardiacCathLab'));
const MedicalWasteTracking = lazy(() => import('./pages/app/MedicalWasteTracking'));
const FormularyManagement = lazy(() => import('./pages/app/FormularyManagement'));
const EquipmentCalibration = lazy(() => import('./pages/app/EquipmentCalibration'));
const PreventiveMaintenance = lazy(() => import('./pages/app/PreventiveMaintenance'));
const BloodDonorRegistry = lazy(() => import('./pages/app/BloodDonorRegistry'));
const FireSafety = lazy(() => import('./pages/app/FireSafety'));
const LinenManagement = lazy(() => import('./pages/app/LinenManagement'));
const DietaryManagement = lazy(() => import('./pages/app/DietaryManagement'));
const StaffOnboarding = lazy(() => import('./pages/app/StaffOnboarding'));
const PatientConsent = lazy(() => import('./pages/app/PatientConsent'));
const Sterilisation = lazy(() => import('./pages/app/Sterilisation'));
const MedicalGas = lazy(() => import('./pages/app/MedicalGas'));
const WardCleaning = lazy(() => import('./pages/app/WardCleaning'));
const ShiftHandover = lazy(() => import('./pages/app/ShiftHandover'));
const FallPrevention = lazy(() => import('./pages/app/FallPrevention'));
const SurgeryBooking = lazy(() => import('./pages/app/SurgeryBooking'));
const InfectionSurveillance = lazy(() => import('./pages/app/InfectionSurveillance'));
const TherapeuticDrugMonitoring = lazy(() => import('./pages/app/TherapeuticDrugMonitoring'));
const PatientIdentification = lazy(() => import('./pages/app/PatientIdentification'));
const PharmacyOrdering = lazy(() => import('./pages/app/PharmacyOrdering'));
const MedicalDevice = lazy(() => import('./pages/app/MedicalDevice'));
const EnergyManagement = lazy(() => import('./pages/app/EnergyManagement'));
const StaffTimeBook = lazy(() => import('./pages/app/StaffTimeBook'));

function RequireStaff({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Checking session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.scope === 'PATIENT') return <Navigate to="/patient" replace />;
  return <>{children}</>;
}

function RequirePatient({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Checking session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.scope !== 'PATIENT') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find-healthcare" element={<FindHealthcare />} />
        <Route path="/facilities" element={<Navigate to="/find-healthcare" replace />} />
        <Route path="/facilities/:id" element={<FacilityProfile />} />
        <Route path="/health-information" element={<ContentPage title="Health Information" body="Health education content is published through the content management workflow and subject to authorized clinical review (spec §77)." />} />
        <Route path="/news" element={<ContentPage title="News & Announcements" body="Facility and national announcements are published by authorized administrators." />} />
        <Route path="/contact" element={<ContentPage title="Contact" body="Please use the facility directory to find verified contact details for specific facilities. Emergency numbers are only ever displayed from configured facility data — never fabricated." />} />
        <Route path="/register-facility" element={<RegisterFacility />} />
        <Route path="/login" element={<Login />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/purchase/verify" element={<PurchaseVerify />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
      </Route>

      <Route
        path="/app"
        element={
          <RequireStaff>
            <AppLayout />
          </RequireStaff>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="queue" element={<Queue />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="register" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />
        <Route path="appointments" element={<Suspense fallback={<PageLoader />}><Appointments /></Suspense>} />
        <Route path="pharmacy" element={<Suspense fallback={<PageLoader />}><PharmacyDashboard /></Suspense>} />
        <Route path="pharmacy/worklist" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="lab" element={<Suspense fallback={<PageLoader />}><Lab /></Suspense>} />
        <Route path="stock" element={<Suspense fallback={<PageLoader />}><Stock /></Suspense>} />
        <Route path="insurance" element={<Suspense fallback={<PageLoader />}><Insurance /></Suspense>} />
        <Route path="assets" element={<Suspense fallback={<PageLoader />}><Assets /></Suspense>} />
        <Route path="surveillance" element={<Suspense fallback={<PageLoader />}><Surveillance /></Suspense>} />
        <Route path="surveillance/district" element={<Suspense fallback={<PageLoader />}><DistrictHealthDashboard /></Suspense>} />
        <Route path="admissions" element={<Suspense fallback={<PageLoader />}><Admissions /></Suspense>} />
        <Route path="referrals" element={<Suspense fallback={<PageLoader />}><Referrals /></Suspense>} />
        <Route path="immunizations" element={<Suspense fallback={<PageLoader />}><Immunizations /></Suspense>} />
        <Route path="beds" element={<Suspense fallback={<PageLoader />}><Beds /></Suspense>} />
        <Route path="ambulances" element={<Suspense fallback={<PageLoader />}><Ambulances /></Suspense>} />
        <Route path="bloodbank" element={<Suspense fallback={<PageLoader />}><BloodBank /></Suspense>} />
        <Route path="theatre" element={<Suspense fallback={<PageLoader />}><Theatre /></Suspense>} />
        <Route path="radiology" element={<Suspense fallback={<PageLoader />}><Radiology /></Suspense>} />
        <Route path="telemedicine" element={<Suspense fallback={<PageLoader />}><Telemedicine /></Suspense>} />
        <Route path="directorate" element={<Suspense fallback={<PageLoader />}><Directorate /></Suspense>} />
        <Route path="gis" element={<Suspense fallback={<PageLoader />}><Gis /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
        <Route path="integrations" element={<Suspense fallback={<PageLoader />}><Integrations /></Suspense>} />
        <Route path="billing" element={<Suspense fallback={<PageLoader />}><Billing /></Suspense>} />
        <Route path="ai" element={<Suspense fallback={<PageLoader />}><Ai /></Suspense>} />
        <Route path="drugs" element={<Suspense fallback={<PageLoader />}><DrugDatabase /></Suspense>} />
        <Route path="diseases" element={<Suspense fallback={<PageLoader />}><DiseaseReference /></Suspense>} />
        <Route path="dr-august" element={<Suspense fallback={<PageLoader />}><DrAugustAI /></Suspense>} />
        <Route path="guidelines" element={<Suspense fallback={<PageLoader />}><ClinicalGuidelines /></Suspense>} />
        <Route path="performance" element={<Suspense fallback={<PageLoader />}><PerformanceMonitor /></Suspense>} />
        <Route path="cache" element={<Suspense fallback={<PageLoader />}><CacheStrategy /></Suspense>} />
        <Route path="admin" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
        <Route path="developer" element={<Suspense fallback={<PageLoader />}><Developer /></Suspense>} />
        <Route path="developer-console" element={<Suspense fallback={<PageLoader />}><DeveloperConsole /></Suspense>} />
        <Route path="admin-hierarchy" element={<Suspense fallback={<PageLoader />}><AdminHierarchy /></Suspense>} />
        <Route path="api-config" element={<Suspense fallback={<PageLoader />}><ApiConfig /></Suspense>} />
        <Route path="system-settings" element={<Suspense fallback={<PageLoader />}><SystemSettings /></Suspense>} />
        <Route path="api-guide" element={<Suspense fallback={<PageLoader />}><ApiGuide /></Suspense>} />
        <Route path="id-cards" element={<Suspense fallback={<PageLoader />}><IdCardBuilder /></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<PageLoader />}><NotificationCenter /></Suspense>} />
        <Route path="staff" element={<Suspense fallback={<PageLoader />}><StaffManagement /></Suspense>} />
        <Route path="import-export" element={<Suspense fallback={<PageLoader />}><BulkImportExport /></Suspense>} />
        <Route path="backup" element={<Suspense fallback={<PageLoader />}><SystemBackup /></Suspense>} />
        <Route path="clinical-dashboard" element={<Suspense fallback={<PageLoader />}><ClinicalDashboard /></Suspense>} />
        <Route path="drug-interactions" element={<Suspense fallback={<PageLoader />}><DrugInteractionChecker /></Suspense>} />
        <Route path="emergency-alerts" element={<Suspense fallback={<PageLoader />}><EmergencyAlerts /></Suspense>} />
        <Route path="environment-monitor" element={<Suspense fallback={<PageLoader />}><EnvironmentMonitor /></Suspense>} />
        <Route path="patient-satisfaction" element={<Suspense fallback={<PageLoader />}><PatientSatisfaction /></Suspense>} />
        <Route path="documents" element={<Suspense fallback={<PageLoader />}><DocumentManagement /></Suspense>} />
        <Route path="revenue" element={<Suspense fallback={<PageLoader />}><RevenueDashboard /></Suspense>} />
        <Route path="bed-management" element={<Suspense fallback={<PageLoader />}><BedManagement /></Suspense>} />
        <Route path="system-guide" element={<Suspense fallback={<PageLoader />}><SystemGuide /></Suspense>} />
        <Route path="maternity" element={<Suspense fallback={<PageLoader />}><Maternity /></Suspense>} />
        <Route path="clinical-notes" element={<Suspense fallback={<PageLoader />}><ClinicalNotes /></Suspense>} />
        <Route path="medication-administration" element={<Suspense fallback={<PageLoader />}><MedicationAdministration /></Suspense>} />
        <Route path="quality-assurance" element={<Suspense fallback={<PageLoader />}><QualityAssurance /></Suspense>} />
        <Route path="ward-rounds" element={<Suspense fallback={<PageLoader />}><WardRounds /></Suspense>} />
        <Route path="patient-timeline" element={<Suspense fallback={<PageLoader />}><PatientTimeline /></Suspense>} />
        <Route path="supplier-procurement" element={<Suspense fallback={<PageLoader />}><SupplierProcurement /></Suspense>} />
        <Route path="waste-management" element={<Suspense fallback={<PageLoader />}><WasteManagement /></Suspense>} />
        <Route path="consent-forms" element={<Suspense fallback={<PageLoader />}><ConsentForms /></Suspense>} />
        <Route path="vital-records" element={<Suspense fallback={<PageLoader />}><VitalRecords /></Suspense>} />
        <Route path="equipment-maintenance" element={<Suspense fallback={<PageLoader />}><EquipmentMaintenance /></Suspense>} />
        <Route path="nutrition-diet" element={<Suspense fallback={<PageLoader />}><NutritionDiet /></Suspense>} />
        <Route path="handover-notes" element={<Suspense fallback={<PageLoader />}><HandoverNotes /></Suspense>} />
        <Route path="theatre-management" element={<Suspense fallback={<PageLoader />}><TheatreManagement /></Suspense>} />
        <Route path="blood-bank-management" element={<Suspense fallback={<PageLoader />}><BloodBankManagement /></Suspense>} />
        <Route path="insurance-claims" element={<Suspense fallback={<PageLoader />}><InsuranceClaims /></Suspense>} />
        <Route path="mental-health" element={<Suspense fallback={<PageLoader />}><MentalHealth /></Suspense>} />
        <Route path="dental-clinic" element={<Suspense fallback={<PageLoader />}><DentalClinic /></Suspense>} />
        <Route path="physiotherapy" element={<Suspense fallback={<PageLoader />}><Physiotherapy /></Suspense>} />
        <Route path="infection-control" element={<Suspense fallback={<PageLoader />}><InfectionControl /></Suspense>} />
        <Route path="staff-training" element={<Suspense fallback={<PageLoader />}><StaffTraining /></Suspense>} />
        <Route path="budget-management" element={<Suspense fallback={<PageLoader />}><BudgetManagement /></Suspense>} />
        <Route path="clinical-protocols" element={<Suspense fallback={<PageLoader />}><ClinicalProtocols /></Suspense>} />
        <Route path="medical-records" element={<Suspense fallback={<PageLoader />}><MedicalRecordsSummary /></Suspense>} />
        <Route path="patient-education" element={<Suspense fallback={<PageLoader />}><PatientEducation /></Suspense>} />
        <Route path="service-charter" element={<Suspense fallback={<PageLoader />}><ServiceCharter /></Suspense>} />
        <Route path="news-announcements" element={<Suspense fallback={<PageLoader />}><NewsAnnouncements /></Suspense>} />
        <Route path="referral-management" element={<Suspense fallback={<PageLoader />}><ReferralManagement /></Suspense>} />
        <Route path="discharge-summary" element={<Suspense fallback={<PageLoader />}><DischargeSummary /></Suspense>} />
        <Route path="clinical-audit" element={<Suspense fallback={<PageLoader />}><ClinicalAudit /></Suspense>} />
        <Route path="mm-reports" element={<Suspense fallback={<PageLoader />}><MMReports /></Suspense>} />
        <Route path="patient-complaints" element={<Suspense fallback={<PageLoader />}><PatientComplaints /></Suspense>} />
        <Route path="ward-management" element={<Suspense fallback={<PageLoader />}><WardManagement /></Suspense>} />
        <Route path="enhanced-patient-portal" element={<Suspense fallback={<PageLoader />}><EnhancedPatientPortal /></Suspense>} />
        <Route path="telemedicine-consult" element={<Suspense fallback={<PageLoader />}><TelemedicineConsult /></Suspense>} />
        <Route path="radiology-pacs" element={<Suspense fallback={<PageLoader />}><RadiologyPACS /></Suspense>} />
        <Route path="laboratory-info" element={<Suspense fallback={<PageLoader />}><LaboratoryInfoSystem /></Suspense>} />
        <Route path="pharmacy-dispensing" element={<Suspense fallback={<PageLoader />}><PharmacyDispensing /></Suspense>} />
        <Route path="patient-risk-assessment" element={<Suspense fallback={<PageLoader />}><PatientRiskAssessment /></Suspense>} />
        <Route path="surgical-safety-checklist" element={<Suspense fallback={<PageLoader />}><SurgicalSafetyChecklist /></Suspense>} />
        <Route path="specimen-tracking" element={<Suspense fallback={<PageLoader />}><SpecimenTracking /></Suspense>} />
        <Route path="facility-management" element={<Suspense fallback={<PageLoader />}><FacilityManagement /></Suspense>} />
        <Route path="patient-flow" element={<Suspense fallback={<PageLoader />}><PatientFlow /></Suspense>} />
        <Route path="emergency-department" element={<Suspense fallback={<PageLoader />}><EmergencyDepartment /></Suspense>} />
        <Route path="blood-transfusion" element={<Suspense fallback={<PageLoader />}><BloodTransfusionService /></Suspense>} />
        <Route path="clinical-pathways" element={<Suspense fallback={<PageLoader />}><ClinicalPathwayBuilder /></Suspense>} />
        <Route path="health-info-exchange" element={<Suspense fallback={<PageLoader />}><HealthInfoExchange /></Suspense>} />
        <Route path="emergency-preparedness" element={<Suspense fallback={<PageLoader />}><EmergencyPreparedness /></Suspense>} />
        <Route path="clinical-research" element={<Suspense fallback={<PageLoader />}><ClinicalResearch /></Suspense>} />
        <Route path="remote-monitoring" element={<Suspense fallback={<PageLoader />}><RemoteMonitoring /></Suspense>} />
        <Route path="smart-scheduling" element={<Suspense fallback={<PageLoader />}><SmartScheduling /></Suspense>} />
        <Route path="revenue-cycle" element={<Suspense fallback={<PageLoader />}><RevenueCycle /></Suspense>} />
        <Route path="health-analytics" element={<Suspense fallback={<PageLoader />}><HealthAnalytics /></Suspense>} />
        <Route path="icu-management" element={<Suspense fallback={<PageLoader />}><ICUManagement /></Suspense>} />
        <Route path="pharmacy-formulary" element={<Suspense fallback={<PageLoader />}><PharmacyFormulary /></Suspense>} />
        <Route path="staff-credentialing" element={<Suspense fallback={<PageLoader />}><StaffCredentialing /></Suspense>} />
        <Route path="code-blue-emergency" element={<Suspense fallback={<PageLoader />}><CodeBlueEmergency /></Suspense>} />
        <Route path="executive-dashboard" element={<Suspense fallback={<PageLoader />}><ExecutiveDashboard /></Suspense>} />
        <Route path="financial-dashboard" element={<Suspense fallback={<PageLoader />}><FinancialDashboard /></Suspense>} />
        <Route path="hospital-accreditation" element={<Suspense fallback={<PageLoader />}><HospitalAccreditation /></Suspense>} />
        <Route path="audit-trail" element={<Suspense fallback={<PageLoader />}><AuditTrail /></Suspense>} />
        <Route path="pre-anaesthesia" element={<Suspense fallback={<PageLoader />}><PreAnaesthesiaAssessment /></Suspense>} />
        <Route path="ophthalmology" element={<Suspense fallback={<PageLoader />}><OphthalmologyClinic /></Suspense>} />
        <Route path="ent-clinic" element={<Suspense fallback={<PageLoader />}><ENTClinic /></Suspense>} />
        <Route path="dermatology" element={<Suspense fallback={<PageLoader />}><DermatologyClinic /></Suspense>} />
        <Route path="orthopaedics" element={<Suspense fallback={<PageLoader />}><OrthopaedicsClinic /></Suspense>} />
        <Route path="paediatric-growth" element={<Suspense fallback={<PageLoader />}><PaediatricGrowthCharts /></Suspense>} />
        <Route path="staff-directory" element={<Suspense fallback={<PageLoader />}><StaffDirectory /></Suspense>} />
        <Route path="cardiology" element={<Suspense fallback={<PageLoader />}><CardiologyClinic /></Suspense>} />
        <Route path="nephrology-dialysis" element={<Suspense fallback={<PageLoader />}><NephrologyDialysis /></Suspense>} />
        <Route path="endocrinology" element={<Suspense fallback={<PageLoader />}><EndocrinologyClinic /></Suspense>} />
        <Route path="pulmonology" element={<Suspense fallback={<PageLoader />}><PulmonologyClinic /></Suspense>} />
        <Route path="gastroenterology" element={<Suspense fallback={<PageLoader />}><GastroenterologyClinic /></Suspense>} />
        <Route path="oncology" element={<Suspense fallback={<PageLoader />}><OncologyClinic /></Suspense>} />
        <Route path="neurology" element={<Suspense fallback={<PageLoader />}><NeurologyClinic /></Suspense>} />
        <Route path="urology" element={<Suspense fallback={<PageLoader />}><UrologyClinic /></Suspense>} />
        <Route path="infectious-disease" element={<Suspense fallback={<PageLoader />}><InfectiousDiseaseClinic /></Suspense>} />
        <Route path="rheumatology" element={<Suspense fallback={<PageLoader />}><RheumatologyClinic /></Suspense>} />
        <Route path="pain-management" element={<Suspense fallback={<PageLoader />}><PainManagement /></Suspense>} />
        <Route path="palliative-care" element={<Suspense fallback={<PageLoader />}><PalliativeCare /></Suspense>} />
        <Route path="transplant" element={<Suspense fallback={<PageLoader />}><TransplantCoordination /></Suspense>} />
        <Route path="geriatric-medicine" element={<Suspense fallback={<PageLoader />}><GeriatricMedicine /></Suspense>} />
        <Route path="speech-therapy" element={<Suspense fallback={<PageLoader />}><SpeechTherapy /></Suspense>} />
        <Route path="occupational-therapy" element={<Suspense fallback={<PageLoader />}><OccupationalTherapy /></Suspense>} />
        <Route path="wound-care" element={<Suspense fallback={<PageLoader />}><WoundCareClinic /></Suspense>} />
        <Route path="day-surgery" element={<Suspense fallback={<PageLoader />}><DaySurgeryUnit /></Suspense>} />
        <Route path="medical-genetics" element={<Suspense fallback={<PageLoader />}><MedicalGenetics /></Suspense>} />
        <Route path="radiology-reporting" element={<Suspense fallback={<PageLoader />}><RadiologyReporting /></Suspense>} />
        <Route path="microbiology" element={<Suspense fallback={<PageLoader />}><MicrobiologyLab /></Suspense>} />
        <Route path="fertility-centre" element={<Suspense fallback={<PageLoader />}><FertilityCentre /></Suspense>} />
        <Route path="hyperbaric-medicine" element={<Suspense fallback={<PageLoader />}><HyperbaricMedicine /></Suspense>} />
        <Route path="sports-medicine" element={<Suspense fallback={<PageLoader />}><SportsMedicine /></Suspense>} />
        <Route path="pathology" element={<Suspense fallback={<PageLoader />}><PathologyLab /></Suspense>} />
        <Route path="nicu" element={<Suspense fallback={<PageLoader />}><NeonatalUnit /></Suspense>} />
        <Route path="cardiac-rehab" element={<Suspense fallback={<PageLoader />}><CardiacRehabilitation /></Suspense>} />
        <Route path="respiratory-rehab" element={<Suspense fallback={<PageLoader />}><RespiratoryRehabilitation /></Suspense>} />
        <Route path="neurorehabilitation" element={<Suspense fallback={<PageLoader />}><Neurorehabilitation /></Suspense>} />
        <Route path="medical-social-work" element={<Suspense fallback={<PageLoader />}><MedicalSocialWork /></Suspense>} />
        <Route path="lactation" element={<Suspense fallback={<PageLoader />}><LactationConsultant /></Suspense>} />
        <Route path="clinical-dietetics" element={<Suspense fallback={<PageLoader />}><ClinicalDietetics /></Suspense>} />
        <Route path="orthotics-prosthetics" element={<Suspense fallback={<PageLoader />}><OrthoticsProsthetics /></Suspense>} />
        <Route path="lab-quality-control" element={<Suspense fallback={<PageLoader />}><LabQualityControl /></Suspense>} />
        <Route path="risk-management" element={<Suspense fallback={<PageLoader />}><RiskManagement /></Suspense>} />
        <Route path="clinical-governance" element={<Suspense fallback={<PageLoader />}><ClinicalGovernance /></Suspense>} />
        <Route path="medical-education" element={<Suspense fallback={<PageLoader />}><MedicalEducation /></Suspense>} />
        <Route path="patient-experience" element={<Suspense fallback={<PageLoader />}><PatientExperience /></Suspense>} />
        <Route path="staff-wellness" element={<Suspense fallback={<PageLoader />}><StaffWellnessPage /></Suspense>} />
        <Route path="triage-assessment" element={<Suspense fallback={<PageLoader />}><TriageAssessment /></Suspense>} />
        <Route path="health-insurance-management" element={<Suspense fallback={<PageLoader />}><HealthInsuranceManagement /></Suspense>} />
        <Route path="community-health" element={<Suspense fallback={<PageLoader />}><CommunityHealthHomeCare /></Suspense>} />
        <Route path="clinical-pharmacy" element={<Suspense fallback={<PageLoader />}><ClinicalPharmacy /></Suspense>} />
        <Route path="health-screening" element={<Suspense fallback={<PageLoader />}><HealthScreeningProgramme /></Suspense>} />
        <Route path="nutrition-kitchen" element={<Suspense fallback={<PageLoader />}><NutritionKitchen /></Suspense>} />
        <Route path="medical-tourism" element={<Suspense fallback={<PageLoader />}><MedicalTourism /></Suspense>} />
        <Route path="mortuary" element={<Suspense fallback={<PageLoader />}><MortuaryManagement /></Suspense>} />
        <Route path="laundry-housekeeping" element={<Suspense fallback={<PageLoader />}><LaundryHousekeeping /></Suspense>} />
        <Route path="portering-transport" element={<Suspense fallback={<PageLoader />}><PorteringTransport /></Suspense>} />
        <Route path="medical-library" element={<Suspense fallback={<PageLoader />}><MedicalLibrary /></Suspense>} />
        <Route path="conference-booking" element={<Suspense fallback={<PageLoader />}><ConferenceBooking /></Suspense>} />
        <Route path="volunteer-management" element={<Suspense fallback={<PageLoader />}><VolunteerManagement /></Suspense>} />
        <Route path="donor-relations" element={<Suspense fallback={<PageLoader />}><DonorRelations /></Suspense>} />
        <Route path="public-relations" element={<Suspense fallback={<PageLoader />}><PublicRelations /></Suspense>} />
        <Route path="legal-compliance" element={<Suspense fallback={<PageLoader />}><LegalCompliance /></Suspense>} />
        <Route path="medical-ethics" element={<Suspense fallback={<PageLoader />}><MedicalEthicsCommittee /></Suspense>} />
        <Route path="death-birth-records" element={<Suspense fallback={<PageLoader />}><DeathBirthRecords /></Suspense>} />
        <Route path="cafeteria" element={<Suspense fallback={<PageLoader />}><CafeteriaManagement /></Suspense>} />
        <Route path="security-management" element={<Suspense fallback={<PageLoader />}><SecurityManagement /></Suspense>} />
        <Route path="transport-management" element={<Suspense fallback={<PageLoader />}><TransportManagement /></Suspense>} />
        <Route path="nursing-care-plans" element={<Suspense fallback={<PageLoader />}><NursingCarePlans /></Suspense>} />
        <Route path="infection-control" element={<Suspense fallback={<PageLoader />}><InfectionControlSurveillance /></Suspense>} />
        <Route path="chemotherapy-day-unit" element={<Suspense fallback={<PageLoader />}><ChemotherapyDayUnit /></Suspense>} />
        <Route path="staff-leave" element={<Suspense fallback={<PageLoader />}><StaffLeaveManagement /></Suspense>} />
        <Route path="capital-projects" element={<Suspense fallback={<PageLoader />}><CapitalProjects /></Suspense>} />
        <Route path="predictive-analytics" element={<Suspense fallback={<PageLoader />}><PredictiveAnalytics /></Suspense>} />
        <Route path="clinical-decision-support" element={<Suspense fallback={<PageLoader />}><ClinicalDecisionSupport /></Suspense>} />
        <Route path="patient-education" element={<Suspense fallback={<PageLoader />}><PatientEducation /></Suspense>} />
        <Route path="telehealth-platform" element={<Suspense fallback={<PageLoader />}><TelehealthPlatform /></Suspense>} />
        <Route path="data-analytics" element={<Suspense fallback={<PageLoader />}><DataAnalyticsDashboard /></Suspense>} />
        <Route path="procurement-tendering" element={<Suspense fallback={<PageLoader />}><ProcurementTendering /></Suspense>} />
        <Route path="staff-performance" element={<Suspense fallback={<PageLoader />}><StaffPerformance /></Suspense>} />
        <Route path="emergency-preparedness-tracker" element={<Suspense fallback={<PageLoader />}><EmergencyPreparednessTracker /></Suspense>} />
        <Route path="nursing-shifts" element={<Suspense fallback={<PageLoader />}><NursingShiftManagement /></Suspense>} />
        <Route path="doctor-on-call" element={<Suspense fallback={<PageLoader />}><DoctorOnCallRoster /></Suspense>} />
        <Route path="fall-prevention" element={<Suspense fallback={<PageLoader />}><FallPreventionProgramme /></Suspense>} />
        <Route path="medication-reconciliation" element={<Suspense fallback={<PageLoader />}><MedicationReconciliation /></Suspense>} />
        <Route path="patient-feedback" element={<Suspense fallback={<PageLoader />}><PatientFeedbackSurvey /></Suspense>} />
        <Route path="incident-reporting" element={<Suspense fallback={<PageLoader />}><IncidentReporting /></Suspense>} />
        <Route path="discharge-planning" element={<Suspense fallback={<PageLoader />}><DischargePlanning /></Suspense>} />
        <Route path="interpreter-services" element={<Suspense fallback={<PageLoader />}><InterpreterServices /></Suspense>} />
        <Route path="advance-directives" element={<Suspense fallback={<PageLoader />}><AdvanceDirectives /></Suspense>} />
        <Route path="ward-equipment" element={<Suspense fallback={<PageLoader />}><WardEquipmentTracking /></Suspense>} />
        <Route path="nutritional-screening" element={<Suspense fallback={<PageLoader />}><NutritionalScreening /></Suspense>} />
        <Route path="documentation-audit" element={<Suspense fallback={<PageLoader />}><ClinicalDocumentationAudit /></Suspense>} />
        <Route path="dvt-prophylaxis" element={<Suspense fallback={<PageLoader />}><DVTProphylaxisTracker /></Suspense>} />
        <Route path="pressure-ulcer-prevention" element={<Suspense fallback={<PageLoader />}><PressureUlcerPrevention /></Suspense>} />
        <Route path="root-cause-analysis" element={<Suspense fallback={<PageLoader />}><RootCauseAnalysis /></Suspense>} />
        <Route path="readmission-prevention" element={<Suspense fallback={<PageLoader />}><ReadmissionPrevention /></Suspense>} />
        <Route path="spiritual-care" element={<Suspense fallback={<PageLoader />}><SpiritualCare /></Suspense>} />
        <Route path="patient-rights" element={<Suspense fallback={<PageLoader />}><PatientRights /></Suspense>} />
        <Route path="consent-tracking" element={<Suspense fallback={<PageLoader />}><ConsentTracking /></Suspense>} />
        <Route path="theatre-scheduling" element={<Suspense fallback={<PageLoader />}><TheatreSchedulingOptimisation /></Suspense>} />
        <Route path="blood-bank-inventory" element={<Suspense fallback={<PageLoader />}><BloodBankInventory /></Suspense>} />
        <Route path="ward-handover" element={<Suspense fallback={<PageLoader />}><WardHandoverProtocol /></Suspense>} />
        <Route path="safety-culture" element={<Suspense fallback={<PageLoader />}><PatientSafetyCulture /></Suspense>} />
        <Route path="palliative-care-consult" element={<Suspense fallback={<PageLoader />}><PalliativeCareConsult /></Suspense>} />
        <Route path="ethics-consultation" element={<Suspense fallback={<PageLoader />}><EthicsConsultation /></Suspense>} />
        <Route path="social-work" element={<Suspense fallback={<PageLoader />}><SocialWorkServices /></Suspense>} />
        <Route path="antimicrobial-stewardship" element={<Suspense fallback={<PageLoader />}><AntimicrobialStewardshipDashboard /></Suspense>} />
        <Route path="pathway-compliance" element={<Suspense fallback={<PageLoader />}><ClinicalPathwayCompliance /></Suspense>} />
        <Route path="ward-census" element={<Suspense fallback={<PageLoader />}><WardCensusDashboard /></Suspense>} />
        <Route path="oxygen-therapy" element={<Suspense fallback={<PageLoader />}><OxygenTherapyTracker /></Suspense>} />
        <Route path="transfusion-safety" element={<Suspense fallback={<PageLoader />}><BloodTransfusionSafety /></Suspense>} />
        <Route path="contact-tracing" element={<Suspense fallback={<PageLoader />}><ContactTracing /></Suspense>} />
        <Route path="blood-product-issuance" element={<Suspense fallback={<PageLoader />}><BloodProductIssuance /></Suspense>} />
        <Route path="national-health-data" element={<Suspense fallback={<PageLoader />}><NationalHealthData /></Suspense>} />
        <Route path="health-facility-profile" element={<Suspense fallback={<PageLoader />}><HealthFacilityProfile /></Suspense>} />
        <Route path="telemedicine-consultation" element={<Suspense fallback={<PageLoader />}><TelemedicineConsultationEnhanced /></Suspense>} />
        <Route path="nhis-claims" element={<Suspense fallback={<PageLoader />}><NHISClaimsProcessing /></Suspense>} />
        <Route path="cancer-registry" element={<Suspense fallback={<PageLoader />}><CancerRegistry /></Suspense>} />
        <Route path="vaccine-cold-chain" element={<Suspense fallback={<PageLoader />}><VaccineColdChain /></Suspense>} />
        <Route path="community-health-workers" element={<Suspense fallback={<PageLoader />}><CommunityHealthWorker /></Suspense>} />
        <Route path="maternal-death-surveillance" element={<Suspense fallback={<PageLoader />}><MaternalDeathSurveillance /></Suspense>} />
        <Route path="neonatal-death-surveillance" element={<Suspense fallback={<PageLoader />}><NeonatalDeathSurveillance /></Suspense>} />
        <Route path="drug-resistance-surveillance" element={<Suspense fallback={<PageLoader />}><DrugResistanceSurveillance /></Suspense>} />
        <Route path="trauma-registry" element={<Suspense fallback={<PageLoader />}><TraumaRegistry /></Suspense>} />
        <Route path="ward-cleaning-audit" element={<Suspense fallback={<PageLoader />}><WardCleaningAudit /></Suspense>} />
        <Route path="patient-tracking" element={<Suspense fallback={<PageLoader />}><PatientTracking /></Suspense>} />
        <Route path="patient-phone-tracking" element={<Suspense fallback={<PageLoader />}><PatientPhoneTracking /></Suspense>} />
        <Route path="pharmacy-compounding" element={<Suspense fallback={<PageLoader />}><PharmacyCompounding /></Suspense>} />
        <Route path="ward-transfer" element={<Suspense fallback={<PageLoader />}><WardTransfer /></Suspense>} />
        <Route path="theatre-utilisation" element={<Suspense fallback={<PageLoader />}><TheatreUtilisation /></Suspense>} />
        <Route path="nicu-tracking" element={<Suspense fallback={<PageLoader />}><NICUTracking /></Suspense>} />
        <Route path="drug-recall" element={<Suspense fallback={<PageLoader />}><DrugRecall /></Suspense>} />
        <Route path="prescription-printing" element={<Suspense fallback={<PageLoader />}><PrescriptionPrinting /></Suspense>} />
        <Route path="lab-result-alerts" element={<Suspense fallback={<PageLoader />}><LabResultAlerts /></Suspense>} />
        <Route path="crash-cart-tracking" element={<Suspense fallback={<PageLoader />}><CrashCartTracking /></Suspense>} />
        <Route path="visitor-management" element={<Suspense fallback={<PageLoader />}><VisitorManagement /></Suspense>} />
        <Route path="antibiotic-stewardship" element={<Suspense fallback={<PageLoader />}><AntibioticStewardship /></Suspense>} />
        <Route path="infection-control-dashboard" element={<Suspense fallback={<PageLoader />}><InfectionControlDashboard /></Suspense>} />
        <Route path="bed-occupancy-realtime" element={<Suspense fallback={<PageLoader />}><BedOccupancyRealTime /></Suspense>} />
        <Route path="staff-scheduling" element={<Suspense fallback={<PageLoader />}><StaffScheduling /></Suspense>} />
        <Route path="oxygen-therapy-monitor" element={<Suspense fallback={<PageLoader />}><OxygenTherapyMonitor /></Suspense>} />
        <Route path="patient-satisfaction-survey" element={<Suspense fallback={<PageLoader />}><PatientSatisfactionSurvey /></Suspense>} />
        <Route path="quality-indicators" element={<Suspense fallback={<PageLoader />}><QualityIndicators /></Suspense>} />
        <Route path="budget-tracking" element={<Suspense fallback={<PageLoader />}><BudgetTracking /></Suspense>} />
        <Route path="laboratory-info-system" element={<Suspense fallback={<PageLoader />}><LaboratoryInfoSystemV2 /></Suspense>} />
        <Route path="wristband-printing" element={<Suspense fallback={<PageLoader />}><WristbandPrinting /></Suspense>} />
        <Route path="discharge-planning-enhanced" element={<Suspense fallback={<PageLoader />}><DischargePlanningEnhanced /></Suspense>} />
        <Route path="insurance-claim-tracker" element={<Suspense fallback={<PageLoader />}><InsuranceClaimTracker /></Suspense>} />
        <Route path="emergency-protocols" element={<Suspense fallback={<PageLoader />}><EmergencyProtocolManager /></Suspense>} />
        <Route path="ward-census-enhanced" element={<Suspense fallback={<PageLoader />}><WardCensusEnhanced /></Suspense>} />
        <Route path="staff-scheduling-enhanced" element={<Suspense fallback={<PageLoader />}><StaffSchedulingEnhanced /></Suspense>} />
        <Route path="ward-rounds-enhanced" element={<Suspense fallback={<PageLoader />}><WardRoundsEnhanced /></Suspense>} />
        <Route path="discharge-summary-enhanced" element={<Suspense fallback={<PageLoader />}><DischargeSummaryEnhanced /></Suspense>} />
        <Route path="queue-enhanced" element={<Suspense fallback={<PageLoader />}><QueueEnhanced /></Suspense>} />
        <Route path="ward-transfer-enhanced" element={<Suspense fallback={<PageLoader />}><WardTransferEnhanced /></Suspense>} />
        <Route path="death-birth-records-enhanced" element={<Suspense fallback={<PageLoader />}><DeathBirthRecordsEnhanced /></Suspense>} />
        <Route path="infection-control-enhanced" element={<Suspense fallback={<PageLoader />}><InfectionControlDashboardEnhanced /></Suspense>} />
        <Route path="antibiotic-stewardship-enhanced" element={<Suspense fallback={<PageLoader />}><AntibioticStewardshipEnhanced /></Suspense>} />
        <Route path="oxygen-therapy-monitor-enhanced" element={<Suspense fallback={<PageLoader />}><OxygenTherapyMonitorEnhanced /></Suspense>} />
        <Route path="bed-management-enhanced" element={<Suspense fallback={<PageLoader />}><BedManagementEnhanced /></Suspense>} />
        <Route path="vital-signs-charting-enhanced" element={<Suspense fallback={<PageLoader />}><VitalSignsChartingEnhanced /></Suspense>} />
        <Route path="consent-forms-enhanced" element={<Suspense fallback={<PageLoader />}><ConsentFormsEnhanced /></Suspense>} />
        <Route path="visitor-management-enhanced" element={<Suspense fallback={<PageLoader />}><VisitorManagementEnhanced /></Suspense>} />
        <Route path="wristband-printing-enhanced" element={<Suspense fallback={<PageLoader />}><WristbandPrintingEnhanced /></Suspense>} />
        <Route path="patient-education-enhanced" element={<Suspense fallback={<PageLoader />}><PatientEducationEnhanced /></Suspense>} />
        <Route path="service-charter-enhanced" element={<Suspense fallback={<PageLoader />}><ServiceCharterEnhanced /></Suspense>} />
        <Route path="hospital-profile-enhanced" element={<Suspense fallback={<PageLoader />}><HospitalProfileSettingsEnhanced /></Suspense>} />
        <Route path="point-of-care-enhanced" element={<Suspense fallback={<PageLoader />}><PointOfCareTestingEnhanced /></Suspense>} />
        <Route path="pharmacy-enhanced" element={<Suspense fallback={<PageLoader />}><PharmacyEnhanced /></Suspense>} />
        <Route path="lab-enhanced" element={<Suspense fallback={<PageLoader />}><LabEnhanced /></Suspense>} />
        <Route path="billing-enhanced" element={<Suspense fallback={<PageLoader />}><BillingEnhanced /></Suspense>} />
        <Route path="emergency-dept-enhanced" element={<Suspense fallback={<PageLoader />}><EmergencyDepartmentEnhanced /></Suspense>} />
        <Route path="theatre-management-enhanced" element={<Suspense fallback={<PageLoader />}><TheatreManagementEnhanced /></Suspense>} />
        <Route path="radiology-enhanced" element={<Suspense fallback={<PageLoader />}><RadiologyEnhanced /></Suspense>} />
        <Route path="maternity-enhanced" element={<Suspense fallback={<PageLoader />}><MaternityEnhanced /></Suspense>} />
        <Route path="icu-monitoring-enhanced" element={<Suspense fallback={<PageLoader />}><ICUMonitoringEnhanced /></Suspense>} />
        <Route path="nicu-tracking-enhanced" element={<Suspense fallback={<PageLoader />}><NICUTrackingEnhanced /></Suspense>} />
        <Route path="appointment-scheduler-enhanced" element={<Suspense fallback={<PageLoader />}><AppointmentSchedulerEnhanced /></Suspense>} />
        <Route path="handover-notes-enhanced" element={<Suspense fallback={<PageLoader />}><HandoverNotesEnhanced /></Suspense>} />
        <Route path="renal-dialysis-enhanced" element={<Suspense fallback={<PageLoader />}><RenalDialysisEnhanced /></Suspense>} />
        <Route path="physiotherapy-enhanced" element={<Suspense fallback={<PageLoader />}><PhysiotherapyEnhanced /></Suspense>} />
        <Route path="covid19-management" element={<Suspense fallback={<PageLoader />}><COVID19Management /></Suspense>} />
        <Route path="radiation-safety" element={<Suspense fallback={<PageLoader />}><RadiationSafety /></Suspense>} />
        <Route path="cardiac-cath-lab" element={<Suspense fallback={<PageLoader />}><CardiacCathLab /></Suspense>} />
        <Route path="medical-waste-tracking" element={<Suspense fallback={<PageLoader />}><MedicalWasteTracking /></Suspense>} />
        <Route path="formulary-management" element={<Suspense fallback={<PageLoader />}><FormularyManagement /></Suspense>} />
        <Route path="equipment-calibration" element={<Suspense fallback={<PageLoader />}><EquipmentCalibration /></Suspense>} />
        <Route path="preventive-maintenance" element={<Suspense fallback={<PageLoader />}><PreventiveMaintenance /></Suspense>} />
        <Route path="blood-donor-registry" element={<Suspense fallback={<PageLoader />}><BloodDonorRegistry /></Suspense>} />
        <Route path="fire-safety" element={<Suspense fallback={<PageLoader />}><FireSafety /></Suspense>} />
        <Route path="linen-management" element={<Suspense fallback={<PageLoader />}><LinenManagement /></Suspense>} />
        <Route path="dietary-management" element={<Suspense fallback={<PageLoader />}><DietaryManagement /></Suspense>} />
        <Route path="staff-onboarding" element={<Suspense fallback={<PageLoader />}><StaffOnboarding /></Suspense>} />
        <Route path="patient-consent" element={<Suspense fallback={<PageLoader />}><PatientConsent /></Suspense>} />
        <Route path="sterilisation" element={<Suspense fallback={<PageLoader />}><Sterilisation /></Suspense>} />
        <Route path="medical-gas" element={<Suspense fallback={<PageLoader />}><MedicalGas /></Suspense>} />
        <Route path="ward-cleaning" element={<Suspense fallback={<PageLoader />}><WardCleaning /></Suspense>} />
        <Route path="shift-handover" element={<Suspense fallback={<PageLoader />}><ShiftHandover /></Suspense>} />
        <Route path="fall-prevention" element={<Suspense fallback={<PageLoader />}><FallPrevention /></Suspense>} />
        <Route path="surgery-booking" element={<Suspense fallback={<PageLoader />}><SurgeryBooking /></Suspense>} />
        <Route path="infection-surveillance" element={<Suspense fallback={<PageLoader />}><InfectionSurveillance /></Suspense>} />
        <Route path="therapeutic-drug-monitoring" element={<Suspense fallback={<PageLoader />}><TherapeuticDrugMonitoring /></Suspense>} />
        <Route path="patient-identification" element={<Suspense fallback={<PageLoader />}><PatientIdentification /></Suspense>} />
        <Route path="pharmacy-ordering" element={<Suspense fallback={<PageLoader />}><PharmacyOrdering /></Suspense>} />
        <Route path="medical-device" element={<Suspense fallback={<PageLoader />}><MedicalDevice /></Suspense>} />
        <Route path="energy-management" element={<Suspense fallback={<PageLoader />}><EnergyManagement /></Suspense>} />
        <Route path="staff-time-book" element={<Suspense fallback={<PageLoader />}><StaffTimeBook /></Suspense>} />
        <Route path="lab-reception" element={<Suspense fallback={<PageLoader />}><LabReception /></Suspense>} />
        <Route path="medication-safety" element={<Suspense fallback={<PageLoader />}><MedicationSafety /></Suspense>} />
        <Route path="patient-meal-tracking" element={<Suspense fallback={<PageLoader />}><PatientMealTracking /></Suspense>} />
        <Route path="theatre-scheduling-enhanced" element={<Suspense fallback={<PageLoader />}><TheatreSchedulingEnhanced /></Suspense>} />
        <Route path="patient-portal-enhanced" element={<Suspense fallback={<PageLoader />}><PatientPortalEnhanced /></Suspense>} />
        <Route path="medical-records-enhanced" element={<Suspense fallback={<PageLoader />}><MedicalRecordsEnhanced /></Suspense>} />
        <Route path="staff-performance-tracker" element={<Suspense fallback={<PageLoader />}><StaffPerformanceTracker /></Suspense>} />
        <Route path="health-screening-programme" element={<Suspense fallback={<PageLoader />}><HealthScreeningProgramme /></Suspense>} />
        <Route path="organ-donation-registry" element={<Suspense fallback={<PageLoader />}><OrganDonationRegistry /></Suspense>} />
        <Route path="telemedicine-enhanced" element={<Suspense fallback={<PageLoader />}><TelemedicineEnhanced /></Suspense>} />
        <Route path="traditional-medicine" element={<Suspense fallback={<PageLoader />}><TraditionalMedicineIntegration /></Suspense>} />
        <Route path="drug-interaction-checker" element={<Suspense fallback={<PageLoader />}><DrugInteractionCheckerEnhanced /></Suspense>} />
        <Route path="blood-bank-enhanced" element={<Suspense fallback={<PageLoader />}><BloodBankEnhanced /></Suspense>} />
        <Route path="equipment-maintenance-enhanced" element={<Suspense fallback={<PageLoader />}><EquipmentMaintenanceEnhanced /></Suspense>} />
        <Route path="vte-prevention" element={<Suspense fallback={<PageLoader />}><VTEPreventionPage /></Suspense>} />
        <Route path="falls-prevention" element={<Suspense fallback={<PageLoader />}><FallsPreventionPage /></Suspense>} />
        <Route path="patient-flow-board" element={<Suspense fallback={<PageLoader />}><PatientFlowBoardPage /></Suspense>} />
        <Route path="pressure-ulcer-prevention" element={<Suspense fallback={<PageLoader />}><PressureUlcerPreventionPage /></Suspense>} />
        <Route path="medication-reconciliation-v2" element={<Suspense fallback={<PageLoader />}><MedicationReconciliationPage /></Suspense>} />
        <Route path="vital-signs-charting" element={<Suspense fallback={<PageLoader />}><VitalSignsChartingPage /></Suspense>} />
        <Route path="specimen-tracking" element={<Suspense fallback={<PageLoader />}><SpecimenTrackingPage /></Suspense>} />
        <Route path="clinical-governance" element={<Suspense fallback={<PageLoader />}><ClinicalGovernancePage /></Suspense>} />
        <Route path="ambulance-dispatch" element={<Suspense fallback={<PageLoader />}><AmbulanceDispatchPage /></Suspense>} />
        <Route path="medication-administration-chart" element={<Suspense fallback={<PageLoader />}><MedicationAdministrationChartPage /></Suspense>} />
        <Route path="point-of-care-testing" element={<Suspense fallback={<PageLoader />}><PointOfCareTestingPage /></Suspense>} />
        <Route path="ward-board" element={<Suspense fallback={<PageLoader />}><WardBoardPage /></Suspense>} />
        <Route path="clinical-pathways" element={<Suspense fallback={<PageLoader />}><ClinicalPathwaysPage /></Suspense>} />
        <Route path="patient-journey" element={<Suspense fallback={<PageLoader />}><PatientJourneyTrackerPage /></Suspense>} />
        <Route path="obstetric-emergency" element={<Suspense fallback={<PageLoader />}><ObstetricEmergencyPage /></Suspense>} />
        <Route path="renal-dialysis" element={<Suspense fallback={<PageLoader />}><RenalDialysisPage /></Suspense>} />
        <Route path="burn-unit" element={<Suspense fallback={<PageLoader />}><BurnUnitPage /></Suspense>} />
        <Route path="hospital-profile" element={<Suspense fallback={<PageLoader />}><HospitalProfileSettingsPage /></Suspense>} />
        <Route path="system-health" element={<Suspense fallback={<PageLoader />}><SystemHealthMonitorPage /></Suspense>} />
        <Route path="user-roles" element={<Suspense fallback={<PageLoader />}><UserRolesManagerPage /></Suspense>} />
        <Route path="nicu" element={<Suspense fallback={<PageLoader />}><NeonatalIntensiveCarePage /></Suspense>} />
        <Route path="surgical-safety-checklist" element={<Suspense fallback={<PageLoader />}><SurgicalSafetyChecklistPage /></Suspense>} />
        <Route path="hand-hygiene-compliance" element={<Suspense fallback={<PageLoader />}><HandHygieneCompliancePage /></Suspense>} />
        <Route path="psychiatric-assessment" element={<Suspense fallback={<PageLoader />}><PsychiatricAssessmentPage /></Suspense>} />
        <Route path="nutrition-assessment" element={<Suspense fallback={<PageLoader />}><NutritionAssessmentPage /></Suspense>} />
        <Route path="discharge-letter" element={<Suspense fallback={<PageLoader />}><DischargeLetterPage /></Suspense>} />
        <Route path="operating-theatre-log" element={<Suspense fallback={<PageLoader />}><OperatingTheatreLogPage /></Suspense>} />
        <Route path="ventilator-management" element={<Suspense fallback={<PageLoader />}><VentilatorManagementPage /></Suspense>} />
        <Route path="blood-transfusion-safety" element={<Suspense fallback={<PageLoader />}><BloodTransfusionSafetyPage /></Suspense>} />
        <Route path="tuberculosis-tracker" element={<Suspense fallback={<PageLoader />}><TuberculosisTrackerPage /></Suspense>} />
        <Route path="malaria-surveillance" element={<Suspense fallback={<PageLoader />}><MalariaSurveillancePage /></Suspense>} />
        <Route path="ssi-tracker" element={<Suspense fallback={<PageLoader />}><SurgicalSiteInfectionTrackerPage /></Suspense>} />
        <Route path="medication-error-tracker" element={<Suspense fallback={<PageLoader />}><MedicationErrorTrackerPage /></Suspense>} />
        <Route path="patient-fall-tracker" element={<Suspense fallback={<PageLoader />}><PatientFallIncidentTrackerPage /></Suspense>} />
        <Route path="infection-control-audit" element={<Suspense fallback={<PageLoader />}><InfectionControlAuditPage /></Suspense>} />
        <Route path="emergency-triage-enhanced" element={<Suspense fallback={<PageLoader />}><EmergencyTriageEnhancedPage /></Suspense>} />
        <Route path="labour-ward" element={<Suspense fallback={<PageLoader />}><LabourWardManagementPage /></Suspense>} />
        <Route path="neonatal-screening" element={<Suspense fallback={<PageLoader />}><NeonatalScreeningPage /></Suspense>} />
        <Route path="immunisation-tracker" element={<Suspense fallback={<PageLoader />}><ImmunisationTrackerPage /></Suspense>} />
        <Route path="mental-health-crisis" element={<Suspense fallback={<PageLoader />}><MentalHealthCrisisPage /></Suspense>} />
        <Route path="psychiatric-ward" element={<Suspense fallback={<PageLoader />}><PsychiatricWardManagementPage /></Suspense>} />
        <Route path="consent-management-enhanced" element={<Suspense fallback={<PageLoader />}><ConsentManagementEnhancedPage /></Suspense>} />
        <Route path="pharmacy-compounding-enhanced" element={<Suspense fallback={<PageLoader />}><PharmacyCompoundingEnhancedPage /></Suspense>} />
        <Route path="community-health-tracker" element={<Suspense fallback={<PageLoader />}><CommunityHealthTrackerPage /></Suspense>} />
        <Route path="diagnostic-imaging" element={<Suspense fallback={<PageLoader />}><DiagnosticImagingTrackerPage /></Suspense>} />
        <Route path="pathology-reporting" element={<Suspense fallback={<PageLoader />}><PathologyReportingPage /></Suspense>} />
        <Route path="theatre-scheduler" element={<Suspense fallback={<PageLoader />}><OperatingTheatreSchedulerPage /></Suspense>} />
        <Route path="pre-op-assessment" element={<Suspense fallback={<PageLoader />}><PreOpAssessmentPage /></Suspense>} />
        <Route path="post-op-recovery" element={<Suspense fallback={<PageLoader />}><PostOpRecoveryPage /></Suspense>} />
        <Route path="ward-medication-safety" element={<Suspense fallback={<PageLoader />}><WardMedicationSafetyPage /></Suspense>} />
        <Route path="oxygen-therapy-safety" element={<Suspense fallback={<PageLoader />}><OxygenTherapySafetyPage /></Suspense>} />
        <Route path="insulin-safety" element={<Suspense fallback={<PageLoader />}><InsulinSafetyTrackerPage /></Suspense>} />
        <Route path="nurse-handover-enhanced" element={<Suspense fallback={<PageLoader />}><NurseHandoverEnhancedPage /></Suspense>} />
        <Route path="clinical-research" element={<Suspense fallback={<PageLoader />}><ClinicalResearchRegistryPage /></Suspense>} />
        <Route path="ward-census-tracker" element={<Suspense fallback={<PageLoader />}><WardCensusTrackerPage /></Suspense>} />
        <Route path="medical-equipment-tracker" element={<Suspense fallback={<PageLoader />}><MedicalEquipmentTrackerPage /></Suspense>} />
        <Route path="patient-risk-stratification" element={<Suspense fallback={<PageLoader />}><PatientRiskStratificationPage /></Suspense>} />
        <Route path="drug-interaction-alerts" element={<Suspense fallback={<PageLoader />}><DrugInteractionAlertsPage /></Suspense>} />
        <Route path="blood-bank-enhanced" element={<Suspense fallback={<PageLoader />}><BloodBankEnhancedModulePage /></Suspense>} />
      </Route>

      <Route
        path="/patient"
        element={
          <RequirePatient>
            <PatientHome />
          </RequirePatient>
        }
      />
      <Route
        path="/patient/portal"
        element={
          <RequirePatient>
            <Suspense fallback={<PageLoader />}><PatientPortal /></Suspense>
          </RequirePatient>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
