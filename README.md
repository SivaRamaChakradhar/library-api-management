# 📚 Library API Management System

A production-ready RESTful API built with **Node.js**, **Express**, and **SQLite** to manage books, members, borrowing transactions, and fines in a library.  

This project demonstrates **layered architecture**, **state machine logic** for resource lifecycles, **database transactions for atomicity**, **comprehensive input validation**, and enforcement of **complex business rules** such as borrowing limits, overdue penalties, and member suspension.

---

## 🚀 Features

### Core Functionality
- Full CRUD operations for **Books** and **Members**
- Borrowing and returning workflow for **Transactions**
- Automatic overdue detection and fine calculation
- Fine payment endpoint with business rule validation
- Advanced querying: available books, member's borrowed books, overdue transactions

### Business Rules Enforced
- **Max 3 active borrows per member** - Members cannot exceed borrowing limit
- **Block borrowing if unpaid fines exist** - Fines must be cleared before new borrows
- **Suspend member if 3+ overdue books** - Automatic suspension for chronic overdue
- **Loan period = 14 days** - Standard lending period
- **Overdue fine = $0.50/day** - Automatic fine calculation upon return

### Technical Highlights
- **Layered Architecture** - Separation of concerns (Controllers, Services, Repositories)
- **State Machine Logic** - Controlled state transitions for books and members
- **Database Transactions** - Atomic operations ensure data consistency
- **Input Validation** - Comprehensive Joi schema validation for all endpoints
- **Centralized Error Handling** - Consistent error responses with appropriate HTTP status codes
- **RESTful API Design** - Proper use of HTTP verbs and status codes

---

## 🛠️ Tech Stack
- **Node.js** + **Express** (API server)
- **SQLite** (relational database)
- **Joi** (input validation)
- **SQL schema** with foreign keys and constraints
- **Layered architecture** (Controllers → Services → Repositories)

---

## 📁 Project Structure

```
library-api-management/
├── app.js                      # Main application entry point
├── package.json               # Dependencies and scripts
├── library.db                 # SQLite database file
├── app.http                   # API endpoint test file
├── README.md                  # Project documentation
└── src/
    ├── config/
    │   └── database.js        # Database configuration with transaction support
    ├── middleware/
    │   └── errorHandler.js    # Centralized error handling and validation
    ├── validators/
    │   ├── book.validator.js      # Book input validation schemas
    │   ├── member.validator.js    # Member input validation schemas
    │   ├── transaction.validator.js # Transaction validation schemas
    │   └── fine.validator.js      # Fine validation schemas
    ├── repositories/
    │   ├── book.repository.js         # Book data access layer
    │   ├── member.repository.js       # Member data access layer
    │   ├── transaction.repository.js  # Transaction data access layer
    │   └── fine.repository.js         # Fine data access layer
    ├── services/
    │   ├── book.service.js           # Book business logic & state machine
    │   ├── member.service.js         # Member business logic & rules
    │   ├── transaction.service.js    # Transaction logic with DB transactions
    │   └── fine.service.js           # Fine business logic
    ├── controllers/
    │   ├── book.controller.js        # Book route handlers
    │   ├── member.controller.js      # Member route handlers
    │   ├── transaction.controller.js # Transaction route handlers
    │   └── fine.controller.js        # Fine route handlers
    └── routes/
        ├── books.routes.js           # Book API routes
        ├── members.routes.js         # Member API routes
        ├── transactions.routes.js    # Transaction API routes
        └── fines.routes.js           # Fine API routes
```

---

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

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SivaRamaChakradhar/library-api-management.git
   cd library-api-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Ensure database exists**
   The SQLite database file (`library.db`) should exist with the proper schema. If not, create it with the schema defined above.

4. **Start the server**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Test the API**
   - The server runs at `http://localhost:3000`
   - Use the included `app.http` file with VS Code REST Client extension
   - Or use Postman/curl to test endpoints

---

## 📚 API Documentation

### Books

#### Get All Books
```http
GET /books
```
Returns all books in the library.

#### Get Available Books
```http
GET /books/available
```
Returns only books that are available for borrowing.

#### Get Book by ID
```http
GET /books/:id
```

#### Create Book
```http
POST /books
Content-Type: application/json

{
  "isbn": "9780134685991",
  "title": "Effective Java",
  "author": "Joshua Bloch",
  "category": "Programming",
  "total_copies": 5
}
```

#### Update Book
```http
PUT /books/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "author": "Updated Author"
}
```
**Note:** Direct status updates are prevented. Book status is managed through borrowing/returning operations.

#### Delete Book
```http
DELETE /books/:id
```

---

### Members

#### Get All Members
```http
GET /members
```

#### Get Member by ID
```http
GET /members/:id
```

#### Get Books Borrowed by Member
```http
GET /members/:id/borrowed
```
Returns all books currently borrowed by the specified member.

#### Create Member
```http
POST /members
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "membership_number": "MEM001"
}
```

#### Update Member
```http
PUT /members/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane.doe@example.com"
}
```

#### Delete Member
```http
DELETE /members/:id
```

---

### Transactions

#### Borrow a Book
```http
POST /transactions/borrow
Content-Type: application/json

{
  "member_id": 1,
  "book_id": 1
}
```
**Business Rules Applied:**
- Member must be active (not suspended)
- Member must have no unpaid fines
- Member must have fewer than 3 active borrows
- Book must be available

#### Return a Book
```http
PATCH /transactions/:id/return
```
**Automatic Processing:**
- Calculates overdue fines if applicable ($0.50/day)
- Updates book availability
- Checks if member should be suspended (3+ overdue books)
- Uses database transaction for atomicity

#### Get All Transactions
```http
GET /transactions
```

#### Get Transaction by ID
```http
GET /transactions/:id
```

#### Get Overdue Transactions
```http
GET /transactions/overdue
```
Automatically marks overdue transactions and returns them.

---

### Fines

#### Get All Fines
```http
GET /fines
```

#### Get Fine by ID
```http
GET /fines/:id
```

#### Pay a Fine
```http
POST /fines/:id/pay
```
Marks the fine as paid with current timestamp.

---

## 🏗️ Architecture & Design

### Layered Architecture

The application follows a clean, layered architecture with clear separation of concerns:

1. **Routes Layer** (`src/routes/`)
   - Defines API endpoints
   - Applies validation middleware
   - Routes requests to controllers

2. **Controllers Layer** (`src/controllers/`)
   - Handles HTTP requests and responses
   - Delegates business logic to services
   - Returns appropriate HTTP status codes

3. **Services Layer** (`src/services/`)
   - **Core business logic and rules**
   - State machine implementations
   - Coordinates repository operations
   - Wraps multi-step operations in database transactions

4. **Repositories Layer** (`src/repositories/`)
   - Direct database access
   - CRUD operations
   - Query construction
   - Data persistence

5. **Middleware** (`src/middleware/`)
   - Input validation using Joi schemas
   - Centralized error handling
   - Async error wrapper

6. **Configuration** (`src/config/`)
   - Database connection management
   - Transaction support utilities

### State Machine Logic

#### Book Status State Machine
```
available → borrowed (when all copies borrowed)
borrowed → available (when a copy is returned)
available ↔ reserved ↔ maintenance
```
- Status transitions are controlled and validated
- Direct status updates are prevented to maintain integrity
- State changes occur through specific actions (borrow/return)

#### Member Status State Machine
```
active → suspended (when 3+ overdue books)
suspended → active (when fines paid and overdue < 3)
```
- Members are automatically suspended based on overdue count
- Borrowing blocked when suspended
- Reactivation requires clearing fines

### Database Transactions

All multi-step operations are wrapped in database transactions:
- **Borrow Operation**: Creates transaction record + updates book availability
- **Return Operation**: Marks returned + creates fine + updates book + checks suspension

This ensures **atomicity** - either all operations succeed or all fail, preventing data inconsistencies.

### Input Validation

Every endpoint validates input using Joi schemas:
- Type checking (string, number, email, etc.)
- Required field validation
- Length constraints
- Format validation (email, ISBN)
- Custom business rule validation

### Error Handling

Centralized error handling provides:
- Consistent error response format
- Appropriate HTTP status codes (400, 404, 409, 500)
- Detailed error messages for debugging
- SQLite constraint error mapping
- Operational vs. programmer error distinction

---

## 🧪 Testing

Use the included `app.http` file with VS Code REST Client extension to test all endpoints.

Example workflow:
1. Create books and members
2. Borrow books
3. Check borrowed books for a member
4. Return books (test overdue scenarios)
5. Pay fines
6. Check member suspension logic

---

## 🎯 Key Improvements from Feedback

### ✅ Issues Addressed

1. **Monolithic Architecture** → **Layered Architecture**
   - Separated into Controllers, Services, Repositories
   - Clear separation of concerns
   - Improved maintainability and testability

2. **Lack of Input Validation** → **Comprehensive Joi Validation**
   - All endpoints validate input
   - Type checking, format validation, constraints
   - Clear validation error messages

3. **No Database Transactions** → **Transaction Support**
   - Multi-table operations wrapped in transactions
   - Ensures atomicity and data consistency
   - Rollback on failures

4. **Inconsistent RESTful Design** → **Proper HTTP Verbs**
   - Changed `POST /transactions/:id/return` to `PATCH`
   - Proper use of GET, POST, PUT, PATCH, DELETE
   - Appropriate status codes (200, 201, 400, 404, 409, 500)

5. **Direct Status Updates** → **State Machine Control**
   - Book status managed through state transitions
   - Prevented direct status updates in PUT /books/:id
   - Controlled state changes through borrow/return actions

6. **Missing Endpoints** → **Complete API Coverage**
   - Added `GET /books/available`
   - Added `GET /members/:id/borrowed`
   - All required endpoints implemented

7. **No Centralized Business Rules** → **Service Layer**
   - Business rules centralized in service classes
   - Reusable and testable logic
   - Clear rule documentation in code

---

## 📝 License
MIT

## 👤 Author
Siva Rama Chakradhar Ramisetti
