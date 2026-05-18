FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src

EXPOSE 4002

CMD ["npm", "start"]
