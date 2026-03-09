# GTD Stack Health Checks
FRONTEND_URL=https://gtd-frontend.salalite.workers.dev
GATEWAY_URL=https://gtd-gateway.salalite.workers.dev
BACKEND_URL=https://hono-d1-backend.salalite.workers.dev

.PHONY: health-all health-frontend health-gateway health-backend check-db bench-setup bench-all bench-cpu bench-io bench-memory bench-cascading bench-malicious bench-report

health-all: health-frontend health-gateway health-backend check-db

health-frontend:
	@echo "🔍 Checking Frontend..."
	@curl -s -o /dev/null -I -w "Status: %{http_code}\n" $(FRONTEND_URL)/
	@curl -s $(FRONTEND_URL)/ | grep -qi "FocusFlow" && echo "✅ Frontend: OK" || echo "❌ Frontend: Content Mismatch (FocusFlow not found)"

health-gateway:
	@echo "\n🔍 Checking Gateway..."
	@curl -s $(GATEWAY_URL)/health | grep -q '"status":"ok"' && echo "✅ Gateway: OK" || echo "❌ Gateway: Failed"
	@echo -n "   Registry: "
	@curl -s $(GATEWAY_URL)/backends
	@echo ""

health-backend:
	@echo "\n🔍 Checking Backend..."
	@curl -s $(BACKEND_URL)/health | grep -q '"status":"ok"' && echo "✅ Backend: OK" || echo "❌ Backend: Failed"

check-db:
	@echo "\n🔍 Checking D1 Database..."
	@wrangler d1 execute gtd-db --remote --command "SELECT 1;" > /dev/null 2>&1 && echo "✅ Database: Reachable" || echo "❌ Database: Unreachable"

# Benchmark Suite
bench-setup:
	@echo "📦 Installing benchmark dependencies..."
	cd benchmarks && npm install

bench-all: bench-setup
	@echo "🚀 Running full benchmark suite..."
	cd benchmarks && npm run benchmark:all

bench-cpu: bench-setup
	@echo "📊 Benchmarking CPU-bound operations..."
	cd benchmarks && npm run benchmark:cpu-bound

bench-io: bench-setup
	@echo "📊 Benchmarking I/O-heavy operations..."
	cd benchmarks && npm run benchmark:io-heavy

bench-memory: bench-setup
	@echo "📊 Benchmarking memory operations..."
	cd benchmarks && npm run benchmark:memory

bench-cascading: bench-setup
	@echo "📊 Benchmarking cascading operations..."
	cd benchmarks && npm run benchmark:cascading

bench-malicious: bench-setup
	@echo "📊 Benchmarking malicious payloads..."
	cd benchmarks && npm run benchmark:malicious

bench-report: bench-setup
	@echo "📈 Generating benchmark report..."
	cd benchmarks && npm run generate-report