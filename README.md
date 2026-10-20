# Agente de intake legal — Demo funcional

Demo funcional de un agente de intake 24/7 para un despacho de abogados en Panamá.
Califica consultas en **inglés, español y alemán**, captura un lead estructurado y **nunca da asesoría legal**.

**Demo en vivo:** https://ricardochen.github.io/kramer-demo-intake/

## Qué demuestra

- Respuesta en segundos, en el idioma del visitante (EN / ES / DE).
- Calificación progresiva: servicio → nacionalidad → ubicación → plazo → contacto.
- Guardrail duro: no interpreta casos, no dice si calificas, no cotiza honorarios, no promete aprobación.
- Cada respuesta se limita a la base de conocimiento del despacho.

## Stack

- Página estática (Tailwind por CDN, sin build).
- Motor: edge function `kraemer-chat` en Supabase (DeepSeek `deepseek-v4-flash`).
- Sin formulario: el chat es el único canal de captura.

## Publicar cambios

`git push` a `main` — GitHub Pages sirve desde la raíz.

## Notas

- Los datos del despacho son de ejemplo; el demo no está publicado bajo el dominio del cliente.
- La tarjeta `og-card.png` es 1200×630 (1.91:1) para que el preview de LinkedIn no recorte.
