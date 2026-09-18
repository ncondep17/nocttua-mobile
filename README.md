# Nocttua — app móvil

App de Expo/React Native para las familias. Separada del monorepo `nocttua` original.

## Setup

```bash
git submodule update --init
npm install
npm start
```

`@nocttua/theme` se resuelve desde `shared/theme` (submodule de [nocttua-shared](https://github.com/ncondep17/nocttua-shared)). Si `shared/` cambió río arriba:

```bash
git submodule update --remote shared
```

## Deploy

Ver `eas.json` para los perfiles de build. Requiere EAS CLI y acceso al proyecto `nocttua` en Expo.
