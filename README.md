# The Backend Shootout: GTD App

A multi-language implementation of the same GTD (Getting Things Done) application to compare Developer Experience, Performance, and Coding Agent capabilities across ecosystems.

## Architecture

- **Frontend**: Next.js + TanStack Query (Single UI for all backends)
- **Gateway**: Cloudflare Workers (Routes traffic based on `x-backend` header)
- **Contract**: OpenAPI v3 (`specs/openapi.yaml`)

## Demo

- **Live Frontend**: [https://gtd.unblockd.dev/](https://gtd.unblockd.dev/)

## Backends (Targets)

| Language | Framework | Path | Status |
|----------|-----------|------|--------|
| Elixir | Phoenix | `backends/elixir-phoenix` | Pending |
| Ruby | Rails | `backends/ruby-rails` | Pending |
| PHP | Laravel | `backends/php-laravel` | Pending |
| C# | .NET | `backends/dotnet-api` | Pending |
| Java | Spring Boot | `backends/java-spring-boot` | Pending |

## Usage

1. **Start the Gateway**:
   ```bash
   cd gateways && npm run dev
   ```

2. **Run a Backend**:
   Navigate to a backend folder and follow its specific README.

3. **Switch Contexts**:
   Use the frontend dropdown to toggle the `x-backend` header.
