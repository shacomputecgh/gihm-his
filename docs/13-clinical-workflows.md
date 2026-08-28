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

## 7. Maternity & obstetrics (implemented — spec §20)
Antenatal care (visits with GA/EDD/vitals/risk assessment, auto visit numbers),
delivery (type/mode/outcome, birth weight, **APGAR 1/5**, maternal + newborn
outcomes, attended-by — a recorded delivery closes the patient's active ANC
visits as DELIVERED), and postnatal follow-up (maternal/newborn review,
breastfeeding method, contraception, immunization) — patient-scoped routes
under `/patients/:id/{antenatal,deliveries,postnatal}` with the same access
rules as encounters (7 API tests, `tests/maternity.test.ts`). The patient
detail page has a **Maternity tab** (`MaternityTab.tsx`) — ANC/delivery/PNC
lists with record forms and the labour chart with alert/action-line flags.

## 8. Labour partograph (implemented — docs/13 §7)
WHO-style labour charting: a partograph per labour episode, repeated
observations (cervical dilation, fetal heart rate, contractions, descent,
maternal vitals) plotted against time since onset. The server computes each
observation's position against the alert/action lines (expected dilation
4cm + 1cm/hour; action line 4 hours behind) so the UI can flag prolonged
labour; a recorded delivery completes the open partograph.

## 9. Telemedicine (implemented — spec §82–83)
Remote consultations with the full lifecycle — **SCHEDULED → IN_PROGRESS →
COMPLETED | CANCELLED | MISSED** — modeled server-side so the future
video/phone transport plugs in behind the same endpoints (a `joinUrl`
placeholder is set when a consultation starts). Patient-scoped booking under
`/patients/:id/teleconsultations` (mode VIDEO/PHONE/CHAT, scheduled time,
optional clinician assignment), a scope-aware clinician worklist at
`GET /teleconsultations` (facility users see their facility's consultations
plus their own assignments; regional/district users their administrative
scope), and guarded transitions: the assigned clinician always owns their
consultation, everyone else needs record-level patient access. The transport
itself (video/phone bridge) remains a future integration phase. UI: a
**Telemedicine worklist** page (`/app/telemedicine`) with status filter and
Start / Complete (with outcome) / Cancel / Missed transitions plus the
joinUrl link, and a **Telemedicine tab** on the patient detail page (booking
form + the patient's consultations).

## 10. Imaging & radiology (implemented — spec §24)
Radiology orders with the same discipline as the laboratory: a request
(**ORDERED**) flows through the study (**IN_PROGRESS**) to the radiologist's
report (**REPORTED → VERIFIED**), or is **CANCELLED** — patient-scoped
ordering under `/patients/:id/imaging-orders` (modality X_RAY/ULTRASOUND/
CT/MRI/MAMMOGRAPHY/FLUOROSCOPY/OTHER, body part, clinical question), a
scope-aware radiology worklist at `GET /imaging/orders` (status/modality
filters), report entry + verification (`order_imaging` / `verify_imaging`
permissions, RADIOLOGIST role), and guarded transitions (409 on illegal
jumps, cancelled orders can never be reported). The DICOM/PACS image
transport itself remains a future integration — the module carries the
order, study status and the structured report. UI: a **Radiology worklist**
page (`/app/radiology`) with status/modality filters, start-study/cancel
actions, report entry + verification and a verified-reports list, plus an
**Imaging tab** on the patient detail page (order form with encounter
selection + the patient's orders with reports).
