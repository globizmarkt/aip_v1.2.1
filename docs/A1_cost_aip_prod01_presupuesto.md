---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.3.4.1/A_cost_aip_prod01_presupuesto.md
TYPE: PRESUPUESTO — COST-AIP-PROD-01 costes de producción Landing+CRM AIP
STATUS: ACTIVE
TIMESTAMP: 2026-06-10
PRODUCED_BY: Lead Architect [A-04] — despacho A ronda 04.3.4.1
---

## COST-AIP-PROD-01

### 1. FIREBASE — PROYECCIÓN POR ESCENARIO

El plan Blaze (pago por uso) de Firebase cuenta con una capa gratuita generosa que absorbe el impacto en fases tempranas. [cite_start]Dado que la arquitectura de seguridad ya está definida (`firestore.rules` con colecciones `users`, `mandates` y subcolecciones de `documents` fiduciarios)[cite: 25], el coste escalará en función de las lecturas/escrituras y el almacenamiento de documentación KYC/Mandatos.

| Escenario | Auth | Firestore (Reads/Writes) | Storage (Docs/Mandatos) | Hosting (Backend) | Coste Estimado/Mes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bajo** (<100 usuarios/mes) | 0€ (Email/Pass) | 0€ (Dentro de cuota 50k reads/día) | ~0.50€ (<5GB) | [cite_start]0€ (Vercel absorbe Frontend) [cite: 10] | **~0€ - 2€** |
| **Medio** (100-1k usuarios/mes) | 0€ | [cite_start]~2€ - 5€ (Picos de lectura del NewsCache y CRM) [cite: 10] | ~5€ - 10€ (Volumen moderado de PDFs/Imágenes) | 0€ | **~7€ - 15€** |
| **Alto** (>1k usuarios, escalado) | 0€ | ~15€ - 30€ (Operativa fiduciaria continua) | ~20€ - 50€ (Data Rooms, histórico KYC) | ~5€ (Cloud Functions/Triggers) | **~40€ - 85€** |

### 2. VERCEL — HOBBY VS PRO

[cite_start]Actualmente la configuración base está preparada (archivo `vercel.json` estandarizado)[cite: 10]. 

* **Hobby (0€/mes):** Limitado a uso no comercial (estrictamente hablando) y proyectos personales. Carece de soporte para equipos.
* **Pro ($20/mes por asiento, ~19€):** Necesario para despliegues comerciales oficiales, colaboración de múltiples desarrolladores en el mismo dashboard, retención extendida de logs y mayor ancho de banda/tiempo de ejecución de Serverless Functions.
* [cite_start]**Trigger de migración:** Se debe saltar a Pro en el momento en que se conecte el dominio corporativo definitivo para la salida a producción real (comercialización) de la Landing y el CRM de Agentes[cite: 10], o si el equipo de desarrollo requiere cuentas colaborativas simultáneas en el panel de Vercel.

### 3. DOMINIO + SSL + DNS

Para evitar el vendor lock-in y mantener costes eficientes y profesionales:

* **Dominio:** Renovación anual (~15€/año, equivalente a **~1.25€/mes**). Proveedores recomendados: Namecheap o AWS Route53.
* **SSL:** Totalmente gratuito y automatizado a través de Vercel (Let's Encrypt) para todos los dominios personalizados.
* **DNS:** * *Opción A (Recomendada):* AWS Route53 (~0.50€ por zona alojada + 0.40€ por millón de consultas). Altísima disponibilidad, coste mensual **< 1€**.
    * *Opción B:* Cloudflare (Capa gratuita). Ofrece protección DDoS adicional sin coste, pero requiere delegar los nameservers completos.

* **Recomendación:** AWS Route53 para gestión de DNS pura + Vercel gestionando el SSL y la entrega. Coste total mensual: **~2.25€**.

### 4. MONITORING / LOGGING / BACKUPS

Para un entorno de producción que maneja datos de contraparte (CIS/KYC) y mandatos, no se puede depender exclusivamente de la consola en crudo:

* **Firebase Crashlytics / Performance:** Integrado y gratuito. Cubrirá la telemetría básica del cliente.
* **Sentry:** Para tracking de errores en el frontend y edge functions. La capa "Developer" es gratuita. Si se requiere retención mayor o equipo, el coste salta a ~25€/mes. Por ahora, capa gratuita (0€).
* **Backups Firestore:** Crítico por R5 (Persistencia atómica). Automatizar exportaciones diarias a un bucket de Google Cloud Storage. El coste es el almacenamiento puro en frío: ~0.02€/GB. Coste estimado inicial: **~1€ - 3€/mes**.
* **Coste total mínimo de herramientas:** **~3€/mes** (mayormente backups de la bóveda de datos).

### 5. RESUMEN MENSUAL POR ESCENARIO

Integrando los servicios de infraestructura fiduciaria frente a la arquitectura actual:

| Componente | Bajo (Lanzamiento) | Medio (Crecimiento) | Alto (Escalado) |
| :--- | :--- | :--- | :--- |
| **Firebase (Blaze)** | 2.00 € | 15.00 € | 85.00 € |
| **Vercel** | 19.00 € (Pro, 1 dev) | 38.00 € (Pro, 2 devs) | 38.00 € (Pro, 2 devs) |
| **Dominio + DNS** | 2.25 € | 2.25 € | 5.00 € |
| **Monitoring/Backups** | 3.00 € | 10.00 € | 35.00 € (Sentry Team + Backups) |
| **TOTAL ESTIMADO** | **~26.25 € / mes** | **~65.25 € / mes** | **~163.00 € / mes** |

### 6. RECOMENDACIÓN PARA FASE ACTUAL DE AIP

[cite_start]Dado que el material CIFI-AIP (prototipos sin código, AppSheet, tope <50€/mes) ha sido relegado a "IGNORADO" bajo la regla R-ARQ-01 y AIP_v1.2.1 ya cuenta con Firebase Auth operativo y Firestore Rules de Zero-Trust desplegadas[cite: 10, 25]:

**Aplica el Escenario: BAJO (Lanzamiento) — ~26.25 € / mes.**

[cite_start]**Justificación:** La Fase 0.2 actual se centra en dejar la web operativa integrando Landing, CRM y motores de noticias[cite: 10]. En este periodo de Semanas 1 a 4, el tráfico real será mínimo. No se superarán los límites gratuitos de lectura de Firestore ni el ancho de banda base. El coste real se derivará exclusivamente de la licencia obligatoria Vercel Pro (~19€) para habilitar el uso comercial corporativo, prorrateo del dominio y micro-costes de copias de seguridad de Firestore. Es una infraestructura infinitamente superior al límite anterior de 50€, manteniéndose muy por debajo de esa barrera presupuestaria durante los primeros meses operativos.

```
