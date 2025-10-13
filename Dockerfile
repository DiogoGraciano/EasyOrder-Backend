FROM node:22-alpine

WORKDIR /usr/src/app

# Instalar netcat para verificação de conectividade
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . .

RUN npm run build

EXPOSE 3000

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

RUN chown -R nestjs:nodejs /usr/src/app

USER nestjs

CMD ["/usr/src/app/docker-entrypoint.sh"]