# Product Rules and Standards

## 1) Landing Page Separation (Critical)

Public landing and authenticated dashboards must stay isolated.

Rules:

- Public users only access landing routes
- Authenticated users are redirected to role dashboards
- No dashboard components inside landing page
- No shared layout between landing and dashboards

Primary routes:

- `/` landing (public)
- `/login`
- `/register`
- `/dashboard/patient`
- `/dashboard/staff`
- `/dashboard/doctor`

## 2) Landing Page Requirements

- Premium black-and-gold visual identity
- Mobile-first responsive layout
- Strong clinic branding

Navbar content:

- Logo
- Home, About, Services, Contact
- Facebook (official page)
- Login
- Book Appointment

Hero content:

- "Estandarte Dental Clinic"
- "Premium Dental Care Made Simple"
- Trusted care in Compostela for over 4 years
- CTA: Book Appointment, Login

Global removals:

- Overview section
- "10+ Years Experience"
- "5,000+ Procedures"
- "4.9 Rating"

Footer content:

- Address
- Phone
- Clinic hours
- Email

## 3) Authentication and Access

- Firebase Authentication
- Role-based login and redirect
- Patient self-registration enabled
- Protected routes for all dashboards

Login/Register design:

- Left side: doctor promotional image
- Right side: form
- Professional clinic-first branding

## 4) Role-Based Dashboards

Doctor:

- Full appointment control
- Pricing control
- Analytics and reports
- Diagnosis and treatment updates
- Before/after image uploads
- Schedule overrides and settings access

Staff:

- Appointment operations
- Payment verification
- Status updates and support workflows
- No pricing control
- No system settings control

Patient:

- Book appointment
- Select service and doctor
- Select payment method
- View records and notifications
- Submit feedback

## 5) Appointment and Payment Rules

Appointment flow:

1. Select service
2. Select doctor
3. Choose date/time
4. Validate availability
5. Select payment
6. Confirm booking

Payment flow (cash only):

- Patient selects cash at booking (pay at clinic after treatment)
- Staff marks **paid** when cash is received at counter
- System assigns official receipt number (OR-YYYY-####)
- Invoice printable from Payments page
- Revenue appears on doctor dashboard (daily + weekly cash report)

Pricing:

- Controlled by doctor
- Stored in Firebase
- Locked after booking

## 6) UI/UX Rules

Typography baseline:

- Inter, Poppins, or Roboto

Hierarchy:

- Headings: bold
- Labels: medium
- Content: regular

Layout constraints:

- Remove Overview section
- Sidebar is primary navigation
- Avoid duplicate UI blocks
- Move profile into sidebar near Logout

Header behavior:

- Patient section shown top-right on desktop
- On mobile, profile appears in sidebar only

## 7) Responsive Rules

Mobile and tablet:

- Hide statistics, latest updates, and shortcut blocks
- Keep form layouts vertical
- Buttons minimum 44px height
- Sidebar-only navigation pattern

Desktop:

- Profile visible top-right

## 8) Security and Quality Rules

- Role-based access control
- Firebase auth enforcement
- Audit logging
- Data privacy controls

Anti-spaghetti rules:

Never:

- Mix multiple role logic in one component
- Hardcode cross-feature UI logic
- Duplicate components
- Put all feature logic in a single file

Always:

- Use modular feature organization
- Separate UI and data logic
- Keep service layer responsible for backend calls

