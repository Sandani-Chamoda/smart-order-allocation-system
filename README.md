# Smart Order Allocation System

A full-stack application developed for the **DartCodes Software Engineer Intern Technical Assessment**.

The system allows customers to place orders and automatically allocates each order to a suitable branch based on **stock availability, distance, branch workload, and remaining stock**.

It also includes customer/admin authentication, inventory management, order lifecycle management, validation, security controls, and an optional AI-powered customer message classifier.

---

## Technologies Used

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
- JWT
- bcrypt
- Helmet
- Express Rate Limit

### AI / ML
- Python
- pandas
- scikit-learn
- TF-IDF
- Logistic Regression
- joblib

---

## Main Features

### Customer
- Register and login
- Browse products
- Select products and quantities
- Select delivery location
- Add an optional order note
- Automatic branch allocation
- View allocation information
- Track order status/history
- Cancel eligible orders

### Administrator
- Admin dashboard
- View and search orders
- Filter orders by status
- Manage order lifecycle
- View branches and workloads
- Manage branch stock
- Manage products
- View allocation reasoning
- View AI message category, confidence, and low-confidence status

---

## System Architecture

The application uses a client-server architecture.

```text
React Frontend
      |
      | REST API
      v
Node.js / Express Backend
      |
      +-----------------------+
      |                       |
      v                       v
MongoDB Atlas          Python ML Classifier
                              |
                              v
                     TF-IDF + Logistic
                         Regression
```

The **React frontend** communicates with the **Express REST API**.

The backend is responsible for authentication, authorization, validation, order management, inventory management, and smart branch allocation.

**MongoDB Atlas** provides persistent data storage.

When an order contains a customer note, the backend can also pass that message to the Python classifier and store the resulting category and confidence with the order.

AI classification is treated as an optional enhancement, so an AI failure does not prevent the customer from creating an order.

---

## Branch Allocation Logic

The goal of the allocation algorithm is to select a branch that can fulfill the complete order while balancing customer proximity, current workload, and inventory.

### Step 1 - Find Eligible Branches

Only active branches are considered.

A branch is eligible only when it has enough stock to fulfill **every product and quantity in the order**.

The system does not split one order between multiple branches.

If no branch can fulfill the complete order, the order is rejected with an appropriate error rather than being partially allocated.

### Step 2 - Calculate Distance

The **Haversine formula** calculates the approximate geographic distance between the customer's selected location and each eligible branch.

### Step 3 - Consider Workload

Each branch has a current workload value.

A branch with a higher active workload receives a larger workload penalty.

### Step 4 - Consider Remaining Stock

The algorithm also considers the relevant stock remaining after the order is fulfilled.

This helps distinguish between multiple otherwise suitable branches.

### Allocation Score

The factors are normalized and combined using:

```text
Allocation Score =
    (0.50 × normalized distance)
  + (0.30 × normalized workload)
  + (0.20 × stock penalty)
```

The eligible branch with the **lowest score** is selected.

### Why This Approach?

Distance receives the highest weight because assigning an order to a nearby branch can generally improve fulfillment efficiency.

Workload is also considered so that one branch is not unnecessarily overloaded when alternatives are available.

Remaining stock is given a smaller weight to help preserve healthier inventory distribution.

This provides a simple and explainable multi-factor allocation strategy instead of selecting a branch using only one factor.

If two calculated scores are equal, a deterministic branch identifier comparison is used to provide consistent selection.

---

## Order Lifecycle

A successfully allocated order follows:

```text
ALLOCATED → PROCESSING → COMPLETED
```

Eligible orders can also become:

```text
CANCELLED
```

When an order is allocated:

- Required stock is deducted/reserved from the selected branch.
- The selected branch workload is increased.
- The order is saved with the assigned branch and allocation information.

When an eligible allocated order is cancelled:

- Reserved stock is restored.
- Branch workload is reduced.

When an order is completed:

- Branch workload is reduced.
- Stock remains consumed because the order was fulfilled.

---

## Authentication and Security

The application uses **JWT-based authentication** and backend-enforced **role-based access control**.

Two roles are available:

```text
CUSTOMER
ADMIN
```

### Customer Registration

Public registration always creates a `CUSTOMER`.

The backend does not trust a role supplied by the frontend. Therefore, a user cannot obtain administrator privileges simply by changing frontend data or manually calling the registration API.

### Administrator Account

Administrator accounts are **not created through public registration**.

The initial administrator is created using the backend's admin seeding mechanism. Admin email and password values are supplied through environment variables.

Example:

```env
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_secure_admin_password
```

Actual administrator credentials and other secrets are intentionally **not stored in the GitHub repository**.

### Security Measures

The application includes:

- bcrypt password hashing
- JWT authentication
- Token expiration
- Protected backend APIs
- Role-based authorization
- Backend input validation
- Authentication rate limiting
- Helmet security headers
- Environment variables for sensitive configuration
- Generic invalid-login responses
- Server-side product price lookup

Passwords, database connection strings, JWT secrets, and administrator credentials are stored in `.env` and excluded from Git.

---

## Validation and Edge Cases

The backend handles cases including:

- Empty orders
- Invalid product IDs
- Inactive products
- Zero or negative quantities
- Non-integer quantities
- Duplicate product entries
- Invalid customer coordinates
- Insufficient branch stock
- No eligible branch
- Invalid order IDs
- Invalid order statuses
- Unauthorized access
- Customer attempts to access admin APIs

Duplicate product entries are combined before stock validation to prevent stock checks from being bypassed.

Product prices are retrieved from the database instead of trusting prices supplied by the client.

Stock is also rechecked before it is decreased.

---

## AI / ML Approach

As an additional feature, customer order notes can be automatically classified using a machine-learning model.

### Categories

The supplied dataset contains eight categories:

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

**TF-IDF + Logistic Regression** was selected because the supplied dataset contains short text messages and a relatively small number of labelled examples.

It provides a lightweight, understandable multi-class text classification solution without unnecessarily introducing a large neural model.

### Training and Evaluation

- Labelled samples: **426**
- Categories: **8**
- Train/test split: **80/20**
- Stratified split
- Held-out test accuracy: **89.53%**

After evaluation, the final classifier is trained using all labelled examples and saved using `joblib`.

### Low-Confidence Predictions

The classifier also returns a confidence value.

The current threshold is:

```text
45%
```

If confidence is below the threshold, the system stores the result as:

```text
Category: General Inquiry
Low Confidence: true
```

The original confidence value is retained.

This prevents an uncertain specialized prediction from being presented as reliable.

If the classifier cannot run, order creation continues normally without AI classification.

---

## Setup Instructions

### Prerequisites

Install:

- Node.js
- npm
- Python 3
- Access to MongoDB Atlas or another compatible MongoDB instance

### 1. Clone Repository

```bash
git clone https://github.com/Sandani-Chamoda/smart-order-allocation-system.git
cd smart-order-allocation-system
```

### 2. Backend

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

using `backend/.env.example` as the reference and configure the required values.

Then start the backend:

```bash
npm run dev
```

> On Windows PowerShell systems where script execution is restricted, `npm.cmd run dev` can be used instead.

The local backend runs on:

```text
http://localhost:5000
```

### 3. AI Classifier

From the project root:

```bash
cd ai-service
```

Install the dependencies.

Windows:

```bash
py -m pip install -r requirements.txt
```

Other environments may use:

```bash
python3 -m pip install -r requirements.txt
```

The saved model can be regenerated using:

```bash
py train_model.py
```

The classifier can be tested using:

```bash
py classifier.py "I want to cancel my order and get a refund"
```

The backend Python command can be configured using the appropriate environment value when the operating system uses `python` or `python3` instead of the Windows `py` launcher.

### 4. Frontend

```bash
cd frontend
npm install
```

Create the frontend environment configuration using `frontend/.env.example`.

For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

On PowerShell systems with script execution restrictions:

```bash
npm.cmd run dev
```

Open the Vite URL displayed in the terminal.

---

## Main API Areas

```text
/api/auth
/api/products
/api/branches
/api/orders
```

Protected endpoints require a valid JWT.

Administrator endpoints additionally require the `ADMIN` role.

---

## Assumptions and Limitations

### Assumptions

- One branch must fulfill the complete order.
- Orders are not split between branches.
- Customer locations are selected from predefined locations in the current prototype.
- Product prices stored in the database are authoritative.
- Branch workload represents active allocated/processing work.
- AI classification is an enhancement and should not block the core ordering process.

### Current Limitations

- The current prototype does not use MongoDB transactions for atomic stock reservation and order creation under high concurrency.
- Delivery locations use predefined coordinates rather than a production geocoding/maps service.
- Real payment processing is outside the scope of the prototype.
- The AI classifier uses the supplied assessment dataset, so a larger real-world dataset would be required for production use.
- AI classification is currently attached to the optional order-note workflow rather than a dedicated customer-support ticket system.
- Additional automated testing and production infrastructure hardening would be required for a commercial deployment.

---

## Project Structure

```text
smart-order-allocation-system/
├── backend/
├── frontend/
├── ai-service/
└── README.md
```

---

## Author

**Sandani Chamoda**  
BSc (Hons) in Information Technology Undergraduate