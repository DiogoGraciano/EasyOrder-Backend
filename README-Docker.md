# Easy Order Backend - Docker Setup

Este projeto inclui configuração Docker para facilitar o desenvolvimento e deploy.

## Pré-requisitos

- Docker
- Docker Compose

## Configuração

1. **Configure as variáveis de ambiente:**
   ```bash
   cp env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações do Cloudflare R2.

## Executando o Projeto

### Desenvolvimento (com hot reload)

```bash
# Iniciar todos os serviços em modo desenvolvimento
docker-compose -f docker-compose.dev.yml up --build

# Ou em background
docker-compose -f docker-compose.dev.yml up -d --build
```

### Produção

```bash
# Iniciar todos os serviços em modo produção
docker-compose up --build

# Ou em background
docker-compose up -d --build
```

## Serviços Disponíveis

- **API NestJS**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **pgAdmin**: http://localhost:8080
  - Email: admin@admin.com
  - Senha: admin

## Comandos Úteis

```bash
# Ver logs da aplicação
docker-compose logs app

# Ver logs do banco de dados
docker-compose logs postgres

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Rebuild apenas a aplicação
docker-compose up --build app

# Executar comandos dentro do container da aplicação
docker-compose exec app npm run build
docker-compose exec app npm run test

# Acessar o shell do container
docker-compose exec app sh
docker-compose exec postgres psql -U postgres -d easy_order
```

## Estrutura dos Arquivos Docker

- `docker-compose.yml` - Configuração para produção
- `docker-compose.dev.yml` - Configuração para desenvolvimento
- `Dockerfile` - Build para produção
- `Dockerfile.dev` - Build para desenvolvimento
- `.dockerignore` - Arquivos ignorados no build

## Banco de Dados

O PostgreSQL será inicializado automaticamente com:
- Database: `easy_order`
- User: `postgres`
- Password: `password`

Os dados são persistidos no volume `postgres_data` (produção) ou `postgres_data_dev` (desenvolvimento).

## Troubleshooting

### Porta já em uso
Se as portas 3000, 5432 ou 8080 já estiverem em uso, edite o docker-compose.yml para usar outras portas:

```yaml
ports:
  - "3001:3000"  # API na porta 3001
```

### Problemas de permissão
Se houver problemas de permissão, certifique-se de que o Docker tem acesso aos arquivos do projeto.

### Rebuild completo
Para fazer um rebuild completo removendo cache:

```bash
docker-compose down
docker system prune -a
docker-compose up --build
``` 