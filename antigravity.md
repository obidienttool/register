# OBIDIENT STATE REGISTER
A structured political membership management system organized by:
State → Local Government → Ward → Polling Unit

Built for speed, simplicity, and scalability.
Hosted on Vercel (Free Tier).
Backend: Supabase (PostgreSQL + Auth) OR Neon + Prisma.
Frontend: Next.js (App Router).

---

# 1. CORE FEATURES

## 1.1 Public Member Signup

Fields:
- Full Name
- Phone Number (unique)
- Email (optional but unique if provided)
- State (dropdown)
- Local Government (dependent dropdown)
- Ward (dependent dropdown)
- Polling Unit (from predefined list)
- Password

System rules:
- Phone number must be unique
- Polling unit must be selected from database
- Default role: MEMBER
- Default verified: false

---

## 1.2 Authentication

Login using:
- Phone number OR username
- Password

Roles:
- MEMBER
- POLLING_UNIT_LEAD
- WARD_COORDINATOR
- LGA_COORDINATOR
- STATE_COORDINATOR
- ADMIN

Use JWT-based authentication via Supabase Auth or NextAuth.

---

# 2. VERIFICATION SYSTEM

Admins / Ward Coordinators can:
- Mark member as "Verified"
- Upon verification:
    - Generate Membership Number
    - Format: ST-LGA-WARD-PU-XXXX

Example:
LA-ETI-IK-0123

Membership number must:
- Be unique
- Auto increment per polling unit

---

# 3. POLLING UNIT 5-MAN TEAM STRUCTURE

Each Polling Unit:
- Max 5 assigned team members
- Assigned manually by:
    - Ward Coordinator
    - System Admin

Database rule:
- Unique constraint: max 5 active team roles per polling unit

Team roles example:
- PU Leader
- Deputy
- Mobilization Lead
- Data Lead
- Security/Logistics

These are assigned, NOT random.

---

# 4. EXCO ASSIGNMENT

Admins can assign:
- Ward Coordinator
- LGA Coordinator
- State Coordinator

Only one coordinator per level per region.

Must enforce:
- Only verified members can become Excos
- Role update audit log

---

# 5. PROFILE PAGE

Users can:
- Update phone (with verification)
- Update email
- Change password
- View membership number
- View assigned role
- View assigned polling unit

Cannot change:
- State hierarchy
- Role
- Membership number

---

# 6. SETTINGS PAGE (ADMIN ONLY)

Sections:

## 6.1 Role Management
- Create new roles
- Assign permissions
- Edit access control

## 6.2 Backup & Restore
- Export full database to JSON
- Import database JSON
- Version control logs

## 6.3 Create Update System
- Create system update (version tag)
- Log changes
- Rollback to previous version

## 6.4 Patch System
- Create patch
- Apply patch
- Patch history log

---

# 7. FILTER & EXPORT

Admin filters:
- By State
- By LGA
- By Ward
- By Polling Unit
- By Verified
- By Role

Export options:
- CSV
- Excel

Fields exportable:
- Name
- Phone
- Email
- Membership Number
- Role
- Verification Status
- Hierarchy location

---

# 8. SMS BROADCAST SYSTEM

Integrate:
- Termii API OR Africa’s Talking

Admin can send SMS to:
- All members in State
- All members in LGA
- All members in Ward
- All verified members
- Custom filtered group

Must:
- Log sent messages
- Track delivery status (if API allows)

---

# 9. AI INTEGRATION

Use OpenAI API or local AI model.

AI features:
- Generate mobilization messages
- Suggest SMS copy
- Analyze member growth statistics
- Predict weak polling units based on signup numbers

AI dashboard:
- Member analytics
- Growth charts
- Engagement suggestions

---

# 10. DATABASE STRUCTURE

Tables:

users
- id
- full_name
- phone (unique)
- email
- password_hash
- state_id
- lga_id
- ward_id
- polling_unit_id
- role
- verified
- membership_number
- created_at

states
lgas
wards
polling_units

pu_team_assignments
- polling_unit_id
- user_id
- role_title

sms_logs
- message
- target_group
- sent_by
- created_at

system_updates
system_patches
audit_logs

---

# 11. SECURITY

- Role-based access control
- Rate limit signup
- Phone verification OTP (optional)
- Admin activity logs
- Database backups weekly

---

# 12. DEPLOYMENT PLAN

Frontend:
- Vercel

Backend:
- Supabase (Free tier)

Repo:
- GitHub

Environment variables:
- SUPABASE_URL
- SUPABASE_KEY
- SMS_API_KEY
- AI_API_KEY

---

# 13. DEVELOPMENT PHASES

PHASE 1:
Auth + Signup + Hierarchy structure

PHASE 2:
Verification + Membership numbers

PHASE 3:
5-man PU team assignment

PHASE 4:
Filtering + Export

PHASE 5:
SMS integration

PHASE 6:
AI analytics

PHASE 7:
Backup / patch system

---

END.