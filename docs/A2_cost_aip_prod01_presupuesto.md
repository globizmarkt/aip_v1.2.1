---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.3.4.1/A_cost_aip_prod01_presupuesto.md
TYPE: PRESUPUESTO — COST-AIP-PROD-01 costes de producción Landing+CRM AIP
STATUS: ACTIVE
TIMESTAMP: 2026-06-10
PRODUCED_BY: Bulldozer (br) [A-02] — despacho A ronda 04.3.4.1
---

## COST-AIP-PROD-01

### 1. FIREBASE — PROYECCIÓN POR ESCENARIO

**Contexto técnico:** AIP_v1.2.1 está en plan Blaze (pago por uso). El archivo `firestore.rules` implementa un modelo Zero-Trust con funciones auxiliares (`isMandateMember`, `mandateExists`) que utilizan `get()` y `exists()`. **Cada llamada a `get()`/`exists()` dentro de una regla cuenta como 1 lectura de documento** en la facturación de Firestore. Esto es el principal driver de coste a nivel de base de datos, no la escritura.

| Concepto Facturable | Escenario Bajo (<100 usr/mes) | Escenario Medio (100-1k usr/mes) | Escenario Alto (>1k usr/mes) |
| :--- | :--- | :--- | :--- |
| **Authentication** (Login/Registro) | <5k eventos/mes → **0,00 €** *(Franquicia 50k)* | ~20k eventos/mes → **0,00 €** | ~100k eventos/mes → **0,54 €** |
| **Firestore Reads** (Docs + Rules `get()`) | ~50k lecturas → **0,00 €** *(Franquicia 50k)* | ~400k lecturas → **1,02 €** | ~3M lecturas → **7,66 €** |
| **Firestore Writes** (Creación usuarios/docs) | <5k escrituras → **0,00 €** *(Franquicia 20k)* | ~30k escrituras → **0,36 €** | ~200k escrituras → **2,44 €** |
| **Firestore Storage** (PDFs, docs fiduciarios) | <0,5 GB → **0,00 €** *(Franquicia 1 GB)* | ~5 GB → **0,46 €** | ~50 GB → **4,60 €** |
| **Firestore Delete** | Insignificante → **0,00 €** | Insignificante → **0,00 €** | ~10k → **0,02 €** |
| **Hosting Firebase** (Solo si se usa como CDN) | No usado (se usa Vercel) → **0,00 €** | No usado → **0,00 €** | No usado → **0,00 €** |
| **TOTAL FIREBASE** | **~0,00 € / mes** | **~1,84 € / mes** | **~15,26 € / mes** |

*(Nota: El escenario Alto asume replicación multi-región, que duplica el coste de almacenamiento frente a una sola región. Las cifras reflejan esto. Precios basados en tarifas Firebase Blaze US-Central1/EU-West1 2026).*

### 2. VERCEL — HOBBY VS PRO

**Estado actual:** `vercel.json` es minimalista (`{"version": 2}`). La configuración por defecto de Vercel para repositorios con `src/` suele requerir ajustes de Build Command (ej. `npm run build` con outdir correcto) en el dashboard, pero no afecta a la capa de precio.

| Característica | Hobby (Gratis) | Pro (20$/mes ≈ 18,50€) |
| :--- | :--- | :--- |
| **Ancho de banda** | 100 GB | 1 TB |
| **Ejecuciones Serverless** | Limitado (no garantizado para pico) | Garantizado |
| **Construcciones (CI/CD)** | 6000 min/mes (1 en cola) | 6000 min/mes (3 en cola) |
| **Branding** | Banner "Powered by Vercel" en errores 404 | 100% White-label |
| **Password Protection** | No (AIP lo hace vía Firebase Auth) | Sí (a nivel de edge) |

**¿Cuándo dar el salto a Pro?**
El salto a Pro no se justifica técnicamente en la fase actual por tráfico (100GB de ancho de banda dan para cientos de miles de visitas de texto/CRM ligero). El único trigger válido para AIP en el corto plazo es **eliminar el branding de Vercel** si Javier requiere que la web corporativa parezca 100% propia incluso en páginas de error, o si se necesitan despliegues en paralelo frecuentes por agente múltiples. *Recomendación: mantener Hobby hasta superar los 80GB de bandwidth o requerir white-label estricto.*

### 3. DOMINIO + SSL + DNS

No hay ataduras técnicas a Cloudflare. La recomendación se basa en minimizar la fricción de configuración (que es tiempo facturable de Sentinel/Carlos).

| Proveedor / Opción | Coste Año | Coste Mes | Ventaja / Desventaja |
| :--- | :--- | :--- | :--- |
| **Vercel Domains** (Recomendado) | ~15-20 € | ~1,50 € | Cero fricción. Se compra desde el dashboard de Vercel, SSL automático, DNS gestionado. Ahorra 1-2h de trabajo. |
| **Cloudflare Registrar** | ~10-12 € | ~1,00 € | El más barato. Requiere apuntar nameservers manualmente y esperar propagación. |
| **Google Domains** (Squarespace) | ~12-15 € | ~1,25 € | Interfaz limpia, pero no añade valor real sobre Vercel. |

*Recomendación:* Comprar directamente desde Vercel si el dominio es nuevo. Si ya está comprado en otro lado, usar Cloudflare como DNS para gestión centralizada. SSL es gratuito en todos los escenarios.

### 4. MONITORING / LOGGING / BACKUPS

En producción seria, no se puede operar a ciegas. AIP_v1.2.1 necesita estas capas:

| Herramienta | Propósito | Coste | Implementación |
| :--- | :--- | :--- | :--- |
| **Firebase Crashlytics** | Crash reporting en interfaz `src/03-interface` | **0,00 €** | SDK incluido en cliente. Requiere despliegue. |
| **Firebase Performance** | Latencia de llamadas a Firestore/Auth | **0,00 €** | Requiere activar traces manualmente en código. |
| **Sentry (Free Tier)** | Captura de errores JS en tiempo real, stack traces | **0,00 €** (hasta 5k eventos/mes) | Suficiente para Escenario Bajo y Medio. |
| **Backups Firestore** | Recuperación ante borrado masivo o corrupción lógica | **0,00 €** | **Importante:** Firestore ya incluye *Point-in-Time Recovery* (PITR) gratuito de 30 días. Para exportar a bucket de GCS (backup externo), se puede programar un Cloud Function mensual (coste GCS <0,50€/mes). |

### 5. RESUMEN MENSUAL POR ESCENARIO

| Concepto | Escenario Bajo | Escenario Medio | Escenario Alto |
| :--- | :--- | :--- | :--- |
| **Firebase (Blaze)** | 0,00 € | 1,84 € | 15,26 € |
| **Vercel** | 0,00 € | 0,00 € | 18,50 € *(Salto a Pro)* |
| **Dominio (Amortizado)** | 1,50 € | 1,50 € | 1,50 € |
| **Monitoring / Backups** | 0,00 € | 0,00 € | 0,50 € |
| **TOTAL MENSUAL** | **~1,50 € / mes** | **~3,34 € / mes** | **~35,76 € / mes** |

*(Nota: El escenario Medio contempla mantener Vercel Hobby. Si se obliga a pasar a Pro por tema de white-label, el Medio sube a ~21,84 €/mes).*

### 6. RECOMENDACIÓN PARA FASE ACTUAL DE AIP

**Escenario que aplica hoy:** **BAJO (<100 usuarios/mes)**.

**Justificación operativa:**
1. AIP sale del prototipo, pero el tráfico inicial es estrictamente la red interna de Javier, Roberto y los primeros agentes. La carga de Firestore será mínima.
2. Las reglas de seguridad actuales (`firestore.rules`) están bien diseñadas (fail-closed, actualización bloqueada al cliente), lo que mitiga el riesgo de ataques de amplificación que disparen la facturación de lecturas.
3. Vercel Hobby soporta el tráfico de lanzamiento sin degradación. Los 100GB de ancho de banda son infinitos para una Landing + CRM de texto y PDFs ligeros.
4. **El coste de infraestructura real de AIP en producción es residual (< 2€/mes).** El techo de <50€/mes del antiguo prototipo CIFI-AIP se supera con creces en capacidad, pero el *coste de ejecución* es drásticamente inferior gracias al stack serverless.

**Acción inmediata para el Director:** Aprobar este marco de costes para insertarlo en la Sección 3 del documento `PRESUPUESTO OPERATIVO WEB AIP - JAVIER.md`. El foco financiero de AIP debe desplazarse desde la infraestructura (resuelta y casi gratuita) hacia las horas de ejecución de los Bloques B y C (CRM Agentes y Noticias), que son el verdadero cuello de botella para declarar la web "operativa".
