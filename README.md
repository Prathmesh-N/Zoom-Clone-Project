# Zoom Clone - Video Conferencing Application

A full-stack video conferencing application built with React, Express, and Socket.io. This application allows users to create and join video meetings, authenticate securely, and maintain a history of their meetings.

## 🚀 Features

- **User Authentication**: Register and login functionality with secure password hashing using bcrypt
- **Video Conferencing**: Real-time peer-to-peer video and audio communication
- **Meeting Management**: Create and join meetings with unique URLs
- **Meeting History**: Track and view previous meetings
- **Real-time Communication**: Socket.io for instant messaging and connection management
- **Responsive Design**: Material-UI components for a modern, responsive interface
- **Cross-Origin Support**: CORS enabled for secure cross-domain requests

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Real-time Communication**: Socket.io 4.8.3
- **Database**: MongoDB with Mongoose 9.1.4
- **Authentication**: Bcrypt 6.0.0
- **Additional**: CORS, HTTP Status, Nodemon

### Frontend
- **Framework**: React 19.2.3
- **Routing**: React Router DOM 7.12.0
- **UI Library**: Material-UI 7.3.7
- **HTTP Client**: Axios 1.13.2
- **Real-time Client**: Socket.io-client 4.8.3
- **Styling**: CSS Modules, Emotion
- **Testing**: React Testing Library

## 📁 Project Structure

```
Zoom Clone/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Main Express application
│   │   ├── controllers/
│   │   │   ├── socketManager.js   # WebSocket connection management
│   │   │   └── users.js           # User controller logic
│   │   ├── models/
│   │   │   ├── meeting.js         # Meeting database schema
│   │   │   └── users.js           # User database schema
│   │   └── routes/
│   │       └── users.js           # User API routes
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main React component
│   │   ├── App.css                # Global styles
│   │   ├── index.js               # React entry point
│   │   ├── envirnoment.js         # Environment configuration
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # Authentication context & API calls
│   │   ├── pages/
│   │   │   ├── landing.jsx        # Landing page
│   │   │   ├── authentication.jsx # Register/Login page
│   │   │   ├── home.jsx           # Home/Dashboard page
│   │   │   ├── videoMeet.jsx      # Video meeting room
│   │   │   └── history.jsx        # Meeting history page
│   │   ├── styles/
│   │   │   ├── home.css           # Home page styles
│   │   │   └── videoMeet.module.css # Video meeting styles
│   │   ├── utils/
│   │   │   └── withAuth.jsx       # Authentication HOC/wrapper
│   │   ├── setupTests.js          # Test configuration
│   │   └── reportWebVitals.js     # Performance monitoring
│   ├── public/
│   │   ├── index.html             # HTML template
│   │   ├── manifest.json          # PWA manifest
│   │   └── robots.txt             # SEO robots file
│   └── package.json
│
└── README.md                        # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MongoDB** (local or MongoDB Atlas account)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Zoom Clone"
```

### 2. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the backend directory with the following environment variables:
```
PORT=8000
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/zoom-clone
```

### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

Update the `src/envirnoment.js` file with your backend server URL:
```javascript
const server = "http://localhost:8000"; // or your deployed backend URL
export default server;
```

## 🚀 Running the Application

### Start the Backend Server

From the `backend` directory:

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The backend will run on `http://localhost:8000`

### Start the Frontend Application

From the `frontend` directory:

```bash
npm start
```

The frontend will automatically open at `http://localhost:3000`

## 📚 API Endpoints

### User Routes (`/api/v1/users`)

- **POST /register** - Register a new user
  ```json
  {
    "name": "John Doe",
    "username": "johndoe",
    "password": "securepassword"
  }
  ```

- **POST /login** - Login user
  ```json
  {
    "username": "johndoe",
    "password": "securepassword"
  }
  ```

- **GET /home** - Backend health check
  - Returns: `"hello world"`

## 🔐 Authentication Flow

1. User registers with name, username, and password
2. Password is hashed using bcrypt
3. User credentials are stored in MongoDB
4. On login, password is verified using bcrypt
5. User data is stored in AuthContext for frontend state management
6. Protected routes use the `withAuth` HOC to ensure authentication

## 🎥 Video Meeting Features

- **Real-time WebRTC**: Peer-to-peer video and audio streaming
- **Socket.io Integration**: Instant signaling and connection management
- **Unique Meeting URLs**: Share custom URLs to invite participants
- **Meeting Controls**: Ability to start, stop, and manage video/audio

## 📱 Pages Overview

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Welcome page with app introduction |
| Authentication | `/auth` | Login/Register user interface |
| Home/Dashboard | `/home` | Create or join meetings |
| Video Meeting | `/:url` | Main video conferencing room |
| History | `/history` | View past meeting records |

## 🛡️ Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **CORS Protection**: Enabled and configured for secure API calls
- **Request Validation**: Size limits on JSON and URL-encoded requests (50kb)
- **MongoDB Security**: Connection string uses authentication
- **Protected Routes**: Authentication wrapper prevents unauthorized access

## 📝 Available Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run prod` - Start with PM2 process manager

### Frontend
- `npm start` - Run development server
- `npm build` - Create production build
- `npm test` - Run test suite
- `npm eject` - Eject from create-react-app (⚠️ irreversible)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👨‍💻 Author

**Prathmesh Nalawade**

## 🆘 Troubleshooting

### Backend Connection Issues
- Ensure MongoDB is running or check your MongoDB Atlas connection string
- Verify PORT is not already in use
- Check that frontend is pointing to correct backend URL

### Frontend Issues
- Clear browser cache and local storage
- Delete `node_modules` and reinstall with `npm install`
- Ensure React version compatibility

### Video Meeting Issues
- Check browser permissions for camera and microphone
- Ensure WebRTC is supported in your browser
- Verify Socket.io connection on console

## 📞 Support

For issues and questions:
1. Check existing issues in the repository
2. Create a detailed issue report with:
   - Error messages
   - Steps to reproduce
   - Your environment details

## 🔮 Future Enhancements

- Screen sharing capability
- Chat functionality during meetings
- Recording and playback
- Meeting scheduling
- Authentication with social media
- Mobile application
- Meeting annotations and whiteboard

---

**Happy Coding!** 🎉 Feel free to reach out with any questions or suggestions.
