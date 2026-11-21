# REGLAS PERMANENTES DE IDENTIDAD Y DESPLIEGUE - ENTORNO REAL

## 1. Identidad Git Obligatoria
En cualquier operación de Git dentro de este repositorio (`apps/bancactiu-nexus` o raíz de `BancActiu_2.0_Separacion_Entidades`):
- `git config user.name "bartcatmo-rgb"`
- `git config user.email "bartcatmo@gmail.com"`
- Remoto oficial: `https://github.com/bartcatmo-rgb/bancactiu-nexus.git`

## 2. Cuenta de Despliegue en Vercel
- Cuenta Vercel: `bartcatmo@gmail.com`
- Proyecto de producción: `bancactiu-nexus` / `banc-actiu-2-0-separacion-entidades`

## 3. Ring-Fencing de Credenciales y Autenticación (Estricto e Inviolable)
- Los archivos `/login`, `middleware.ts`, `lib/server-credentials-store.ts`, `lib/auth-security.ts` NO se deben modificar sin autorización expresa.
- Únicamente existen dos usuarios oficiales autorizados en el almacén de credenciales:
  1. `52622304Y` - SuperAdmin Govern TI
  2. `47956602S` - SuperAdmin Pentest TI
- Prohibido reintroducir datos de prueba obsoletos o usuarios no autorizados.

## 4. Blindaje de Despliegue Silencioso (PROHIBIDO VERCEL CLI)
- Está terminantemente PROHIBIDO ejecutar `npx vercel` o `vercel` en la terminal, scripts o entornos de ejecución.
- Todos los despliegues de producción se realizan única y exclusivamente mediante `git push origin main` a GitHub, donde Vercel ejecuta el despliegue automático conectado al repositorio.
- Prohibida cualquier invocación interactiva o despliegue CLI local que altere o interfiera con las credenciales o enlaces de proyecto.
