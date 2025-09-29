# 💬 ChatBox

ChatBox is a real-time chat application designed for fast, secure, and interactive communication. Built with **React, Node.js, Express, MongoDB, and Socket.IO**, it delivers instant messaging with a clean, responsive user experience.

***

## 🚀 Features

- Real-time messaging with **Socket.IO** for instant updates[1]
- Secure **user authentication** (JWT-based)
- Private and group conversation support
- **File/Image upload** via Multer and Cloudinary integration (if configured)
- Persistent conversation history stored in the database
- Mobile-first, responsive UI with modern design principles

***

## 🛠 Tech Stack

- **Frontend:** React (with Vite), Socket.IO Client
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB (Adjust as per your configuration)
- **Media Uploads:** Multer, Cloudinary (if enabled)
- **Authentication:** JWT (JSON Web Tokens)

***

## 📂 Project Structure

```
chatBox/
│── backend/        # Express + Socket.IO server
│── frontend/       # React (Vite) app
```

***

## ⚡ Getting Started

### Prerequisites

- Node.js 
- MongoDB database (Atlas/local instance)
- Cloudinary account for media uploads

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mrpawarGit/ChatBox.git
   cd ChatBox
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables:**
   - Create a `.env` file inside the `backend/` directory:
     ```
     PORT=5000
     MONGO_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     CLOUDINARY_URL=your_cloudinary_url # Optional, for media uploads
     ```

5. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

6. **Start the frontend app:**
   ```bash
   cd frontend
   npm run dev
   ```

***

## 📦 Important Dependencies & Their Uses

### 🔙 Backend

* **express** – Core web framework to handle API routes and middleware.
* **mongoose** – ODM for MongoDB to define schemas and interact with the database.
* **jsonwebtoken (JWT)** – Secure user authentication & authorization via tokens.
* **bcryptjs** – Hashing passwords before storing them in the database.
* **socket.io** – Enables real-time, bi-directional communication for chat.
* **multer** – Middleware for handling file uploads (images, media).
* **cloudinary & multer-storage-cloudinary** – Cloud-based storage and delivery of media files.
* **passport & passport-google-oauth20** – OAuth2 integration for Google login.
* **twilio** – Used for SMS/OTP-based authentication or notifications.
* **nodemailer** – Sending verification or notification emails.
* **cookie-parser** – Parse cookies for session/auth handling.
* **cors** – Allow cross-origin requests (important for frontend-backend communication).
* **dotenv** – Manage environment variables securely.

---

### 🖥️ Frontend

* **react** – Core frontend library for building UI.
* **react-router-dom** – Handles client-side routing and navigation.
* **socket.io-client** – Connects the frontend to the backend for real-time messaging.
* **axios** – Simplifies API requests to the backend.
* **zustand** – Lightweight state management solution for React.
* **react-hook-form & yup** – Form handling and validation.
* **react-toastify** – Beautiful toast notifications (success, error, etc.).
* **emoji-picker-react & @emoji-mart/react** – Adds emoji picker support in chat.
* **react-icons** – Provides a large set of customizable icons.
* **framer-motion** – Smooth animations and transitions in UI.
* **react-phone-input-2** – Phone number input with country code support.
* **date-fns** – Date/time formatting for messages.
* **tailwindcss & daisyui** – Utility-first CSS + component library for styling.

***

## 🎮 Usage

- Open `http://localhost:3000` in your browser.
- Register or log in to your account.
- Start chatting in real-time: text, images, and files will sync instantly across all users.

***

## 🔮 Future Roadmap

- Group chats and public channels
- End-to-end encryption
- Video call

---
