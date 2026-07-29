#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker não encontrado. Instale Docker Desktop ou Docker Engine." >&2
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Arquivo .env criado. Revise ADMIN_EMAIL, ADMIN_PASSWORD e SESSION_SECRET."
fi

npm install
docker compose up -d postgres redis

printf 'Aguardando PostgreSQL'
for _ in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U alpha -d alpha >/dev/null 2>&1; then
    echo
    break
  fi
  printf '.'
  sleep 2
done

npm run db:generate
npm run db:deploy || npm run db:migrate
npm run db:seed

echo "Fundação pronta. Execute: npm run dev"
