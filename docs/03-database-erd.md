# 03 — Database ERD

Source of truth: `apps/api/prisma/schema.prisma` (24 models). Key entity groups:

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
```
`Patient(mrn@unique, fullName, dateOfBirth, ghanaCard, nhisNumber, allergies[], regionId, districtId, facilityId, consentAccepted…)`

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
