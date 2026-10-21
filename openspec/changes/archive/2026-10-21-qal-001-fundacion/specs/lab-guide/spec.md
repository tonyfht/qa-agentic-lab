# Spec Delta — lab-guide

## Purpose

Define la guía del laboratorio, el README que conduce la visita, para que cualquiera, sepa o no de QA, recorra y
ejecute el laboratorio sin ayuda.

## ADDED Requirements

### Requirement: QA-030 Identidad y propósito a primera vista
El README SHALL abrir con el logo de QA Agentic Lab y un párrafo que explique, sin jerga, qué es el laboratorio y qué se aprende en él.

#### Scenario: Primera visita
- **WHEN** alguien abre el repositorio en GitHub
- **THEN** ve el logo y el párrafo de propósito sin desplazarse

#### Scenario: Tema oscuro
- **WHEN** alguien abre el README con GitHub en tema oscuro
- **THEN** el logo se ve con contraste suficiente

### Requirement: QA-031 Ruta de la visita
El README SHALL incluir una ruta de la visita numerada. Cada paso SHALL decir qué abrir, con un enlace, y qué se debe ver. Todos los enlaces internos de la ruta SHALL apuntar a ficheros o secciones existentes.

#### Scenario: Seguir la ruta
- **WHEN** alguien sigue los pasos en orden
- **THEN** cada enlace abre lo que el paso anuncia y lo que se ve coincide con lo descrito

#### Scenario: Enlace roto
- **GIVEN** un paso de la ruta que enlaza a un fichero que ya no existe
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa de análisis estático falla señalando el enlace roto

### Requirement: QA-032 Diagramas del laboratorio
El README SHALL incluir, como diagramas que GitHub muestra como imagen, el ciclo SDD (spec → código → Gherkin → pruebas → informe) y el pipeline con sus etapas reales.

#### Scenario: Pipeline coherente con el diagrama
- **WHEN** se compara el diagrama del pipeline con las etapas de una ejecución en GitHub Actions
- **THEN** aparecen las mismas etapas en el mismo orden

#### Scenario: Diagrama roto
- **GIVEN** un diagrama con sintaxis inválida
- **WHEN** se ejecuta el pipeline
- **THEN** la etapa de análisis estático falla señalando el diagrama

### Requirement: QA-033 Ejecútalo tú
El README SHALL explicar cómo ejecutar el laboratorio en local, con los requisitos previos y un único comando para la tienda y otro para todo el pipeline, y cómo lanzarlo en GitHub Actions desde la interfaz.

#### Scenario: Ejecución en local siguiendo el README
- **GIVEN** una máquina con los requisitos previos indicados
- **WHEN** alguien ejecuta los comandos del README tal como están escritos
- **THEN** la tienda queda disponible en `http://localhost:3400` y el pipeline completo termina con su informe

#### Scenario: Requisito previo ausente
- **GIVEN** una versión de Node inferior a la indicada
- **WHEN** se ejecuta el comando de instalación
- **THEN** se muestra un error que indica la versión necesaria

### Requirement: QA-034 La guía crece con cada cambio
Cada cambio que añada algo visible SHALL actualizar la ruta de la visita y los diagramas afectados. La plantilla de Pull Request SHALL incluirlo en su lista de comprobación.

#### Scenario: Cambio con algo visible
- **GIVEN** un PR que añade una funcionalidad a la tienda
- **WHEN** se revisa
- **THEN** su lista de comprobación indica qué paso de la ruta se añadió o se actualizó

#### Scenario: Cambio sin nada visible
- **GIVEN** un PR de mantenimiento interno
- **WHEN** se revisa
- **THEN** la lista de comprobación permite marcar "sin cambios visibles" de forma explícita
