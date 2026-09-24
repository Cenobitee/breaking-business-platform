# Breaking Business

A full-stack starter for role-based POS operations and investor financial transparency.

## Stack

- Java 21 and Spring Boot
- Spring Security with signed JWT access tokens
- PostgreSQL with Flyway migrations
- React and Vite

## Roles

- `OWNER`: creates a business profile, then creates and manages that business's Manager and Investor accounts
- `MANAGER`: POS, staff directory, and operational analytics access
- `INVESTOR`: business-scoped investor analytics, investment requests, and personal investment history

## Business hierarchy

**Breaking Business** is the platform name. Each Owner creates a separate business profile, such as **Irodori**. Managers and Investors cannot register themselves; their Owner creates their profiles from Operations, and every user, sale, analytic, investment request, and investment notification is restricted to that business.

The Business Profile page lets the Owner maintain a logo, description, address, phone, contact email, website, and business name. Manager and Investor accounts in that business can view the profile but cannot edit it.

## Local setup

1. Start PostgreSQL:

   ```bash
   docker compose up -d database
   ```

2. Start the backend (requires Java 21 and Maven 3.9+):

   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. Start the frontend (requires Node.js 20+):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173`.

Development users are created automatically under the **Irodori** business when the database contains no users:

| Role | Email | Password |
|---|---|---|
| Owner | `owner@example.com` | `ChangeMe123!` |
| Manager | `manager@example.com` | `ChangeMe123!` |
| Investor | `investor@example.com` | `ChangeMe123!` |

Change the seed credentials and JWT secret before any shared or production deployment. Environment variable names are documented in `.env.example`.

## API overview

| Method | Endpoint | Roles |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public (creates a business and its Owner) |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password` | Public |
| POST | `/api/sales` | Owner, Manager |
| DELETE | `/api/sales/{id}` | Owner, Manager (audited cancellation) |
| GET | `/api/sales` | Owner, Manager |
| GET | `/api/analytics/operations` | Owner, Manager |
| GET | `/api/analytics/investor` | Owner, Investor |
| GET | `/api/users` | Owner, Manager |
| POST | `/api/users` | Owner (creates Manager or Investor under the Owner's business) |
| GET | `/api/business` | Owner, Manager, Investor |
| PUT | `/api/business` | Owner |
| POST | `/api/investments/requests` | Investor |
| GET | `/api/investments/me` | Investor |
| GET | `/api/investments/requests/pending` | Owner |
| POST | `/api/investments/requests/{id}/approve` | Owner |
| GET | `/api/investments/active` | Owner |
| POST | `/api/investments/{id}/remove` | Owner |
| DELETE | `/api/investments/history` | Owner (permanently deletes that business's investment history) |
| GET | `/api/messages/contacts` | Owner, Manager, Investor |
| GET | `/api/messages/conversations/{contactId}` | Allowed business contacts |
| POST | `/api/messages/conversations/{contactId}` | Role-policy controlled |
| PATCH | `/api/messages/{messageId}` | Message sender only |
| DELETE | `/api/messages/{messageId}` | Message sender only |

The floating messaging window polls for new messages and displays unread badges. Investors can message Owners and Managers. Managers can message Owners, and can read but cannot reply to Investor messages. Owners can message both Managers and Investors. Senders can edit or permanently delete their own messages. All contacts and conversations are isolated to the current business.

The POS accepts user-entered product names and unit prices. `Grape Pulp Juice` remains a protected catalog item at exactly `130.00 BDT`; attempts to record it at another price are rejected.

Deleting a sale creates an immutable cancellation record rather than physically removing the original financial entry. Cancelled sales are excluded from recent sales, revenue, order count, AOV, profit, and investor analytics.

Password-reset tokens expire after 30 minutes and are single-use. In local development the reset link is shown in the browser because no email delivery service is configured. Set `PASSWORD_RESET_EXPOSE_TOKEN=false` before deployment and connect the reset service to an email provider.

Investors can request an amount from their portal. Owners receive a notification and approve requests from Operations. Approval creates an immutable investment transaction with the exact date and time, adds it to approved-capital analytics, and records it in that investor's history.

Owners can remove an active invested amount. Removal is an immutable audit record rather than a database deletion: it subtracts the amount from active-capital totals while preserving the original investment, removal date and time, and responsible owner in the investor's history.

## Planned modules

The React application contains a non-functional placeholder for automated profit distribution. Database migrations reserve future `inventory` and `investors` tables without connecting them to live financial calculations.
