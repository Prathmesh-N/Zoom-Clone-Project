# ConnectMe (Zoom Clone)

ConnectMe is a full-stack video meeting app where users can register/login, join meetings using a code, chat in real time, and track meeting history.

## 🚀 Features

- User authentication (register + login)
- Join video call rooms via meeting code
- Real-time signaling with Socket.IO
- In-call chat
- Toggle camera/mic
- Screen sharing (when supported)
- Meeting history (save, view, delete)
- Protected routes for authenticated users

## 🛠️ Tech Stack

### Frontend
- React (CRA)
- React Router
- Material UI (MUI)
- Axios
- Socket.IO Client
- WebRTC (peer-to-peer media)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- bcrypt (password hashing)

## 📁 Project Structure

bash
```
Zoom Clone/
├── frontend/
│   ├── src/
│   │   ├── pages/            # landing, auth, home, history, videoMeet
│   │   ├── contexts/         # AuthContext
│   │   ├── utils/            # route protection
│   │   └── envirnoment.js    # API/server URL config
└── backend/
    └── src/
        ├── app.js
        ├── routes/  
        ├── controllers/
        └── models/ 
```

### API Endpoints
- Base: /api/v1/users

- POST /register - create user
- POST /login - login user
- POST /add_to_activity - add meeting to history
- POST /get_all_activity - fetch user meeting history
- POST /delete_activity - delete meeting from history
