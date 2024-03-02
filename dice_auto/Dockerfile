FROM node:16
# Install necessary node libs

WORKDIR /site

COPY app.ts /site
COPY tsconfig.json /site
COPY package.json /site
COPY public /site/public
RUN npm install


CMD ["npx", "ts-node", "app.ts"]


EXPOSE 8080
