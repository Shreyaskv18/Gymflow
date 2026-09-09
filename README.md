# GymFlow — Single-Gym Management Platform (Stage 1)

GymFlow is a purpose-built web application engineered for gym owners and fitness club managers to supervise daily facility operations, monitor member retention, and track core revenue metrics.

---

## 1. What GymFlow Is

GymFlow V1 provides gym owners with an operational control center:
- Instant visibility into active members, expiring memberships, and daily footfall
- Real-time monthly revenue calculations in Indian Rupees (INR)
- Immediate identification of members requiring renewal attention
- Facility and administrator profile settings management backed by a decoupled persistent storage layer

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript (~5.8), Vite 6
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Architecture**: Service Repository Pattern separating UI from the persistent data layer
- **Data Persistence**: Type-safe local persistent storage with relational entities and automated seed generator
- **Runtime**: Node.js 22 / Cloud Run container environment

---

## 3. Project Structure

```
src/
├── components/
│   └── common/
│       ├── Header.tsx           # Top navigation bar with live date, gym info & admin profile
│       ├── Sidebar.tsx          # Responsive navigation sidebar & mobile drawer
│       └── Toast.tsx            # Global notification system
├── data/
│   └── seedData.ts              # Realistic Indian gym seed data generator
├── layouts/
│   └── AppLayout.tsx            # Authenticated application shell & view router
├── pages/
│   ├── LoginPage.tsx            # Admin authentication with validation & demo helper
│   ├── DashboardPage.tsx        # KPI metrics, membership distribution & recent activity
│   ├── SettingsPage.tsx         # Gym info editor, admin profile editor & seed re-initializer
│   └── ComingSoonPage.tsx       # Stage 2 module roadmap placeholders
├── services/
│   ├── storageService.ts        # Core persistent repository engine
│   ├── authService.ts           # Admin login, session validation & credential checks
│   ├── gymService.ts            # Gym profile queries & persistence
│   ├── memberService.ts         # Member queries, expiration logic & attention lists
│   ├── activityService.ts       # Activity feed query & logging
│   └── dashboardService.ts      # Real-time computed dashboard statistics
├── types/
│   └── index.ts                 # TypeScript interfaces for Admin, Gym, Member, Payment, Attendance, Activity
├── utils/
│   └── formatters.ts            # INR currency (₹), date, and relative time helpers
├── App.tsx                      # Root application component & session controller
├── main.tsx                     # React application entry point
└── index.css                    # Global Tailwind styling
```

---

## 4. How to Install Dependencies

```bash
npm install
```

---

## 5. How to Configure Environment Variables

Create a `.env` file in the root directory (referencing `.env.example`):

```env
# Optional Gemini API Key (Reserved for Stage 3 AI Receptionist)
GEMINI_API_KEY=""

# App URL
APP_URL="http://localhost:3000"
```

---

## 6. How to Run Locally

Start the Vite development server on port 3000:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## 7. Demo Login Credentials

For testing and development in Stage 1, a pre-configured administrator account is provided:

- **Admin Email**: `admin@gymflow.demo`
- **Password**: `admin123`

*(You can also click the **"Auto-fill"** button on the login screen to quickly populate these credentials.)*

---

## 8. Database Setup & Relational Integrity

The data layer is built on a clean service repository interface (`src/services/`):
- **Admin**: ID, Name, Email, Password Hash, Role, Timestamp
- **Gym**: ID, Name, Address, Phone, Email, Currency (`INR`), Timestamp
- **Member**: ID, Name, Phone, Email, Membership Plan, Start Date, End Date, Status (`active` | `expiring_soon` | `expired`)
- **Payment**: ID, Member ID (foreign relation), Amount, Payment Date, Payment Method (`UPI`, `Card`, `Cash`, `NetBanking`), Status (`completed`)
- **Attendance**: ID, Member ID (foreign relation), Check-in Time, Date
- **Activity**: ID, Type (`check_in`, `payment_received`, `member_joined`, `renewal`), Description, Timestamp

---

## 9. How Seed Data Works

- The seed dataset contains **18 realistic gym members** with Indian names (e.g., *Rahul Sharma*, *Ananya Rao*, *Deepika Iyer*, *Karthik Sundaram*).
- Dates are dynamically anchored to the current execution date so expiration countdowns and activity relative timestamps are always accurate.
- **KPI calculations are never hard-coded in JSX**:
  - Active Members and Expiring Soon are computed directly from member record expiry dates.
  - Today's Attendance is derived from check-in timestamps matching the current date.
  - Monthly Revenue is calculated by summing completed payment transactions in the current calendar month.

---

## 10. What is Included in Stage 1

1. **Admin Authentication**: Login screen with form validation, error handling, session persistence, and logout flow.
2. **Application Shell & Responsive Navigation**: Desktop sidebar, collapsible mobile navigation drawer, and top header.
3. **Live Gym Dashboard**:
   - 4 Primary KPI cards: Active Members, Expiring Soon, Today's Attendance, Monthly Revenue (in INR ₹).
   - Membership Overview: Visual distribution bar and segmented status cards (Active, Expiring Soon, Expired).
   - Recent Activity: Live timeline of check-ins, payments, enrollments, and renewals.
   - Renewal Attention: Proactive preview list of members with impending expiry within 7 days.
4. **Settings Module**: Gym profile editor (Name, Phone, Email, Address) and Admin profile editor with persistent saving and data re-seeding utilities.
5. **Stage 2 Module Placeholders**: Dedicated roadmap views for Members, Payments, Attendance, and Renewals without fake mockups.

---

## 11. What is Intentionally NOT Included Yet

- Full Member Onboarding & CRUD table views (Stage 2)
- Payment Gateway & Invoicing generator (Stage 2)
- Live Front-Desk Check-in terminal (Stage 2)
- Automated WhatsApp/SMS renewal messaging (Stage 2)
- Multi-Gym / Multi-Branch SaaS tenant routing (Future)
- AI Gym Receptionist & Voice Assistant (Future Stage 3)

---

## 12. How Stage 2 Should Extend the System

Stage 2 will build upon the existing Stage 1 data contracts and service interfaces:
1. **Member Management**: Connect the `memberService` to interactive table views, search bars, and member creation modals.
2. **Payments Module**: Implement payment entry forms that record new `Payment` objects, update monthly revenue in real-time, and generate printable PDF receipts.
3. **Attendance Terminal**: Build an active front-desk scanner or search box to record `Attendance` entries on the fly.
4. **Renewal Workflows**: Implement 1-click renewal action buttons directly from the Renewal Attention list.
