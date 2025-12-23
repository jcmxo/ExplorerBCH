# Estructura del Proyecto

```
ethereum-event-explorer/
├── src/
│   ├── config/
│   │   ├── database.ts          # Pool de conexiones PostgreSQL
│   │   └── rabbitmq.ts          # Conexión y gestión de RabbitMQ
│   ├── database/
│   │   └── rpc-manager.ts       # Gestión de RPCs con failover
│   └── services/
│       ├── producer.ts          # Producer que divide bloques en chunks
│       ├── consumer.ts          # Consumer worker que procesa mensajes
│       ├── event-processor.ts   # Procesa logs y los almacena
│       └── event-signature-resolver.ts  # Resuelve firmas usando 4byte.directory
│
├── scripts/
│   ├── reset-system.ts          # Reset completo del sistema
│   ├── start-producer.ts        # Iniciar producer
│   ├── start-consumer.ts        # Iniciar consumer
│   ├── add-rpc.ts               # Agregar RPC endpoint
│   ├── init-rpcs.ts              # Inicializar RPCs comunes
│   └── process-token.ts         # Procesar token ERC20 específico
│
├── tests/
│   ├── unit/
│   │   ├── rpc-manager.test.ts
│   │   ├── producer.test.ts
│   │   └── event-processor.test.ts
│   └── integration/
│       └── producer-consumer.test.ts
│
├── migrations/
│   └── schema.sql               # Esquema completo de PostgreSQL
│
├── examples/
│   └── queries.sql              # Queries SQL de ejemplo
│
├── docker-compose.yml           # Servicios: PostgreSQL, RabbitMQ, Backend
├── Dockerfile                   # Imagen del backend
├── package.json                 # Dependencias y scripts
├── tsconfig.json                # Configuración TypeScript
├── jest.config.js               # Configuración de tests
├── env.example                  # Variables de entorno de ejemplo
├── .gitignore
├── .dockerignore
├── README.md                    # Documentación completa
└── PROJECT_STRUCTURE.md         # Este archivo
```

## Flujo de Datos

1. **Producer** → Divide rango de bloques → Envía a RabbitMQ
2. **RabbitMQ** → Cola principal → Retry queue → DLQ
3. **Consumer** → Lee mensaje → Selecciona RPC → `eth_getLogs` → Procesa eventos
4. **EventProcessor** → Resuelve firmas → Almacena en PostgreSQL
5. **RPCManager** → Trackea fallos → Auto-desactiva RPCs problemáticos

## Componentes Clave

### Producer
- Divide `ETHEREUM_START_BLOCK` a `ETHEREUM_END_BLOCK` en chunks de `BLOCKS_PER_MESSAGE`
- Envía mensajes persistentes a RabbitMQ

### Consumer
- Consume de cola principal y retry queue
- Selecciona RPC disponible (menor fail_count)
- Ejecuta `eth_getLogs` para rango de bloques
- Guarda eventos y métricas
- Maneja errores con retry y DLQ

### RPC Manager
- Gestiona múltiples endpoints RPC
- Auto-desactiva RPCs con `fail_count >= RPC_FAIL_THRESHOLD`
- Balancea carga seleccionando RPC con menor fail_count

### Event Signature Resolver
- Resuelve firmas usando API 4byte.directory
- Cache en memoria y base de datos
- Preload de firmas comunes (Transfer, Approval, etc.)

## Base de Datos

### Tablas
- `events`: Eventos extraídos
- `consumer_metrics`: Métricas de procesamiento
- `rpcs`: Configuración de RPCs
- `event_signatures`: Cache de firmas resueltas

## RabbitMQ

### Colas
- `ethereum_blocks_queue`: Cola principal
- `ethereum_blocks_retry`: Reintentos
- `ethereum_blocks_dlq`: Dead letter queue

---

## ✅ Estado del Proyecto

**Proyecto Completado y Funcional**

Toda la estructura descrita en este documento ha sido implementada y está funcionando correctamente. El sistema está listo para procesamiento masivo de eventos de la blockchain de Ethereum.

- ✅ Todos los componentes implementados
- ✅ Arquitectura validada y funcionando
- ✅ Pruebas end-to-end completadas
- ✅ Sistema listo para producción

