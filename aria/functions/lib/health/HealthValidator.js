"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthValidator = void 0;
class HealthValidator {
    validatePatient(patient) {
        const errors = [];
        const warnings = [];
        if (!patient.userId)
            errors.push('userId required');
        if (!patient.demographics?.fullName)
            errors.push('demographics.fullName required');
        if (patient.demographics?.dateOfBirth && Number.isNaN(Date.parse(patient.demographics.dateOfBirth))) {
            errors.push('demographics.dateOfBirth must be a valid date');
        }
        if (!patient.demographics?.phone && !patient.demographics?.email) {
            warnings.push('No phone or email on file — reminders cannot be delivered');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    validateAppointment(appt) {
        const errors = [];
        const warnings = [];
        if (!appt.userId)
            errors.push('userId required');
        if (!appt.patientId)
            errors.push('patientId required');
        if (!appt.scheduledFor) {
            errors.push('scheduledFor required');
        }
        else if (Number.isNaN(Date.parse(appt.scheduledFor))) {
            errors.push('scheduledFor must be a valid date');
        }
        if (appt.durationMinutes !== undefined && appt.durationMinutes <= 0) {
            errors.push('durationMinutes must be positive');
        }
        if (!appt.facilityId && appt.type !== 'telemedicine') {
            warnings.push('No facility specified for non-telemedicine appointment');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    validateMedication(med) {
        const errors = [];
        const warnings = [];
        if (!med.userId)
            errors.push('userId required');
        if (!med.patientId)
            errors.push('patientId required');
        if (!med.name)
            errors.push('name required');
        if (!med.dosage)
            errors.push('dosage required');
        if (!med.frequency)
            errors.push('frequency required');
        if (!med.startDate)
            errors.push('startDate required');
        return { valid: errors.length === 0, errors, warnings };
    }
    validateVaccination(vac) {
        const errors = [];
        const warnings = [];
        if (!vac.userId)
            errors.push('userId required');
        if (!vac.patientId)
            errors.push('patientId required');
        if (!vac.vaccineName)
            errors.push('vaccineName required');
        if (!vac.scheduledFor)
            errors.push('scheduledFor required');
        if (vac.doseNumber !== undefined && vac.doseNumber < 1)
            errors.push('doseNumber must be >= 1');
        return { valid: errors.length === 0, errors, warnings };
    }
}
exports.HealthValidator = HealthValidator;
//# sourceMappingURL=HealthValidator.js.map