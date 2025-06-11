# Easy Order Backend API

Uma API REST construída com NestJS para gerenciamento de pedidos, clientes, empresas e produtos.

## 🚀 Configuração e Execução

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação
```bash
npm install
```

### Executar a aplicação
```bash
npm run start
```

A API estará disponível em: `http://localhost:3000`

## 📋 Documentação das Rotas

### 🏢 Empresas (Enterprises)

**Base URL:** `/enterprises`

#### Criar uma nova empresa
- **POST** `/enterprises`
- **Descrição:** Cria uma nova empresa no sistema
- **Corpo da requisição:**
```json
{
  "legalName": "Nome da Empresa Ltda",
  "tradeName": "Nome Fantasia",
  "logo": "url_da_logo_opcional",
  "foundationDate": "2023-01-01T00:00:00.000Z",
  "cnpj": "12345678901234",
  "address": "Rua da Empresa, 123"
}
```

#### Listar todas as empresas
- **GET** `/enterprises`
- **Descrição:** Retorna uma lista com todas as empresas cadastradas

#### Buscar empresa por ID
- **GET** `/enterprises/:id`
- **Descrição:** Retorna os dados de uma empresa específica
- **Parâmetros:**
  - `id` (string): ID único da empresa

#### Atualizar empresa
- **Put** `/enterprises/:id`
- **Descrição:** Atualiza os dados de uma empresa existente
- **Parâmetros:**
  - `id` (string): ID único da empresa
- **Corpo da requisição:** Mesma estrutura do POST (campos opcionais)

#### Excluir empresa
- **DELETE** `/enterprises/:id`
- **Descrição:** Remove uma empresa do sistema
- **Parâmetros:**
  - `id` (string): ID único da empresa

#### Upload de logo da empresa
- **POST** `/enterprises/:id/logo`
- **Descrição:** Faz upload da logo de uma empresa
- **Parâmetros:**
  - `id` (string): ID único da empresa
- **Corpo da requisição:** Form-data com o campo `logo` (arquivo)

---

### 👥 Clientes (Customers)

**Base URL:** `/customers`

#### Criar um novo cliente
- **POST** `/customers`
- **Descrição:** Cadastra um novo cliente no sistema
- **Corpo da requisição:**
```json
{
  "name": "Nome do Cliente",
  "email": "cliente@email.com",
  "phone": "11999999999",
  "photo": "url_da_foto_opcional",
  "cpf": "12345678901234",
  "address": "Rua do Cliente, 456"
}
```

#### Listar todos os clientes
- **GET** `/customers`
- **Descrição:** Retorna uma lista com todos os clientes cadastrados

#### Buscar cliente por ID
- **GET** `/customers/:id`
- **Descrição:** Retorna os dados de um cliente específico
- **Parâmetros:**
  - `id` (string): ID único do cliente

#### Atualizar cliente
- **Put** `/customers/:id`
- **Descrição:** Atualiza os dados de um cliente existente
- **Parâmetros:**
  - `id` (string): ID único do cliente
- **Corpo da requisição:** Mesma estrutura do POST (campos opcionais)

#### Excluir cliente
- **DELETE** `/customers/:id`
- **Descrição:** Remove um cliente do sistema
- **Parâmetros:**
  - `id` (string): ID único do cliente

#### Upload de foto do cliente
- **POST** `/customers/:id/photo`
- **Descrição:** Faz upload da foto de um cliente
- **Parâmetros:**
  - `id` (string): ID único do cliente
- **Corpo da requisição:** Form-data com o campo `photo` (arquivo)

---

### 📦 Produtos (Products)

**Base URL:** `/products`

#### Criar um novo produto
- **POST** `/products`
- **Descrição:** Cadastra um novo produto no sistema
- **Corpo da requisição:**
```json
{
  "name": "Nome do Produto",
  "description": "Descrição detalhada do produto",
  "price": 29.99,
  "stock": 100,
  "photo": "url_da_foto_opcional",
  "enterpriseId": "id_da_empresa"
}
```

#### Listar produtos
- **GET** `/products`
- **Descrição:** Retorna uma lista com todos os produtos ou filtrados por empresa
- **Query Parameters (opcionais):**
  - `enterpriseId` (string): Filtra produtos por empresa específica
- **Exemplos:**
  - `GET /products` - Lista todos os produtos
  - `GET /products?enterpriseId=uuid-da-empresa` - Lista produtos de uma empresa

#### Buscar produto por ID
- **GET** `/products/:id`
- **Descrição:** Retorna os dados de um produto específico
- **Parâmetros:**
  - `id` (string): ID único do produto

#### Atualizar produto
- **Put** `/products/:id`
- **Descrição:** Atualiza os dados de um produto existente
- **Parâmetros:**
  - `id` (string): ID único do produto
- **Corpo da requisição:** Mesma estrutura do POST (campos opcionais)

#### Excluir produto
- **DELETE** `/products/:id`
- **Descrição:** Remove um produto do sistema
- **Parâmetros:**
  - `id` (string): ID único do produto

#### Upload de foto do produto
- **POST** `/products/:id/photo`
- **Descrição:** Faz upload da foto de um produto
- **Parâmetros:**
  - `id` (string): ID único do produto
- **Corpo da requisição:** Form-data com o campo `photo` (arquivo)

#### Atualizar estoque
- **Put** `/products/:id/stock`
- **Descrição:** Atualiza a quantidade em estoque de um produto
- **Parâmetros:**
  - `id` (string): ID único do produto
- **Corpo da requisição:**
```json
{
  "quantity": 50
}
```

---

### 🛒 Pedidos (Orders)

**Base URL:** `/orders`

#### Criar um novo pedido
- **POST** `/orders`
- **Descrição:** Cria um novo pedido no sistema
- **Corpo da requisição:**
```json
{
  "orderNumber": "PED-001",
  "orderDate": "2023-12-01T10:30:00.000Z",
  "status": "PENDING",
  "customerId": "id_do_cliente",
  "enterpriseId": "id_da_empresa",
  "totalAmount": 149.98,
  "notes": "Observações opcionais",
  "items": [
    {
      "productId": "id_do_produto",
      "productName": "Nome do Produto",
      "quantity": 2,
      "unitPrice": 29.99,
      "subtotal": 59.98
    },
    {
      "productId": "id_do_produto_2",
      "productName": "Outro Produto",
      "quantity": 3,
      "unitPrice": 30.00,
      "subtotal": 90.00
    }
  ]
}
```

#### Listar pedidos
- **GET** `/orders`
- **Descrição:** Retorna uma lista com todos os pedidos ou filtrados
- **Query Parameters (opcionais):**
  - `customerId` (string): Filtra pedidos por cliente específico
  - `enterpriseId` (string): Filtra pedidos por empresa específica
- **Exemplos:**
  - `GET /orders` - Lista todos os pedidos
  - `GET /orders?customerId=uuid-do-cliente` - Lista pedidos de um cliente
  - `GET /orders?enterpriseId=uuid-da-empresa` - Lista pedidos de uma empresa

#### Buscar pedido por ID
- **GET** `/orders/:id`
- **Descrição:** Retorna os dados de um pedido específico
- **Parâmetros:**
  - `id` (string): ID único do pedido

#### Atualizar pedido
- **Put** `/orders/:id`
- **Descrição:** Atualiza os dados de um pedido existente
- **Parâmetros:**
  - `id` (string): ID único do pedido
- **Corpo da requisição:** Mesma estrutura do POST (campos opcionais)

#### Excluir pedido
- **DELETE** `/orders/:id`
- **Descrição:** Remove um pedido do sistema
- **Parâmetros:**
  - `id` (string): ID único do pedido

---

## 📊 Status dos Pedidos

Os pedidos podem ter os seguintes status:
- `PENDING` - Pendente
- `CONFIRMED` - Confirmado
- `PREPARING` - Em preparação
- `READY` - Pronto
- `DELIVERED` - Entregue
- `CANCELLED` - Cancelado

## 🔧 Validações

### Campos obrigatórios por entidade:

**Empresa:**
- legalName (1-255 caracteres)
- tradeName (1-255 caracteres)
- foundationDate (formato ISO 8601)
- cnpj (14 caracteres)
- address

**Cliente:**
- name (1-255 caracteres)
- email (formato válido)
- phone (1-20 caracteres)
- cpf (14 caracteres)
- address

**Produto:**
- name (1-255 caracteres)
- description
- price (valor decimal com até 2 casas, ≥ 0)
- stock (número inteiro ≥ 0)
- enterpriseId (UUID válido)

**Pedido:**
- orderNumber
- orderDate (formato ISO 8601)
- customerId (UUID válido)
- enterpriseId (UUID válido)
- totalAmount (valor decimal com até 2 casas, ≥ 0)
- items (array com pelo menos um item)

**Item do Pedido:**
- productId (UUID válido)
- productName
- quantity (≥ 1)
- unitPrice (≥ 0)
- subtotal (≥ 0)

## ⚠️ Códigos de Resposta HTTP

- `200` - Sucesso (GET, Put)
- `201` - Criado com sucesso (POST)
- `400` - Dados inválidos
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## 🛡️ Tratamento de Erros

A API retorna respostas estruturadas para erros de validação:

```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

## 📝 Notas Importantes

1. Todos os IDs são UUIDs v4
2. Datas devem estar no formato ISO 8601
3. Valores monetários são armazenados com até 2 casas decimais
4. Uploads de arquivos devem ser enviados como form-data
5. A validação de dados é feita automaticamente em todas as rotas
6. CPF e CNPJ devem conter apenas números (14 dígitos) 