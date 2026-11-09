# opoplanner

Aplicación web para preparar oposiciones de la Administración General del Estado y de la Seguridad Social. Reúne en un solo sitio el temario, los apuntes, los simulacros por tema, los exámenes y un planner de estudio diario.

> 🚧 **En desarrollo.** Por ahora solo existe el frontend y funciona con datos simulados. El backend con Java y Spring Boot es el siguiente paso.

<!-- Añade aquí las capturas, por ejemplo:
![Home de opoplanner](docs/screenshots/home.png)
-->

## Por qué existe

Nace de una necesidad real: mi novia está opositando y estudia con un PDF del temario, un Excel para planificar y una app de tests distinta, y ninguna de esas herramientas se comunica con las demás. opoplanner intenta juntarlo todo y que el progreso de un sitio se refleje en el resto.

## Oposiciones incluidas

- Administrativo de la AGE (C1)
- Auxiliar Administrativo de la AGE (C2)
- Administrativo de la Seguridad Social (C1)
- Auxiliar Administrativo de la Seguridad Social (C2)

Cada oposición es independiente: temario, preguntas, exámenes, planner y estadísticas van por separado aunque las materias se repitan.

## Estado actual

**Hecho**

- Registro e inicio de sesión (con servicio simulado).
- Layout de la aplicación con sidebar plegable y navegación inferior en móvil.
- Home con:
  - Cuenta atrás hasta la fecha prevista del examen.
  - Racha de estudio y resumen de los últimos siete días.
  - Tareas de hoy del planner.
  - Bloques más flojos (por porcentaje de aciertos) y bloques estudiados.
  - Juego de verdadero o falso con explicación de cada respuesta.
- Notificaciones tipo toast, modal y componentes base propios (botón, input, input de contraseña, iconos).

**Pendiente**

- Temario oficial, apuntes, exámenes cronometrados, simulacros por tema y planner completo.
- Onboarding y cambio de oposición activa.
- Modo administrador para gestionar temario, preguntas y exámenes oficiales.
- Backend con Java y Spring Boot, autenticación real y persistencia.
- Demo desplegada.

Los casos de uso, las entidades y las decisiones de diseño están en [`docs/requisitos.md`](docs/requisitos.md).

## Stack

**Frontend** (`web/`)

- Angular 22 con componentes standalone, Signals y el nuevo control flow.
- NgRx SignalStore para el estado de cada página.
- RxJS para los flujos asíncronos.
- Bootstrap 5 como base, con diseño y componentes propios encima.
- ngx-translate para los textos de la interfaz.
- date-fns para el manejo de fechas.
- Vitest para los tests, ESLint y Prettier para la calidad del código.

**Backend** (próximamente)

- Java y Spring Boot.

## Arquitectura del frontend

- **Una página, un store.** Cada página (login, registro, layout, home) tiene su propio SignalStore, que se encarga de cargar datos, gestionar los estados de carga y error y exponer los métodos que usa la vista.
- **Componentes de presentación.** Las tarjetas de la home y los componentes comunes solo reciben datos por `input()` y emiten eventos por `output()`. No conocen los stores ni los servicios.
- **Servicios intercambiables.** Los servicios devuelven `Observable` con datos simulados, de forma que conectar el backend consista en cambiar su implementación sin tocar stores ni componentes.
- **Accesibilidad.** Textos para lectores de pantalla, `role="status"` en los mensajes dinámicos y gestión del foco en los flujos interactivos.
- **OnPush** en todos los componentes.

```
web/src/
├── app/
│   ├── app-layout/     # Layout de la aplicación y su store
│   ├── auth-layout/    # Layout de login y registro
│   ├── home/           # Home: tarjetas y store
│   ├── login/
│   ├── register/
│   └── services/       # Servicios de datos (simulados por ahora)
├── common/
│   ├── components/     # Componentes reutilizables
│   ├── constants/
│   ├── models/
│   ├── pipes/
│   ├── services/       # Servicios transversales (notificaciones)
│   └── utils/
└── styles/             # Variables, tema y estilos globales
```

## Cómo arrancarlo

Necesitas Node.js y npm.

```bash
cd web
npm ci
npm start
```

La aplicación se abre en `http://localhost:4200`. Como los datos son simulados, puedes iniciar sesión con cualquier email válido y cualquier contraseña.

### Scripts

| Comando                | Qué hace                               |
|------------------------|----------------------------------------|
| `npm start`            | Servidor de desarrollo                 |
| `npm run build`        | Build de producción en `web/dist/`     |
| `npm test`             | Tests con Vitest                       |
| `npm run lint`         | ESLint                                 |
| `npm run format`       | Formatea el código con Prettier        |
| `npm run format:check` | Comprueba el formato sin modificar     |

## Flujo de trabajo

- Una rama por funcionalidad (`feat/...`) y merge mediante pull request.
- Commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/).

## Autor

**Jose Manuel Martín Vega** · Senior Frontend Developer

[LinkedIn](https://www.linkedin.com/in/josemmartindev) · [GitHub](https://github.com/skz99)
