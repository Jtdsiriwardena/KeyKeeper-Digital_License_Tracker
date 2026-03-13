# 🔑 Key Keeper — Cloud-Based License Tracker System

A secure and scalable backend application for managing software licenses, tracking renewals, storing documents, and monitoring costs.

> Key Keeper helps organizations avoid missed license renewals, securely store license information, and maintain centralized license records using cloud storage.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- User registration and login
- Password hashing with `bcryptjs`
- JWT-based authentication
- Protected routes using middleware
- Ownership validation before updates/deletes

### 📦 Product Management
- Create product
- Update product
- Delete product
- Tag-based categorization
- User-specific product isolation

### 🧾 License Management
- Encrypted license keys
- Expiry date tracking
- Auto-renew option
- Usage limits
- Status tracking (`Active` / `Expired` / `Renewed`)
- Client/Project tagging
- Monthly and Annual cost tracking
- Search functionality
- Filtering by status, tag, and project

### ☁️ Document Storage (AWS S3)
- Upload license documents
- Store file metadata in MongoDB
- Secure S3 bucket integration
- Support for multiple document uploads

### 📊 Cost Analytics
- Total monthly license cost
- Total annual license cost
- Upcoming renewal costs (next 30 days)
- Expiring licenses detection

### ⚙️ Automation
- Scheduled expiry checks using `node-cron`
- Ready for automated renewal reminder emails using `nodemailer`

### 🧪 Automated Testing

Implemented using:
- [Jest](https://jestjs.io/)
- [Supertest](https://github.com/ladjs/supertest)
- [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)

Tested components:
- Authentication routes
- License CRUD operations
- Authorization checks
- Error handling
- Protected route validation

---

## 🏗 System Architecture

```
Client (Frontend / Postman)
        │
        ▼
   Express Server
        │
        ▼
Authentication Middleware
        │
        ▼
    Controllers
      │     │
      ▼     ▼
 MongoDB   AWS S3
(Data)   (Documents)
```

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Backend** | Node.js, Express.js (v5), MongoDB, Mongoose |
| **Security** | JWT, bcryptjs, Custom Encryption Utility |
| **Cloud Storage** | AWS S3 (AWS SDK v3), Multer |
| **Validation** | Joi |
| **Automation** | node-cron, nodemailer |
| **Testing** | Jest, Supertest, mongodb-memory-server |

---

## 📸 Screenshots

### Authentication

**Register API**

> _Screenshot placeholder_

**Login API**

> _Screenshot placeholder_

### Product Management

**Create Product**

> _Screenshot placeholder_

**Product List**

> _Screenshot placeholder_

### License Management

**Create License**

> _Screenshot placeholder_

**License List**

> _Screenshot placeholder_

### Document Upload (AWS S3)

**Upload License Document**

> _Screenshot placeholder_

### Cost Analytics

**License Cost Summary**

> _Screenshot placeholder_

---

## ⚙️ Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/key-keeper-license-tracker.git
```

**2. Navigate to the project directory**

```bash
cd key-keeper-license-tracker
```

**3. Install dependencies**

```bash
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name
```

---

## ▶️ Running the Application

**Start the development server**

```bash
npm run dev
```

**Run in production mode**

```bash
npm start
```

---

## 🧪 Running Tests

**Run all tests**

```bash
npm test
```

---

## 📂 Project Structure

```
src
 ├── controllers
 ├── models
 ├── routes
 ├── middleware
 ├── utils
 ├── config
 ├── services
 └── tests
```

---

## 🔒 Security Features

- License keys encrypted before storage
- JWT secure authentication
- Password hashing using bcrypt
- Authorization checks for resource ownership
- Secure AWS S3 integration

---
