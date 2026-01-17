# E & T PRODUCTION - Backend

Node.js backend server dengan Express, Socket.IO, dan security hardening lengkap.

## 🚀 Features

- ✅ RESTful API endpoints
- ✅ Real-time WebSocket (Socket.IO)
- ✅ System health monitoring
- ✅ Visitor analytics & tracking
- ✅ Security hardened (Rate limiting, CORS, Helmet, HPP)
- ✅ Admin authentication
- ✅ YouTube integration

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **Security**: Helmet, CORS, express-rate-limit, HPP

## 🔧 Setup

1. **Clone repository**
```bash
git clone https://github.com/q680278-del/backend-etproduction.git
cd backend-etproduction
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file** (copy from .env.example)
```bash
cp .env.example .env
```

4. **Edit .env** with your credentials

5. **Run development server**
```bash
npm run dev
```

Server will start on http://localhost:4000

## 🌍 Deployment

See [Deployment Guide](https://github.com/q680278-del/backend-etproduction/wiki/deployment) for Railway/Render deployment instructions.

## 🔐 Security

- Rate limiting: 100 req/15min global, 5 req/15min login
- CORS: Strict origin checking
- HPP: Parameter pollution prevention
- Helmet: Security headers
- Environment variables: Credentials isolated

## 📝 License

MIT
