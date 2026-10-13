# Kampus — Frontend

App móvil de **Kampus** hecha con [Expo](https://expo.dev) (SDK 57), React Native y [Expo Router](https://docs.expo.dev/router/introduction/) (rutas basadas en archivos).

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Instalación](#2-instalación)
3. [Ejecutar el proyecto](#3-ejecutar-el-proyecto)
4. [Ver la app en tu celular](#4-ver-la-app-en-tu-celular)
5. [Otras formas de verla](#5-otras-formas-de-verla)
6. [Scripts disponibles](#6-scripts-disponibles)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Solución de problemas](#8-solución-de-problemas)

---

## 1. Requisitos

Instala esto en tu computadora:

| Herramienta | Versión | Cómo verificar |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 20 LTS o superior (recomendado 22 o 24) | `node -v` |
| [pnpm](https://pnpm.io/installation) | 10 o superior | `pnpm -v` |
| [Git](https://git-scm.com/) | cualquiera reciente | `git --version` |

Si no tienes pnpm:

```bash
npm install -g pnpm
```

Y en tu celular:

- **Expo Go**: [Android (Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

> ⚠️ **Este proyecto usa pnpm.** No uses `npm install` ni `yarn`: generan otro lockfile y mezclar gestores causa errores (módulos duplicados, descargas repetidas, etc.).

---

## 2. Instalación

```bash
# 1. Clona el repositorio
git clone <url-del-repo>

# 2. Entra a la carpeta del frontend
cd Frontend-kampus

# 3. Instala las dependencias
pnpm install
```

La primera instalación tarda unos minutos. Las siguientes son mucho más rápidas porque pnpm reutiliza los paquetes que ya descargó.

---

## 3. Ejecutar el proyecto

```bash
pnpm start
```

(equivalente a `pnpm expo start`)

Esto levanta el servidor de desarrollo (Metro) y muestra en la terminal:

- Un **código QR** para abrir la app en tu celular.
- Atajos de teclado:
  - `a` → abrir en emulador Android
  - `i` → abrir en simulador iOS (solo macOS)
  - `w` → abrir en el navegador
  - `r` → recargar la app
  - `j` → abrir el depurador
  - `m` → abrir el menú de desarrollo en el dispositivo

Deja esta terminal abierta mientras desarrollas. Al guardar cambios en el código, la app se actualiza sola (Fast Refresh).

---

## 4. Ver la app en tu celular

### Opción A: misma red Wi‑Fi (recomendada)

1. Conecta **tu computadora y tu celular a la misma red Wi‑Fi**.
2. Ejecuta `pnpm start` en la computadora.
3. Escanea el código QR:
   - **Android:** abre **Expo Go** → *Scan QR code*.
   - **iPhone:** abre la app de **Cámara** y apunta al QR; toca el aviso para abrir en Expo Go.
4. Espera a que cargue el bundle (la primera vez tarda un poco más).

#### En Windows: revisa la red y el firewall

Si el celular se queda cargando o muestra *"Could not connect to development server"*:

- La red Wi‑Fi debe estar configurada como **Privada**:
  *Configuración → Red e Internet → Wi‑Fi → (tu red) → Tipo de perfil de red → Privada*.
- Cuando Windows pregunte si **Node.js** puede comunicarse en la red, acepta para **redes privadas**.
  Si ya lo rechazaste: *Panel de control → Firewall de Windows Defender → Permitir una aplicación… → Node.js → marcar "Privada"*.

### Opción B: túnel (redes de escuela / redes distintas)

Si no estás en la misma red, o la red bloquea conexiones entre dispositivos (común en Wi‑Fi de universidades), usa un túnel:

```bash
pnpm expo start --tunnel
```

La primera vez te pedirá instalar `@expo/ngrok`; acepta. Luego escanea el QR igual que en la opción A. Es más lento, pero funciona desde cualquier red.

### Opción C: cable USB (solo Android)

1. Activa **Opciones de desarrollador** y **Depuración USB** en tu Android.
2. Conecta el celular por USB y acepta el aviso de depuración.
3. Ejecuta `pnpm start` y presiona `a`.

Requiere tener instalado [Android Platform Tools (adb)](https://developer.android.com/tools/releases/platform-tools).

---

## 5. Otras formas de verla

- **Navegador:** `pnpm web` o presiona `w` en la terminal de Expo.
- **Emulador Android:** instala [Android Studio](https://docs.expo.dev/workflow/android-studio-emulator/), crea un dispositivo virtual, ábrelo y presiona `a`.
- **Simulador iOS:** solo en macOS con [Xcode](https://docs.expo.dev/workflow/ios-simulator/); presiona `i`.

---

## 6. Scripts disponibles

| Comando | Qué hace |
| --- | --- |
| `pnpm start` | Inicia el servidor de desarrollo de Expo |
| `pnpm android` | Inicia y abre en Android |
| `pnpm ios` | Inicia y abre en iOS (macOS) |
| `pnpm web` | Inicia y abre en el navegador |
| `pnpm lint` | Revisa el código con ESLint |
| `pnpm tsc --noEmit` | Revisa los tipos de TypeScript |

### Agregar dependencias

Usa siempre `expo install` en lugar de `pnpm add`, porque elige la versión compatible con el SDK de Expo:

```bash
pnpm expo install <paquete>
```

> Expo Go solo trae los módulos nativos de Expo. Si agregas una librería con código nativo propio, ya no abrirá en Expo Go y se necesitará un [development build](https://docs.expo.dev/develop/development-builds/introduction/).

---

## 7. Estructura del proyecto

```
Frontend-kampus/
├── assets/               # Imágenes, íconos y fuentes
├── scripts/              # Scripts auxiliares
├── src/
│   ├── app/              # Pantallas y rutas (Expo Router)
│   │   ├── _layout.tsx   # Layout raíz
│   │   ├── (tabs)/       # Pantallas con barra de pestañas
│   │   └── auth/         # Login, registro y recuperar contraseña
│   ├── components/       # Componentes reutilizables
│   │   ├── auth/         # Componentes de las pantallas de autenticación
│   │   └── ui/           # Botones, inputs, checkbox, etc.
│   ├── constants/        # Tema, colores y constantes
│   └── hooks/            # Hooks personalizados
├── app.json              # Configuración de Expo
├── package.json
└── pnpm-lock.yaml
```

Cada archivo dentro de `src/app/` es una ruta. Por ejemplo, `src/app/auth/login/` corresponde a la pantalla `/auth/login`.

---

## 8. Solución de problemas

**La app no refleja cambios o muestra errores raros**
Limpia la caché de Metro:

```bash
pnpm expo start -c
```

**El celular no se conecta al servidor**
- Verifica que ambos estén en la misma Wi‑Fi.
- Revisa el firewall de Windows (ver [sección 4](#en-windows-revisa-la-red-y-el-firewall)).
- Prueba con `pnpm expo start --tunnel`.

**Expo Go dice que el proyecto es incompatible / versión de SDK distinta**
Actualiza Expo Go desde la tienda. El proyecto usa **SDK 57**.

**pnpm descarga todo de nuevo**
Pasa si antes instalaste con `npm`. Borra `node_modules` y reinstala solo con pnpm:

```bash
Remove-Item -Recurse -Force node_modules   # PowerShell
pnpm install
```

**Conectar con el backend desde el celular**
En el celular, `localhost` / `127.0.0.1` apunta al propio celular, no a tu computadora. Para consumir la API de Laravel usa la **IP local de tu PC** (obtenla con `ipconfig`, ej. `http://192.168.1.50:8000`) y levanta el backend escuchando en la red:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

---

## Recursos

- [Documentación de Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo Go](https://expo.dev/go)
