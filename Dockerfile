# Dockerfile para orcament-cmv (Bun + Node + WhatsApp Web.js)
FROM oven/bun:1.1.13 AS base

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos do projeto
COPY . .

# Instala as dependências
RUN bun install

# Porta padrão do backend/socket
EXPOSE 3000
EXPOSE 3001

# Comando para rodar o servidor (ajuste conforme seu entrypoint)
CMD ["bun", "run", "src/server.ts"]
