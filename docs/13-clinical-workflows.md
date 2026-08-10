# 13 — Clinical Workflows

## 1. OPD (implemented — spec §16)

```
Register/Appointment → Queue → Triage+vitals → Clinical consultation
  → Diagnosis (ICD-10) → Orders (lab) / Prescription → Pharmacy (dispense) → Billing → Follow-up
```

Data flow: `Patient → Encounter → ClinicalNote/Diagnosis/LabOrder/Prescription` — strictly **append-oriented** (spec §102); nothing is overwritten, everything is versioned by `createdAt` and audited.

## 2. Emergency (partial — spec §19)
`Encounter.type = EMERGENCY` with `triageCategory` (EMERGENT/URGENT/NON_URGENT). A dedicated emergency dashboard is a later phase.

## 3. Laboratory (implemented — spec §23)
```
LabOrder(ORDERED) → sample collection (sampleType) → result entry + verification (VERIFIED, verifiedById)
  → critical flag surfaces red alerts on dashboards
```

## 4. Pharmacy (implemented — spec §25)
```
Prescription(ACTIVE) → dispense (dispensedQty) → DISPENSED | PARTIAL
```

## 5. Inpatient (partial — spec §18)
`Admission(ward, bed, ADMITTED → DISCHARGED)` with discharge summary.

## 6. Appointments & queue (implemented — spec §14–15)
Booking is idempotent (`idempotencyKey`); statuses BOOKED → CONFIRMED → CHECKED_IN → COMPLETED/CANCELLED/MISSED. Queue entries carry auto tickets (`OUT-001`, `PHA-001`…) with WAITING → CALLED → IN_SERVICE → COMPLETED/SKIPPED.

## 7. Not yet implemented (roadmap)
Partograph/labour, newborn APGAR, immunisation reminders/defaulter tracking, theatre, blood bank, referral transport states, telemedicine — see `docs/22`.
