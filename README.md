# ExplorerBCH 🔍

Explorador de la Blockchain de Bitcoin Cash (BCH) - Una aplicación web para explorar bloques, transacciones y direcciones en la blockchain de Bitcoin Cash.

## Características

- 📊 **Estadísticas en Tiempo Real**: Visualiza estadísticas actuales de la blockchain BCH
- 🔎 **Búsqueda Inteligente**: Busca bloques por altura o hash, transacciones por hash, o direcciones
- 📦 **Detalles de Bloques**: Ver información completa de cualquier bloque incluyendo todas sus transacciones
- 💸 **Información de Transacciones**: Consulta entradas, salidas y detalles completos de transacciones
- 👛 **Seguimiento de Direcciones**: Ver balance, historial de transacciones y estadísticas de direcciones
- 🎨 **Interfaz Moderna**: Diseño responsive y fácil de usar

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

## Instalación

1. Clone el repositorio:
```bash
git clone https://github.com/jcmxo/ExplorerBCH.git
cd ExplorerBCH
```

2. Instale las dependencias:
```bash
npm install
```

## Uso

1. Inicie el servidor:
```bash
npm start
```

2. Abra su navegador web y navegue a:
```
http://localhost:3000
```

3. Use la interfaz web para:
   - Ver estadísticas de la blockchain en la página principal
   - Buscar bloques por número de bloque o hash de bloque
   - Buscar transacciones por hash de transacción
   - Buscar direcciones BCH para ver balance e historial

## Ejemplos de Búsqueda

- **Bloque por altura**: `800000`
- **Bloque por hash**: `000000000000000000a8f3f13c9f44e0d1b5f7d8c9b6e5f4d3c2b1a0f9e8d7c6`
- **Transacción**: `abc123...` (hash completo de transacción)
- **Dirección**: `bitcoincash:qp...` (dirección BCH en formato CashAddr)

## Tecnologías Utilizadas

- **Backend**: Node.js con Express
- **Motor de Plantillas**: EJS
- **API de Blockchain**: Blockchair API
- **Estilos**: CSS personalizado con diseño responsive

## Estructura del Proyecto

```
ExplorerBCH/
├── index.js              # Servidor principal y rutas
├── package.json          # Dependencias y scripts
├── views/               # Plantillas EJS
│   ├── index.ejs        # Página principal
│   ├── block.ejs        # Vista de detalles de bloque
│   ├── transaction.ejs  # Vista de detalles de transacción
│   ├── address.ejs      # Vista de información de dirección
│   └── error.ejs        # Página de error
└── public/              # Archivos estáticos
    └── css/
        └── style.css    # Estilos de la aplicación
```

## API Utilizada

Este explorador utiliza la [Blockchair API](https://blockchair.com/api) para obtener datos de la blockchain de Bitcoin Cash.

## Licencia

ISC

## Autor

jcmxo

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abra un issue o pull request para sugerencias y mejoras.