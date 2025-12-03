.PHONY: help build run stop clean logs shell dev prod-build prod-run

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker image
	docker build -t aixiv-insights:latest .

run: ## Run the container in development mode
	docker-compose up -d

stop: ## Stop the container
	docker-compose down

clean: ## Remove containers and images
	docker-compose down --rmi all --volumes --remove-orphans
	docker rmi aixiv-insights:latest 2>/dev/null || true

logs: ## Show container logs
	docker-compose logs -f

shell: ## Access container shell
	docker exec -it aixiv-insights-app /bin/sh

dev: ## Run development server locally
	npm run dev

prod-build: ## Build for production
	docker build -t aixiv-insights:prod .

prod-run: ## Run in production mode
	docker-compose -f docker-compose.prod.yml up -d

prod-stop: ## Stop production container
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-shell: ## Access production container shell
	docker exec -it aixiv-insights-prod /bin/sh
