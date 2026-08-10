# 06 — Role–Permission Matrix

Seeded in `apps/api/prisma/seed.ts`. Permissions are stored per role as a JSON array; access is enforced by `requirePermission(...)` preHandlers (spec §61–62).

## 1. Permission codes (spec §62)

`view_patient · create_patient · edit_patient · view_clinical_record · write_clinical_note · prescribe · dispense · order_lab · verify_lab · view_financial · process_payment · view_reports · export_data · manage_users · manage_facility · manage_region · manage_district · view_queue · manage_queue · view_appointments · book_appointment · view_dashboard · view_audit · manage_devices · sync_data · view_surveillance · manage_stock · self_access`

## 2. Roles → scope → permissions (matrix summary)

| Role | Scope | Key permissions |
|---|---|---|
| National Super Administrator | NATIONAL | all |
| Regional Director | REGIONAL | view_*, reports, manage_region, surveillance |
| District Director | DISTRICT | view_*, reports, manage_district, surveillance |
| Hospital Administrator | FACILITY | all facility ops + manage_users/facility, view_audit, manage_devices |
| Medical Director | FACILITY | clinical + prescribe/order_lab/verify_lab + reports |
| Doctor | FACILITY | view_patient, clinical record, write notes, prescribe, order_lab |
| Nurse / Midwife | FACILITY | clinical record, notes, queue mgmt, dispense (nurse) |
| Pharmacist | FACILITY | dispense, queue, stock |
| Laboratory Scientist | FACILITY | order_lab, verify_lab, queue |
| Health Information Officer | FACILITY | view_patient, reports, export_data, audit view |
| Accountant | FACILITY | view_financial, reports |
| Cashier | FACILITY | view_financial, process_payment, queue |
| IT Admin | FACILITY | manage_devices, view_audit, sync_data, manage_users |
| Community Health Worker | FACILITY | create/view patient, clinical record, sync_data, surveillance |
| Patient | PATIENT | self_access only |

## 3. Enforcement layers

1. **Authentication** — JWT; every protected route decodes the token and loads the active user.
2. **Permission** — handler-level `requirePermission(...)`.
3. **Scope** — data-level filter (see `docs/02` §4): facility/district/region/national/patient.
4. **Audit** — every write records actor + role (spec §67).

## 4. Extensibility

New roles/permissions are master data — no code changes required. Assignments and permission sets are version-controlled via the seed; an admin UI for user management is a later phase.
