# Sale Marketing Management

Monorepo for the Sale Marketing Management application: Laravel backend API and React frontend(s).

---

## Requirements

### Backend

| Requirement | Version |
|------------|---------|
| **PHP** | ^8.4 |
| **Composer** | 2.x |
| **Node.js** | 18+ (for Laravel frontend assets) |
| **npm** | 9+ |

### Frontend

| Requirement | Version |
|------------|---------|
| **Node.js** | 18+ |
| **npm** | 9+ |

### Optional (backend database)

- **SQLite** (default) – no extra install
- **MySQL 8+** or **MariaDB** – if you switch from SQLite in `.env`

### Backend with Docker

| Requirement | Version |
|------------|---------|
| **Docker** | 20+ |
| **Docker Compose** | 2+ |

The backend can be run in Docker with **MySQL 8** and the **Laravel app** in separate containers (see `backend/Dockerfile` and `backend/docker-compose.yml`). No local PHP or Composer needed.

---

## Backend setup

Backend is a Laravel 12 app in `backend/`.

1. **Go to backend**
   ```bash
   cd backend
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   - Default DB is SQLite. For SQLite, ensure the file exists:
     ```bash
     touch database/database.sqlite
     ```
   - For MySQL/MariaDB, set `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `.env`.

4. **Run migrations**
   ```bash
   php artisan migrate
   ```

5. **Install Node dependencies and build assets** (for Laravel’s Vite/Tailwind)
   ```bash
   npm install
   npm run build
   ```

6. **One-shot setup** (optional – does install, env, key, migrate, npm install, npm build)
   ```bash
   composer setup
   ```

### Run backend

- **Dev (API + queue + logs + Vite):**
  ```bash
  cd backend
  composer dev
  ```
  Serves API at `http://localhost:8000` (or the URL shown by `php artisan serve`).

- **API only:**
  ```bash
  cd backend
  php artisan serve
  ```

---

## Backend with Docker

You can run the backend (Laravel app + MySQL) using Docker instead of installing PHP and running `php artisan serve` locally.

### Services

| Service   | Container name  | Description                    | Port  |
|----------|-----------------|--------------------------------|-------|
| **app**  | `backend-app`   | Laravel API (PHP 8.4, Composer)| 8000  |
| **mysql**| `backend-mysql` | MySQL 8.0 database            | 3306  |

The app container uses MySQL by default (`DB_HOST=mysql`, `DB_DATABASE=laravel`, `DB_USERNAME=laravel`, `DB_PASSWORD=secret`). On startup it will create `.env` from `.env.example` if missing, run `php artisan key:generate` and `php artisan migrate`, then serve the API.

### Run backend with Docker

1. **From project root**
   ```bash
   cd backend
   ```

2. **Build and start**
   ```bash
   docker compose up --build
   ```
   Or in the background:
   ```bash
   docker compose up -d --build
   ```

3. **Use the API**
   - API: **http://localhost:8000**
   - MySQL (from host): `localhost:3306` — user `laravel` / password `secret`, database `laravel` (root password `root` if needed).

### Optional: custom `.env` for Docker

The compose file sets `DB_*` via environment, so you don’t need a `.env` for the app to connect to MySQL. To override or add variables, create `backend/.env` (e.g. copy from `.env.example`) and ensure `DB_HOST=mysql`, `DB_DATABASE=laravel`, `DB_USERNAME=laravel`, `DB_PASSWORD=secret` if you keep using the compose MySQL service.

### Useful Docker commands

| Command | Description |
|---------|-------------|
| `docker compose up -d --build` | Start app + MySQL in background |
| `docker compose down` | Stop and remove containers |
| `docker compose down -v` | Stop and remove containers + MySQL volume |
| `docker compose logs -f app` | Follow Laravel app logs |
| `docker exec -it backend-app bash` | Shell into the app container |

---

## Frontend setup

Main React app is in `frontend/` (React 19, MUI, TypeScript, Vite).

1. **Go to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment (optional)**  
   To point at the backend API, create `.env` in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
   If you don’t set this, the app uses the empty string (same-origin or you configure your proxy).

4. **Run dev server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

---

## Quick start (full stack)

### Option A: Local backend (PHP + SQLite)

**Terminal 1 – backend**
```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate
npm install && npm run build
composer dev
```

**Terminal 2 – frontend**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

Then open the frontend URL (e.g. `http://localhost:5173`) and use the API at `http://localhost:8000`.

### Option B: Backend with Docker (MySQL)

**Terminal 1 – backend (Docker)**
```bash
cd backend
docker compose up --build
```

**Terminal 2 – frontend**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

API runs at `http://localhost:8000` with MySQL in Docker. Frontend same as above.

---

## Scripts summary

| Location | Command | Description |
|----------|---------|-------------|
| `backend/` | `composer install` | Install PHP dependencies |
| `backend/` | `composer setup` | Full backend setup (env, key, migrate, npm, build) |
| `backend/` | `composer dev` | Run API + queue + logs + Vite |
| `backend/` | `php artisan serve` | Run API only (local) |
| `backend/` | `docker compose up --build` | Run API + MySQL in Docker |
| `backend/` | `docker compose down` | Stop Docker backend |
| `backend/` | `npm run dev` | Run Vite for Laravel assets |
| `frontend/` | `npm run dev` | Run React dev server |
| `frontend/` | `npm run build` | Build React app for production |
