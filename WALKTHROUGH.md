# AssetTrack — Complete Code Walkthrough & Testing Guide

> **For Team NEWBIES — CBU Coding Hackathon 2026**
> This document explains every part of the system so your entire team understands the codebase.

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [How to Test Everything](#2-how-to-test-everything)
3. [The Database Layer](#3-the-database-layer)
4. [The Java Backend (Spring Boot)](#4-the-java-backend)
5. [The Frontend (Next.js)](#5-the-frontend)
6. [Key Flows Explained Step-by-Step](#6-key-flows-explained)
7. [File Reference Table](#7-file-reference-table)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                            │
│                                                                  │
│  Next.js App (React + TypeScript)  ←→  Supabase Auth SDK        │
│  http://localhost:3000                  (login/signup only)       │
└──────────────┬───────────────────────────────────────────────────┘
               │ HTTP requests (fetch)
               │ e.g. GET /api/assets
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   JAVA SPRING BOOT BACKEND                       │
│                   http://localhost:8080                           │
│                                                                  │
│  Controller  →  Service  →  Repository  →  Database              │
│  (routes)       (logic)     (queries)      (PostgreSQL)          │
└──────────────┬───────────────────────────────────────────────────┘
               │ JDBC (SQL queries)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL DATABASE                    │
│                                                                  │
│  Tables: assets, employees, assignments, asset_history, depts    │
│  Triggers: check_asset_assignable (prevents bad assignments)     │
│  Indexes: unique active assignment per asset                     │
└──────────────────────────────────────────────────────────────────┘
```

### Why two servers?

| Server | What it does | Port |
|--------|-------------|------|
| **Next.js** (frontend) | Renders the UI, handles navigation, manages login/signup via Supabase Auth | 3000 |
| **Java Spring Boot** (backend) | REST API — all data operations (CRUD, business logic, analytics) | 8080 |

**Authentication (login/signup)** goes directly from the browser to Supabase Auth using their JavaScript SDK. The Java backend does NOT handle auth — it only handles data.

---

## 2. How to Test Everything

### Starting the app

You need **two terminal windows** running simultaneously:

**Terminal 1 — Java Backend:**
```bash
cd /Users/almali/Documents/Personal/myProjects/boam/v1/backend
java -jar target/assettrack-backend-1.0.0.jar
```
Wait until you see: `Started AssetTrackApplication in X seconds`

**Terminal 2 — Next.js Frontend:**
```bash
cd /Users/almali/Documents/Personal/myProjects/boam/v1
npm run dev
```
Wait until you see: `Ready in X seconds`

**Open browser:** http://localhost:3000

### Testing each feature

#### Login/Signup (http://localhost:3000/login)
1. Click "Create account" tab
2. Enter email + password (min 6 chars)
3. Check your email for confirmation link
4. Click the link → redirected to dashboard
5. Test logout (button in navbar) and login again

#### Dashboard (http://localhost:3000/dashboard)
- You should see summary cards (Total Assets: 11, etc.)
- Pie chart showing assets by category
- Bar chart showing assets by status
- Recent activity feed at the bottom
- Quick action buttons: "Add Asset", "Add Employee", "View All Assets"

#### Assets (http://localhost:3000/assets)
1. See the table of all 11 seed assets
2. **Search**: Type "Dell" in search bar → filters to Dell assets
3. **Filter**: Select "IT" from category dropdown → shows only IT assets
4. **Filter**: Select "ASSIGNED" from status dropdown
5. **Add Asset**: Click "Add Asset" → fill form → submit → see new asset appear
6. **View**: Click eye icon → goes to asset detail page
7. **QR Code**: Click QR icon → see QR code in modal → try "Print QR Code" button

#### Asset Detail (http://localhost:3000/assets/[click any asset])
1. See full asset info, current assignee, QR code
2. **Assign**: Click "Assign" → pick an employee → add notes → submit
3. **Return**: On an assigned asset, click "Return" → enters reason → asset goes back to REGISTERED
4. **Change Status**: Click "Mark In Repair" → enter reason → status changes
5. **History**: Scroll down to see assignment history and status change history
6. **Business rules**: Try marking a WRITTEN_OFF asset → buttons should be disabled

#### Employees (http://localhost:3000/employees)
1. See 5 seed employees with asset counts
2. **Add Employee**: Click "Add Employee" → fill form → submit
3. **View Assets**: Click an employee row → expands to show their currently assigned assets

#### Audit Log (http://localhost:3000/audit)
1. See all status changes with timestamps
2. **Filter by date**: Select a date range
3. **Filter by asset**: Select an asset from dropdown
4. **Export CSV**: Click "Export CSV" → downloads a .csv file

#### Analytics (http://localhost:3000/analytics)
1. **Asset Aging**: Bar chart showing age distribution
2. **Department Breakdown**: Which departments have the most assets
3. **Status Trends**: Line chart of changes over time
4. **Top Reassigned**: Table of most-moved assets
5. **AI Risk Alerts**: Rule-based warnings (yellow cards at bottom)

### Testing the API directly (optional, for understanding)

You can test the Java backend directly with curl:

```bash
# Get all assets
curl http://localhost:8080/api/assets

# Get one asset
curl http://localhost:8080/api/assets/a1000000-0000-0000-0000-000000000001

# Get employees
curl http://localhost:8080/api/employees

# Get dashboard stats
curl http://localhost:8080/api/analytics/summary

# Get AI alerts
curl http://localhost:8080/api/analytics/alerts

# Get audit history (last 5)
curl "http://localhost:8080/api/asset-history?limit=5"
```

---

## 3. The Database Layer

### File: `supabase/schema.sql`

This creates all the tables. Think of it as the blueprint.

#### Tables explained:

**`assets`** — Every physical item the bank owns
```sql
- id          → unique identifier (UUID)
- name        → "Dell Latitude 5540"
- type        → "Laptop"
- category    → IT | Office | Security | Other (enum)
- serial_number → "DL-5540-001" (must be unique)
- status      → REGISTERED | ASSIGNED | IN_REPAIR | LOST | WRITTEN_OFF (enum)
- created_at  → when the asset was added
- updated_at  → last modification time
```

**`employees`** — Bank staff who receive assets
```sql
- id, full_name, email, department, branch, created_at
```

**`assignments`** — Links assets to employees (who has what)
```sql
- asset_id    → which asset
- employee_id → who has it
- assigned_at → when they got it
- returned_at → NULL means they still have it, a date means they returned it
- notes       → optional notes
```

**`asset_history`** — Audit log (every status change is recorded)
```sql
- asset_id    → which asset changed
- changed_by  → email of who did it
- old_status  → what it was before
- new_status  → what it became
- reason      → why (required for every change)
- changed_at  → when
```

#### Database triggers (automatic rules):
```sql
-- This function runs BEFORE every INSERT into assignments
-- It checks: is the asset LOST or WRITTEN_OFF? If yes, block the assignment
CREATE FUNCTION check_asset_assignable() ...
  IF asset_status IN ('LOST', 'WRITTEN_OFF') THEN
    RAISE EXCEPTION 'Cannot assign an asset with status LOST or WRITTEN_OFF';
  END IF;
```

### File: `supabase/seed.sql`

Sample data to make the app look real. Contains 10 assets, 5 employees, assignments, and history entries.

---

## 4. The Java Backend

### How Spring Boot works (simplified)

```
HTTP Request arrives
       ↓
  @RestController  ← Receives the request, extracts parameters
       ↓
  @Service         ← Contains business logic (rules, validation)
       ↓
  @Repository      ← Translates to SQL queries, talks to database
       ↓
  Database         ← Returns data
       ↓
  DTO              ← Shapes the data into JSON format
       ↓
  HTTP Response    ← Sent back to the browser
```

### Layer-by-layer explanation:

#### Models (JPA Entities) — `backend/src/.../model/`

These are Java classes that map 1:1 to database tables. Each field = one column.

**`Asset.java`**
```java
@Entity                    // "This class represents a database table"
@Table(name = "assets")    // "The table is called 'assets'"
public class Asset {
    @Id                    // "This is the primary key"
    private UUID id;

    @Column(nullable = false)  // "This column cannot be NULL"
    private String name;

    private String status;     // Maps to the status column

    @PrePersist                // "Run this code BEFORE inserting a new row"
    protected void onCreate() {
        createdAt = OffsetDateTime.now();  // Auto-set creation time
        if (status == null) status = "REGISTERED";  // Default status
    }
}
```

**`Assignment.java`**
```java
@ManyToOne(fetch = FetchType.LAZY)  // "Each assignment belongs to ONE asset"
@JoinColumn(name = "asset_id")      // "The foreign key column is asset_id"
private Asset asset;

@ManyToOne(fetch = FetchType.LAZY)  // "Each assignment belongs to ONE employee"
@JoinColumn(name = "employee_id")
private Employee employee;
```

#### Repositories — `backend/src/.../repository/`

These are interfaces (not classes!) that Spring automatically implements. You declare WHAT you want, Spring writes the SQL.

**`AssetRepository.java`**
```java
public interface AssetRepository extends JpaRepository<Asset, UUID> {
    // Spring auto-generates: SELECT * FROM assets ORDER BY updated_at DESC
    List<Asset> findAllByOrderByUpdatedAtDesc();

    // Custom SQL needed because 'status' is a PostgreSQL enum type
    @Query(value = "SELECT * FROM assets WHERE status = CAST(:status AS asset_status)",
           nativeQuery = true)
    List<Asset> findByStatus(@Param("status") String status);
}
```

The naming convention is magic: `findByStatus` → Spring generates `WHERE status = ?`
`findAllByOrderByUpdatedAtDesc` → Spring generates `ORDER BY updated_at DESC`

#### Services — `backend/src/.../service/`

This is where the **business rules** live. Services validate data and coordinate operations.

**`AssetService.java`** — Key business logic:
```java
// Defines which status transitions are allowed
private static final Map<String, List<String>> STATUS_TRANSITIONS = Map.of(
    "REGISTERED", List.of("ASSIGNED", "IN_REPAIR"),
    "ASSIGNED",   List.of("REGISTERED", "IN_REPAIR", "LOST"),
    "IN_REPAIR",  List.of("REGISTERED", "ASSIGNED", "WRITTEN_OFF"),
    "LOST",       List.of("WRITTEN_OFF"),
    "WRITTEN_OFF", List.of()  // Empty = terminal state, no transitions allowed
);

public Asset changeStatus(UUID id, String newStatus, String reason, String changedBy) {
    Asset asset = findById(id);

    // Check if transition is allowed
    List<String> allowed = STATUS_TRANSITIONS.get(asset.getStatus());
    if (!allowed.contains(newStatus)) {
        throw new RuntimeException("Cannot transition from " + asset.getStatus() + " to " + newStatus);
    }

    // If moving away from ASSIGNED, close the active assignment
    if ("ASSIGNED".equals(asset.getStatus())) {
        assignmentRepository.findByAssetIdAndReturnedAtIsNull(id)
            .ifPresent(a -> {
                a.setReturnedAt(OffsetDateTime.now());
                assignmentRepository.save(a);
            });
    }

    // Save the change
    String oldStatus = asset.getStatus();
    asset.setStatus(newStatus);
    assetRepository.save(asset);

    // Log to audit history
    AssetHistory history = new AssetHistory();
    history.setAssetId(id);
    history.setOldStatus(oldStatus);
    history.setNewStatus(newStatus);
    history.setReason(reason);
    history.setChangedBy(changedBy);
    historyRepository.save(history);

    return asset;
}
```

**`AnalyticsService.java`** — Computes dashboard stats, aging, alerts:
```java
// Rule 1: Assets in repair for over 30 days
List<Asset> inRepair = assetRepository.findByStatus("IN_REPAIR");
for (Asset a : inRepair) {
    long daysSinceUpdate = ChronoUnit.DAYS.between(a.getUpdatedAt(), now);
    if (daysSinceUpdate > 30) {
        alerts.add(new AlertDTO("REPAIR_OVERDUE", "high",
            "Asset X has been in repair for 30+ days — risk of loss"));
    }
}
```

#### Controllers — `backend/src/.../controller/`

Controllers are the entry points for HTTP requests. They define the URL routes.

**`AssetController.java`**
```java
@RestController               // "This class handles HTTP requests"
@RequestMapping("/api/assets") // "All routes start with /api/assets"
public class AssetController {

    @GetMapping                // GET /api/assets
    public List<AssetDTO> getAll(@RequestParam(required = false) String status,
                                 @RequestParam(required = false) String category,
                                 @RequestParam(required = false) String search) {
        // Delegates to service layer
    }

    @GetMapping("/{id}")       // GET /api/assets/abc-123
    public AssetDTO getById(@PathVariable UUID id) { ... }

    @PostMapping               // POST /api/assets (create new)
    public AssetDTO create(@RequestBody AssetDTO dto) { ... }

    @PutMapping("/{id}")       // PUT /api/assets/abc-123 (update)
    public AssetDTO update(@PathVariable UUID id, @RequestBody AssetDTO dto) { ... }

    @PatchMapping("/{id}/status")  // PATCH /api/assets/abc-123/status (change status)
    public AssetDTO changeStatus(@PathVariable UUID id,
                                  @RequestBody StatusChangeRequest req) { ... }
}
```

#### DTOs — `backend/src/.../dto/`

DTOs (Data Transfer Objects) define the shape of JSON sent to/from the frontend.

```java
public class AssetDTO {
    private UUID id;
    private String name;
    private String type;
    private String category;
    // ... fields match what the frontend expects
}

public class StatusChangeRequest {
    private String newStatus;  // e.g., "IN_REPAIR"
    private String reason;     // e.g., "Screen cracked"
    private String changedBy;  // e.g., "admin@bank.uz"
}
```

#### Configuration — `backend/src/.../config/`

**`CorsConfig.java`** — Allows the frontend (port 3000) to call the backend (port 8080):
```java
// Without this, the browser would block requests between different ports
// (this is a security feature called "Same-Origin Policy")
config.setAllowedOrigins(List.of("http://localhost:3000"));
config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
```

**`application.properties`** — Database connection settings:
```properties
spring.datasource.url=jdbc:postgresql://...pooler.supabase.com:5432/postgres
spring.datasource.username=postgres.gdmmnshwkiqtnulyrnee
spring.datasource.password=...

# This makes Java field names convert to snake_case in JSON
# So "serialNumber" in Java becomes "serial_number" in JSON
spring.jackson.property-naming-strategy=SNAKE_CASE
```

---

## 5. The Frontend

### How Next.js works (simplified)

```
app/
├── layout.tsx      ← Wraps EVERY page (navbar, theme, fonts)
├── login/page.tsx  ← Shows at http://localhost:3000/login
├── dashboard/page.tsx  ← Shows at http://localhost:3000/dashboard
├── assets/
│   ├── page.tsx    ← Shows at http://localhost:3000/assets
│   └── [id]/page.tsx  ← Shows at http://localhost:3000/assets/abc-123
│                      [id] is a dynamic parameter — any UUID
```

Each `page.tsx` is a React component that renders a full page.

### Key files:

**`lib/api.ts`** — The bridge between frontend and Java backend:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Generic fetch wrapper — all API calls go through this
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// Specific functions for each operation:
export const getAssets = () => fetchApi<Asset[]>("/api/assets");
export const getAsset = (id: string) => fetchApi<Asset>(`/api/assets/${id}`);
export const createAsset = (data: Partial<Asset>) =>
    fetchApi<Asset>("/api/assets", { method: "POST", body: JSON.stringify(data) });
export const changeAssetStatus = (id: string, data: StatusChangeRequest) =>
    fetchApi<Asset>(`/api/assets/${id}/status`, { method: "PATCH", body: JSON.stringify(data) });
// ... etc.
```

**`lib/supabase.ts`** — Only used for authentication:
```typescript
import { createBrowserClient } from "@supabase/ssr";
export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
```

**`middleware.ts`** — Runs BEFORE every page load, checks if user is logged in:
```typescript
// If no valid session exists and user is NOT on /login → redirect to /login
// If valid session exists and user IS on /login → redirect to /dashboard
```

**`lib/types.ts`** — TypeScript interfaces (shape of data):
```typescript
export interface Asset {
    id: string;
    name: string;
    type: string;
    category: AssetCategory;
    serial_number: string;
    status: AssetStatus;
    // ...
}
```

**`lib/constants.ts`** — Shared constants:
```typescript
export const STATUS_COLORS = {
    REGISTERED: "bg-green-500",
    ASSIGNED: "bg-blue-500",
    IN_REPAIR: "bg-yellow-500",
    LOST: "bg-red-500",
    WRITTEN_OFF: "bg-gray-500",
};

export const STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
    REGISTERED: ["ASSIGNED", "IN_REPAIR"],
    ASSIGNED: ["REGISTERED", "IN_REPAIR", "LOST"],
    // ... same rules as the Java backend
};
```

### Page components explained:

**`app/dashboard/page.tsx`**
```typescript
"use client";  // This runs in the browser (not on the server)

export default function DashboardPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [history, setHistory] = useState<AssetHistory[]>([]);

    useEffect(() => {
        loadData();  // Runs once when page loads
    }, []);

    const loadData = async () => {
        const [assetsData, historyData] = await Promise.all([
            api.getAssets(),          // GET /api/assets
            api.getRecentHistory(10), // GET /api/asset-history?limit=10
        ]);
        setAssets(assetsData);
        setHistory(historyData);
    };

    return (
        // Summary cards, charts, activity feed
    );
}
```

### Component types:

| Component | Purpose |
|-----------|---------|
| `Navbar.tsx` | Top navigation bar with links + logout button |
| `StatusBadge.tsx` | Colored pill showing status (green/blue/yellow/red/gray) |
| `StatsCard.tsx` | Dashboard summary card (icon + number + label) |
| `AssetForm.tsx` | Modal dialog to create or edit an asset |
| `EmployeeForm.tsx` | Modal dialog to add an employee |
| `ChangeStatusModal.tsx` | Modal to change asset status with reason input |
| `AssignModal.tsx` | Modal to assign asset to an employee |
| `QRModal.tsx` | Modal showing QR code with print button |
| `ConfirmDialog.tsx` | "Are you sure?" confirmation popup |
| `AIAlerts.tsx` | Risk alert cards (fetched from Java backend) |

---

## 6. Key Flows Explained

### Flow 1: User logs in

```
1. User opens http://localhost:3000
2. middleware.ts runs → no session found → redirect to /login
3. User enters email + password, clicks "Sign In"
4. login/page.tsx calls: supabase.auth.signInWithPassword({ email, password })
5. Supabase Auth verifies credentials, returns a session token
6. Session cookie is set in the browser
7. User is redirected to /dashboard
8. middleware.ts runs → session found → allow access
```

### Flow 2: Viewing the dashboard

```
1. dashboard/page.tsx loads
2. useEffect() triggers loadData()
3. loadData() calls:
   - api.getAssets()          → fetch("http://localhost:8080/api/assets")
   - api.getRecentHistory(10) → fetch("http://localhost:8080/api/asset-history?limit=10")
4. Java AssetController.getAll() receives the request
5. AssetService calls AssetRepository.findAllByOrderByUpdatedAtDesc()
6. Repository generates SQL: SELECT * FROM assets ORDER BY updated_at DESC
7. Database returns rows → mapped to Asset objects → converted to AssetDTO → JSON
8. Frontend receives JSON → setState() → React re-renders with data
9. Recharts library renders pie/bar charts from the data
```

### Flow 3: Assigning an asset to an employee

```
1. User is on /assets/[id] page, clicks "Assign" button
2. AssignModal opens, loads employee list via api.getEmployees()
3. User selects an employee, adds notes, clicks "Assign"
4. Component calls supabase.auth.getUser() to get current user's email
5. Component calls api.assignAsset(assetId, { employee_id, notes, assigned_by })
6. This sends: POST http://localhost:8080/api/assignments/{assetId}
7. Java AssignmentController receives it, calls AssignmentService.assignAsset()
8. AssignmentService:
   a. Checks asset is not LOST or WRITTEN_OFF (throws error if so)
   b. Checks no active assignment exists (returned_at IS NULL)
   c. Creates new Assignment row in database
   d. Updates asset status to ASSIGNED
   e. Creates AssetHistory row (audit log entry)
   f. Returns the new assignment as DTO
9. Frontend shows "Asset assigned successfully" toast
10. Page reloads data to show updated state
```

### Flow 4: Changing asset status

```
1. User clicks "Mark In Repair" on asset detail page
2. ChangeStatusModal opens with reason text field
3. User enters reason, clicks "Confirm"
4. Component calls api.changeAssetStatus(id, { new_status, reason, changed_by })
5. PATCH http://localhost:8080/api/assets/{id}/status
6. Java AssetService.changeStatus():
   a. Validates transition is allowed (checks STATUS_TRANSITIONS map)
   b. If moving FROM "ASSIGNED", closes the active assignment
   c. Updates asset status
   d. Creates audit history entry
7. Frontend shows success toast, reloads page
```

### Flow 5: AI Risk Alerts

```
1. Analytics page (or AIAlerts component) calls api.getAlerts()
2. GET http://localhost:8080/api/analytics/alerts
3. Java AnalyticsService.getRiskAlerts() runs 5 rules:
   Rule 1: Find assets IN_REPAIR for 30+ days → "high" alert
   Rule 2: Find departments with 3+ LOST assets → "critical" alert
   Rule 3: Find active assets older than 5 years → "medium" alert
   Rule 4: Find assets with 5+ reassignments → "medium" alert
   Rule 5: Find recently WRITTEN_OFF assets → "low" alert
4. Returns list of AlertDTO objects as JSON
5. Frontend renders them as colored warning cards
```

---

## 7. File Reference Table

### Config Files
| File | What it does |
|------|-------------|
| `package.json` | Lists all npm dependencies (React, Next.js, shadcn/ui, recharts, etc.) |
| `next.config.js` | Next.js configuration (minimal) |
| `tailwind.config.js` | Tailwind CSS theme (dark colors, gold accent) |
| `.env.local` | Secret keys — Supabase URL, API key, backend URL |
| `middleware.ts` | Intercepts every request to check authentication |
| `backend/pom.xml` | Java dependencies (Spring Boot, PostgreSQL driver, etc.) |
| `backend/.../application.properties` | Database connection, JSON settings |

### Database Files
| File | What it does |
|------|-------------|
| `supabase/schema.sql` | Creates all tables, enums, triggers, indexes |
| `supabase/seed.sql` | Inserts sample data (10 assets, 5 employees, etc.) |

### Frontend — Lib
| File | What it does |
|------|-------------|
| `lib/api.ts` | All HTTP calls to Java backend (getAssets, createAsset, etc.) |
| `lib/supabase.ts` | Supabase browser client (auth only) |
| `lib/supabase-server.ts` | Supabase server client (used in middleware) |
| `lib/types.ts` | TypeScript type definitions (Asset, Employee, etc.) |
| `lib/constants.ts` | Status colors, allowed transitions, category list |
| `lib/utils.ts` | Helper functions (date formatting, etc.) |

### Frontend — Pages
| File | URL | What it shows |
|------|-----|-------------|
| `app/layout.tsx` | (all pages) | Dark theme wrapper, navbar, font, toast provider |
| `app/login/page.tsx` | /login | Login + signup form |
| `app/auth/confirm/route.ts` | /auth/confirm | Email verification handler (no UI) |
| `app/dashboard/page.tsx` | /dashboard | Stats cards, charts, recent activity |
| `app/assets/page.tsx` | /assets | Asset table with search/filter |
| `app/assets/[id]/page.tsx` | /assets/abc-123 | Single asset detail, QR code, history |
| `app/employees/page.tsx` | /employees | Employee table with asset counts |
| `app/audit/page.tsx` | /audit | Full audit log, CSV export |
| `app/analytics/page.tsx` | /analytics | Charts, trends, AI alerts |

### Frontend — Components
| File | What it does |
|------|-------------|
| `components/Navbar.tsx` | Top navigation bar |
| `components/StatusBadge.tsx` | Colored status pill (REGISTERED=green, etc.) |
| `components/StatsCard.tsx` | Dashboard metric card |
| `components/AssetForm.tsx` | Modal to add/edit an asset |
| `components/EmployeeForm.tsx` | Modal to add an employee |
| `components/ChangeStatusModal.tsx` | Modal for status changes with reason |
| `components/AssignModal.tsx` | Modal to assign asset to employee |
| `components/QRModal.tsx` | Modal showing QR code with print button |
| `components/ConfirmDialog.tsx` | Confirmation popup for destructive actions |
| `components/AuditLogRow.tsx` | Single row in audit table |
| `components/AIAlerts.tsx` | Risk alert cards |

### Backend — Java
| File | What it does |
|------|-------------|
| `AssetTrackApplication.java` | Entry point — starts the Spring Boot server |
| `config/CorsConfig.java` | Allows frontend to make cross-origin requests |
| `model/Asset.java` | Maps to `assets` table |
| `model/Employee.java` | Maps to `employees` table |
| `model/Assignment.java` | Maps to `assignments` table |
| `model/AssetHistory.java` | Maps to `asset_history` table |
| `model/Department.java` | Maps to `departments` table |
| `repository/AssetRepository.java` | SQL queries for assets |
| `repository/EmployeeRepository.java` | SQL queries for employees |
| `repository/AssignmentRepository.java` | SQL queries for assignments |
| `repository/AssetHistoryRepository.java` | SQL queries for history |
| `service/AssetService.java` | Asset CRUD + status transition logic |
| `service/EmployeeService.java` | Employee CRUD |
| `service/AssignmentService.java` | Assign/return logic |
| `service/AssetHistoryService.java` | Audit history queries |
| `service/AnalyticsService.java` | Dashboard stats, aging, alerts |
| `controller/AssetController.java` | REST routes for /api/assets |
| `controller/EmployeeController.java` | REST routes for /api/employees |
| `controller/AssignmentController.java` | REST routes for /api/assignments |
| `controller/AssetHistoryController.java` | REST routes for /api/asset-history |
| `controller/AnalyticsController.java` | REST routes for /api/analytics |
| `dto/*.java` | JSON shape definitions (8 DTO classes) |

---

## Quick Glossary

| Term | Meaning |
|------|---------|
| **API** | Application Programming Interface — a set of URLs the backend exposes for the frontend to call |
| **REST** | A style of API design using HTTP methods (GET, POST, PUT, PATCH, DELETE) |
| **DTO** | Data Transfer Object — a simple class that defines what JSON looks like |
| **JPA** | Java Persistence API — maps Java classes to database tables |
| **CRUD** | Create, Read, Update, Delete — the 4 basic data operations |
| **UUID** | Universally Unique Identifier — a 36-character ID like `a1000000-0000-0000-0000-000000000001` |
| **CORS** | Cross-Origin Resource Sharing — browser security that blocks requests between different ports/domains |
| **Middleware** | Code that runs BEFORE a page loads (used for auth checking) |
| **useEffect** | React hook that runs code when a component first appears on screen |
| **useState** | React hook that stores data that can change (triggers re-render when updated) |
| **Enum** | A type with a fixed set of allowed values (e.g., status can only be one of 5 values) |

---

*This walkthrough was generated for Team NEWBIES. Good luck at the hackathon! 🚀*
