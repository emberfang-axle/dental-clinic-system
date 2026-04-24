# Roles and Workflows

## 1) Role Responsibilities

### Doctor

- Manage appointments (approve, reschedule, cancel)
- Manage services and pricing
- View analytics and reports
- Add diagnosis, treatment plans, and records
- Upload before/after treatment images
- Control clinic-level settings and scheduling overrides

### Staff

- Manage appointment operations and queue
- Verify payments and update billing states
- Update support notes and statuses
- Assist in clinic operations and patient workflow

Restrictions:

- No pricing control
- No full system settings control

### Patient

- Book appointments
- Select services and doctor
- Select payment method
- Upload/submit payment proof (when applicable)
- View records and notifications
- Submit post-treatment feedback

## 2) Appointment Workflow

1. Patient selects service
2. Patient selects doctor
3. Patient picks date and time
4. System validates slot availability
5. Patient chooses payment method
6. Booking is created
7. Role users receive notifications

Operational constraints:

- No double booking
- Real-time schedule awareness
- Calendar synchronization support

## 3) Billing Workflow

### GCash

1. Patient submits reference number
2. Screenshot may be uploaded
3. Status set to `pending_verification`
4. Staff/doctor verifies payment
5. Status progresses to `verified`, then `paid`

### Cash

1. Payment collected at clinic
2. Staff confirms and marks as paid

## 4) System Flow (End-to-End)

1. User visits landing page
2. User logs in or registers
3. Firebase authenticates identity
4. User role is resolved
5. User is redirected to role dashboard
6. User actions update data in near real time
7. Staff verifies payments
8. Appointments are completed
9. Records and analytics are updated

