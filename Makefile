.PHONY: up down

up:
	@echo "Starting KV and Next.js app..."
	@docker-compose up -d
	@npm run dev

down:
	@echo "Stopping KV and Next.js app..."
	@docker-compose down -v
	@pkill -f "next dev" || true 