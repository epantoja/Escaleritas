# Utiliza una imagen de Node.js como base
FROM node

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de tu proyecto al contenedor (asegúrate de que el archivo package.json está presente)
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install

# Instala Angular CLI globalmente en el contenedor
RUN npm install -g @angular/cli@16.2.0

# Copia el resto de los archivos de tu proyecto al contenedor
COPY . .

# Compila la aplicación Angular (ajusta el comando según tus necesidades)
RUN ng build --configuration=production

CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
