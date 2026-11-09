# Requisitos de la aplicación

Casos de uso, entidades y guía de desarrollo · 5 de noviembre de 2026 · Jose Manuel Martín Vega

Web de estudio para cuatro oposiciones (Administrativo y Auxiliar de la AGE y de la Seguridad Social), con exámenes cronometrados, simulacros por tema, apuntes propios y planner. Todo lo que aparece aquí son decisiones ya tomadas; lo que no está decidido va en «Pendiente de decidir».

## 1. Alcance y actores

**Oposiciones incluidas (por ahora)**

- Administrativo de la AGE (C1)
- Auxiliar Administrativo de la AGE (C2)
- Administrativo de la Seguridad Social (C1)
- Auxiliar Administrativo de la Seguridad Social (C2)

**Principio general**

Cada oposición es independiente. Temario, preguntas, exámenes, calendario y estadísticas van separados por oposición, aunque las materias se repitan entre ellas.

| Actor             | Qué hace                                                                                                               |
|-------------------|------------------------------------------------------------------------------------------------------------------------|
| **Usuario**       | Se registra, prepara una o varias oposiciones, hace exámenes y simulacros, gestiona sus apuntes y su planner.          |
| **Administrador** | Gestiona el temario, las preguntas, los exámenes oficiales, los casos prácticos y la fecha prevista de cada oposición. |

## 2. Acceso y configuración

### CU-01 · Registrarse

**Actor:** usuario sin cuenta.

1.  Rellena nombre, apellidos, email y contraseña.
2.  Pulsa «Registrarse».
3.  El sistema envía un correo de verificación.
4.  Verifica el email y ya puede entrar.

**Reglas**

- El registro con email es el único método por ahora (cualquier email, sin login social).
- Sin verificar el email no se puede entrar.
- Contraseña de al menos 8 caracteres con una minúscula, una mayúscula y un número.
- La contraseña se puede mostrar con el icono del ojo, por eso no hay campo «repetir contraseña».

### CU-02 · Iniciar sesión

**Actor:** usuario registrado.

1.  Introduce su email y su contraseña.
2.  Pulsa «Iniciar sesión».
3.  Si es su primera vez, pasa al onboarding (CU-03).
4.  Si tiene más de una oposición, elige con cuál entra (CU-04).

### CU-03 · Onboarding inicial

**Actor:** usuario que entra por primera vez. **Obligatorio.**

1.  Elige qué oposiciones prepara (una o varias).
2.  Configura su horario de estudio por defecto, uno por oposición.
3.  Si está en un ordenador, elige la interfaz (ordenador, o tablet y móvil) con una pequeña vista previa de cada una.

**Reglas**

**Añadir otra oposición más adelante:** salta un mini onboarding solo para esa oposición.

### CU-04 · Elegir la oposición activa

**Actor:** usuario con más de una oposición.

1.  Al entrar, la app pregunta siempre con qué oposición quiere trabajar.
2.  La oposición activa se puede cambiar en cualquier momento con el selector.

**Reglas**

- Con una sola oposición no se pregunta.
- En ordenador, el selector está en el sidebar.
- En tablet y móvil, el selector es el nombre de la oposición en la cabecera de la pantalla, con una flecha.

### CU-05 · Resolver y cambiar la interfaz

**Actor:** usuario. Hay dos interfaces: **ordenador** (sidebar que se colapsa a iconos con tooltip) y **tablet y móvil** (barra inferior flotante, solo con iconos). Las dos tienen las mismas funcionalidades; solo cambia la colocación.

1.  Detecta el tipo de dispositivo por **pantalla táctil más ancho de pantalla**. El iPad Pro de 13" usa la interfaz de tablet; solo los portátiles usan el sidebar.
2.  Si hay una preferencia guardada en la **caché de este dispositivo**, manda esa.
3.  Si no, usa la **preferencia por defecto de la cuenta** para ese tipo de dispositivo.
4.  Si es un dispositivo nuevo, aplica la de la cuenta y muestra una **burbuja** que ofrece cambiarla y lleva a Ajustes.
5.  Si no hay nada guardado en ningún sitio: en ordenador la app pregunta; en tablet y móvil sale la barra inferior.

**Reglas**

- La burbuja desaparece sola al cabo de un rato y tiene «no volver a mostrar en este dispositivo», guardado en la caché.
- Al cambiar la interfaz desde Ajustes, la app pregunta si se aplica a la **cuenta** (por defecto para ese tipo de dispositivo) o **solo a este dispositivo** (caché).

## 3. Estudio

**Navegación principal** (por oposición activa): Temario oficial · Apuntes · Exámenes · Simulacros por tema · Planner.

### CU-06 · Ver la home

**Actor:** usuario, con una oposición activa.

- Un pequeño calendario con lo que le toca **hoy**.
- Su **racha** de días.
- Los **bloques ya estudiados** y los **más flojos**.
- El **juego de verdadero/falso** (CU-11).
- Arriba, la **fecha prevista** del examen de esa oposición.

**Reglas**

La racha cuenta los días seguidos que el usuario entra y hace algo en las pestañas de estudio (por ejemplo, abrir apuntes). El verdadero/falso no cuenta. La racha es **por usuario**, no por oposición.

### CU-07 · Hacer un examen

**Actor:** usuario. Sirve para **medirse** en condiciones reales.

1.  Elige un examen: **oficial** de convocatorias anteriores, o un **batiburrillo** de preguntas.
2.  Lo hace con **temporizador**, sin explicaciones durante el examen.
3.  Al terminar ve su resultado: **tiempo total** y **media por pregunta**.
4.  El sistema le **recomienda qué bloques practicar** según su porcentaje de error por bloque.
5.  El examen queda en su **historial**, con estadísticas de lo que más falla.
6.  Se registra solo en el **planner** (CU-10).

**Reglas**

- Las explicaciones solo existen en los simulacros por tema, no en los exámenes.
- Los exámenes oficiales llevan las preguntas de reserva; las anuladas no aparecen.

### CU-08 · Hacer un simulacro por tema

**Actor:** usuario. Sirve para **repasar** los temas conforme los estudia, o uno concreto cuando quiera.

1.  Elige un tema.
2.  La app mezcla preguntas de ese tema. También puede plantear **casos prácticos**, siempre tipo test.
3.  Al fallar una pregunta, ve **la respuesta correcta y su razonamiento** en ese momento.

**Reglas**

El razonamiento va guardado con cada pregunta en la base de datos.

### CU-09 · Marcar un bloque como estudiado

**Actor:** usuario.

1.  Marca un bloque como estudiado. Aparece como «hecho» en la home.
2.  Puede desmarcarlo cuando quiera.

**Reglas**

«Estudiado» lo decide el usuario. El porcentaje de aciertos es solo para saber qué tal lo lleva; no marca el bloque.

### CU-11 · Jugar al verdadero/falso

**Actor:** usuario, desde la home.

1.  Aparecen cards con afirmaciones de su oposición.
2.  Responde verdadero o falso (posible formato swipe, por ver).

**Reglas**

- Las afirmaciones se generan a partir del banco de preguntas de la oposición.
- Solo se usan las preguntas marcadas como **aptas para verdadero/falso**.
- Las respuestas **no cuentan** para estadísticas ni para la racha.

## 4. Planner y apuntes

### CU-10 · Usar el planner

**Actor:** usuario. Calendario para planificar y registrar lo que hace cada día. Hay **un calendario por oposición**.

1.  Ve su semana en **vista semanal con horas**.
2.  Crea tareas de **texto libre** con hora de inicio y fin.
3.  Mueve y redimensiona tareas con **drag and drop**.
4.  Marca cada tarea como hecha con un **checkbox**.

**Reglas**

- **Horario por defecto:** se configura en el onboarding y después se puede editar.
- **Solapes:** las tareas se pueden solapar. Si choca con el calendario de otra oposición, la app **avisa** pero deja guardar.
- **Exámenes y simulacros:** se apuntan solos con su hora real. Son un **registro**: no se editan ni se borran.
- **Fecha prevista del examen:** la pone el administrador, una por oposición. Sale en el calendario y arriba en la app.
- **Calendario completo:** «ver mi calendario completo» junta todas sus oposiciones, cada una con su **color** y una etiqueta en tooltip.
- **Campanita:** el planner es solo para consultar, sin recordatorios. La campanita avisa de **todo lo que queda por resolver**.

### CU-12 · Gestionar apuntes

**Actor:** usuario. Sirven para leer su propio material desde la app.

1.  Crea un apunte subiendo un **PDF** o escribiendo en un **editor de texto tipo Word**.
2.  Lo asocia siempre a un **bloque** de la oposición.
3.  Puede organizarlos en **carpetas**.

**Reglas**

- Los apuntes son **privados** de cada usuario.
- **No cuentan** para las preguntas del temario: son material aparte.
- Compartirlos con otros usuarios (por ejemplo, grupos) queda para más adelante.

## 5. Administrador

### CU-13 · Gestionar temario y preguntas

**Actor:** administrador, desde el **modo administrador**.

1.  Añade y edita el temario de cada oposición.
2.  Añade preguntas tipo test, cada una con su **razonamiento** de la respuesta correcta.
3.  Crea **casos prácticos**, siempre tipo test.
4.  Marca qué preguntas son **aptas para verdadero/falso**.

**Reglas**

- El contenido es independiente por oposición: si una pregunta vale para varias, se carga en cada una.
- El banco de preguntas y los casos prácticos son propios.

### CU-14 · Importar un examen oficial

**Actor:** administrador.

1.  Sube el examen en un **formato específico** que sigue al oficial, por número de pregunta.
2.  El sistema valida el archivo.
3.  Si hay errores, **avisa de lo que falla**.

**Reglas**

- Se cargan las **preguntas de reserva**.
- Las **anuladas no se suben**.
- Los exámenes oficiales los descarga el administrador.

### CU-15 · Fijar la fecha prevista del examen

**Actor:** administrador.

1.  Fija la fecha prevista de cada oposición, una por oposición.
2.  La fecha aparece en el calendario de los usuarios y arriba en la app.

## 6. Entidades

No es un modelo cerrado: recoge lo que piden los casos de uso. Los nombres, campos y relaciones exactas se deciden al diseñar la base de datos.

| Entidad                 | Qué guarda                                                                                         | Sale de                    |
|-------------------------|----------------------------------------------------------------------------------------------------|----------------------------|
| Usuario                 | Nombre, apellidos, email, contraseña, email verificado, rol (usuario o administrador)              | CU-01, CU-02, CU-13        |
| Oposición               | Nombre, fecha prevista del examen, color                                                           | CU-10, CU-15               |
| Inscripción             | Qué oposiciones prepara cada usuario                                                               | CU-03                      |
| Preferencia de interfaz | Por usuario y tipo de dispositivo (ordenador o tablet/móvil)                                       | CU-05                      |
| Bloque y tema           | Temario de cada oposición; si el usuario ha marcado el bloque como estudiado                       | CU-08, CU-09, CU-13        |
| Pregunta y opciones     | Enunciado, opciones, respuesta correcta, razonamiento, apta para verdadero/falso, si es de reserva | CU-08, CU-11, CU-13, CU-14 |
| Caso práctico           | Supuesto con sus preguntas tipo test                                                               | CU-08, CU-13               |
| Examen                  | Oficial o batiburrillo, sus preguntas                                                              | CU-07, CU-14               |
| Intento                 | Usuario, respuestas, aciertos y fallos, tiempo total, inicio y fin                                 | CU-07, CU-08               |
| Tarea del planner       | Texto, inicio, fin, hecha, oposición, si es un registro automático                                 | CU-10                      |
| Horario por defecto     | Por usuario y oposición                                                                            | CU-03, CU-10               |
| Apunte y carpeta        | PDF o texto enriquecido, bloque, carpeta, propietario                                              | CU-12                      |
| Actividad diaria        | Días con actividad de estudio, para la racha                                                       | CU-06                      |

**En el navegador (caché del dispositivo):** la preferencia de interfaz de ese dispositivo y el «no volver a mostrar» de la burbuja.

## 7. Guía de desarrollo

|                      |                                                                                                                                                                            |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Front**            | Angular 22: componentes standalone, signals y NgRx SignalStore. Bootstrap 5 compilado desde SCSS con la paleta de marca. ngx-translate para los textos. Vitest para tests. |
| **Back**             | Java con Spring Boot y PostgreSQL.                                                                                                                                         |
| **Interfaz**         | Marca propia (teal, naranja, cian, amarillo sobre crema, tipografía Nunito) y un set de iconos SVG propio.                                                                 |
| **Flujo de trabajo** | Una rama y una pull request por cambio contra `main`. Commits en inglés con Conventional Commits.                                                                          |

**Orden de construcción.** Cada fase deja algo que funciona de punta a punta y se apoya en la anterior.

| Fase | Qué se construye                                                                        | Casos de uso        |
|------|-----------------------------------------------------------------------------------------|---------------------|
| 1    | Registro, verificación de email, login y roles. Las dos navegaciones responsive, vacías | CU-01, CU-02        |
| 2    | Oposiciones, inscripción, onboarding y selector de oposición activa                     | CU-03, CU-04        |
| 3    | Modo administrador: temario, preguntas y casos prácticos                                | CU-13               |
| 4    | Simulacro por tema y marcar bloques como estudiados                                     | CU-08, CU-09        |
| 5    | Exámenes, importación de oficiales y fecha prevista                                     | CU-07, CU-14, CU-15 |
| 6    | Home con racha y bloques, y la lógica de preferencia de interfaz                        | CU-06, CU-05        |
| 7    | Planner                                                                                 | CU-10               |
| 8    | Apuntes                                                                                 | CU-12               |
| 9    | Juego de verdadero/falso                                                                | CU-11               |

El modo administrador va en la fase 3 porque sin preguntas cargadas no se puede probar ningún test. Cada caso de uso puede ser una issue en GitHub: sus reglas son los criterios de aceptación, y cada regla, un test.

## 8. Pendiente de decidir

- Pantalla del **examen en curso**: navegación entre preguntas, marcar para revisar, entregar.
- Pantalla de **resultados** del examen.
- **Puntuación**: si hay penalización por fallo y con qué fórmula en cada oposición.
- **Estructura de cada examen** por oposición: número de preguntas, tiempo, partes.
- **Simulacro por tema**: si se puede elegir más de un tema, cuántas preguntas y si lleva tiempo.
- **Verdadero/falso**: formato (swipe u otro).
- **Formato del archivo de importación** de exámenes (Excel, CSV, JSON…).
- **Recuperar contraseña.**
- **Puntos de corte** exactos de la detección táctil más ancho, y qué ve un portátil táctil.
- **Calendario completo**: si se puede editar desde ahí o solo consultar.
- **Campanita**: qué cuenta exactamente como «por resolver».
- **Compartir apuntes** con grupos (más adelante).
- **Librerías**: editor tipo Word (ngx-quill, Tiptap…) y calendario (FullCalendar…), evaluadas pero sin elegir.
