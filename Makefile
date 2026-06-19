# Resilience Cards — developer shortcuts
# Run `make help` to list targets.

.DEFAULT_GOAL := help
.PHONY: help install dev start lint lint-fix format test sync-envs \
        infra-up infra-down infra-reset infra-logs

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies (also wires husky git hooks)
	npm install

dev: ## Run the API with auto-reload (nodemon)
	npm run dev

start: ## Run the API via the production entrypoint (bootstrap.js)
	npm start

lint: ## Lint the codebase
	npm run lint

lint-fix: ## Lint and auto-fix
	npm run lint:fix

format: ## Format with Prettier
	npm run format

test: ## Run the mocha test suite (USE_MOCK_MODEL=1)
	npm test

sync-envs: ## Regenerate .env.example from .env (values stripped)
	npm run sync-envs

infra-up: ## Start local MongoDB (docker compose)
	docker compose up -d

infra-down: ## Stop local MongoDB
	docker compose down

infra-reset: ## Wipe local MongoDB data and restart
	docker compose down -v && docker compose up -d

infra-logs: ## Tail MongoDB logs
	docker compose logs -f
