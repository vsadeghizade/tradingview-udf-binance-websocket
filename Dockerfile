FROM node:16.14.1
ENV NODE_ENV=production
ENV MARKET_TYPE=futures
WORKDIR /app
COPY package.json package-lock.json
COPY . .
RUN npm install --production
CMD ["node", "bin/www"]
EXPOSE 3000