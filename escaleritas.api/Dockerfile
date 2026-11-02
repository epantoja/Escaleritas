FROM node

WORKDIR /app

COPY package*.json /.

RUN npm install -g ts-node
RUN npm install

# Indicamos que este contenedor se comunica por el puerto 80/tcp
EXPOSE 9010

COPY . .

CMD ["npm","start"]