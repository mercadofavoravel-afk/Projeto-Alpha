.PHONY: bootstrap dev infra infra-down db-generate db-migrate db-seed quality build full-up full-down

bootstrap:
	bash scripts/bootstrap.sh

dev:
	npm run dev

infra:
	docker compose up -d postgres redis

infra-down:
	docker compose down

db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

quality:
	npm run quality

build:
	npm run build

full-up:
	docker compose --profile full up -d --build

full-down:
	docker compose --profile full down
