FROM node:16
# Install necessary node libs

WORKDIR /site

COPY app.ts /site
COPY tsconfig.json /site
COPY package.json /site
COPY public /site/public
RUN npm install
RUN npm install --save @opentelemetry/api
RUN npm install --save @opentelemetry/auto-instrumentations-node

CMD ["npx", "ts-node", "app.ts"]


EXPOSE 8080
