# 🎬 CineVerse - Movie Ticketing System

**🚀 Live Demo**: [https://cineverse-mrba.onrender.com/](https://cineverse-mrba.onrender.com/)

CineVerse is a full-stack digital movie booking and ticket sales platform. It features a decoupled client-server architecture with a fast, modern **React + Vite** frontend communicating with a high-performance **Java Spring Boot REST API**. 

The project resolves common real-world cinema application challenges, including:
- **Stateless Authentication**: Protected API routes using secure custom bearer token authorization logic.
- **Race Condition Seating**: Thread-safe reservation locks mapped to unique showtime entities to prevent double bookings.
- **Tiered Multipliers**: Real-time pricing calculations dynamically computing ticket subtotals based on seating category (VIP, Premium, or Standard).
- **Automated Communication**: SMTP client dispatching formatted HTML email tickets directly to customers upon simulated payment approval.
- **Dynamic Data Seeding**: Autoinjector seeder that ensures the system initializes with pre-configured venues, movie metadata, and custom admin profiles.

---

## 🚀 Key Features

### 👤 User Dashboard
- **Movie Catalog**: Sleek search and genre filters by city location.
- **Showtime Picker**: Select preferred screenings and timings dynamically.
- **Interactive Seating Grid**: Premium cinema layout separating Standard, Premium, and VIP seat zones with real-time checkout updates.
- **Digital Ticket Receipts**: Verification QR mock and checkout wizard.
- **HTML Email Tickets**: Dynamic ticket details dispatched directly to the customer's Gmail.

### 🔑 Admin Workspace
- **System KPIs**: Revenue tracker, tickets issued counter, active movie list.
- **Venues & Screens Manager**: Add theaters, screen auditoriums, and schedule showtimes.
- **Dynamic City Manager**: Switch between default cities or register brand new ones on the fly.
- **Seat Cleansing Action**: A dedicated "Empty Seats" command to purge and reset booking states after screenings are over.

---

## 🛠️ Technology Stack
- **Frontend**: React + Vite, Custom CSS (Glassmorphism, cinema dark-mode styling).
- **Backend**: Java 17+, Spring Boot, JPA/Hibernate.
- **Database**: Persistent H2 file database (`data/cineverse`).
- **Communication**: Spring Mail SMTP (Gmail integration).

---

## 📂 Project Structure
```text
BookMyShow/
├── backend/            # Java Spring Boot REST API
├── frontend/           # React + Vite application
├── data/               # Persistent H2 database storage
├── run.bat             # Quick launch script (Windows CMD)
└── run.ps1             # Quick launch script (Windows PowerShell)
```

---
