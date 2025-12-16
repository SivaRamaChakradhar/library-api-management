# 📚 Library API Management System

A RESTful API built with **Node.js**, **Express**, and **SQLite** to manage books, members, borrowing transactions, and fines in a library.  
This project demonstrates **state machine logic** for resource lifecycles and enforces **business rules** such as borrowing limits, overdue penalties, and member suspension.

---

## 🚀 Features
- Full CRUD operations for **Books** and **Members**
- Borrowing and returning workflow for **Transactions**
- Automatic overdue detection and fine calculation
- Fine payment endpoint
- Business rules enforced:
  - Max 3 active borrows per member
  - Block borrowing if unpaid fines exist
  - Suspend member if 3+ overdue books
  - Loan period = 14 days
  - Overdue fine = $0.50/day

---

## 🛠️ Tech Stack
- **Node.js** + **Express** (API server)
- **SQLite** (database)
- **SQL schema** with foreign keys and constraints
- **Postman** for testing


## Database Schema

### Book Table
| Column           | Type     | Constraints                                                                       |
|------------------|----------|-----------------------------------------------------------------------------------|
| id               | INTEGER  | PRIMARY KEY AUTOINCREMENT                                                         |
| isbn             | TEXT     | UNIQUE, NOT NULL                                                                  |
| title            | TEXT     | NOT NULL                                                                          |
| author           | TEXT     | NOT NULL                                                                          |
| category         | TEXT     | Optional                                                                          |
| status           | TEXT     | NOT NULL, DEFAULT 'available', CHECK (available, borrowed, reserved, maintenance) |
| total_copies     | INTEGER  | DEFAULT 1                                                                         |
| available_copies | INTEGER  | DEFAULT 1                                                                         |

### Member Table
| Column            | Type     | Constraints                                                                 |
|-------------------|----------|-----------------------------------------------------------------------------|
| id                | INTEGER  | PRIMARY KEY AUTOINCREMENT                                                   |
| name              | TEXT     | NOT NULL                                                                    |
| email             | TEXT     | UNIQUE, NOT NULL                                                            |
| membership_number | TEXT     | UNIQUE, NOT NULL                                                            |
| status            | TEXT     | NOT NULL, DEFAULT 'active', CHECK (active, suspended)                       |

### Transactions Table
| Column       | Type     | Constraints                                                                 |
|--------------|----------|-----------------------------------------------------------------------------|
| id           | INTEGER  | PRIMARY KEY AUTOINCREMENT                                                   |
| book_id      | INTEGER  | FOREIGN KEY → Book(id), NOT NULL                                            |
| member_id    | INTEGER  | FOREIGN KEY → Member(id), NOT NULL                                          |
| borrowed_at  | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP                                         |
| due_date     | DATETIME | NOT NULL                                                                    |
| returned_at  | DATETIME | Nullable                                                                    |
| status       | TEXT     | NOT NULL, DEFAULT 'active', CHECK (active, returned, overdue)               |

### Fine Table
| Column        | Type     | Constraints                                                                 |
|---------------|----------|-----------------------------------------------------------------------------|
| id            | INTEGER  | PRIMARY KEY AUTOINCREMENT                                                   |
| member_id     | INTEGER  | FOREIGN KEY → Member(id), NOT NULL                                          |
| transaction_id| INTEGER  | FOREIGN KEY → Transactions(id), NOT NULL                                   |
| amount        | REAL     | NOT NULL                                                                    |
| paid_at       | DATETIME | Nullable                                                                    |
---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/SivaRamaChakradhar/library-api-management.git
   cd library-api-management

2. **npm install** - This will install necessary modules

3. **node app.js** - This will start the server

4. **Test API endpoints** - Use a tool like postman or the included app.http file

5. Example endpoints are

   -> GET http://localhost:3000/books - Fetch all books
   -> POST http://localhost:3000/members - Add a new member