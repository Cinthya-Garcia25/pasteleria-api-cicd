FROM node:22

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

ENV npm_config_build_from_source=true
RUN npm install --production

COPY . .

ENV PORT=80
EXPOSE 80
EXPOSE 6061

CMD ["node", "src/index.js"]