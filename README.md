# 🏀 MPH Booking System

## 📖 Project Description

A full-stack web application for booking sports facilities at TUS Athlone. Students can book basketball, badminton, and volleyball courts in real-time with automated conflict detection. Administrators can manage bookings, block time slots for maintenance, and handle cancellations through a dedicated dashboard.

**Key Features:**
- ⚡ Real-time court availability with smart overlap detection
- 🔐 Secure user authentication with email verification
- 💳 Complete booking flow with payment processing
- 👨‍💼 Admin dashboard with sortable tables and data cleanup
- 📧 Professional email notifications for confirmations and cancellations

**Tech Stack:** Node.js, Express, MongoDB, Vanilla JavaScript, SendGrid

---

## 🚀 How to Install and Run the Project

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- SendGrid account (for email notifications)

### Installation Steps

1. **📦 Clone the repository**
   ```bash
   git clone https://github.com/haydenteh5526/MPH-Booking-System.git
   cd MPH-Booking-System
   ```

2. **📥 Install dependencies**
   ```bash
   cd login-system
   npm install
   ```

3. **⚙️ Set up environment variables**
   
   Create a `.env` file in the `login-system` folder:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secret_key
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key
   MAIL_FROM=your_email@example.com
   APP_BASE_URL=http://localhost:3000
   ```

4. **▶️ Start the server**
   ```bash
   npm start
   ```

5. **🌐 Access the application**
   - Open your browser and go to: `http://localhost:3000`

---

## 📱 How to Use the Project

### For Students 👨‍🎓

1. **📝 Register an Account**
   - Navigate to the registration page
   - Enter your email and create a password
   - Verify your email through the link sent

2. **🎯 Book a Court**
   - Select your sport (🏀 Basketball, 🏸 Badminton, or 🏐 Volleyball)
   - Choose a date and time
   - View available courts in the calendar
   - Select a time slot and proceed to payment
   - Complete booking and receive email confirmation

3. **📋 Manage Bookings**
   - Go to "My Bookings" to view all reservations
   - Cancel bookings if needed (refund processed in 5-7 days)

### For Administrators 👨‍💼

**Login Credentials:**
- Email: `admin@tus.ie`
- Password: `admin`

**Admin Functions:**
- 📊 View all bookings with search and sort functionality
- 🚫 Block time slots for maintenance (automatically blocks overlapping courts)
- ❌ Cancel user bookings with email notification
- 🧹 Cleanup old cancelled bookings and expired blocks

---

## 👥 Credits

This project was developed as part of the Software Engineering module at TUS Athlone.

**Team Members:**
- **Hayden** - Full-stack development
- **Roy** - Database and Backend development
- **Lim Zher** - Frontend development
- **Sebastian** - Frontend development

**Technologies Used:**
- 💻 Frontend: Vanilla JavaScript, HTML5, CSS3
- ⚙️ Backend: Node.js, Express.js
- 🗄️ Database: MongoDB Atlas
- 📧 Email Service: SendGrid
- 🔑 Authentication: JSON Web Tokens (JWT)

**Special Thanks:**
- 🎓 TUS Athlone Software Engineering Module
- 📨 SendGrid for email service
- ☁️ MongoDB Atlas for database hosting

---

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 MPH Booking System Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---