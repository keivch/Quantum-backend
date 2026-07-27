# Uso de Inteligencia Artificial

Durante el desarrollo de este proyecto se utilizaron herramientas de inteligencia artificial como apoyo, principalmente **Cursor**, sin delegar en ellas las decisiones centrales de arquitectura ni la revisión final del código.

## Herramientas utilizadas

* Cursor y sus funciones de asistencia mediante inteligencia artificial.

## Tareas en las que se utilizó IA

La IA se utilizó principalmente para:

* Apoyar la implementación de los tickets y funcionalidades definidas.
* Generar fragmentos iniciales de código.
* Proponer implementaciones para controladores, servicios y acceso a datos.
* Identificar posibles errores y oportunidades de mejora durante la revisión del código.
* Agilizar tareas repetitivas de implementación.

## Contexto proporcionado

Para obtener respuestas útiles, se proporcionó a la herramienta el contexto disponible en el repositorio, incluyendo:

* La estructura de los proyectos.
* La arquitectura definida manualmente.
* Los modelos de la base de datos.
* Los archivos relacionados con cada funcionalidad.
* Los requisitos y criterios de aceptación de los tickets.
* Las convenciones y patrones utilizados en el resto del proyecto.

Las solicitudes se realizaron sobre funcionalidades concretas y posteriormente se revisaron los cambios propuestos antes de incorporarlos.

## Propuestas descartadas o corregidas

En una de las implementaciones sugeridas, la IA incluyó lógica de negocio directamente en los controladores.

Esta propuesta fue corregida porque generaba controladores con demasiadas responsabilidades y no respetaba la separación de capas definida para el proyecto. La lógica de negocio se trasladó a servicios, dejando en los controladores únicamente la recepción de solicitudes, la validación básica de entrada y la coordinación de las respuestas.

También se ajustaron las instrucciones posteriores dadas a la herramienta para indicarle explícitamente que la lógica de negocio debía implementarse en la capa de servicios y no en los controladores.

## Trabajo realizado manualmente

Las siguientes actividades fueron realizadas manualmente:

* Creación inicial de los proyectos.
* Definición de la estructura del repositorio.
* Diseño de la arquitectura de la solución.
* Creación de los modelos de la base de datos.
* Revisión y auditoría del código generado con asistencia de IA.
* Refactorización de responsabilidades entre controladores y servicios.
* Corrección de implementaciones que no respetaban los patrones establecidos.
* Validación de la coherencia del código con el resto del proyecto.

El código sugerido por la IA no se incorporó de manera automática. Cada cambio fue revisado y, cuando fue necesario, modificado o reescrito.

## Validación de la solución

La solución se comprobó mediante la revisión manual y auditoría del código implementado. Se verificó especialmente que:

* Se respetara la arquitectura definida.
* La lógica de negocio permaneciera en los servicios.
* Los controladores no tuvieran responsabilidades adicionales.
* Los modelos y operaciones fueran coherentes con la estructura de la base de datos.
* Los cambios no afectaran negativamente otras funcionalidades del proyecto.
* No se incorporaran credenciales, datos sensibles o configuraciones inseguras.
* Las implementaciones fueran comprensibles y mantenibles.

La responsabilidad sobre la versión final del código y su integración en el proyecto fue asumida por el desarrollador.

## Decisiones no delegadas a la IA

La definición de la arquitectura, la estructura de los proyectos y los modelos de la base de datos no se delegó a la IA.

Estas decisiones se realizaron manualmente porque determinan la organización, mantenibilidad y evolución futura de la solución. La IA se utilizó como una herramienta de apoyo para la implementación, pero no como responsable de las decisiones técnicas o de producto.
