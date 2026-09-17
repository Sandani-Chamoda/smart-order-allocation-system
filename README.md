# Smart Order Allocation System

A full-stack order management application developed as part of the DartCodes Software Engineer Intern Technical Assessment.

The system allows customers to create orders and automatically assigns each order to a suitable branch based on stock availability, geographic distance, current branch workload, and remaining stock suitability.

The application also includes secure authentication, role-based access control, inventory management, order lifecycle management, and an optional AI-powered customer message classifier.

---

## Features

### Customer

- Customer registration and login
- Browse available products
- Select product and quantity
- Select delivery location
- Add an optional customer note
- Automatic branch allocation
- View allocation details
- View order history
- Cancel eligible orders
- Responsive customer interface

### Administrator

- Admin dashboard
- View and search orders
- Filter orders by status
- Manage order lifecycle
- View branches and workloads
- Manage branch stock
- Add and view products
- View allocation reasoning
- View AI customer-message classifications and confidence scores

---

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt
- Helmet
- Express Rate Limit

### AI / Machine Learning

- Python
- pandas
- scikit-learn
- TF-IDF
- Logistic Regression
- joblib

---

## System Architecture

The application follows a simple client-server architecture.

```text
React Frontend
      |
      | REST API
      v
Node.js / Express Backend
      |
      +----------------------+
      |                      |
      v                      v
MongoDB Atlas          Python ML Classifier
                              |
                              v
                     TF-IDF + Logistic
                         Regression
```

The React frontend communicates with the Express backend using REST APIs.

The backend handles authentication, authorization, validation, business logic, smart order allocation, inventory updates, and database access.

MongoDB is used for persistent storage.

The Python classifier is invoked by the backend when an order contains a customer message. AI failure does not prevent normal order creation.

---

## Smart Branch Allocation

An order is assigned only to a branch that can fulfill the **entire order**.

The current prototype does not split a single order between multiple branches.

### 1. Eligibility

The system first checks active branches.

A branch is eligible only when it has enough stock for every item and requested quantity in the order.

If no branch can fulfill the complete order, the API returns a conflict response instead of creating a partially fulfillable order.

### 2. Distance

The Haversine formula is used to calculate the approximate geographic distance between the customer location and each eligible branch.

### 3. Workload

Each branch maintains a current workload value.

Branches with higher active workloads receive a larger workload component in their allocation score.

### 4. Remaining Stock Suitability

The algorithm also considers how much relevant stock would remain after fulfilling the order.

This provides an additional tie-breaking factor when several branches are suitable.

### Allocation Score

The factors are normalized before being combined.

```text
Allocation Score =
    (0.50 × normalized distance)
  + (0.30 × normalized workload)
  + (0.20 × stock penalty)
```

The branch with the **lowest score** is selected.

The weighting gives the highest priority to customer proximity while still considering operational workload and inventory suitability.

A deterministic branch identifier comparison is used when scores are equal.

---

## Order and Inventory Lifecycle

When an order is successfully allocated:

1. The selected branch stock is reduced/reserved.
2. The branch workload is increased.
3. The order is stored with status `ALLOCATED`.

Supported lifecycle:

```text
ALLOCATED
    |
    v
PROCESSING
    |
    v
COMPLETED
```

Eligible orders can also move to:

```text
CANCELLED
```

When an allocated order is cancelled, its reserved stock is restored and the branch workload is reduced.

When an order is completed, the workload is reduced while the stock remains consumed.

---

## Authentication and Security

The application implements backend-enforced authentication and authorization.

### Authentication

- Passwords are hashed using bcrypt.
- JWT is used for authenticated sessions.
- Tokens have an expiration time.
- Protected APIs verify the token before allowing access.

### Role-Based Access Control

Two roles are supported:

```text
CUSTOMER
ADMIN
```

Public registration always creates a `CUSTOMER`.

A user cannot become an administrator by modifying the frontend request or directly sending an `ADMIN` role through the registration API.

Admin routes are protected by backend role authorization middleware.

### Additional Security

- Password hashing
- JWT expiration
- Protected API routes
- Backend role validation
- Request/input validation
- Authentication rate limiting
- Helmet security headers
- Environment variables for secrets
- Generic invalid-login responses
- Server-side product price lookup

Sensitive configuration is stored in `.env` and is excluded from Git.

---

## Validation and Edge Cases

The backend handles several invalid or unusual cases, including:

- Empty orders
- Invalid product IDs
- Inactive or unavailable products
- Zero or negative quantities
- Non-integer quantities
- Duplicate product entries
- Invalid latitude or longitude
- Insufficient branch stock
- Invalid order IDs
- Invalid branch filters
- Invalid order status transitions
- Unauthorized API access
- Customer attempts to access admin APIs

Duplicate product entries are combined before allocation so they cannot be used to bypass stock validation.

Stock is also rechecked before being decreased.

---

## AI Customer Message Classification

The optional AI/ML feature classifies customer messages into eight categories:

- Payment Issue
- Delivery Issue
- Refund/Cancellation
- Product/Stock Inquiry
- Order Status Inquiry
- Account/Login Issue
- Promotion/Discount Inquiry
- General Inquiry

### Model

The classifier uses:

```text
Customer Message
       |
       v
TF-IDF Vectorization
       |
       v
Logistic Regression
       |
       v
Category + Confidence
```

TF-IDF with Logistic Regression was selected because the supplied dataset contains relatively short text messages and a modest number of labelled samples. This approach is lightweight, interpretable, and suitable for multi-class text classification without unnecessarily introducing a large neural model.

### Training and Evaluation

- Labelled samples used: **426**
- Number of categories: **8**
- Train/test split: **80/20**
- Stratified sampling
- Test accuracy: **89.53%**

After evaluation, the final model is trained using all labelled examples and saved using joblib.

### Confidence Handling

The classifier returns both a predicted category and probability-based confidence.

A confidence threshold of:

```text
45%
```

is used.

Predictions below the threshold are safely categorized as `General Inquiry` and marked as low-confidence rather than presenting an uncertain specialized category as reliable.

The original confidence score is retained.

### Failure Handling

AI classification is treated as an enhancement rather than a critical dependency.

If the Python classifier fails, the order creation process continues normally without an AI classification.

---

## Project Structure

```text
smart-order-allocation-system/
|
├── backend/
|   ├── src/
|   |   ├── controllers/
|   |   ├── middleware/
|   |   ├── models/
|   |   ├── routes/
|   |   └── services/
|   ├── scripts/
|   └── server.js
|
├── frontend/
|   ├── src/
|   |   ├── components/
|   |   ├── context/
|   |   ├── pages/
|   |   └── services/
|   └── package.json
|
├── ai-service/
|   ├── dataset/
|   ├── model/
|   ├── classifier.py
|   ├── train_model.py
|   └── requirements.txt
|
└── README.md
```

---

## Local Setup

### Prerequisites

Install:

- Node.js
- npm
- Python 3
- MongoDB Atlas account or compatible MongoDB instance

Clone the repository:

```bash
git clone https://github.com/Sandani-Chamoda/smart-order-allocation-system.git
cd smart-order-allocation-system
```

---

## Backend Setup

Navigate to:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example` as a reference.

Configure the required MongoDB, JWT, and administrator environment variables.

Start the backend:

```bash
npm run dev
```

The development API runs by default at:

```text
http://localhost:5000
```

---

## AI Service Setup

Navigate to:

```bash
cd ai-service
```

Install Python dependencies:

```bash
py -m pip install -r requirements.txt
```

Train the classifier if the saved model is not available:

```bash
py train_model.py
```

Test the classifier:

```bash
py classifier.py "I want to cancel my order and get a refund"
```

On systems where Python is invoked using `python` or `python3` rather than `py`, the backend Python command can be configured through the environment.

---

## Frontend Setup

Navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the frontend environment configuration using `.env.example`.

For local development:

```text
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the Vite development URL shown in the terminal.

---

## Main API Areas

```text
/api/auth
/api/products
/api/branches
/api/orders
```

Protected endpoints require a valid JWT.

Administrative endpoints additionally require the `ADMIN` role.

---

## Assumptions

- A branch must fulfill the complete order.
- Orders are not split across branches.
- Product prices are taken from the database, not trusted from frontend input.
- The prototype uses predefined delivery locations and coordinates rather than a production geocoding/address service.
- Branch workload represents active allocated/processing work.
- AI classification is optional and must not block core ordering functionality.

---

## Current Limitations and Future Improvements

This project is an assessment prototype rather than a production-ready commerce platform.

Potential improvements include:

- MongoDB transactions for atomic stock reservation and order creation under high concurrency
- Atomic inventory operations for concurrent orders
- Full address entry and geocoding/maps integration
- Real payment processing
- Dedicated customer support/ticket interface for AI message classification
- Larger AI training dataset and model monitoring
- Automated backend and frontend test suites
- More advanced inventory forecasting
- Notification services
- Production-specific CORS and infrastructure configuration

The current implementation prioritizes a complete, understandable solution with clear allocation logic, security controls, validation, and graceful failure handling.

---

## Author

**Sandani Chamoda**

BSc (Hons) in Information Technology Undergraduate