
# PromoterFlow - Sistema de Gestión de Campo con IA

Aplicación integral para el registro, seguimiento en tiempo real y análisis de desempeño de promotores.

## Despliegue en Vercel

1. Sube este código a un repositorio de GitHub.
2. En Vercel, selecciona "New Project" e importa el repositorio.
3. **IMPORTANTE:** En la sección "Environment Variables", añade la siguiente:
   - `API_KEY`: Tu clave de API de Google AI Studio (Gemini).
4. Haz clic en "Deploy".

## Despliegue en GitHub Pages
*Nota: GitHub Pages no soporta variables de entorno del lado del servidor de forma nativa para SPAs sin un proceso de build intermedio. Se recomienda Vercel para este proyecto.*

## Características
- **Modo Admin:** Control de usuarios, roles, zonas y envío de amonestaciones/avisos.
- **Modo Gestor:** Registro de actividades con fotos, contactos comunitarios y GPS.
- **IA Generativa:** Resúmenes ejecutivos e informes finales automáticos.
- **PWA Ready:** Instalable en iOS y Android.
