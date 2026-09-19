# SolidHomeApp

A modern Single Page Application (SPA) for smart home management, built with **Angular 21** and **Tailwind CSS v4**.

---

## Features

- **Authentication Module (Auth):**
  - User login with session management (`sessionStorage` or persistent `localStorage` via *Remember Me*).
  - New user registration.
  - Password recovery and reset using email verification codes.
  - Multi-tab logout synchronization via window storage listeners.
- **Lighting Control (Lights):**
  - Interactive SVG home blueprint with real-time lamp position visualization.
  - Optimistic UI updates for individual light toggling and global on/off switch.
  - Real-time event history log with clearing capabilities.
- **User Settings (Settings Modal):**
  - Profile updates for username, email, and password using Angular Signal Forms.
  - Accent color picker with 6 predefined theme variants.
  - Configurable display units (temperature, atmospheric pressure, time format).
- **Internationalization (i18n):**
  - Full multi-language support (English and Polish) via `@ngx-translate`.
- **Theming:**
  - Dark and Light mode support with automatic system preference detection and manual toggle.

---

## Tech Stack

- **Framework:** Angular 21 (Standalone Components, Signals, Signal Forms)
- **Styling:** Tailwind CSS v4, custom theme system, Sora font
- **State Management:** Angular Signals & RxJS
- **Unit Testing:** Vitest + `@angular/build:unit-test` (V8 Coverage)
- **Icons & Graphics:** `angular-svg-icon` with custom SVG vectors

---

## Project Structure

```text
src/
├── app/
│   ├── core/              # Global services, guards, HTTP interceptors, models
│   │   ├── guards/        # Route authentication guards (loginGuard)
│   │   ├── interceptors/  # authInterceptor, errorInterceptor
│   │   ├── models/        # TypeScript interfaces (core.models, auth.models)
│   │   └── services/      # theme, translations, accent-color, loading, logout
│   ├── features/          # Feature-based business logic (auth, lights, settings)
│   │   ├── auth/          # Authentication forms and services
│   │   ├── lights/        # Lighting widget, SVG map, history, and controllers
│   │   └── settings/      # User profile and UI customization modal
│   ├── pages/             # Main routed page components (auth, home, lights, gates, air, security)
│   ├── shared/            # Shared UI components (navbar, buttons, spinner, directives)
│   ├── app.config.ts      # Global ApplicationConfig and providers
│   ├── app.routes.ts      # Route definitions and Lazy Loading configuration
│   └── app.ts             # Root application component
└── environments/          # Environment configuration files (development / production)
```

---

## Getting Started

### Prerequisites
- Node.js (version `>= 20.x`)
- npm (version `>= 10.x`)

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
# or: ng serve
```
Navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you change any source files.

---

## Testing

The project includes a comprehensive unit test suite powered by **Vitest**:

```bash
# Run all unit tests
npm test

# Run tests once with code coverage report
npx ng test --no-watch --coverage
```

---

## Production Build

```bash
npm run build
```
The build artifacts will be stored in the `dist/solid-home-app/browser/` directory, optimized for performance and production deployment.
