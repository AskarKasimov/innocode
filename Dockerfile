FROM node:20-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Regenerate the Prisma client (the node_modules volume may predate the current
# schema), then exec the service command. Inlined rather than a shell script so
# it can't be broken by CRLF line endings from a Windows checkout.
ENTRYPOINT ["sh", "-c", "npx prisma generate && exec \"$@\"", "sh"]
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
