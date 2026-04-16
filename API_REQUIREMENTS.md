# NACOS LASUSTECH API Integration Requirements

Note: Most link values in these payloads are placeholders and will be updated.

This document outlines the required API endpoints and data payloads for the student portal.

> [!NOTE]
> Most link values (URLs) in these payloads are placeholders and will be updated as the production environment is finalized.

---

## 1. Authentication & Security
### **POST** `/auth/login`
**Purpose**: Authenticate students using Matric Number and Password.
- **Request Payload**:
```json
{
  "matric_number": "230303010052",
  "password": "********"
}
```
- **Response (Success)**:
```json
{
  "status": "success",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "matric_number": "230303010052",
    "level": "400L",
    "role": "student"
  }
}
```

---

## 2. Student Portal & Profile
### **GET** `/student/profile`
**Purpose**: Fetch dashboard data for the logged-in student.
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "full_name": "Toluwani Moses",
  "level": "400L",
  "dues_status": "Paid",
  "id_card_status": "Ready",
  "wallet_balance": 500.00,
  "recent_activities": [
    { "type": "payment", "amount": 2000, "date": "2026-04-10" }
  ]
}
```

---

## 3. Payments (Dues & Fees)
### **POST** `/payments/initialize`
**Purpose**: Initialize a payment transaction (e.g., Paystack/Flutterwave).
- **Request Payload**:
```json
{
  "amount": 2500,
  "payment_type": "nacos_dues", // or "id_card", "event_ticket"
  "email": "student@example.com"
}
```
- **Response**:
```json
{
  "status": "success",
  "reference": "NACOS-ref-12345",
  "authorization_url": "https://checkout.paystack.com/..."
}
```

---

## 4. ID Card Services
### **POST** `/services/id-card/request`
**Purpose**: Student submits a request for a new ID card.
- **Request Payload**:
```json
{
  "passport_url": "https://nacosid.tmb.it.com/uploads/img.jpg",
  "full_name": "Bakare Toluwani",
  "matric_number": "230303010052/DE",
  "blood_group": "O+",
  "birthday": "2004-05-15", // Note: This should connect to NACOS Google Calendar
  "emergency_contact": "08012345678"
}
```

---

## 5. Content & Management (Dynamic Data)
### **GET** `/content/executives`
**Purpose**: Fetch the official executive council list.
- **Response**:
```json
[
  {
    "name": "Shofunde Jubril",
    "post": "President",
    "level": "400L",
    "image": "https://api.nacos.ng/images/pres.jpg",
    "description": "..."
  }
]
```

---

## 6. Contact & Support
### **POST** `/contact/submit`
**Purpose**: Submit a message from the contact form.
- **Request Payload**:
```json
{
  "full_name": "Toluwani Bakare",
  "email": "toluwani@example.com",
  "subject": "Inquiry about Dues",
  "message": "Hello, I would like to know the deadline for dues payment."
}
```
- **Response**:
```json
{
  "status": "success",
  "message": "Your message has been received. We will get back to you soon."
}
```

---

## Common Error Responses
The API should return standard HTTP status codes:
- `400 Bad Request`: Validation errors.
- `401 Unauthorized`: Missing or invalid token.
- `500 Server Error`: Unexpected backend issues.
