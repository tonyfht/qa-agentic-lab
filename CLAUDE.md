@AGENTS.md

---

# Instrucciones para Claude Code

## Idioma

Responder siempre en **español**. Código y comentarios en el idioma que ya use el fichero (generalmente inglés técnico).

## Flujo de trabajo SDD

Antes de escribir código (de la tienda o de pruebas):

1. Confirmar que existe un cambio de OpenSpec con `proposal.md` **aprobado** que lo cubra.
2. Si no existe, crearlo y esperar validación antes de implementar.
3. No interpretar "cuéntame cómo lo harías" como autorización para implementar.

## Estilo de colaboración

- **Preguntar dirección** antes de construir UI significativa nueva: proponer la dirección de diseño y esperar
  confirmación. Este proyecto se enseña a clientes: lo visible importa.
- **Analizar primero** cuando se revisan fallos: dar el diagnóstico directamente.
- **No resumir** al final lo que se acaba de hacer; el diff habla por sí solo.
- **Pensar en la demo**: cada cambio debe poder explicarse a un cliente en un minuto. Si no se puede, sobra o está mal
  partido.
