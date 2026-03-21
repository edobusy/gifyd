FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/app/.npm \
  npm set cache /app/.npm && \
  npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
