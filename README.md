# 💰 XPENSES GAME — Dividí bien. Gastá mejor.

La aplicación de finanzas compartidas diseñada específicamente para parejas y amigos que buscan una forma ágil, visual y gamificada de gestionar sus gastos.

---

## 🚀 Guía de Instalación Rápida

Para poner la app en funcionamiento en tu PC:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/xpenses-game.git
   cd xpenses-game
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar el entorno**:
   Copia el archivo `.env.local.example` a `.env.local` y completa tus credenciales de Supabase:
   ```bash
   cp .env.local.example .env.local
   # Luego edita .env.local con tu URL y ANON_KEY
   ```

4. **Levantar el servidor**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ☁️ Configuración de Supabase (Backend)

Para que el login y el registro funcionen, debes seguir estos pasos en tu proyecto de [Supabase](https://supabase.com):

1. **Tablas SQL**:
   Copia el contenido del archivo `supabase_schema.sql` (en la raíz de este proyecto) y pégalo en el **SQL Editor** de tu panel de Supabase. Dale a "Run".

2. **Autenticación**:
   - Ve a **Authentication** → **Providers**.
   - Habilita **Email/Password**.
   - Habilita **Google** y/o **Microsoft** si deseas soporte para OAuth. Mira la guía detallada en `gui-config-auth.md`.

3. **URLs de Redirección**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

---

## 🛠️ Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos & Auth**: Supabase
- **Estilos**: Vanilla CSS con Variables Dinámicas (Temas)
- **Gráficos**: Chart.js / Lucide React

---

## 🎨 Sistema de Temas

La app soporta 6 paletas de colores vibrantes configurables por cada grupo:
- 💜 **Violet** (Original)
- 💚 **Emerald** (Ecológico)
- 💖 **Rose** (Moderno)
- 🧡 **Amber** (Clásico)
- 💎 **Cyan** (Tecnológico)
- 📽️ **Slate** (Dark Mode Pro)

---

## 🛡️ Seguridad (GitHub)

**IMPORTANTE**: Nunca subas el archivo `.env.local` a GitHub. Está incluido en el `.gitignore` por defecto. Tus API Keys son privadas.

Hecho con ❤️ para **Xpenses Game**.
