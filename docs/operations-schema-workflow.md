# Cemetery Operations Schema and Workflow

## Core Collections

### plots
Canonical idea for all physical spaces. Current DB keeps separate Directus collections, so the app maps them into one operational model.

| Current collection | Purpose | Status values |
| --- | --- | --- |
| graveyards | Ground lots | available, reserved, occupied, maintenance |
| apartment_stores | Apartment tombs | available, reserved, occupied, maintenance |
| apartment_baby_stores | Baby apartment tombs | available, reserved, occupied, maintenance |
| bone_vault_stores | Bone vault spaces | available, reserved, occupied, maintenance |

### burial_records
One record per interment case.

Required operational fields:
- Deceased identity: first_name, middle_name, last_name, age, gender, indigent, address
- Dates: date_of_birth, date_of_death, date_of_renewal
- Contact: contact_person, contact_number
- Plot assignment: exactly one of graveyard_id, ab_stores_tomb, baby_apartment_stores, bone_vault
- Payment: amount, or_number
- Renewal: renew, number_of_renew, year_covered, days_passed, days_left
- Status: active, pending_renewal, expired, transferred, archived

### tomb_history
Audit trail for plot usage over time.

Used when:
- A deceased record is transferred to another plot
- A plot is vacated
- A plot is renewed or archived

### history_old_user
Human-readable transfer history for officers.

Used when:
- Previous occupant is moved to bone vault
- A tomb changes occupant

## Operations Workflow

1. Officer opens Interment Records.
2. Officer reviews the table first to avoid duplicate records.
3. Officer clicks New Interment.
4. Officer enters deceased and contact details.
5. Officer chooses a plot type.
6. System lists only available spaces for that plot type.
7. Officer saves the record.
8. System creates the burial record.
9. System marks the assigned plot as occupied.
10. Renewal dates and days remaining are calculated automatically.

## Renewal Workflow

1. System calculates base coverage as 7 years from date_of_death.
2. Each renewal adds another 7 years.
3. Records with low days_left become pending_renewal.
4. Expired records appear in the Expired Burial Record workflow.

## Transfer Workflow

1. Officer opens a plot.
2. Officer selects Transfer / Move to Bone Vault.
3. System updates the burial record assignment field.
4. Old plot becomes available or maintenance.
5. New plot becomes occupied.
6. tomb_history and history_old_user receive audit entries.

## UI Principle

Operations screens should always follow:
- table first
- clear filters
- one primary action
- guided form
- automatic status updates
- no duplicate entry pages
