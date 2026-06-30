# ARIA Healthcare Intelligence Platform (Phase 4.8)

A secure, extensible healthcare module supporting healthcare professionals,
public health programs, hospitals, and personal health management. The core
engine is generic; all program-specific logic (Maternal Health, Child Health,
Immunization, Vector Control, Disease Surveillance, Nutrition, School Health,
NCD, TB, HIV, and future programs) is implemented as plugins via
`HealthProgramPlugin`.

## Architecture

```
health/
├── HealthEngine.ts            facade — orchestrates all managers
├── HealthProvider.ts          provider interface + base/no-op implementations
├── HealthRegistry.ts          provider registry (register/get/list/unregister)
├── HealthProgramPlugin.ts     public-health plugin contract + plugin registry
├── PatientManager.ts          patient repository (demographics, visits, allergies,
│                               medical history, lab results, document links)
├── FacilityManager.ts         facility + healthcare provider repository
├── AppointmentManager.ts      scheduling, recurrence, reminders, travel time
├── MedicationManager.ts       schedules, missed-dose detection, refills,
│                               interaction-check placeholder
├── VaccinationManager.ts      schedule, due/upcoming/completed/missed, boosters
├── DiseaseKnowledge.ts        provider-independent disease + program knowledge
├── ClinicalDecisionSupport.ts rule engine + AI-assisted decision support
├── HealthAnalytics.ts         stats: appointments, adherence, coverage, etc.
├── HealthScheduler.ts         generates reminder suggestions (never auto-sends)
├── HealthPermissions.ts       per-patient role-based access control
├── HealthValidator.ts         input validation for all entities
├── HealthEvents.ts            event bus (patient/appointment/medication/etc.)
├── HealthConfig.ts            tunables (lead times, budgets, limits)
├── HealthTypes.ts             shared types for the entire module
└── index.ts                   per-user singleton sessions + re-exports
```

`functions/src/healthApi.ts` exposes the engine to the frontend as Firebase
Cloud Functions (`onCall`), following the same pattern as the Communication
Hub: every function checks `request.auth`, validates input, and delegates
to a per-user `HealthEngine` instance obtained from `getHealthEngine`.

## Providers

Every health data source provider implements `HealthProvider`:

```ts
initialize() / authenticate() / connect() / disconnect()
search() / sync() / healthCheck() / shutdown() / getStatus()
```

`HealthRegistry` holds providers in a `Map<string, HealthProvider>`. Unlike
the Communication Hub's registry (which pre-registers placeholder channels),
the Health Registry registers **no providers by default** — health data
sources are vendor/program-specific (a national EMR, a lab system, a
vaccination registry, etc.) rather than a fixed enumerable channel set.
`BaseHealthProvider` and `NoOpHealthProvider` are available to build new
providers without code changes to the engine.

## Patient Model

`Patient` holds: `demographics`, `visits[]`, `allergies[]`,
`medicalHistory[]`, `labResults[]`, `documentIds[]` (linked attachments via
Document Intelligence), and `memoryNodeId` (the Memory Graph node this
patient is represented by). `PatientManager` is a pure Firestore repository
(`users/{userId}/patients`); `HealthEngine` is the only caller that also
performs Memory Graph linking.

## Appointment Engine

`AppointmentManager` supports schedule / reschedule / cancel / complete,
telemedicine appointments (via `type`), recurring series (`daily` / `weekly`
/ `monthly`), travel-time annotation, and reminder-scheduled tracking so
`HealthScheduler` never double-reminds. Listing supports filtering by
patient/status and an "upcoming within N hours" query used by the reminder
scheduler.

## Medication System

`MedicationManager` tracks medication schedules as an array of doses with
status `pending | taken | missed | skipped`. `detectMissedDoses` scans for
doses more than 30 minutes past their scheduled time still pending, marks
them missed, and emits `medication:dose_missed`. `listRefillsDue` surfaces
medications whose `refillDate` falls within the configured lead window.
`checkInteractionsPlaceholder` is an explicit, documented extension point —
it returns `[]` today and is meant to be overridden by a plugin or future
provider with a real drug-interaction knowledge base.

## Vaccination System

`VaccinationManager` tracks status (`due | upcoming | completed | missed`),
supports `scheduleBooster` for additional doses, and `refreshDueStatuses`
recomputes due/upcoming/missed transitions based on the current time and the
configured due-window.

## Decision Support

`ClinicalDecisionSupport` combines a synchronous **rule engine**
(`registerRule` / `evaluateRules`, where a single faulty rule can never break
the overall result because each call is wrapped in `try/catch`) with an
**AI-assisted** pass that asks Claude for a checklist, missing-information
list, and additional recommendations. Every `DecisionSupportResult` carries
a fixed disclaimer and the AI prompt itself instructs the model:

> "You are a clinical decision SUPPORT assistant. Never provide a final
> diagnosis. Always phrase output as recommendations for a clinician to
> review."

**This module never produces a diagnosis** — only recommendations a
qualified clinician must review and confirm.

## Plugin Architecture

`HealthProgramPlugin` is the contract for public-health programs:

```ts
interface HealthProgramPlugin {
  id, name, description
  registerDiseases?(): DiseaseInfo[]
  registerProgram?(): HealthProgram
  registerProtocols?(): DecisionSupportRule[]
  computeAnalytics?(userId, engine): Promise<Record<string, unknown>>
  generateReports?(userId, engine): Promise<HealthProgramReport[]>
  registerDashboards?(): HealthProgramDashboardWidget[]
  registerWorkflows?(): Array<{ id, name, description }>
}
```

`HealthPluginRegistry.installInto(userId, engine)` registers a plugin's
diseases, program metadata, and decision-support rules into the core engine
without the engine ever importing a concrete program. New programs (TB,
HIV, NCD, etc.) are added purely by implementing this interface — zero
changes to `HealthEngine` or any other core file.

## Integration

- **Document Intelligence**: `HealthEngine.linkMedicalReport(userId,
  patientId, documentId, extractedSummary)` is the entry point for
  OCR → entity extraction pipelines to attach a processed medical report to
  a patient's visit timeline and the Memory Graph.
- **Communication Hub**: `HealthScheduler` only ever *creates suggestions*
  (`HealthSuggestion`, always `requiresApproval: true`). It never calls a
  send function directly — the Communication Hub dispatches a suggestion
  only after explicit user approval.
- **Navigation Intelligence**: `setAppointmentTravelTime` stores a
  travel-time annotation on an appointment for a navigation/leave-reminder
  workflow to act on. Facility-finder / nearby-hospital search reuse
  `FacilityManager.listFacilities` as the data source.
- **Memory Graph**: patients, facilities, appointments, medications,
  vaccinations, and medical reports are each upserted as nodes and linked
  with edges (`ATTENDED`, `RELATED_TO`) back to the patient node. All
  Memory Graph calls are best-effort (wrapped in `try/catch`) and never
  block the primary health-record write.

## Security

- Never produces a final diagnosis; all clinical output is decision support
  reviewed by a qualified professional.
- Never sends a communication automatically; every reminder is a suggestion
  requiring explicit user approval.
- All AI calls run through Firebase Cloud Functions using the
  `ANTHROPIC_API_KEY` Secret Manager secret — never exposed to the frontend.
- `HealthPermissions` provides per-patient, role-based access control
  (`reader < health_worker < doctor < admin`).
- All writes go through the repository/manager classes — no direct,
  unvalidated Firestore writes from the API layer.
