# 03 — Database ERD

Source of truth: `apps/api/prisma/schema.prisma` (65 models). Key entity groups:

## 1. Administrative geography
```
Region 1─∞ District 1─∞ SubDistrict
        └─∞ Facility
```
`Region(code,name,capital,gpsLat,gpsLng)` · `District(code,name,type[METROPOLITAN|MUNICIPAL|DISTRICT],capital,regionId)`

## 2. Organizations & facilities
```
Organization 1─∞ Facility 1─∞ Department
Region 1─∞ Facility ∞─1 District
```
`Facility(code,name,type,level,ownership,regionId,districtId,services[],departments[],openingHours,bedCapacity,…)`

## 2b. Hospital structure & workforce
```
Facility 1─∞ Department 1─? HospitalUnit 1─∞ Ward 1─∞ Bed
Facility 1─∞ HospitalUnit · HospitalUnit 1─∞ Admission
HospitalUnit 1─∞ UnitEquipment 1─∞ EquipmentMaintenance
Facility 1─∞ Staff ?─1 HospitalUnit
```
`HospitalUnit(code@unique-per-facility, name, type[CLINICAL|DIAGNOSTIC|SUPPORT|ADMINISTRATIVE], headName, headTitle, phone, location, bedCapacity, services[], status)`
`Ward(name@unique-per-unit, bedCapacity, status)` — beds link `unitId` + `wardId` and keep the legacy free-text `ward` name for the bed board.
`UnitEquipment(name@unique-per-unit, category[LIFE_SUPPORT|MONITORING|DIAGNOSTIC|SURGICAL|THERAPY|SUPPORT|OTHER], quantity, functional/inMaintenance/faulty counts, serialNumber, manufacturer, model, purchaseDate, nextMaintenanceAt)` — status is derived from the counts; `EquipmentMaintenance(performedAt, note, performedById)` logs completed maintenance.
`Staff(staffNumber@unique-per-facility, fullName, role[CONSULTANT|MEDICAL_OFFICER|NURSE|MIDWIFE|…], speciality, licenseNumber, employmentStatus[ACTIVE|ON_LEAVE|RETIRED|TERMINATED], headOfUnit, joinedAt)` — the workforce: per-unit teams plus hospital-level roles (records, finance, HIO, security…); `headOfUnit` is exclusive per unit (promotion clears the previous head) and mirrors the unit's free-text headName.

## 3. Identity & access
```
Role 1─∞ User
User ∞─1 Facility · ∞─1 Organization · 1─? Patient (patient portal link)
```
`Role(code,scope,permissions[])` — permissions is a JSON array of permission codes (spec §62).

## 4. Patient & MPI
```
Patient 1─∞ PatientIdentifier (GHANA_CARD|NHIS|PASSPORT|…)
       1─∞ PatientContact
       1─∞ PatientDocument (digital folder)
```
`Patient(mrn@unique, fullName, dateOfBirth, ghanaCard, nhisNumber, allergies[], regionId, districtId, facilityId, consentAccepted…)`
`PatientDocument(patientId, category[GHANA_CARD|NHIS_CARD|PASSPORT|VISA_PERMIT|IDENTITY|REFERRAL_LETTER|LAB_RESULT|IMAGING|PRESCRIPTION|DISCHARGE_SUMMARY|CONSENT|INSURANCE|MEDICAL_RECORD|OTHER], originalName, storedName@unique, mimeType, sizeBytes, notes, uploadedById)` — the digital patient folder: scanned IDs, referrals, lab results and discharge summaries. Files live on disk under `uploads/patients/<patientId>/` and are served only through the authenticated `GET /patients/:id/documents/:docId/content` endpoint (never statically); every upload/update/delete is audit-logged (`patient.document.*`). Cascade-deleted with the patient.

## 5. Clinical (append-oriented — spec §102)
```
Patient 1─∞ Encounter 1─∞ ClinicalNote
                    1─∞ Diagnosis (ICD-10)
                    1─∞ LabOrder (status ORDERED→COLLECTED→VERIFIED, critical flag)
                    1─∞ Prescription (status ACTIVE→DISPENSED/PARTIAL, dispensedQty)
Patient 1─∞ Admission (ward, bed, ADMITTED/DISCHARGED)
       1─∞ Appointment (status, idempotencyKey@unique)
       1─∞ Referral (status DRAFT…COMPLETED)
       1─∞ Invoice (amount, paidAmount, paymentMethod)
       1─∞ Immunization (vaccine, dose, nextDueAt)
       1─∞ DiseaseCase (surveillance)
```

## 6. Offline-first & audit
```
Device(deviceId@unique, platform, status, lastSyncAt, lastSeenAt)
MutationLog(transactionId@unique, entityType, entityId, operation, payload, idempotencyKey, clientTimestamp, status, retryCount, error)
AuditLog(actor, action, entityType, entityId, before, after, deviceId, ip, createdAt)
```

## 7. Design rules (spec §85–86)

- UUID primary keys everywhere; **names/phones are never primary keys**.
- Every client write carries `clientTimestamp` + `idempotencyKey` (spec §100).
- Coded values (types/statuses) are strings validated by the API, keeping the schema portable to PostgreSQL (no enums/Json/Decimal).
- Audit `before`/`after` JSON snapshots make every clinical change reconstructable.
