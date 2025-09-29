# PlayWell - Game Time Tracker

A desktop application built with Electron and React that helps you track and manage your gaming time. Set limits, view statistics, and maintain a healthy gaming balance.

## 🚀 Technologies Used

### **Electron** - Desktop Application Framework
- **Why**: Provides native desktop app capabilities with web technologies
- **How**: Main process handles system integration, renderer process runs the React UI
- **Features**: System tray, auto-start, cross-platform compatibility

### **React + React Router** - User Interface
- **Why**: Modern, component-based UI with excellent developer experience
- **How**: Handles all user interactions, routing between different app sections
- **Features**: Component reusability, state management, responsive design

### **Prisma + PostgreSQL** - Database & ORM
- **Why**: Type-safe database operations with excellent developer experience
- **How**: Prisma provides the ORM layer, PostgreSQL stores game sessions and limits
- **Features**: Type safety, migrations, query optimization

### **Vite** - Build Tool
- **Why**: Fast development server and optimized production builds
- **How**: Bundles React app for Electron renderer process
- **Features**: Hot module replacement, fast builds, modern tooling

### **Background Process Architecture**
- **Why**: Separate game tracking from UI to prevent blocking
- **How**: Node.js worker processes handle game detection and database operations
- **Features**: Non-blocking operations, system resource monitoring

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- **npm** or **yarn** package manager

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd PlayWell
npm install
```

### 2. Database Setup
1. Install and start PostgreSQL
2. Create a database for the project
3. Copy environment file:
   ```bash
   copy .env.example .env
   ```
4. Update `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/playwell"
   ```

### 3. Initialize Database
```bash
# Generate Prisma client
npm run prisma:generate

# Create database schema
npm run prisma:migrate
```

### 4. Start Development
```bash
npm run dev
```

## 📜 Available Scripts

### **Development**
- `npm run dev` - Start development server with hot reload
- `npm run dev:renderer` - Start Vite dev server only
- `npm run dev:electron` - Start Electron only

### **Database**
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### **Production**
- `npm run build` - Build for production
- `npm run start` - Run built application

## 🏗️ Project Structure

```
PlayWell/
├── electron.main.js          # Electron main process
├── electron.tray.js           # System tray functionality
├── background/               # Background services
│   ├── index.js             # Background process entry
│   ├── gameTracker.js        # Game detection logic
│   ├── dbService.js          # Database operations
│   └── prismaClient.js       # Prisma client singleton
├── src/                      # React application
│   ├── pages/               # App pages (Home, Limits, Stats, etc.)
│   ├── components/          # Reusable components
│   └── theme/               # Design system
├── prisma/                  # Database schema
└── public/                  # Static assets
```

## 🎯 Features (Planned)

- **Game Time Tracking** - Automatic detection and logging of gaming sessions
- **Time Limits** - Set daily/weekly limits for different games
- **Statistics Dashboard** - Visualize your gaming patterns
- **Session History** - Review past gaming sessions
- **System Integration** - Tray icon, notifications, auto-start

## 🔧 Development Notes

- The app uses a background process architecture to prevent UI blocking
- All database operations are handled through Prisma ORM
- Theme system provides consistent styling across components
- Electron security best practices implemented (context isolation, preload scripts)

## 📝 License

MIT License - see LICENSE file for details