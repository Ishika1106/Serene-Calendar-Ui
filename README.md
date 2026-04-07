# Serene Calendar UI

A beautiful, interactive wall calendar with glassmorphism design built with Next.js 16, React, and Tailwind CSS.

## Design Choices

### Architecture
- **Next.js 16 with App Router**: Uses React Server Components where possible, with 'use client' for interactive components
- **Component Structure**: Separated into focused components (CalendarGrid, NotesSection, Clock, MiniWhiteboard) for maintainability
- **State Management**: Uses React useState/useReducer for local state, useLocalStorage for persisting user preferences

### Performance Optimizations
- **Isolated Clock Component**: The Clock component runs its own timer with useEffect, preventing re-renders of the entire WallCalendar every second
- **React.memo on CalendarGrid**: Memoized to prevent unnecessary re-renders when parent components update
- **useCallback for Event Handlers**: Prevents creating new function references on each render

### Features
- **Month Navigation**: j/k keyboard shortcuts for Vim-style navigation, plus arrow buttons
- **Date Selection**: Click to select start/end dates, drag to select ranges
- **Notes with Markdown**: Notes section supports markdown rendering with syntax highlighting (react-markdown + react-syntax-highlighter)
- **Customizable Clock**: Three styles - digital, analog, minimal
- **Opacity Control**: Adjustable card opacity (5-100%), switches to dark text at 100% for visibility
- **Holidays**: Pre-defined holidays with dot indicators and popup on click
- **Infinite Scroll**: CalendarGrid supports virtualized scrolling for future expansion

### Styling
- **Glassmorphism**: Semi-transparent cards with blur effects using rgba backgrounds
- **Responsive**: Works on mobile and desktop
- **Animations**: Framer Motion for smooth transitions and hover effects
- **Theme**: Dark green gradient background with pastel light green when opacity is high

## Running Locally

1. Navigate to the project directory:
   ```bash
   cd wall-calendar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Building for Production

```bash
npm run build
```

The production build will be in the `.next` directory. To start the production server:

```bash
npm start
```

## Keyboard Shortcuts

- `j` - Go to previous month
- `k` - Go to next month
- Arrow keys - Navigate days (when focused)