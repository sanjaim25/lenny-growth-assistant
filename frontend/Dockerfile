FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate next types and build (optional for dev, but good for prod/checking)
# We will use next dev for simplicity during this phase, or build + start.
# Since it's a take-home, next dev is fine or build + start.
# Let's run `npm run dev` to pick up changes automatically if mounted, 
# but in docker-compose we aren't mounting. We will run dev mode.

CMD ["npm", "run", "dev"]
