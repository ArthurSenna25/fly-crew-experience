# ✈️ Fly Crew Experience

A modern, scalable and production-ready CRM platform developed for **Fly Crew Experience**, designed to centralize business operations, student management, workshops, testimonials, analytics and administrative workflows.

Built with a modern full-stack architecture focused on performance, maintainability and an exceptional user experience.

---

# ✨ Features

### 👥 Student Management
- Complete student records
- Search and advanced filtering
- Tags and segmentation
- Status management

### 📈 CRM & Leads
- Lead pipeline
- Contact management
- Follow-up tracking
- Notes and observations

### 🎓 Workshops
- Workshop registration
- Attendance management
- Student progress
- Reports

### 💬 Testimonials
- Testimonial management
- Approval workflow
- Categories
- Public showcase integration

### 📊 Dashboard
- Business metrics
- Analytics
- Performance charts
- KPIs

### 🔐 Authentication
- Secure authentication
- Protected routes
- Session management
- Role-based permissions

### 🌍 Internationalization
- Multi-language support
- Locale-aware routing

### 🎨 Modern UI
- Responsive design
- Dark mode
- Smooth animations
- Accessible components

---

# 🛠 Tech Stack

## Frontend

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- SWR
- React Hook Form
- Zod
- Lucide Icons
- Sonner

## Backend

- Next.js Server Actions
- Better Auth
- Drizzle ORM
- PostgreSQL (Neon)

## Charts

- Recharts

## Development

- ESLint
- TypeScript
- PostCSS

---

# 📁 Project Structure

```
app/
components/
hooks/
lib/
actions/
services/
db/
drizzle/
public/
messages/
middleware.ts
```

---

# 🚀 Getting Started

## Clone

```bash
git clone https://github.com/your-user/fly-crew-site.git

cd fly-crew-site
```

---

## Install dependencies

```bash
npm install
```

---

## Configure environment variables

Create a `.env.local` file.

Example:

```env
DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_API_URL=
```

---

## Run development server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 📦 Available Scripts

```bash
npm run dev
```

Runs the development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Starts the production server.

```bash
npm run lint
```

Runs ESLint.

---

# 🗄 Database

This project uses:

- PostgreSQL
- Drizzle ORM
- Neon Database

Run migrations as needed:

```bash
npm run drizzle:generate

npm run drizzle:migrate
```

---

# 🎯 Architecture

The application follows a modular architecture with clear separation of concerns:

- Components
- Server Actions
- Database Layer
- Authentication Layer
- Business Logic
- Reusable Hooks
- Utility Functions

This approach improves:

- Maintainability
- Scalability
- Performance
- Testability

---

# 🔒 Security

The project follows modern security practices including:

- Environment variable isolation
- Authentication middleware
- Protected routes
- Secure session handling
- Server-side validation
- Input validation using Zod

---

# 🌟 Main Technologies

| Technology | Purpose |
|------------|---------|
| Next.js 15 | Framework |
| React | UI |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Better Auth | Authentication |
| Drizzle ORM | Database ORM |
| PostgreSQL | Database |
| Neon | Cloud Database |
| Framer Motion | Animations |
| SWR | Data Fetching |
| Zod | Validation |
| Recharts | Analytics |

---

# 📈 Project Goals

The platform was built to:

- Centralize company operations
- Improve productivity
- Simplify student management
- Optimize administrative workflows
- Provide business insights through analytics
- Offer a modern and responsive user experience

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/my-feature
```

3. Commit your changes

```bash
git commit -m "feat: add new feature"
```

4. Push

```bash
git push origin feature/my-feature
```

5. Open a Pull Request.

---

# 📄 License

This project is private and proprietary.

Unauthorized copying, distribution or modification is prohibited.

---

# 👨‍💻 Developed by

**Arthur de Senna**

Software Engineering Student • Full Stack Developer

Built with ❤️ using Next.js, TypeScript and modern web technologies.
