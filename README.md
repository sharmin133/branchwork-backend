# Branchwork Backend

A multi-tenant branch and inventory management REST API built with **NestJS, TypeScript, Prisma ORM, and PostgreSQL**.

Branchwork helps organizations manage multiple branches, staff members, custom roles, permissions, and products with secure organization-level and branch-level access control.

## Features

- **Authentication:** Organization registration, Owner and Staff login, JWT authentication, refresh token rotation, and logout.
- **Branch Management:** Create, view, update, and delete branches with pagination.
- **Role & Permission Management:** Create custom roles and assign predefined permissions.
- **Staff Management:** Create staff accounts, assign branches and roles, update, and delete staff.
- **Product Management:** CRUD operations, search, category and branch filters, and pagination.
- **Access Control:** Role-based permissions, organization isolation, and branch-level restrictions.
- **Low Stock Detection:** Automatically identifies products with stock of 10 or below.

## Technology Stack

- **NestJS** – Backend framework
- **TypeScript** – Programming language
- **PostgreSQL** – Database
- **Prisma ORM** – Database management
- **JWT & Passport** – Authentication
- **bcrypt** – Password hashing
- **class-validator** – Request validation
- **class-transformer** – Data transformation
- **Swagger** – API documentation and testing
- **pnpm** – Package manager

## Project Structure

```text
branchwork-backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── common/
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── interfaces/
│   │   └── utils/
│   ├── modules/
│   │   ├── auth/
│   │   ├── branches/
│   │   ├── roles/
│   │   ├── staff/
│   │   └── products/
│   ├── prisma/
│   ├── app.module.ts
│   └── main.ts
├── prisma.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js
- pnpm
- PostgreSQL

### 1. Install NestJS CLI

```bash
npm install -g @nestjs/cli
```

### 2. Clone Repository

```bash
git clone https://github.com/sharmin133/branchwork-backend.git
cd branchwork-backend
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your_postgresql_connection_url"
DIRECT_URL="your_direct_postgresql_connection_url"

JWT_SECRET="your_jwt_secret"
JWT_ACCESS_EXPIRES_IN="15m"

JWT_REFRESH_SECRET="your_refresh_token_secret"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=3000
```

Use the environment variable names configured in your application. Never commit `.env` to GitHub.

### 5. Generate Prisma Client

```bash
pnpm exec prisma generate
```

### 6. Run Database Migrations

```bash
pnpm exec prisma migrate dev
```

### 7. Start Development Server

```bash
pnpm start:dev
```

The API will be available at:

```text
http://localhost:3000
```

## API Documentation

Swagger UI:

```text
http://localhost:3000/docs
```

Use Swagger UI to explore and test API endpoints with JWT authentication.

## API Endpoints

All protected endpoints require a valid JWT access token.

### Authentication

- `POST /auth/register-organization` – Register organization and Owner
- `POST /auth/login` – Login as Owner or Staff
- `GET /auth/me` – Get current user profile
- `POST /auth/refresh` – Refresh access token
- `POST /auth/logout` – Logout and revoke refresh token

### Branches

- `POST /branches` – Create a branch
- `GET /branches` – Get all branches with pagination
- `GET /branches/:id` – Get branch details
- `PATCH /branches/:id` – Update branch
- `DELETE /branches/:id` – Delete branch

### Roles

- `POST /roles` – Create a role
- `GET /roles` – Get all roles with pagination
- `GET /roles/:id` – Get role details
- `PATCH /roles/:id` – Update role and permissions
- `DELETE /roles/:id` – Delete role

### Staff

- `POST /staff` – Create a staff member
- `GET /staff` – Get staff members with pagination
- `GET /staff/:id` – Get staff details
- `PATCH /staff/:id` – Update staff information
- `DELETE /staff/:id` – Delete staff member

### Products

- `POST /products` – Create a product
- `GET /products` – Get products with search, filters, and pagination
- `GET /products/:id` – Get product details
- `PATCH /products/:id` – Update product (Owner only)
- `PATCH /products/:id/organize` – Organize product information
- `DELETE /products/:id` – Delete product (Owner only)

## Roles & Permissions

The system provides the following predefined permissions:

- **MANAGE_STAFF** – Manage staff members
- **VIEW_PRODUCTS** – View products
- **ORGANIZE_PRODUCTS** – Organize product information

### Owner

The Owner has full access to the organization's resources.

- Manage branches
- Create and manage roles
- Manage staff members
- Create, update, and delete products
- View products across the organization

### Staff

Staff access depends on assigned role permissions and branch assignment.

For example:

**Stock Clerk**
- View products
- Organize product category and stock
- Access products within the assigned branch

**Branch Manager**
- View products
- Organize product information
- Manage staff, subject to assigned permissions and branch restrictions

Staff cannot access resources outside their assigned organization or branch.

## Product Search & Filtering

Get products with pagination:

```http
GET /products?page=1&limit=10
```

Search by product name, SKU, or category:

```http
GET /products?search=Mustard
```

Filter by category:

```http
GET /products?category=Grocery
```

Filter by branch (Owner only):

```http
GET /products?branchId=YOUR_BRANCH_ID
```

Combine search, filters, and pagination:

```http
GET /products?search=Oil&category=Grocery&page=1&limit=10
```

## API Response Format

Successful responses follow a consistent structure:

```json
{
  "success": true,
  "data": {}
}
```

Paginated responses include `items` and `meta` information:

```json
{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## Build & Production

Check TypeScript errors:

```bash
pnpm exec tsc --noEmit
```

Build the application:

```bash
pnpm build
```



## Security

- Passwords are hashed using bcrypt.
- JWT-based authentication protects private endpoints.
- Request validation and centralized exception handling.
- Organization-level and branch-level data isolation.
- Sensitive environment variables are kept outside source control.
