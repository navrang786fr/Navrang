# Navrang Platform — System Architecture & Technology Stack

An end-to-end architectural blueprint of the **Navrang Family Restaurant & Digital Ordering Platform**, detailing system components, data flows, cloud infrastructure, on-premise POS synchronization, and technology stacks.

---

## 1. High-Level Architecture Overview

```mermaid
flowchart TB
    subgraph ClientDevices["1. CLIENT APPLICATION TIER"]
        CustomerMobile["Customer Handheld<br/>(order.html - Mobile PWA)"]
        WaiterDevice["Waiter Handheld Tablet<br/>(admin/waiters.html)"]
        CounterPOS["Cashier / Counter Billing PC<br/>(admin/billing.html)"]
        AdminLaptop["Manager / Owner Dashboard<br/>(admin/dishes.html, categories.html)"]
    end

    subgraph EdgeCDN["2. HOSTING & CDN LAYER"]
        GH_Pages["GitHub Pages CDN<br/>(navrang786fr.github.io/Navrang)<br/>- High-speed global edge cache<br/>- Zero-cost static asset delivery"]
    end

    subgraph CloudServerless["3. CLOUD SERVERLESS TIER (Vercel)"]
        direction TB
        VercelGateway["Vercel Edge Gateway (ratings-api-pink.vercel.app)"]
        APIRate["/api/rate<br/>(Customer Dish Reviews)"]
        APITrack["/api/track<br/>(Customer Telemetry)"]
        APIGame["/api/game-stats<br/>(Real Biryani Catcher Counter)"]
        APICat["/api/categories<br/>(Image Upload & Category Meta)"]
        APIDish["/api/dishes<br/>(Live Menu Pricing & Availability)"]
        APIAuth["/api/login & change-password<br/>(JWT HMAC-SHA256 Auth)"]
        APICron["/api/backup-activity<br/>(Vercel Cron 7-day Backup)"]
    end

    subgraph DataTier["4. TRANSACTIONAL SERVERLESS DATABASE (GitHub Repos)"]
        PublicRepo[("Public Repo: navrang786fr/Navrang<br/>- menu-data.js (Live Dish Catalog)<br/>- ratings.json (Public Customer Reviews)<br/>- game-stats.json (Verified Plays)<br/>- images/menu/ (Optimized Media)")]
        PrivateRepo[("Private Repo: rahamathalisk/admin-db<br/>- activity-log.json (Search & Item Views)<br/>- rating-submissions.json (IP Throttles)<br/>- access-log.json & audit-log.json<br/>- backups/activity-log-YYYY-MM-DD.json")]
    end

    subgraph OnPremiseTier["5. ON-PREMISE LAN POS TIER (Local Server)"]
        PythonServer["Python 3 Multi-threaded Server<br/>(server.py on port 3000)<br/>- Zero cloud dependency<br/>- Sub-millisecond LAN latency"]
        POSOrders[("pos-orders.json<br/>- Active Table Carts<br/>- Submitted Kitchen KOTs<br/>- Settled Bills & Daily Collections")]
        LocalAdminStore["Local Credentials<br/>- cashier-pin.txt<br/>- admin-password.txt"]
    end

    %% Client traffic
    CustomerMobile -->|HTTPS static bundle| GH_Pages
    CustomerMobile -->|POST Ratings / Telemetry / Game| VercelGateway
    CustomerMobile -.->|Optional in-restaurant Wi-Fi| PythonServer

    WaiterDevice -->|HTTP LAN port 3000| PythonServer
    CounterPOS -->|HTTP LAN port 3000| PythonServer
    AdminLaptop -->|HTTPS / Cloud Management| VercelGateway
    AdminLaptop -->|HTTP LAN / POS Overrides| PythonServer

    %% Serverless routing
    VercelGateway --> APIRate
    VercelGateway --> APITrack
    VercelGateway --> APIGame
    VercelGateway --> APICat
    VercelGateway --> APIDish
    VercelGateway --> APIAuth
    VercelGateway --> APICron

    %% Backend to Database GitHub API
    APIRate -->|Octokit REST Contents API| PublicRepo
    APIGame -->|Atomic SHA PUT| PublicRepo
    APICat -->|Base64 Image Upload| PublicRepo
    APIDish -->|Serialized AST Mutation| PublicRepo

    APITrack -->|Encrypted Sliding Window Array| PrivateRepo
    APIAuth -->|Audit Log Entries| PrivateRepo
    APICron -->|Automated Snapshots| PrivateRepo

    %% Local disk storage
    PythonServer --> POSOrders
    PythonServer --> LocalAdminStore
```

---

## 2. Core Architecture Subsystems

The Navrang platform is split into three decoupled subsystems designed for **zero downtime**, **zero operational infrastructure cost**, and **high survivability**:

### A. Customer Experience PWA (`order.html`)
* **Dual-Language Client Engine (`order-app.js`)**: Real-time instantaneous toggle between English and Telugu (`తెలుగు`) with dynamic string dictionary translation for search placeholders, dietary badges, categories, and allergen warnings.
* **Instant Client-side Search & Multi-filter**: Fuzzy search across English dish names, Telugu script dish titles, ingredients, and categories. Instant filtering by Veg/Non-Veg, Top Best Sellers, and price brackets (<₹100, ₹100–₹200, ₹200–₹300, ₹300+).
* **Biryani Catcher Mini-Game**: HTML5 Canvas 2D game running at 60 FPS directly within the waiting bar. Built with retro pixel-art physics, particle thruster sparks, catch explosion bursts, and a procedural Web Audio API sound synthesizer (no external MP3 asset dependencies).
* **Real Game Plays Sync Engine**: Synchronized counter between client `localStorage`, `game-stats.json`, and `/api/game-stats` on Vercel. Increments automatically when players compete and syncs across devices.
* **Split-Bill Calculator**: Native utility for dine-in groups to divide total food checks among guest counts, round figures, copy breakdown text to WhatsApp, or render downloadable HTML5 screenshot receipts.
* **Social & Community Integration**: Direct topbar icon buttons, footer subscribe widgets, and floating action button (FAB) speed-dials linking to the restaurant's **YouTube Channel** (`https://www.youtube.com/channel/UCgJrjCtAEO39sfaaTyd_EHA`) and **Instagram** (`@navrang786fr` 5% OFF discount campaign).

---

### B. On-Premise LAN Floor & POS Server (`server.py`)
* **Local Floor-to-Counter Sync**: Built using Python 3's `http.server.SimpleHTTPRequestHandler` with `socketserver.ThreadingMixIn` running on `0.0.0.0:3000`.
* **Zero-Cloud LAN Dependency**: When local Internet broadband drops, dining operations continue without interruption. Waiter handhelds (`admin/waiters.html`) and counter billing PCs (`admin/billing.html`) communicate directly over the local Wi-Fi router.
* **Thread-Safe Atomic File Storage**: Orders are persisted to `pos-orders.json` using atomic temporary file swaps (`.tmp.{pid}.{threadid}`) shielded by `threading.Lock()` to prevent race conditions during peak dining rush.
* **Multi-Role Authentication**: Dedicated roles for Cashiers (PIN-based access with custom fallback in `cashier-pin.txt`) and Administrators/Managers (with overrides stored in `admin-password.txt`).

---

### C. Cloud Serverless Edge & Microservices (`ratings-api/`)
* **Stateless Microservices on Vercel**: Node.js edge lambdas that expose REST endpoints (`/api/rate`, `/api/track`, `/api/game-stats`, `/api/categories`, `/api/dishes`, `/api/login`).
* **Git-as-a-Database Architecture**: Uses GitHub's REST Contents API as a serverless database:
  * Public tables: `menu-data.js`, `ratings.json`, `game-stats.json`
  * Private security tables: `activity-log.json`, `rating-submissions.json`, `access-log.json`, `audit-log.json`
* **Optimistic Concurrency & Retry Loops**: Mutations fetch the target file's Git SHA, execute AST modifications or array appends, and commit back with retry loops (`maxRetries = 4`) to gracefully handle concurrent HTTP 409 conflicts.
* **Sliding-Window IP Rate Limiting**: Protects against review bombing, tracking spam, and denial-of-service by throttling requests over 5-minute and 60-minute sliding windows per client IP.

---

## 3. End-to-End Data Flows

### Flow 1: Customer Digital Menu & Real Game Play Sync
```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Customer Phone
    participant GH as 🌐 GitHub Pages CDN
    participant Vercel as ⚡ Vercel Serverless
    participant Repo as 📦 GitHub Repo (Navrang)

    Customer->>GH: GET /order.html & menu-data.js?v=timestamp
    GH-->>Customer: Cached HTML & Live Menu Catalog
    Customer->>Customer: Render dishes, dietary pills, search index
    Customer->>GH: GET /game-stats.json
    GH-->>Customer: Current real game play count
    Customer->>Customer: Display real verified players badge

    Customer->>Customer: Plays "Biryani Catcher" game (Catch items, avoid chilies)
    Customer->>Customer: Game Over: updates local best score in localStorage
    Customer->>Vercel: POST /api/game-stats (action: "play")
    Vercel->>Repo: Fetch game-stats.json SHA & increment totalPlays
    Repo-->>Vercel: Commit success
    Vercel-->>Customer: Return updated { totalPlays, ok: true }
    Customer->>Customer: Increment live badge display
```

---

### Flow 2: Floor Waiter to Counter POS Billing Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Waiter as 🧑‍🍳 Waiter (waiters.html)
    participant LAN as 🖥️ Python POS Server (server.py)
    participant Storage as 💾 pos-orders.json
    actor Cashier as 💵 Cashier (billing.html)

    Waiter->>LAN: POST /api/login (Waiter PIN)
    LAN-->>Waiter: Return Session Token
    Waiter->>Waiter: Select Table 4, punch 2x Dum Biryani, 1x Chicken 65
    Waiter->>LAN: POST /api/pos/orders (table: "Table 4", items, status: "submitted_to_counter")
    LAN->>Storage: Acquire Lock & Atomic write pos-orders.json
    Storage-->>LAN: Write Confirmed
    LAN-->>Waiter: Order Placed (ID: ord_xxx)

    Cashier->>LAN: Polling GET /api/pos/orders
    LAN-->>Cashier: Return active table orders
    Cashier->>Cashier: Table 4 illuminates yellow ("Active Order")
    Cashier->>Cashier: Apply 5% Instagram follower discount
    Cashier->>LAN: PUT /api/pos/orders/ord_xxx (status: "settled", paymentMethod: "UPI")
    LAN->>Storage: Update order record to settled
    Storage-->>LAN: Saved
    LAN-->>Cashier: Bill Printed & Revenue Logged
```

---

### Flow 3: Food Review Submission with Serverless Git-as-a-Database
```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Customer (order.html)
    participant Vercel as ⚡ Vercel Edge (/api/rate)
    participant AdminDB as 🔒 Private admin-db Repo
    participant PublicDB as 📂 Public Navrang Repo

    Customer->>Customer: Clicks "Rate Your Food", selects 5★, adds comments
    Customer->>Vercel: POST /api/rate (name, dishes, rating, comments)
    Vercel->>AdminDB: Read rating-submissions.json
    AdminDB-->>Vercel: Return client submission timestamps
    Vercel->>Vercel: Verify IP rate limit (< 5 ratings / hour)
    
    Vercel->>PublicDB: GET /contents/ratings.json
    PublicDB-->>Vercel: Base64 content + current Git SHA
    Vercel->>Vercel: Append new review object into JSON array
    Vercel->>PublicDB: PUT /contents/ratings.json (with SHA validation)
    PublicDB-->>Vercel: HTTP 201 Created
    
    Vercel->>AdminDB: Record IP in rating-submissions.json
    Vercel-->>Customer: HTTP 200 { ok: true, message: "Thank you!" }
```

---

## 4. Complete Technology Stack Matrix

| Category | Technology / Library | Purpose & Implementation |
| :--- | :--- | :--- |
| **Frontend Core** | **Vanilla HTML5 (Semantic)** | PWA shell, accessible forms, meta tags, safe-area inset management for notch devices. |
| **Styling & Theme** | **Vanilla CSS3 Custom Properties** | Bespoke design system (`--maroon`, `--turmeric-gold`, `--leaf-bg`), frosted glass backdrop filters, responsive cards. |
| **Typography** | **Google Web Fonts** | `Yatra One` (Heritage brand headings), `Aref Ruqaa` (Urdu calligraphy), `Karla` (Clean body text), `IBM Plex Mono` (Billing receipts), `Noto Sans Telugu` (Vernacular Telugu script). |
| **Client Scripting** | **Vanilla JavaScript (ES6+)** | Zero runtime dependencies. Modular controllers for search, filtering, lightbox, internationalization, and analytics. |
| **Game Engine** | **HTML5 Canvas 2D API** | Custom 60 FPS physics engine for Biryani Catcher with touch dragging, banking angle effects, combo streaks, and particle bursts. |
| **Sound System** | **Web Audio API** | Real-time procedural audio synthesis generating chimes, catch bells, and warning buzzes without downloading external MP3s. |
| **Local POS Server** | **Python 3 (`http.server`)** | Lightweight multi-threaded local HTTP server (`server.py`) handling real-time floor ordering and billing synchronization over LAN. |
| **Serverless Backend** | **Node.js (Vercel Serverless)** | Microservices deployed to Vercel handling ratings, telemetry tracking, game play counters, categories, and JWT authentication. |
| **Database Engine** | **GitHub Contents REST API** | Git-as-a-Database transactional persistence with optimistic locking via Git SHAs and conflict auto-retries. |
| **Authentication** | **HMAC-SHA256 JWT** | Stateless tokens for admin session validation with role-based access control (Admin, Cashier, Waiter). |
| **Rate Limiting** | **In-memory Sliding Window** | Per-IP throttling across 5-minute (telemetry) and 60-minute (ratings) windows. |
| **Cloud Hosting** | **GitHub Pages CDN** | High-availability, edge-cached static hosting for customer menus and restaurant pages. |
| **Microservice Cloud**| **Vercel Platform** | Edge hosting for `ratings-api-pink.vercel.app` with zero cold-start penalty on Node.js lambdas. |
| **Social Channels** | **YouTube & Instagram APIs** | Integrated channel link (`UCgJrjCtAEO39sfaaTyd_EHA`) and Instagram (`@navrang786fr`) 5% discount campaign. |

---

## 5. File & Directory Structure

```text
d:\Navrang\
├── index.html                   # Desktop & web landing presentation page
├── order.html                   # Flagship mobile digital menu & order PWA
├── order-app.js                 # Complete client logic (EN/TE, search, game, split bill)
├── menu-data.js                 # Central database of categories & dish inventory
├── ratings.json                 # Verified public customer reviews and feedback
├── game-stats.json              # Verified global count of Biryani Catcher games played
├── server.py                    # Multi-threaded on-premise LAN POS & Table Sync Server
├── pos-orders.json              # Local store of active, submitted, and settled table bills
├── config.js                    # Environment endpoint configuration
│
├── admin/                       # On-premise POS & Manager Control Suite
│   ├── login.html               # Staff login with cashier PIN / admin credentials
│   ├── billing.html             # Cashier counter terminal (bill settlement, print receipts)
│   ├── waiters.html             # Waiter handheld order punch tablet interface
│   ├── daily-collections.html   # End-of-day revenue, settlement, and payment audits
│   ├── pos-audit.html           # Live operational event stream & change log
│   ├── dishes.html              # Menu catalog editor (live prices, availability)
│   ├── categories.html          # Category order manager and photo uploader
│   ├── ratings.html             # Customer feedback moderation & insights
│   ├── activity.html            # Customer search query and traffic telemetry
│   ├── admin-shared.js          # Shared authentication, token verification, and navbar
│   └── admin-style.css          # Design system stylesheet for admin portals
│
├── ratings-api/                 # Cloud Serverless Microservices (Vercel)
│   ├── package.json             # Microservice package descriptor
│   ├── vercel.json              # Vercel cron schedules and edge configuration
│   └── api/
│       ├── rate.js              # Append customer rating to ratings.json
│       ├── track.js             # Record search/view telemetry to activity-log.json
│       ├── game-stats.js        # Global Biryani Catcher player counter endpoint
│       ├── dishes.js            # Update dish inventory in menu-data.js
│       ├── categories.js        # Category CRUD and base64 image processor
│       ├── login.js             # Staff JWT token issuance
│       ├── change-password.js   # Secure credential updater
│       ├── backup-activity.js   # Automated 7-day activity snapshot worker
│       └── _lib/
│           ├── auth.js          # JWT verification & claims validation
│           ├── github.js        # GitHub Contents API reader/writer with retry loops
│           ├── menuData.js      # AST parser and serializer for menu-data.js
│           ├── rateLimit.js     # Sliding window rate limiting engine
│           └── requestInfo.js   # Client IP, geo-location, and device detector
│
└── images/                      # Media assets
    ├── app/                     # Icons, Instagram banners, logo marks
    ├── menu/                    # Compressed dish photos (categories & item thumbnails)
    └── qr-cards/                # High-contrast scannable QR card codes (EN/TE)
```

---

## 6. Key Reliability & Security Attributes

1. **Dual-Offline Resilience**: If the internet connection fails, the dining room operates normally via `server.py` over local LAN. If the local POS PC is restarted, customer digital menus on GitHub Pages continue serving QR-code scans uninterrupted.
2. **Zero Plaintext Credentials**: Staff passwords and PINs are securely stored in serverless runtime environment variables and localized configuration files (`admin-password.txt`, `cashier-pin.txt`), with public demo defaults masked.
3. **Data Protection & SAIF Privacy**: Customer IP addresses, cities, and user agents are strictly isolated in the private repository (`admin-db`) and never exposed in client-facing public assets like `ratings.json` or `game-stats.json`.
4. **Edge CDN Cache Busting**: Dynamic menu and inventory scripts are requested with timestamped query parameters (`menu-data.js?v=Date.now()`), guaranteeing that price changes or dish stock statuses take effect instantly on all customer phones.
