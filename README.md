# Skill Forge

## Backend

### Run quickly (default H2, no external DB needed)

```bash
./mvnw spring-boot:run
```

### Run with PostgreSQL

1. Start database:

```bash
docker compose up -d
```

2. Ensure DB exists (idempotent):

```bash
./scripts/create-db-if-not-exists.sh
```

3. Run backend with postgres profile:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=postgres
```

The backend API runs on `http://localhost:8080`.

Flyway migrations are in `src/main/resources/db/migration` and run automatically at startup.

If your DB credentials are different, run with:

```bash
DB_URL=jdbc:postgresql://localhost:5432/skillforge DB_USERNAME=your_user DB_PASSWORD=your_password ./mvnw spring-boot:run
```

For Maven Flyway plugin checks:

```bash
./mvnw flyway:info -Dflyway.url=jdbc:postgresql://localhost:5432/skillforge -Dflyway.user=your_user -Dflyway.password=your_password
./mvnw flyway:validate -Dflyway.url=jdbc:postgresql://localhost:5432/skillforge -Dflyway.user=your_user -Dflyway.password=your_password
./mvnw flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/skillforge -Dflyway.user=your_user -Dflyway.password=your_password
```

Default seeded admin (via `V2__seed_admin_user.sql`):
- Email: `admin@skillforge.local`
- Password: `password`

Bootstrap admin (works for both H2 and PostgreSQL startup) can be overridden:

```bash
APP_BOOTSTRAP_ADMIN_EMAIL=admin@yourdomain.com APP_BOOTSTRAP_ADMIN_PASSWORD=YourStrongPassword ./mvnw spring-boot:run
```

## Frontend (React)

The React app is in [`frontend/`](./frontend).

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.
