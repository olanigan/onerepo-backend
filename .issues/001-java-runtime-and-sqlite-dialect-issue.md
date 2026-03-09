# Issue: Java Runtime and SQLite Dialect in Spring Boot (Java 21)

## Description
When running the Spring Boot backend using ./mvnw spring-boot:run, several issues were encountered:
1. **Missing Java Runtime:** The system failed to locate a Java runtime even though which java returned /usr/bin/java. This was resolved by explicitly setting JAVA_HOME to the Homebrew-installed OpenJDK 21 path (/opt/homebrew/opt/openjdk@21).
2. **Missing SQLite Dialect:** Spring Data JDBC (v4.0.3) does not provide a built-in dialect for SQLite, leading to a NoDialectException during application startup.

## Status
- **Java Runtime:** Temporary workaround using export JAVA_HOME=/opt/homebrew/opt/openjdk@21. A permanent solution (e.g., updating .zshrc or a project-level configuration) is needed.
- **SQLite Dialect:** Attempted to fix by adding SqliteConfig.java to provide JdbcAnsiDialect.INSTANCE.

## Reproduction Steps
```bash
cd backends/java-springboot
./mvnw spring-boot:run
```

## Environment
- OS: darwin (macOS 15.6.1)
- Java version required: 21 (properties in pom.xml)
- Spring Boot version: 4.0.3