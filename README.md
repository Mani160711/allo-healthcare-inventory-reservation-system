# Allo Healthcare - Inventory Reservation Platform

Allo Healthcare is a premium, clinical operations dashboard designed to manage high-concurrency inventory allocation and secure checkout holds for vital medical stock (such as vaccines, therapeutics, and surgical supplies). 

The platform guarantees data consistency and prevents race conditions under high traffic, using HSL Slate clinical aesthetics and modular Next.js architecture.

---

## 🚀 Local Development Setup

To run the Allo Healthcare application locally, follow these steps:

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed on your machine.

### 2. Configure Environment Variables
Create a `.env` file in the root directory. You can copy the template from `.env.example`:

```bash
cp .env.example .env
```

Add your database connection strings:
```env
# Neon PostgreSQL Connection with pgBouncer pooling enabled (port 5432)
DATABASE_URL="postgresql://user:password@host-pooler.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Neon PostgreSQL Direct Connection for schema migrations and prisma pushes
DIRECT_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"

# Root Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Secure token for triggering the expiration cron
CRON_SECRET="your-secure-local-secret"
```

### 3. Install Dependencies
Install all required node packages:
```bash
npm install
```

### 4. Database Migrations & Prisma Generation
To apply the database schema to your PostgreSQL database, run:
```bash
npx prisma db push
```
This will automatically compile your Prisma schema and map the relational tables (`Product`, `Warehouse`, `Inventory`, and `Reservation`) into Neon PostgreSQL.

### 5. Seed Database Clinical Inventory
Populate the database with clinical healthcare products and warehouses:
```bash
npx prisma db seed
```
This will seed the database with real-world clinical inventory (such as *Adrenaline*, *Bio-Defense Influenza vaccine*, and *Critical-Care Patient ventilators*) distributed across multiple geographical hubs.

### 6. Run the App
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the operational dashboard!

---

## ⏱️ How the Expiry Mechanism Works in Production

When clinical staff initiates a reserve transaction, the system places a **temporary 10-minute hold** on those specific units of stock. During these 10 minutes, the reserved units are locked out of general inventory and cannot be checked out by other departments.

To handle hold releases, the system leverages a **dual-layered cleanup mechanism** in production:

### Layer A: Reactive Just-in-Time (JIT) Database Sweeps
Whenever a user interacts with the app (e.g. loads the inventory list, creates a reservation, or loads details), the backend repository executes a reactive query sweep.
* Before running inventory allocation queries, the database automatically identifies any records in the `Reservation` table where `status === 'PENDING'` and `expiresAt` is less than the current time (`now`).
* In a single database transaction, it updates the expired reservations to `RELEASED` and restores the locked stock back to the warehouse's available balance.
* This ensures that available inventory metrics are **always 100% accurate and fresh** upon any active user request.

### Layer B: Proactive Scheduled Cron Sweep
To clean up stale, abandoned reservations in the background (even if no users are actively reloading the page), a Vercel Cron Job is configured:
* The configuration in `vercel.json` routes a daily trigger to the `/api/cron/expire-reservations` API route.
* Vercel's automated system hits this route with a secure `Authorization: Bearer <CRON_SECRET>` header.
* The API triggers the backend `ReservationService.processExpiredReservations()` function to batch-release any expired holds in PostgreSQL, keeping the database footprint clean and optimized.

---

## ⚖️ Technical Trade-offs & Future Enhancements

With more development time or larger operational scale, the following architectural trade-offs would be addressed differently:

### 1. Database-Level Locking vs. Redis-Based Hold Cache
* **Current Approach**: Temporary 10-minute holds are written directly to PostgreSQL using transaction queries to lock stock counts safely.
* **Trade-off**: High-frequency reservation traffic results in frequent write-heavy queries directly to the relational database, increasing Neon compute load.
* **What we'd do with more time**: Use a high-performance, distributed key-value store (like **Redis / Upstash**) to manage temporary 10-minute checkout holds. 
  * The holds would live in Redis memory with an automatic TTL (Time-to-Live) of 600 seconds.
  * PostgreSQL would only be written to *once a hold is finalized and confirmed*. This drastically reduces database load and scales to millions of simultaneous reservation requests with sub-millisecond latencies.

### 2. Client-Side Polling vs. Real-Time WebSockets
* **Current Approach**: The dashboard uses TanStack React Query polling cycles (fetching fresh stocks and active holds every few seconds) to keep screens synchronous.
* **Trade-off**: Rapid client polling generates constant network requests and database queries, even when stock balances haven't changed.
* **What we'd do with more time**: Implement a live **Server-Sent Events (SSE) or WebSockets** layer. 
  * When a pharmacist confirms or releases a hold, the server broadcasts the updated stock levels in real-time to all connected dashboards, eliminating the need for periodic network polling.

### 3. Serverless Database Connection Pooler (pgBouncer)
* **Current Approach**: The app uses Neon’s pgBouncer pooler (`DATABASE_URL` on port 5432) to prevent serverless function invocation spikes from exhausting PostgreSQL database connection limits.
* **Trade-off**: Pre-configured poolers occasionally exhibit connection-close warnings when database servers undergo idle states on free tiers.
* **What we'd do with more time**: Integrate a dedicated ORM database accelerator (such as **Prisma Accelerate**) to manage connection states globally outside the database environment.
