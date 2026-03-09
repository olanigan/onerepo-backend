# Walkthrough - Java Runtime and SQLite Dialect Fix

I have successfully resolved the issues preventing the Java Spring Boot backend from running.

## Changes Made

### 1. Environment Configuration
- Created `dev.sh` to automate setting `JAVA_HOME` to the correct Homebrew-installed OpenJDK 21 path (`/opt/homebrew/opt/openjdk@21`).
- This ensures the application always runs with the required Java version regardless of global system settings.

### 2. SQLite Dialect Integration
- Integrated the `org.komamitsu:spring-data-sqlite` (v1.4.0) library into `pom.xml`.
- Annotated `GtdBackendApplication` with `@EnableSqliteRepositories`.
- Removed the manual and incomplete `SqliteConfig.java`.

## Verification Results

### Application Startup
The application now starts successfully using `./dev.sh`.

```bash
Using JAVA_HOME: /opt/homebrew/opt/openjdk@21
...
2026-03-09T15:55:11.717-04:00  INFO 15107 --- [           main] c.o.gtd_backend.GtdBackendApplication    : Starting GtdBackendApplication using Java 21.0.10...
2026-03-09T15:55:11.925-04:00  INFO 15107 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JDBC repositories in DEFAULT mode.
```

### Functional Check
Verified that the application is reachable on port `3003` and can interact with the SQLite database.

```bash
curl http://localhost:3003/projects
# Returns JSON list of projects from the SQLite database
```

> [!NOTE]
> The application is configured to use the SQLite database at:
> `/Users/unblockd/unblockd_workspaces/labs-coding/onerepo/backends/backends/bun-sqlite/gtd.db`
