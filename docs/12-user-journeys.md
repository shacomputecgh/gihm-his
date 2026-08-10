# 12 — User Journeys

## 1. Public visitor
1. Land on home → search "hospital near Accra" → filter by region/district/type.
2. Open a facility profile → view services, departments, hours, contact, map link.
3. Tap "Book appointment" → prompted to log in.

## 2. Registration clerk (offline-capable)
1. Opens Register Patient → fills demographics + Ghana Card/NHIS.
2. MPI check runs: **duplicate found** → clerk reviews candidates (confidence score) → opens existing record, or creates as distinct record with justification.
3. New patient gets an MRN (GH-0000xx). **If offline** → form saves locally, syncs automatically on reconnect (verified via the sync badge).

## 3. Doctor
1. Opens patient registry → searches by name/MRN → opens longitudinal record.
2. Opens a new encounter (type, triage, vitals, complaint).
3. Orders lab tests; writes prescription; adds clinical notes.
4. Later reviews verified results (critical results are flagged red).

## 4. Nurse / queue
1. Opens Queue board → sees live waiting list per department.
2. Starts (calls) the next patient; completes when service ends.

## 5. Pharmacist
1. Sees prescription in the patient record → dispenses with quantity tracking (DISPENSED/PARTIAL).

## 6. Regional/national director
1. Logs in (regional scope) → dashboard shows aggregates within the region.
2. Searches patients — access outside the region is denied (403).
3. Opens Admin → audit log, device status, sync health.

## 7. Patient
1. Logs in with the patient account → sees only their own record: appointments, visits, labs, bills, immunizations.
2. Any attempt to access staff endpoints is blocked (role scope `PATIENT`).
