# Allo Healthcare Inventory Reservation System

### 1. How to Run the App Locally

To set up the application on your local machine, follow these steps:

#### Install Dependencies
First, install the npm packages:
```bash
npm install
```

#### Set Up Environment Variables
Create a `.env` file in the root directory and add your PostgreSQL database connection strings (the project is pre-configured to use Neon):
```env
DATABASE_URL="postgresql://..." # pgBouncer pooled connection (port 5432)
DIRECT_URL="postgresql://..."   # Direct connection for running schema migrations
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your-secure-cron-secret-token"
```

#### Database Setup (Migrations & Seeding)
Sync the Prisma schema directly to your database:
```bash
npx prisma db push
```

Once the tables are created, run the database seed script to populate the clinical inventories:
```bash
npx prisma db seed
```

#### Run the Development Server
Finally, start the local Next.js server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

### 2. How the Expiry Mechanism Works in Production

When a user locks inventory to reserve items, they get a temporary 10-minute hold. The hold prevents other users from checking out those items. In production, this cleanup is handled through two layers:

* **Just-in-Time (JIT) Sweeps**: Every time a user loads the inventory table or attempts a transaction, the application automatically triggers a fast query in the background that checks for expired holds (`status === 'PENDING'` and `expiresAt < now`). Any expired holds are immediately reverted back to available stock. This ensures available stock numbers are always accurate when users browse the site.
* **Daily Cron Job**: A scheduled cron endpoint `/api/cron/expire-reservations` runs once a day (configured in `vercel.json` as `0 0 * * *` to stay within Vercel's free Hobby limits). This acts as a background cleaner to sweep any leftover abandoned checkouts that haven't been touched in over 24 hours.

---

### 3. Trade-offs & Things I'd Do Differently With More Time

* **Database Transactions vs. Redis Caching**: 
  Currently, every temporary checkout hold is written directly to PostgreSQL. While this guarantees ACID compliance and keeps the architecture simple, it is highly write-heavy. If this app scaled to thousands of simultaneous checkouts, the database would quickly experience bottlenecks. 
  With more time, I would store the temporary 10-minute checkout holds in **Redis (using a TTL of 600 seconds)** instead. When a hold expires, Redis would trigger a callback to release the stock, and we would only write to PostgreSQL once the user actually confirms their checkout.

* **Client Polling vs. WebSockets**:
  To keep stock numbers current, the frontend uses short-interval query polling. This keeps the data fresh but places unnecessary read load on the database.
  If I had more time, I would replace this polling with **WebSockets** or **Server-Sent Events (SSE)**. This way, we could broadcast real-time stock updates to all active sessions only when a state change actually happens.

* **Prisma Accelerate Connection Pooling**:
  Serverless environments like Vercel open and close database connections constantly, which can quickly exhaust PostgreSQL connection limits. I bypassed this by using Neon's connection pooler in the connection string, but in a production enterprise setup, utilizing a managed proxy pooler like Prisma Accelerate would be a much cleaner solution to handle serverless connection scaling.
