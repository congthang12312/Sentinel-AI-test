.PHONY: install clean gen test report pipeline help docker-test

help:
	@echo "Automation Framework Commands:"
	@echo ""
	@echo "  Local Test Execution:"
	@echo "    make test                    - Run all tests locally"
	@echo "    make test mod=auth           - Run tests for a specific module"
	@echo "    make test tag=@smoke         - Run tests matching a tag"
	@echo "    make test-ui [mod=x]         - Run tests in PLAYWRIGHT UI MODE"
	@echo "    make test-headed [mod=x]     - Run tests in headed mode"
	@echo ""
	@echo "  Docker Test Execution:"
	@echo "    make docker-test             - Run ALL tests inside Docker container"
	@echo ""
	@echo "  AI Development Tools (requires API key):"
	@echo "    make ai-gen req=<file> mod=<module> - Generate test from requirement"
	@echo "    make ai-heal req=<feature>          - AI self-healing for a feature"
	@echo ""
	@echo "  Reports:"
	@echo "    make report          - Open HTML Playwright report"
	@echo "    make report-docker   - Start Allure report server"
	@echo "    make stop-report     - Stop all Docker services"
	@echo ""
	@echo "  Utilities:"
	@echo "    make install         - Install dependencies and browsers"
	@echo "    make check           - Run Prettier + ESLint fix"
	@echo "    make clean           - Remove reports and generated files"
	@echo "    make compile         - TypeScript compile check (src only)"
	@echo "    make compile-ai      - TypeScript compile check (src + ai-agent)"

install:
	npm install
	npx playwright install webkit chromium firefox

clean:
	rm -rf allure/results/ allure/report/ playwright-report/ test-results/ reports/ src/allure-results/ src/playwright-report/

check:
	npm run format
	npm run lint:fix

compile:
	npm run compile

compile-ai:
	npm run compile:ai

# ─── Local Test Execution ─────────────────────────────────────────
# Usage:
#   make test                  → run all tests
#   make test mod=auth         → run only auth module
#   make test tag=@smoke       → run tests matching tag
#   make test mod=auth tag=@e2e → combine module + tag

test:
	@echo "Running Playwright tests locally..."
	@rm -rf allure/results && mkdir -p allure/results
	@npx bddgen
	@if [ -n "$(tag)" ] && [ -n "$(mod)" ]; then \
		npx playwright test src/tests/$(mod) --grep "$(tag)"; \
	elif [ -n "$(tag)" ]; then \
		npx playwright test --grep "$(tag)"; \
	elif [ -n "$(mod)" ]; then \
		npx playwright test src/tests/$(mod); \
	else \
		npx playwright test; \
	fi

test-ui:
	@if [ -z "$(mod)" ]; then \
		echo "Running Playwright Inspector UI..."; \
		npx playwright test --ui; \
	else \
		echo "Running Playwright Inspector UI for module: $(mod)..."; \
		npx playwright test src/tests/$(mod) --ui; \
	fi

test-headed:
	@if [ -z "$(mod)" ]; then \
		echo "Running Playwright tests in Headed mode..."; \
		npx playwright test --headed; \
	else \
		echo "Running Playwright tests for module: $(mod) in Headed mode..."; \
		npx playwright test src/tests/$(mod) --headed; \
	fi

# ─── Docker Test Execution ────────────────────────────────────────
# Runs ALL tests inside Docker container, results fed to Allure

docker-test:
	@echo "Running ALL tests in Docker..."
	@rm -rf allure/results && mkdir -p allure/results
	docker compose --profile test run --build --rm test-runner
	@echo ""
	@echo "✅ Docker test complete! View report:"
	@echo "👉 http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html"

# ─── Reports ──────────────────────────────────────────────────────

report:
	npx playwright show-report playwright-report

report-docker:
	docker compose up -d allure
	@echo "⏳ Waiting for Allure server to start..."
	@sleep 10
	@echo "🚀 Allure Report is now running in Docker!"
	@echo "👉 Open your browser at: http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html"

stop-report:
	-docker ps -q --filter "name=test-runner" | xargs -r docker stop 2>/dev/null
	docker compose down --remove-orphans

# ─── AI Development Tools (requires GEMINI_API_KEY) ──────────────

ai-gen:
	@if [ -z "$(req)" ] || [ -z "$(mod)" ]; then echo "Error: req and mod are required. Usage: make ai-gen req=login-flow.md mod=auth"; exit 1; fi
	npx ts-node ai-agent/cli.ts requirements/$(req) --module=$(mod)

ai-heal:
	@if [ -z "$(req)" ]; then echo "Error: req is required. Usage: make ai-heal req=login-flow.md"; exit 1; fi
	npx ts-node ai-agent/cli.ts requirements/$(req) --heal-only
