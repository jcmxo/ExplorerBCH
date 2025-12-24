# Dockerfile para desarrollo del frontend Next.js
FROM node:20

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para aprovechar cache de Docker)
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto 3000 (puerto por defecto de Next.js)
EXPOSE 3000

# Comando para desarrollo con hot reload
CMD ["npm", "run", "dev"]

