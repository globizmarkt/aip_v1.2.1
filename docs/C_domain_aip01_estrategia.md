---
METAFAC_VER: 0.6.0
GEO_LOC: 03_INBOX/.../despachos_04.3.4.1/C_domain_aip01_estrategia.md
TYPE: INFRAESTRUCTURA — DOMAIN-AIP-01 estrategia de dominio producción
STATUS: ACTIVE
TIMESTAMP: 2026-06-10
PRODUCED_BY: Perplexity [A-14] — despacho C ronda 04.3.4.1
---

## DOMAIN-AIP-01

### 1. RECOMENDACIÓN DE EXTENSIÓN

La extensión recomendada es **.com**, con el dominio principal reservado para la marca institucional y una arquitectura de subdominios para funciones operativas separadas. Para un actor financiero institucional, `.com` sigue siendo el estándar más reconocible y confiable para usuarios, contrapartes y validaciones externas, y además encaja mejor con una presencia corporativa de producción que un dominio experimental o geográfico. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

La implementación recomendada es usar el apex `aip.com` solo si la marca y la disponibilidad lo permiten; en caso contrario, registrar una variante corporativa limpia bajo `.com` y hacer de ella el dominio canónico. Vercel admite dominios apex mediante registros A y subdominios mediante CNAME, y también recomienda añadir y gestionar el dominio desde el panel del proyecto. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

### 2. ARQUITECTURA DE SUBDOMINIOS

| Subdominio | Módulo AIP_v1.2.1 | Fase de activación |
|---|---|---|
| `www.dominio.com` | Landing pública vinculada a `landing/` y al `index.html` raíz | Activación inmediata como entrada pública principal  [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain) |
| `crm.dominio.com` | CRM de agentes en gadgets de `aip-crm-home.js` | Activación cuando el CRM esté publicado y conectado a auth/datos |
| `docs.dominio.com` | Documentación operativa y compliance | Activación cuando exista corpus estable de compliance y material regulatorio |
| `auth.dominio.com` | Flujos Firebase Auth / handler / email domain | Activación al configurar dominios autorizados y callback de auth  [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain) |
| `status.dominio.com` | Estado operativo / incidencias / mantenimiento | Activación opcional para transparencia operativa institucional |

La asignación real del repositorio apunta a una separación clara: `landing/` está vacía y pendiente de la entrega 04.5.1-C, mientras que el CRM de agentes vive en gadgets de `aip-crm-home.js`, así que la arquitectura de subdominios debe reflejar esa madurez asimétrica. Dado que `vercel.json` ya existe con versión 2 y `firebase.json` solo fija reglas de Firestore, la estrategia más limpia es mantener Vercel como capa de frontend/dominio público y Firebase como backend de identidad y datos. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/6c3cf5b1-a841-4b15-8e54-6581659c6781/2026-05-25_VIBEORGANISM_CARRIL-FULL.md?AWSAccessKeyId=ASIA2F3EMEYE7OZENGOD&Signature=dXBUmRc4L9T56KWfKkRhuCfUE%2BY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIQDqLahVx1PR40gImOgWhYKaUIUCksqPwHpRT%2FEXLTRuLAIgWotGjCaL%2FzN1xJaMArVeXrAZCfCMDgCnJsInKPD6rnYq%2FAQI6P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDCBOwlO4rKr0vDR2HyrQBEIsfubV53x9W%2FLu9gu11VKoRzYgw4Oc1U1GJ3%2FBJZrx9S6ZpgImdyE9Ds0T5KKZGpKc3sm%2BjksEsOZL%2BoudtVBTahyVvg%2FpJOpztcH%2BPw6a4mhF6c%2B%2FL%2FoOK1A3bDepoBVJ64dsdDOtKBdDIcYDhFHDWmADzP1xPAEcaWIGLw%2FmSOcVsxW%2FHyE98%2FpSXPw667wk3qYvXmeV1gxwoyML1xnfCfx5CxEaxfJgZBKysLmQ3t4gIOi0o0dW25bteR2hjxTNpsUwbdHn5GPYcVEn%2Fhda4d1tOUoszf0T0Ck%2F%2BkWUJMd1Oa3koNGFeRd5cCRhPErDQ2UH2j96Uhqt4hoRkgYsFG9MjVM2eClsfwWzaNl2lEGx3V8p4sVoPAa6unJ3GM3O6%2FdjOiQOTSfaC4m9AJVrEE4HQYWJ9PVs0zLsVsPMKxp%2BVG0xFo87nXD1xHrf3w%2Bvt7woQRfAjtmSGamYovuSHzdbXsvhLOt3BIe4HrEXfooAkBUBgxjCwyGWi9VtbQdPUsJRuQtPTV8caUDr8u5dWRTf9ZtpPLDzhhIWyGudZrMWZacmiYkxmRLx%2FS%2FE7HlAVg75yZgryvXTTHdEvCmJ3hlQb1yXJelRBTskhoaECAl28jdfteUH0etTIn4HUPkoo82c2lpzGkIHe%2BF7KhIzLWn%2FAqb8nsebaBaIeQNLK1BWHkcg0riMyLKCZY1MjD%2F3YN9gKDm5WVQA%2Fe4WVHyByPv42PejjjZlgm3kpQRBFeVv5J0fv6VBVrQS5KpY4pwU%2B2STJFpLr68tA2d6ruMw9%2Byl0QY6mAHXqEB%2BQ4QGMYtF7Y%2F8E4SldfQ4bEE7JHUglsi26UqdokKEappn5%2B23vIWfegqHNDKq3ya0I394zZ2iJG1DWqhqPWiwLAWwl1gjzd19KnrIoaUQDJDY6BDm96w6PnPgi0DPmvQ99gb1HAohm12RzHuB2uaPOKcFt37geEv0e5GxW%2BCyVvzLyXS1j5I93yXSulfoQID2cZ5wHg%3D%3D&Expires=1781105738)

### 3. CHECKLIST DE REGISTRO Y CONFIGURACIÓN

1. Registrar el dominio principal en un **registrador corporativo fiable** con gestión DNS completa, bloqueo de transferencia y privacidad WHOIS activa si está disponible; la privacidad de dominio reduce exposición de datos del registrante. [nic](https://www.nic.st/whois-privacy)
2. Reservar el dominio principal bajo `.com` y crear variantes defensivas si la marca lo requiere, para evitar typosquatting y duplicidad de identidad.
3. En Vercel, añadir el dominio desde **Project Settings → Domains**; para apex usar A, y para subdominios usar CNAME. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
4. Configurar `www` como subdominio principal o redirigido al apex, ya que Vercel soporta redirección y manejo explícito de ambos. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
5. En Firebase Authentication, añadir el dominio a los **authorized domains** y actualizar el dominio personalizado en plantillas de email y callback de auth. [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain)
6. Verificar que el `authDomain` de la app apunte al dominio personalizado y no a los dominios por defecto de Firebase, para evitar roturas en login y enlaces de correo. [cloud.google](https://cloud.google.com/identity-platform/docs/show-custom-domain)
7. Mantener `firebase.json` alineado con cualquier rewrite o ruta de hosting que el flujo de auth requiera; aunque el archivo actual solo muestra Firestore rules, la configuración de hosting debe consolidarse cuando el frontend publique rutas reales. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/7f78121b-a6f4-4777-9ee2-2c240ee8d295/2026-05-25_PLANT_BOOTLOADER_v2.6.md?AWSAccessKeyId=ASIA2F3EMEYE7OZENGOD&Signature=9BU022LcNhmEYsNzfALV0LQ0ztA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIQDqLahVx1PR40gImOgWhYKaUIUCksqPwHpRT%2FEXLTRuLAIgWotGjCaL%2FzN1xJaMArVeXrAZCfCMDgCnJsInKPD6rnYq%2FAQI6P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDCBOwlO4rKr0vDR2HyrQBEIsfubV53x9W%2FLu9gu11VKoRzYgw4Oc1U1GJ3%2FBJZrx9S6ZpgImdyE9Ds0T5KKZGpKc3sm%2BjksEsOZL%2BoudtVBTahyVvg%2FpJOpztcH%2BPw6a4mhF6c%2B%2FL%2FoOK1A3bDepoBVJ64dsdDOtKBdDIcYDhFHDWmADzP1xPAEcaWIGLw%2FmSOcVsxW%2FHyE98%2FpSXPw667wk3qYvXmeV1gxwoyML1xnfCfx5CxEaxfJgZBKysLmQ3t4gIOi0o0dW25bteR2hjxTNpsUwbdHn5GPYcVEn%2Fhda4d1tOUoszf0T0Ck%2F%2BkWUJMd1Oa3koNGFeRd5cCRhPErDQ2UH2j96Uhqt4hoRkgYsFG9MjVM2eClsfwWzaNl2lEGx3V8p4sVoPAa6unJ3GM3O6%2FdjOiQOTSfaC4m9AJVrEE4HQYWJ9PVs0zLsVsPMKxp%2BVG0xFo87nXD1xHrf3w%2Bvt7woQRfAjtmSGamYovuSHzdbXsvhLOt3BIe4HrEXfooAkBUBgxjCwyGWi9VtbQdPUsJRuQtPTV8caUDr8u5dWRTf9ZtpPLDzhhIWyGudZrMWZacmiYkxmRLx%2FS%2FE7HlAVg75yZgryvXTTHdEvCmJ3hlQb1yXJelRBTskhoaECAl28jdfteUH0etTIn4HUPkoo82c2lpzGkIHe%2BF7KhIzLWn%2FAqb8nsebaBaIeQNLK1BWHkcg0riMyLKCZY1MjD%2F3YN9gKDm5WVQA%2Fe4WVHyByPv42PejjjZlgm3kpQRBFeVv5J0fv6VBVrQS5KpY4pwU%2B2STJFpLr68tA2d6ruMw9%2Byl0QY6mAHXqEB%2BQ4QGMYtF7Y%2F8E4SldfQ4bEE7JHUglsi26UqdokKEappn5%2B23vIWfegqHNDKq3ya0I394zZ2iJG1DWqhqPWiwLAWwl1gjzd19KnrIoaUQDJDY6BDm96w6PnPgi0DPmvQ99gb1HAohm12RzHuB2uaPOKcFt37geEv0e5GxW%2BCyVvzLyXS1j5I93yXSulfoQID2cZ5wHg%3D%3D&Expires=1781105738)
8. Emitir SSL/TLS por el proveedor de hosting y forzar HTTPS; Vercel gestiona certificados automáticamente tras la verificación del dominio. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
9. Validar propagación DNS y estado de verificación antes de cambiar el dominio canónico de producción.
10. Cerrar con smoke test de tres rutas: landing pública, CRM de agentes y auth/email de recuperación, para confirmar que el dominio resuelve todo el flujo institucional sin depender de URLs legacy.

**Conclusión operativa:** para AIP en producción, el patrón correcto es **marca `.com` + `www` público + `crm` separado + `docs` de compliance + `auth` dedicado**, con Vercel resolviendo el frontend y Firebase sosteniendo identidad y datos. 

**Seguimientos:**

1. Checklist: auditoría técnica de DNS para despliegue de AIP (Vercel/Firebase) — evita fallos de propagación y errores de seguridad
2. Plan de migración: mueve tu AIP de entorno de pruebas a producción — configuración de registros, seguridad OAuth y validación HTTPS
3. Implementación de subdominios en Vercel para Firebase Auth
4. Configuración de registros A y CNAME para dominios apex en Vercel
5. Estrategia de despliegue para el módulo de CRM en producción
## DOMAIN-AIP-01

### 1. RECOMENDACIÓN DE EXTENSIÓN

La extensión recomendada es **.com** como dominio principal institucional. Vercel documenta soporte directo para dominios apex y subdominios, y `.com` es la opción más estándar para una entidad financiera que busca confianza, recordación y compatibilidad operativa. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

Para AIP en producción, la estrategia más sólida es reservar el dominio principal en `.com` y usarlo como raíz canónica, con redirección controlada desde `www` si hace falta. Si el nombre exacto no está disponible, conviene una variante corporativa igualmente limpia bajo `.com` antes que saltar a extensiones menos neutrales para banca/institucionalidad. [cloudflare](https://www.cloudflare.com/learning/dns/what-is-domain-privacy/)

### 2. ARQUITECTURA DE SUBDOMINIOS

| Subdominio | Módulo AIP_v1.2.1 | Fase de activación |
|---|---|---|
| `www.dominio.com` | Landing pública en `landing/` + `index.html` raíz | Inmediata, como entrada principal pública  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/6c3cf5b1-a841-4b15-8e54-6581659c6781/2026-05-25_VIBEORGANISM_CARRIL-FULL.md?AWSAccessKeyId=ASIA2F3EMEYEYNZYWQYU&Signature=vlwlB%2FGZkJk%2BguWrpY%2BVUAsUwQk%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIDs5POnVCwmnKaUC8TjjeqSrZZWhXrxmOzWRWrqI9hzCAiEApLQEOg5S5HW8xIknymNj7b7YkSUrnvwOPEhcw%2BY6fSgq%2FAQI6P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDNChYKErulMgM61S%2FyrQBCJP8VWsJXSoJkwpByYNOLLg5gntyzA%2BhP8VOxTZbvhl65qGUovYlj6L57%2BaxzXNQSLwP1yNRM5JqZdqq8HfQB9C4gMCntUfoiBZB8L9YemW1Gl2bbckN6cgFXv4Sal1uDEDOQyX1JFlYUzORc8tWV5y%2BNVMTqpVBvXScPut6avecB2QD%2FLUV1BTZ9JR1G5k3XuTjXmUvEE8spxwK6%2FvtSdCJmFFLHpjYTUnixGBCh5xQuy7UoN0cj3Jhja9nCxR0xx06bN7OmD3IBiUrbjJS1CB1X4TtShrPOsYhRvTJb%2F7mgNuWngijP7yEBvgfjnhs5tjfTzqgPOpH6mWEHqdwDrG2ZY9YMWGjhgbPKb4WWuU8aK1GF1ZG1qXU17gvOiQ3FCJX5pJTbSTcHc19yaQx%2FeerKSzwas01MuDOqPUM1w%2BBRZ7SPl%2FkwFQiObYZ2WDg%2FgkoVUxTsoH2mB7ECaehsJJdbMn2UoZz3WPg8cWCtqxlOaGwYvr%2FYk%2BdmNzrJb63CzboNISyIGCYpQEWDOSvWvfIoOncGKxfXaF%2B5Jq3%2FQ2SKp%2FcCO%2BFB4tLhUf8SKykRnGe6q9jfpGs6N8tqQivi6ieZP7uhBGWtZh9DoEotekbQXPzJSTO43BflKiqm%2Fc68hYsRA9vSIBH0at6xtgpqyEXZ%2B4LlwtQogDYtkLrUr7I499zVogf2rAniLJAUg2WFvcSlSNVso2I7Y3XGRttUdBtsKwHRuali3aVFx7ZadAXCH5RMmNG2h8JEpEVTwcuW1B3084w%2FSIVVXFiZIpRwQw9%2FGl0QY6mAGIQJKJH8%2FoNl2GSVZ41nQ2V4lf9Av%2Boxfkgt4if73bFOjcH6LQVfto4lAlJJJqPGcEDf436HwTJy8Q1y9MZnObWfYA7Q7WFg746TA5%2FZaZekquObDbN24BVsfRtRHctFtdCezI7LXhTcBGXWELa7XvZb3YN9jCDKnAI8kEGHpiZo2QSMuzO6OXkT%2BWDbdBK8pog6Od1cmCCg%3D%3D&Expires=1781106378) |
| `crm.dominio.com` | CRM de agentes en gadgets de `aip-crm-home.js` | Cuando el CRM esté enlazado con auth y datos de producción  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/6c3cf5b1-a841-4b15-8e54-6581659c6781/2026-05-25_VIBEORGANISM_CARRIL-FULL.md?AWSAccessKeyId=ASIA2F3EMEYEYNZYWQYU&Signature=vlwlB%2FGZkJk%2BguWrpY%2BVUAsUwQk%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIDs5POnVCwmnKaUC8TjjeqSrZZWhXrxmOzWRWrqI9hzCAiEApLQEOg5S5HW8xIknymNj7b7YkSUrnvwOPEhcw%2BY6fSgq%2FAQI6P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDNChYKErulMgM61S%2FyrQBCJP8VWsJXSoJkwpByYNOLLg5gntyzA%2BhP8VOxTZbvhl65qGUovYlj6L57%2BaxzXNQSLwP1yNRM5JqZdqq8HfQB9C4gMCntUfoiBZB8L9YemW1Gl2bbckN6cgFXv4Sal1uDEDOQyX1JFlYUzORc8tWV5y%2BNVMTqpVBvXScPut6avecB2QD%2FLUV1BTZ9JR1G5k3XuTjXmUvEE8spxwK6%2FvtSdCJmFFLHpjYTUnixGBCh5xQuy7UoN0cj3Jhja9nCxR0xx06bN7OmD3IBiUrbjJS1CB1X4TtShrPOsYhRvTJb%2F7mgNuWngijP7yEBvgfjnhs5tjfTzqgPOpH6mWEHqdwDrG2ZY9YMWGjhgbPKb4WWuU8aK1GF1ZG1qXU17gvOiQ3FCJX5pJTbSTcHc19yaQx%2FeerKSzwas01MuDOqPUM1w%2BBRZ7SPl%2FkwFQiObYZ2WDg%2FgkoVUxTsoH2mB7ECaehsJJdbMn2UoZz3WPg8cWCtqxlOaGwYvr%2FYk%2BdmNzrJb63CzboNISyIGCYpQEWDOSvWvfIoOncGKxfXaF%2B5Jq3%2FQ2SKp%2FcCO%2BFB4tLhUf8SKykRnGe6q9jfpGs6N8tqQivi6ieZP7uhBGWtZh9DoEotekbQXPzJSTO43BflKiqm%2Fc68hYsRA9vSIBH0at6xtgpqyEXZ%2B4LlwtQogDYtkLrUr7I499zVogf2rAniLJAUg2WFvcSlSNVso2I7Y3XGRttUdBtsKwHRuali3aVFx7ZadAXCH5RMmNG2h8JEpEVTwcuW1B3084w%2FSIVVXFiZIpRwQw9%2FGl0QY6mAGIQJKJH8%2FoNl2GSVZ41nQ2V4lf9Av%2Boxfkgt4if73bFOjcH6LQVfto4lAlJJJqPGcEDf436HwTJy8Q1y9MZnObWfYA7Q7WFg746TA5%2FZaZekquObDbN24BVsfRtRHctFtdCezI7LXhTcBGXWELa7XvZb3YN9jCDKnAI8kEGHpiZo2QSMuzO6OXkT%2BWDbdBK8pog6Od1cmCCg%3D%3D&Expires=1781106378) |
| `docs.dominio.com` | Documentación operativa, compliance y uso institucional | Cuando exista corpus estable de compliance y versiones controladas |
| `auth.dominio.com` | Firebase Auth, email templates y callbacks OAuth | Cuando el dominio esté autorizado en Firebase y el OAuth esté actualizado  [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain) |
| `status.dominio.com` | Estado operativo, incidencias y mantenimiento | Opcional, para transparencia y soporte institucional |

La lectura de los artefactos apunta a una separación natural: `landing/` está vacía y pendiente, mientras el CRM ya existe como lógica de agente; por eso el dominio no debe mezclar superficies todavía inmaduras con áreas funcionales. `vercel.json` está en versión 2, y `firebase.json` solo fija reglas de Firestore, así que la capa pública debe quedar en Vercel y la identidad/datos en Firebase. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/13db12b0-065b-4391-954c-2d58dcddf8c4/01_PERPLEXITY_BOVEDA_IMPA.md?AWSAccessKeyId=ASIA2F3EMEYEYNZYWQYU&Signature=K72zkZpUxANZLzaXpmnSQfmMc0Q%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIDs5POnVCwmnKaUC8TjjeqSrZZWhXrxmOzWRWrqI9hzCAiEApLQEOg5S5HW8xIknymNj7b7YkSUrnvwOPEhcw%2BY6fSgq%2FAQI6P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDNChYKErulMgM61S%2FyrQBCJP8VWsJXSoJkwpByYNOLLg5gntyzA%2BhP8VOxTZbvhl65qGUovYlj6L57%2BaxzXNQSLwP1yNRM5JqZdqq8HfQB9C4gMCntUfoiBZB8L9YemW1Gl2bbckN6cgFXv4Sal1uDEDOQyX1JFlYUzORc8tWV5y%2BNVMTqpVBvXScPut6avecB2QD%2FLUV1BTZ9JR1G5k3XuTjXmUvEE8spxwK6%2FvtSdCJmFFLHpjYTUnixGBCh5xQuy7UoN0cj3Jhja9nCxR0xx06bN7OmD3IBiUrbjJS1CB1X4TtShrPOsYhRvTJb%2F7mgNuWngijP7yEBvgfjnhs5tjfTzqgPOpH6mWEHqdwDrG2ZY9YMWGjhgbPKb4WWuU8aK1GF1ZG1qXU17gvOiQ3FCJX5pJTbSTcHc19yaQx%2FeerKSzwas01MuDOqPUM1w%2BBRZ7SPl%2FkwFQiObYZ2WDg%2FgkoVUxTsoH2mB7ECaehsJJdbMn2UoZz3WPg8cWCtqxlOaGwYvr%2FYk%2BdmNzrJb63CzboNISyIGCYpQEWDOSvWvfIoOncGKxfXaF%2B5Jq3%2FQ2SKp%2FcCO%2BFB4tLhUf8SKykRnGe6q9jfpGs6N8tqQivi6ieZP7uhBGWtZh9DoEotekbQXPzJSTO43BflKiqm%2Fc68hYsRA9vSIBH0at6xtgpqyEXZ%2B4LlwtQogDYtkLrUr7I499zVogf2rAniLJAUg2WFvcSlSNVso2I7Y3XGRttUdBtsKwHRuali3aVFx7ZadAXCH5RMmNG2h8JEpEVTwcuW1B3084w%2FSIVVXFiZIpRwQw9%2FGl0QY6mAGIQJKJH8%2FoNl2GSVZ41nQ2V4lf9Av%2Boxfkgt4if73bFOjcH6LQVfto4lAlJJJqPGcEDf436HwTJy8Q1y9MZnObWfYA7Q7WFg746TA5%2FZaZekquObDbN24BVsfRtRHctFtdCezI7LXhTcBGXWELa7XvZb3YN9jCDKnAI8kEGHpiZo2QSMuzO6OXkT%2BWDbdBK8pog6Od1cmCCg%3D%3D&Expires=1781106378)

### 3. CHECKLIST DE REGISTRO Y CONFIGURACIÓN

1. Registrar el dominio principal bajo `.com` en un registrador serio con control DNS completo, bloqueo de transferencia y privacidad WHOIS cuando esté disponible. [cloudflare](https://www.cloudflare.com/learning/dns/what-is-domain-privacy/)
2. Definir el apex como dominio canónico y reservar variantes defensivas para evitar typosquatting y conflictos de marca.
3. En Vercel, añadir el dominio en el panel del proyecto; para apex usar **A records** y para subdominios usar **CNAME**. [vercel](https://vercel.com/docs/domains/set-up-custom-domain)
4. Configurar `www` como alias o redirección al apex, según la política de marca.
5. En Firebase, añadir el dominio a **Authorized domains** y actualizar las plantillas de email con el dominio personalizado. [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain)
6. En el OAuth de Google/Firebase, registrar el origen JavaScript y los redirect URIs con `https://` y la ruta de handler correspondiente. [medium](https://medium.com/@citi_zen/quick-guide-setting-up-google-oauth2-login-with-a-custom-domain-in-firebase-auth-fc86c328682d)
7. Verificar que la app use el `authDomain` nuevo y no el dominio por defecto de Firebase, para evitar roturas en login y recuperación de cuenta. [medium](https://medium.com/@citi_zen/quick-guide-setting-up-google-oauth2-login-with-a-custom-domain-in-firebase-auth-fc86c328682d)
8. Mantener el frontend alojado en Vercel y el backend de identidad/datos en Firebase; si más adelante hay rewrites o rutas de auth, consolidarlas en `firebase.json` y no improvisar en cliente. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/7f78121b-a6f4-4777-9ee2-2c240ee8d295/2026-05-25_PLANT_BOOTLOADER_v2.6.md?AWSAccessKeyId=ASIA2F3EMEYEYNZYWQYU&Signature=dU9op%2FuFJSm19s%2FyvVimDnB3D%2Fo%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIDs5POnVCwmnKaUC8TjjeqSrZZWhXrxmOzWRWrqI9hzCAiEApLQEOg5S5HW8xIknymNj7b7YkSUrnvwOPEhcw%2BY6fSgq%2FAQI6P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDNChYKErulMgM61S%2FyrQBCJP8VWsJXSoJkwpByYNOLLg5gntyzA%2BhP8VOxTZbvhl65qGUovYlj6L57%2BaxzXNQSLwP1yNRM5JqZdqq8HfQB9C4gMCntUfoiBZB8L9YemW1Gl2bbckN6cgFXv4Sal1uDEDOQyX1JFlYUzORc8tWV5y%2BNVMTqpVBvXScPut6avecB2QD%2FLUV1BTZ9JR1G5k3XuTjXmUvEE8spxwK6%2FvtSdCJmFFLHpjYTUnixGBCh5xQuy7UoN0cj3Jhja9nCxR0xx06bN7OmD3IBiUrbjJS1CB1X4TtShrPOsYhRvTJb%2F7mgNuWngijP7yEBvgfjnhs5tjfTzqgPOpH6mWEHqdwDrG2ZY9YMWGjhgbPKb4WWuU8aK1GF1ZG1qXU17gvOiQ3FCJX5pJTbSTcHc19yaQx%2FeerKSzwas01MuDOqPUM1w%2BBRZ7SPl%2FkwFQiObYZ2WDg%2FgkoVUxTsoH2mB7ECaehsJJdbMn2UoZz3WPg8cWCtqxlOaGwYvr%2FYk%2BdmNzrJb63CzboNISyIGCYpQEWDOSvWvfIoOncGKxfXaF%2B5Jq3%2FQ2SKp%2FcCO%2BFB4tLhUf8SKykRnGe6q9jfpGs6N8tqQivi6ieZP7uhBGWtZh9DoEotekbQXPzJSTO43BflKiqm%2Fc68hYsRA9vSIBH0at6xtgpqyEXZ%2B4LlwtQogDYtkLrUr7I499zVogf2rAniLJAUg2WFvcSlSNVso2I7Y3XGRttUdBtsKwHRuali3aVFx7ZadAXCH5RMmNG2h8JEpEVTwcuW1B3084w%2FSIVVXFiZIpRwQw9%2FGl0QY6mAGIQJKJH8%2FoNl2GSVZ41nQ2V4lf9Av%2Boxfkgt4if73bFOjcH6LQVfto4lAlJJJqPGcEDf436HwTJy8Q1y9MZnObWfYA7Q7WFg746TA5%2FZaZekquObDbN24BVsfRtRHctFtdCezI7LXhTcBGXWELa7XvZb3YN9jCDKnAI8kEGHpiZo2QSMuzO6OXkT%2BWDbdBK8pog6Od1cmCCg%3D%3D&Expires=1781106378)
9. Confirmar que SSL/TLS quede emitido automáticamente tras la validación de dominio en Vercel y Firebase, y forzar HTTPS como única superficie.
10. Validar propagación DNS con pruebas de resolución para apex, `www`, `crm` y `auth` antes de anunciar producción.
11. Ejecutar smoke test final: carga de landing, acceso CRM, inicio de sesión Firebase, enlaces de email y redirecciones.

### Estrategia de despliegue CRM

Para el módulo de CRM en producción, la estrategia correcta es aislarlo en `crm.dominio.com` y conectarlo solo después de que `auth.dominio.com` y los dominios autorizados de Firebase estén listos. Firebase documenta que los dominios personalizados deben añadirse también en las plantillas de email y en la configuración de autenticación, mientras Vercel resuelve el dominio y el certificado. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

Eso reduce riesgo de exposición prematura: la landing pública puede salir antes, el CRM queda detrás de autenticación y el canal de documentos se mantiene separado. Con esa separación, el dominio corporativo queda alineado con una arquitectura institucional y no con una publicación monolítica de prototipo. [vercel](https://vercel.com/docs/deployment-protection)

**Seguimientos:**

6. Estrategias para minimizar el tiempo de inactividad y evitar errores de propagación durante migraciones de DNS en entornos de producción
7. Configuración de registros DNS para evitar fallos de propagación
8. Mejores prácticas de seguridad DNS para infraestructuras financieras
9. Migración de AIP de entorno de desarrollo a producción en Vercel
10. Estrategia de despliegue para Firebase Auth con dominios personalizados

## DOMAIN-AIP-01

### 1. RECOMENDACIÓN DE EXTENSIÓN

Para AIP en producción, la extensión recomendada sigue siendo **.com** como dominio principal institucional. En un entorno financiero, la prioridad es confianza, memorabilidad y compatibilidad operativa; `.com` sigue siendo la opción más neutral y reconocible para terceros, clientes y proveedores. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

La estrategia correcta es reservar el dominio canónico en `.com` y usar subdominios funcionales para separar superficie pública, acceso de agentes y documentación. Para evitar degradación de marca o riesgo de confusión, conviene evitar extensiones más asociadas a startups, pruebas o territorios no alineados con una presencia institucional. [vercel](https://vercel.com/docs/domains/set-up-custom-domain)

### 2. ARQUITECTURA DE SUBDOMINIOS

| Subdominio | Módulo AIP_v1.2.1 | Fase de activación |
|---|---|---|
| `www.dominio.com` | Landing pública en `landing/` + `index.html` raíz | Inmediata, como entrada pública principal  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/6c3cf5b1-a841-4b15-8e54-6581659c6781/2026-05-25_VIBEORGANISM_CARRIL-FULL.md?AWSAccessKeyId=ASIA2F3EMEYE5BCJBAZC&Signature=XuQ1rDIgla4n0dzlgeE1jiK9t4A%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIQDLm2EbWLFOtIkFamzAN%2BAQNgtkOmK6YvK%2Few4LIpY6ugIgG9QkjvXArovdU9DMBIteh0bcJKMK8Ytis6dN7usNtW0q%2FAQI5%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDCHs%2F8iIFIVzlxS6GCrQBF5NS07KmmOMlvx%2FGbIWzmkt8bZ8FmzdVyJrhIfkISdBSfcfKIz9Tq%2BOllp9b1CCdY3kg1T7bMCgkmSvBU3ZcKt1oZM20f2gPMLsZQbQFdbThn3hxVIb9qmNr3uC61lMCxnS9jqok5WhdyMxhdsEmBQuwjkucaGH%2B5RJJM7Yho6LHq9lhlZhLWQaha41tWM02kBv8sZ0slNNJdI%2FuBMNf5Gc1B9oqcWOV5TEZiXYuj2o%2FnsynjiWfXM7%2BFacX93cP5y3TfTMOAIaOTXzPzFdnol6wBHDt4s1zRFgsEFeJQO50vWjJU6GQtdYsxsGJnkIraIZ2Z36Lcr6EGl%2B5gWiTmTnGiwG2N%2Fvr6UlfPe3x9ylmDAwt75feY50EdiY6DcH56UyZczmBqFptyaTLxht%2FMyXm1reRpVblPnHMfXXCh0%2F8bwxk9mY7yRMDwCJM6Qqune56crkymHVMNUI%2FCiq1VH5k3s5eayQueKSpCrHKCC6QgrbaO1feDSqR5cJlHBNlrNTQWqKclU0EdU6xpVN8kgFWPay4olPJqAnzERbhnKdIat5ZzXBUdsakYd5VdO3GOZecAT56Gocxy9WdcOORbt4Tqh1M3vpdq1N3OViyPi7RsS4DfVVSQQPZbSnmhJeF1iLG0WW9Vd1nn41R8FWZfAo1SBMH5d%2FZ0wma6CY0l0pjuTPdBCz5%2B4GYlQy%2FnG%2Fu7%2F7RiCJbS0t8YjdYLVeMyYGcQx5Rz2lAovI5TDnioELNti04n2bFxSVMtl1O0qcbhh1XUmDP0TGgQ8C0N3Oo7gwkuWl0QY6mAGAm%2FJE9x0UsrTqe15qSFgSClCwwGVmEudsTSv5lkSf9QV9xgqBbAC4F7R8gS0DbUFPiL5xtzm5oSLsB7m3J1APYMUUxsceEkfCMuUsPqQILZjHDPwsyKXu6SH78j28Q7OcZ9MWLZZKjltd0TeXfDrpEGnjG0%2B5qgzJ6JyroWM69aKO34eei6gz84YWeG0W5Z3r5YXLgrFtkA%3D%3D&Expires=1781104741) |
| `crm.dominio.com` | CRM de agentes en gadgets de `aip-crm-home.js` | Cuando el CRM esté enlazado con autenticación y datos de producción  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/6c3cf5b1-a841-4b15-8e54-6581659c6781/2026-05-25_VIBEORGANISM_CARRIL-FULL.md?AWSAccessKeyId=ASIA2F3EMEYE5BCJBAZC&Signature=XuQ1rDIgla4n0dzlgeE1jiK9t4A%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIQDLm2EbWLFOtIkFamzAN%2BAQNgtkOmK6YvK%2Few4LIpY6ugIgG9QkjvXArovdU9DMBIteh0bcJKMK8Ytis6dN7usNtW0q%2FAQI5%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDCHs%2F8iIFIVzlxS6GCrQBF5NS07KmmOMlvx%2FGbIWzmkt8bZ8FmzdVyJrhIfkISdBSfcfKIz9Tq%2BOllp9b1CCdY3kg1T7bMCgkmSvBU3ZcKt1oZM20f2gPMLsZQbQFdbThn3hxVIb9qmNr3uC61lMCxnS9jqok5WhdyMxhdsEmBQuwjkucaGH%2B5RJJM7Yho6LHq9lhlZhLWQaha41tWM02kBv8sZ0slNNJdI%2FuBMNf5Gc1B9oqcWOV5TEZiXYuj2o%2FnsynjiWfXM7%2BFacX93cP5y3TfTMOAIaOTXzPzFdnol6wBHDt4s1zRFgsEFeJQO50vWjJU6GQtdYsxsGJnkIraIZ2Z36Lcr6EGl%2B5gWiTmTnGiwG2N%2Fvr6UlfPe3x9ylmDAwt75feY50EdiY6DcH56UyZczmBqFptyaTLxht%2FMyXm1reRpVblPnHMfXXCh0%2F8bwxk9mY7yRMDwCJM6Qqune56crkymHVMNUI%2FCiq1VH5k3s5eayQueKSpCrHKCC6QgrbaO1feDSqR5cJlHBNlrNTQWqKclU0EdU6xpVN8kgFWPay4olPJqAnzERbhnKdIat5ZzXBUdsakYd5VdO3GOZecAT56Gocxy9WdcOORbt4Tqh1M3vpdq1N3OViyPi7RsS4DfVVSQQPZbSnmhJeF1iLG0WW9Vd1nn41R8FWZfAo1SBMH5d%2FZ0wma6CY0l0pjuTPdBCz5%2B4GYlQy%2FnG%2Fu7%2F7RiCJbS0t8YjdYLVeMyYGcQx5Rz2lAovI5TDnioELNti04n2bFxSVMtl1O0qcbhh1XUmDP0TGgQ8C0N3Oo7gwkuWl0QY6mAGAm%2FJE9x0UsrTqe15qSFgSClCwwGVmEudsTSv5lkSf9QV9xgqBbAC4F7R8gS0DbUFPiL5xtzm5oSLsB7m3J1APYMUUxsceEkfCMuUsPqQILZjHDPwsyKXu6SH78j28Q7OcZ9MWLZZKjltd0TeXfDrpEGnjG0%2B5qgzJ6JyroWM69aKO34eei6gz84YWeG0W5Z3r5YXLgrFtkA%3D%3D&Expires=1781104741) |
| `docs.dominio.com` | Documentación operativa y compliance | Cuando exista un corpus estable y versionado de soporte normativo |
| `auth.dominio.com` | Firebase Auth, plantillas de correo, callbacks OAuth | Cuando el dominio esté autorizado en Firebase y OAuth esté actualizado  [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain) |
| `status.dominio.com` | Estado operativo / incidencias / mantenimiento | Opcional, para transparencia operacional |

La lectura de los artefactos muestra una separación clara: `landing/` está vacía y pendiente, mientras el CRM ya existe como lógica de agente; por eso el dominio debe reflejar madurez desigual sin mezclar áreas inmaduras con zonas productivas. `vercel.json` ya está en versión 2 y `firebase.json` solo fija reglas de Firestore, así que la capa pública debe vivir en Vercel y la identidad/datos en Firebase. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/7f78121b-a6f4-4777-9ee2-2c240ee8d295/2026-05-25_PLANT_BOOTLOADER_v2.6.md?AWSAccessKeyId=ASIA2F3EMEYE5BCJBAZC&Signature=6N%2BoGLwekRbvE2tHZfykJO%2BMsqs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIQDLm2EbWLFOtIkFamzAN%2BAQNgtkOmK6YvK%2Few4LIpY6ugIgG9QkjvXArovdU9DMBIteh0bcJKMK8Ytis6dN7usNtW0q%2FAQI5%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDCHs%2F8iIFIVzlxS6GCrQBF5NS07KmmOMlvx%2FGbIWzmkt8bZ8FmzdVyJrhIfkISdBSfcfKIz9Tq%2BOllp9b1CCdY3kg1T7bMCgkmSvBU3ZcKt1oZM20f2gPMLsZQbQFdbThn3hxVIb9qmNr3uC61lMCxnS9jqok5WhdyMxhdsEmBQuwjkucaGH%2B5RJJM7Yho6LHq9lhlZhLWQaha41tWM02kBv8sZ0slNNJdI%2FuBMNf5Gc1B9oqcWOV5TEZiXYuj2o%2FnsynjiWfXM7%2BFacX93cP5y3TfTMOAIaOTXzPzFdnol6wBHDt4s1zRFgsEFeJQO50vWjJU6GQtdYsxsGJnkIraIZ2Z36Lcr6EGl%2B5gWiTmTnGiwG2N%2Fvr6UlfPe3x9ylmDAwt75feY50EdiY6DcH56UyZczmBqFptyaTLxht%2FMyXm1reRpVblPnHMfXXCh0%2F8bwxk9mY7yRMDwCJM6Qqune56crkymHVMNUI%2FCiq1VH5k3s5eayQueKSpCrHKCC6QgrbaO1feDSqR5cJlHBNlrNTQWqKclU0EdU6xpVN8kgFWPay4olPJqAnzERbhnKdIat5ZzXBUdsakYd5VdO3GOZecAT56Gocxy9WdcOORbt4Tqh1M3vpdq1N3OViyPi7RsS4DfVVSQQPZbSnmhJeF1iLG0WW9Vd1nn41R8FWZfAo1SBMH5d%2FZ0wma6CY0l0pjuTPdBCz5%2B4GYlQy%2FnG%2Fu7%2F7RiCJbS0t8YjdYLVeMyYGcQx5Rz2lAovI5TDnioELNti04n2bFxSVMtl1O0qcbhh1XUmDP0TGgQ8C0N3Oo7gwkuWl0QY6mAGAm%2FJE9x0UsrTqe15qSFgSClCwwGVmEudsTSv5lkSf9QV9xgqBbAC4F7R8gS0DbUFPiL5xtzm5oSLsB7m3J1APYMUUxsceEkfCMuUsPqQILZjHDPwsyKXu6SH78j28Q7OcZ9MWLZZKjltd0TeXfDrpEGnjG0%2B5qgzJ6JyroWM69aKO34eei6gz84YWeG0W5Z3r5YXLgrFtkA%3D%3D&Expires=1781104741)

### 3. CHECKLIST DE REGISTRO Y CONFIGURACIÓN

1. Registrar el dominio principal en un registrador serio con control total de DNS, bloqueo de transferencia y privacidad WHOIS activa si está disponible. [cloudflare](https://www.cloudflare.com/learning/dns/what-is-domain-privacy/)
2. Reservar el apex bajo `.com` y, si procede, registrar variantes defensivas para evitar suplantación y typosquatting.
3. En Vercel, añadir el dominio en el proyecto; usar **A records** para apex y **CNAME** para subdominios. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
4. Definir `www` como alias o redirección del apex según la política de marca.
5. En Firebase, añadir el dominio a **Authorized domains** y ajustar plantillas de email con el dominio personalizado. [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain)
6. En OAuth, registrar orígenes y redirect URIs con `https://` y la ruta exacta del flujo de autenticación. [medium](https://medium.com/@citi_zen/quick-guide-setting-up-google-oauth2-login-with-a-custom-domain-in-firebase-auth-fc86c328682d)
7. Verificar que la aplicación use el `authDomain` personalizado y no el dominio por defecto de Firebase, para evitar fallos de login y recuperación. [medium](https://medium.com/@citi_zen/quick-guide-setting-up-google-oauth2-login-with-a-custom-domain-in-firebase-auth-fc86c328682d)
8. Mantener el frontend en Vercel y el backend de identidad/datos en Firebase; cualquier rewrite o ruta especial debe consolidarse en configuración, no improvisarse en cliente. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/7f78121b-a6f4-4777-9ee2-2c240ee8d295/2026-05-25_PLANT_BOOTLOADER_v2.6.md?AWSAccessKeyId=ASIA2F3EMEYE5BCJBAZC&Signature=6N%2BoGLwekRbvE2tHZfykJO%2BMsqs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJHMEUCIQDLm2EbWLFOtIkFamzAN%2BAQNgtkOmK6YvK%2Few4LIpY6ugIgG9QkjvXArovdU9DMBIteh0bcJKMK8Ytis6dN7usNtW0q%2FAQI5%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDCHs%2F8iIFIVzlxS6GCrQBF5NS07KmmOMlvx%2FGbIWzmkt8bZ8FmzdVyJrhIfkISdBSfcfKIz9Tq%2BOllp9b1CCdY3kg1T7bMCgkmSvBU3ZcKt1oZM20f2gPMLsZQbQFdbThn3hxVIb9qmNr3uC61lMCxnS9jqok5WhdyMxhdsEmBQuwjkucaGH%2B5RJJM7Yho6LHq9lhlZhLWQaha41tWM02kBv8sZ0slNNJdI%2FuBMNf5Gc1B9oqcWOV5TEZiXYuj2o%2FnsynjiWfXM7%2BFacX93cP5y3TfTMOAIaOTXzPzFdnol6wBHDt4s1zRFgsEFeJQO50vWjJU6GQtdYsxsGJnkIraIZ2Z36Lcr6EGl%2B5gWiTmTnGiwG2N%2Fvr6UlfPe3x9ylmDAwt75feY50EdiY6DcH56UyZczmBqFptyaTLxht%2FMyXm1reRpVblPnHMfXXCh0%2F8bwxk9mY7yRMDwCJM6Qqune56crkymHVMNUI%2FCiq1VH5k3s5eayQueKSpCrHKCC6QgrbaO1feDSqR5cJlHBNlrNTQWqKclU0EdU6xpVN8kgFWPay4olPJqAnzERbhnKdIat5ZzXBUdsakYd5VdO3GOZecAT56Gocxy9WdcOORbt4Tqh1M3vpdq1N3OViyPi7RsS4DfVVSQQPZbSnmhJeF1iLG0WW9Vd1nn41R8FWZfAo1SBMH5d%2FZ0wma6CY0l0pjuTPdBCz5%2B4GYlQy%2FnG%2Fu7%2F7RiCJbS0t8YjdYLVeMyYGcQx5Rz2lAovI5TDnioELNti04n2bFxSVMtl1O0qcbhh1XUmDP0TGgQ8C0N3Oo7gwkuWl0QY6mAGAm%2FJE9x0UsrTqe15qSFgSClCwwGVmEudsTSv5lkSf9QV9xgqBbAC4F7R8gS0DbUFPiL5xtzm5oSLsB7m3J1APYMUUxsceEkfCMuUsPqQILZjHDPwsyKXu6SH78j28Q7OcZ9MWLZZKjltd0TeXfDrpEGnjG0%2B5qgzJ6JyroWM69aKO34eei6gz84YWeG0W5Z3r5YXLgrFtkA%3D%3D&Expires=1781104741)
9. Confirmar que SSL/TLS quede emitido automáticamente tras la validación de dominio y forzar HTTPS como única superficie activa. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
10. Validar propagación DNS con pruebas de resolución para apex, `www`, `crm` y `auth` antes del anuncio de producción.
11. Ejecutar un smoke test final con landing, acceso CRM, login Firebase y enlaces de correo.

### 4. MINIMIZAR CAÍDA Y PROPAGACIÓN

La forma más segura de migrar DNS es reducir el TTL con antelación, esperar la ventana de caché y luego hacer el corte. Las guías de migración y propagación indican que bajar TTL antes del cambio reduce la latencia de actualización y ayuda a acotar el tiempo de inactividad; también recomiendan staging o infraestructura de prueba antes del corte definitivo. [ilimit](https://www.ilimit.com/es/blog/tecnologico-2/migracion-hosting-pasos-consideraciones-clave-37)

Para una infraestructura financiera, además conviene separar registrar y DNS autoritativo cuando sea posible, mantener copias espejo de registros y hacer el cambio por etapas. IBM y otros materiales de operación de DNS señalan que una estrategia estable, con TTL bajo y verificación global, puede acortar la propagación de forma significativa. [ibm](https://www.ibm.com/mx-es/think/topics/dns-propagation)

### 5. SEGURIDAD DNS FINANCIERA

En un entorno financiero, el DNS no solo debe resolver; debe resistir manipulación y fallos en cascada. Las prácticas recomendables incluyen DNS administrado en infraestructura confiable, control de acceso estricto, privacidad del registrante, vigilancia de cambios y revisión de que las zonas no expongan información sensible. [cnmv](https://www.cnmv.es/docportal/publicaciones/ciberseguridad/ciberseguridad_infraestructuras_mercados.pdf)

La política operativa debería incluir: TTL moderadamente bajo para migraciones, protección del dominio en el registrador, registro de cambios, validación cruzada de A/CNAME/TXT, y monitoreo de resolución desde varios puntos. En esa clase de entorno, un fallo de propagación o un redirect mal resuelto tiene impacto directo en confianza y acceso, así que la seguridad debe tratarse como parte del diseño, no como un añadido. [infoblox](https://www.infoblox.com/es/solutions/compliance/)

### 6. MIGRACIÓN A PRODUCCIÓN

Para mover AIP de desarrollo a producción en Vercel, la secuencia correcta es: preparar dominio, configurar DNS, validar staging, conectar subdominios, luego activar redirecciones y autenticación. Vercel documenta el alta de dominios, el uso de apex/subdominios y el aprovisionamiento de HTTPS tras la verificación, lo que encaja bien con una transición controlada desde pruebas a producción. [vercel](https://vercel.com/docs/production-checklist)

En paralelo, Firebase Auth debe quedar alineado con el nuevo dominio: authorized domains, plantillas de correo y OAuth redirect URIs deben apuntar al dominio canónico. Si eso no se hace antes del corte, el síntoma típico será un login que funciona en entorno de prueba pero falla en producción o rompe enlaces de recuperación. [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain)

### 7. DESPLIEGUE CRM

El CRM de producción no debe compartir superficie con la landing pública; debe vivir en `crm.dominio.com` y depender de autenticación fuerte antes de exponer cualquier funcionalidad operativa. Eso reduce el radio de fallo, facilita el control de acceso y permite que la landing siga siendo pública mientras el CRM permanece protegido detrás de Firebase Auth y reglas de datos. [ppl-ai-file-upload.s3.amazonaws]

La práctica recomendada es publicar primero landing y auth, después CRM, y por último documentación de compliance si requiere material sensible. Ese orden minimiza exposición, reduce errores de migración y permite verificar cada capa antes de abrir la siguiente. [ilimit](https://www.ilimit.com/es/blog/tecnologico-2/migracion-hosting-pasos-consideraciones-clave-37)

**Seguimientos:**

11. Estrategias para minimizar tiempo de inactividad durante migraciones DNS
12. Mejores prácticas para configuración de registros TTL al migrar dominios
13. Configuración de DNS con Firebase y Vercel en entornos de alta disponibilidad
14. Prevención de errores de propagación DNS en despliegues productivos
15. Seguridad y validación de registros SPF, DKIM y DMARC post-migración

## DOMAIN-AIP-01

### 1. Estrategia de tiempo de inactividad

La forma más segura de minimizar caída en una migración DNS es bajar el TTL con anticipación, esperar al menos un ciclo completo y hacer el corte cuando la mayoría de resolvers ya estén refrescando rápido. Para cambios críticos, TTLs cortos en el rango de 60–120 segundos son adecuados durante la ventana de migración, y después conviene subirlos de nuevo a valores más estables como 3600 o más. [docs.aws.amazon](https://docs.aws.amazon.com/es_es/Route53/latest/DeveloperGuide/best-practices-dns.html)

Para AIP, la migración debería hacerse en una ventana de baja actividad y con el backend ya validado en staging, porque el riesgo real no es solo la propagación: también es que un subdominio resuelva bien en unos resolvers y mal en otros. La verificación debe cubrir apex, `www`, `crm` y `auth` antes de anunciar producción. [hostingexperto](https://hostingexperto.site/como-resolver-problemas-comunes-de-propagacion-de-dns-rapidamente/)

### 2. TTL y propagación

Durante el cambio, los TTL de registros que vayan a mutar deben ser bajos; los registros estables como NS o MX pueden mantenerse más altos, porque cambian menos y no aportan beneficio operativo al dejarlos demasiado bajos. En DNS de alta disponibilidad, evitar respuestas demasiado grandes también ayuda, porque respuestas excesivas pueden forzar TCP y degradar la fiabilidad. [docs.aws.amazon](https://docs.aws.amazon.com/es_es/Route53/latest/DeveloperGuide/best-practices-dns.html)

La regla práctica para AIP es: bajar TTL 24–48 horas antes si el TTL original es alto, hacer el corte con TTL bajo, monitorizar la propagación y restaurar TTL normal cuando la nueva topología ya esté estable. Eso reduce el tiempo de inactividad visible y limita el tiempo durante el cual distintos usuarios pueden ver destinos diferentes. [carontestudio](https://carontestudio.com/blog/errores-comunes-al-hacer-una-migracion-web/)

### 3. DNS con Vercel y Firebase

En esta arquitectura, Vercel debe resolver el frontend público y Firebase debe sostener autenticación y datos. Vercel soporta el alta de dominio, apex con A records y subdominios con CNAME, además de emitir HTTPS tras la verificación; Firebase requiere que el dominio esté autorizado para Auth y que los flujos OAuth apunten al dominio correcto. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

Para evitar errores en alta disponibilidad, el frontend no debería depender de un único cambio monolítico: `www` puede ir a Vercel, `crm` puede apuntar al frontend con rutas protegidas o a un subproyecto separado, y `auth` debe estar explícitamente autorizado en Firebase. Si todo se hace en paralelo sin validar cada subdominio, el fallo típico es que la landing funcione pero el login o los enlaces de correo queden rotos. [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain)

### 4. Seguridad DNS

En infraestructuras financieras, el DNS debe tratarse como parte del perímetro de seguridad. Buenas prácticas razonables incluyen privacidad del registrante, bloqueo de transferencia, auditoría de cambios, DNS administrado en infraestructura confiable y monitorización de A/AAAA/CNAME/TXT para detectar desvíos o manipulaciones. [cloudflare](https://www.cloudflare.com/learning/dns/what-is-domain-privacy/)

También conviene habilitar DNSSEC si el proveedor lo soporta y mantener los registros alineados con la política de correo: SPF, DKIM y DMARC deben validarse después de la migración para que el dominio no solo resuelva, sino que también pueda enviar correo con autenticidad verificable. Un cambio de DNS sin revisar esos registros puede romper notificaciones, recuperaciones de cuenta y reputación del dominio. [q2bstudio](https://www.q2bstudio.com/nuestro-blog/26589/7-errores-a-evitar-al-gestionar-registros-dns-en-produccion)

### 5. Checklist operativo

1. Reducir TTL de los registros que van a cambiar con suficiente antelación, idealmente 24–48 horas antes. [carontestudio](https://carontestudio.com/blog/errores-comunes-al-hacer-una-migracion-web/)
2. Congelar cambios no esenciales durante la ventana de migración.
3. Verificar que los registros apex y subdominios estén precreados en el nuevo proveedor antes del corte. [carontestudio](https://carontestudio.com/blog/errores-comunes-al-hacer-una-migracion-web/)
4. Configurar apex con A records y subdominios con CNAME en Vercel. [vercel](https://vercel.com/docs/domains/set-up-custom-domain)
5. Autorizar el dominio en Firebase Auth y actualizar `authDomain`, orígenes OAuth y URIs de redirección. [medium](https://medium.com/@citi_zen/quick-guide-setting-up-google-oauth2-login-with-a-custom-domain-in-firebase-auth-fc86c328682d)
6. Validar propagación desde varios resolvers y regiones antes de anunciar la migración completa. [ibm](https://www.ibm.com/mx-es/think/topics/dns-propagation)
7. Confirmar HTTPS operativo y redirecciones limpias.
8. Revisar SPF, DKIM y DMARC tras el cambio para no degradar correo y notificaciones. [q2bstudio](https://www.q2bstudio.com/nuestro-blog/26589/7-errores-a-evitar-al-gestionar-registros-dns-en-produccion)
9. Restaurar TTL a un valor más alto cuando el entorno esté estable. [docs.aws.amazon](https://docs.aws.amazon.com/es_es/Route53/latest/DeveloperGuide/best-practices-dns.html)
10. Mantener monitorización de cambios DNS y alertas de discrepancias durante las primeras horas post-corte. [infoblox](https://www.infoblox.com/es/solutions/compliance/)

### 6. Secuencia recomendada

La secuencia más segura para AIP es: preparar DNS y auth, bajar TTL, validar staging, hacer el cambio de dominio, comprobar propagación, corregir si hace falta y luego estabilizar TTL. Ese orden minimiza downtime real porque separa el riesgo de resolución del riesgo de autenticación y del riesgo de correo. [ibm](https://www.ibm.com/mx-es/think/topics/dns-propagation)

Para el CRM, la activación debe ser la última pieza visible: primero landing y auth, luego `crm`, y por último documentación sensible. Así, aunque haya retrasos de propagación en algún resolver, el impacto queda contenido y el acceso institucional no queda expuesto a fallos parciales. [ppl-ai-file-upload.s3.amazonaws]

**Seguimientos:**

16. Puedes detallar cómo configurar el TTL específicamente para Vercel
17. Qué registros debo configurar primero, el apex o el subdominio www
18. Cómo verifico que la propagación es exitosa antes del corte final
19. Qué riesgos hay si configuro un TTL demasiado bajo permanentemente
20. Cómo gestiono los certificados SSL tras la migración de dominios

## DOMAIN-AIP-01

### 1. TTL en Vercel

En Vercel, el TTL por defecto de los registros DNS es **60 segundos**, y puede personalizarse en la UI para usuarios avanzados. Para una migración, eso significa que el valor práctico es dejarlo en 60 durante el corte y solo subirlo después, cuando la propagación ya esté estable. [digicert](https://www.digicert.com/es/faq/dns/what-is-ttl)

Para AIP, el TTL corto conviene en `www`, `crm` y `auth` mientras dure la transición. Si tu zona DNS está todavía fuera de Vercel, la misma lógica aplica en el proveedor autoritativo: bajar TTL antes del cambio y restaurarlo después reduce riesgo de caché desalineada. [vercel](https://vercel.com/kb/guide/how-to-manage-vercel-dns-records)

### 2. Orden de registros

Primero configura el **apex** y luego el subdominio `www` si el apex será canónico; si quieres minimizar fricción de validación, también puedes dejar `www` listo en paralelo como alias de redirección. Vercel soporta apex con A records y subdominios con CNAME, así que la decisión real es de marca y flujo de entrada, no de capacidad técnica. [vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

Para AIP, la secuencia más limpia es: 1) apex, 2) `www`, 3) `auth`, 4) `crm`, 5) `docs`. Eso deja la raíz institucional lista primero y evita que la landing pública dependa de un subdominio que todavía no esté verificado. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_f1d3ce88-0a72-43ea-960f-5484149c86fe/6c3cf5b1-a841-4b15-8e54-6581659c6781/2026-05-25_VIBEORGANISM_CARRIL-FULL.md?AWSAccessKeyId=ASIA2F3EMEYE5ESE4E3I&Signature=lVrEUkxw%2BjMwKVhvaZK48tNbvCQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEB8aCXVzLWVhc3QtMSJIMEYCIQCNs4cGGFk3AuH7m6q3QsGkwBgugp88tB05WVt988jyxAIhALXVvzNdkp59wV7RmrhocGLXzGwA6FvAk3%2FVxJuQ5G%2FuKvwECOj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQARoMNjk5NzUzMzA5NzA1IgyvkGnsbOZgrBKwOscq0ASSDUfFgeYYlFJeE2YwTxcZ6jZpdSPIZ1ES1QWwKMsduj7AONMMI996oJQfEJ9npXvysTKjdHq6aityko5ZUMV1wTEk75hAcoxOf39l%2Flr0u69Hj1wlbZbfBcG9xwo%2FzZUN0WT98Vsx%2BxyKXV%2FyWp%2FIAMS9hcjXjdJnkrXKXvJcpWyaHhYpp5y00O85NEpl7YEbMMmMhy3SG27Tjt8vxlTH7AjiDp7YXoI%2FFLR6gGmPDysysRkIHSIGxOee8hlOMLuzSp6IEt%2Bf2WJGYEmyt1%2F22qSiUBlC%2Bbc7AkDtBQw5L%2FhHt%2B2gqCe%2FRDlW2Z3TWnLKX4Vum%2BkxyBKushtDkDsqIeQsSKYkAEMJE7ZeFZWXvA2vx6gJCKWHpAc1sJp33CRKF3gLoWYACGu3tJpWJ9Jf%2FFs2wGLdZzUHr6qegrwZ2YRtJmJW9ogTl5vI8kD9hbpTmTOtoEE3L1zRPvj8q3U2Lijxa0mlfpoEcbP65R%2FBJa7%2FTJvW64wbDCwyuCt65AR%2B0hxOfQqLCHffewVA8rozRfO93dQYfc%2FMlY9tloF%2FbUP4Ej%2FQ0zXrAsME%2Fl9t7CBhSwFRKSri%2BtsjmnzZpUZBLyokPQToczN3eHU%2FQYyn1d%2FG3rAvXGRgpsJBw01jOd8McRjUUd1b0NzTprukg5L19J4mE3igXDWGgpPSz%2Bpgc1W%2FqEoq3XQS%2BFvg3fLbr5G4zujOEr%2FiPngI45njKxFVK0ALWDohveqrUyVzl649Gc%2FsC9YCIxI3U9LNpj%2FtEgAsiQLRS%2FIiWwY60QRfFISbMLDypdEGOpcBrRLDxk3mOkQjaFwb%2Fehb3P72QKJG0jigiZpcholg%2B4TGRWFcQOmhYp5bg8SIiK0ABXk%2FZiuE0zxL5lYBMwYhESXnWLoexrIwR%2BxSeebMzWPfeU95qHB843%2FdQkOCpkz9AI89Ekn78v3KGvcA8bBz1V4aPqXb1NX6mbBtyjU5ly815L%2BxVZNMYZR89FPVhCRPmkuTLLnbpg%3D%3D&Expires=1781106435)

### 3. Verificación de propagación

La propagación se considera exitosa cuando el dominio resuelve correctamente desde varios resolvers públicos y devuelve el destino esperado de forma consistente. Vercel recomienda comprobar los registros con herramientas de terceros y también verificar desde terminal; los validadores externos muestran si el cambio ya se ve globalmente o solo en algunos puntos. [guias.webempresa](https://guias.webempresa.com/preguntas-frecuentes/chequeo-propagacion-dns/)

Antes del corte final, comprueba al menos cuatro cosas: apex resuelve al destino correcto, `www` resuelve o redirige como esperas, `auth` está autorizado en Firebase, y `crm` carga tras autenticación. Si cualquiera de esos cuatro puntos falla en un resolver común, todavía no estás en estado de producción confiable. [firebase.google](https://firebase.google.com/docs/auth/email-custom-domain)

### 4. TTL demasiado bajo

Un TTL muy bajo de forma permanente no “rompe” el dominio por sí mismo, pero sí aumenta el número de consultas a los nameservers y, por tanto, la carga y la exposición a fallos operativos en la capa DNS. DigiCert lo resume bien: TTL bajo acelera cambios, pero incrementa tráfico de consultas; TTL alto estabiliza, pero retrasa cambios. [digicert](https://www.digicert.com/es/faq/dns/what-is-ttl)

Para AIP, mantener 60 segundos indefinidamente solo tiene sentido en zonas que cambian mucho o en ventanas de operación muy activa. En producción estable, conviene volver a TTLs más razonables en registros poco volátiles para reducir ruido, coste operativo y dependencia de resoluciones frecuentes. [docs.aws.amazon](https://docs.aws.amazon.com/es_es/Route53/latest/DeveloperGuide/best-practices-dns.html)

### 5. SSL tras migración

En Vercel, una vez el dominio está verificado, el certificado SSL/TLS se gestiona automáticamente y el sitio queda servible por HTTPS sin intervención manual adicional. Eso no sustituye la validación: primero debes confirmar que el dominio apunta bien y luego dejar que Vercel emita o renueve el certificado. [vercel](https://vercel.com/docs/domains/set-up-custom-domain)

En Firebase, la parte crítica es que el dominio personalizado esté autorizado para Auth y que los flujos de correo/OAuth apunten al dominio correcto; si eso está mal, el SSL del sitio puede estar perfecto pero el login seguirá fallando. En la práctica, el cierre correcto es: DNS estable, HTTPS activo, Auth validado, correo verificado y smoke test final. [medium](https://medium.com/@citi_zen/quick-guide-setting-up-google-oauth2-login-with-a-custom-domain-in-firebase-auth-fc86c328682d)
