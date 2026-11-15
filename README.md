# BancActiu Nexus - Gateway Launcher & SuperAdmin Console

> **Micro-aplicació central de governança i seguretat de BancActiu 2.0**  
> Port local per defecte: 3000 &middot; Desplegament central a Vercel

---

## 1. Característiques Principals

* **Gateway Launcher**: Commutador central per a la navegació entre les 5 aplicacions del monorepo (`bancactiu-nexus`, `bancactiu-salut`, `bancactiu-municipal`, `bancactiu-social`, `bancactiu-operatiu`).
* **Seguretat Zero-Trust**:
  * Superadministrador arrel vinculat al DNI: **52622304Y**.
  * Formulari de login net (sense autofill ni dades de prova).
  * Flux de primer accés per forçar la configuració d'una contrasenya robusta (ENS Nivell Alt).
  * Autenticació suportada per certificats digitals idCAT / T-CAT corporatius.
* **Assistent Kenzo**:
  * Assistent flotant intel·ligent amb informes d'auditoria, mètriques per mòdul i Mode de Presentació de Diapositives (Slides Mode).
* **Mòduls Administratius Avançats**:
  * Alta descentralitzada de centres sanitaris i municipals.
  * Gestió de rols, serveis i llocs de treball.
  * Stress & Security Lab (simulació de concurrència 1-3 anys a Catalunya).
  * Consola de l'Enginyer Agent IA de codi.
  * Pasarel·les de dades sensibles AOC / Via Oberta.

---

## 2. Instruccions d'Execució

```bash
# Execució local
npm run dev

# Compilació de producció
npm run build

# Desplegament complet
npx vercel --prod
```
