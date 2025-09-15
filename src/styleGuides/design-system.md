# ValueMomentum AI & Emerging Tech Design System

This document defines the design system for the ValueMomentum Emerging Tech Demo Portal. It provides a comprehensive guide for maintaining visual consistency across all portal components.

## Color Palette

### Primary Colors
- **Primary Blue**: `#1E40AF` - Used for primary buttons, active states, and important UI elements
- **Primary Dark Blue**: `#1E3A8A` - Used for button hover states and secondary emphasis
- **Primary Light Blue**: `#93C5FD` - Used for backgrounds, cards, and highlighting

### Secondary Colors
- **Accent Purple**: `#7C3AED` - Used for AI-specific elements and innovation highlights
- **Accent Teal**: `#0D9488` - Used for secondary actions and technology elements

### Neutral Colors
- **Dark Gray**: `#1F2937` - Used for text and footer background
- **Medium Gray**: `#4B5563` - Used for secondary text and icons
- **Light Gray**: `#F3F4F6` - Used for backgrounds and subtle UI elements
- **White**: `#FFFFFF` - Used for card backgrounds and text on dark backgrounds

### Semantic Colors
- **Success**: `#10B981` - Used for success states and confirmations
- **Warning**: `#F59E0B` - Used for warnings and cautionary elements
- **Error**: `#EF4444` - Used for errors and destructive actions
- **Info**: `#3B82F6` - Used for informational states

### Opacity Modifiers
- Use opacity modifiers for creating subtle variations:
  - `primary/5` - Very subtle background (5% opacity)
  - `primary/10` - Subtle background (10% opacity)
  - `primary/20` - Light background (20% opacity)
  - `primary-light/20` - Light accent background (20% opacity)

## Typography

### Font Families
- **Heading Font**: Inter, system-ui, sans-serif
- **Body Font**: Inter, system-ui, sans-serif

### Font Sizes
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)

### Font Weights
- **normal**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

### Text Effects
- **text-gradient**: Apply gradient effect to text using `text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-accent-purple`
- **text-balance**: Apply balanced text wrapping with `text-wrap: balance`

## Spacing

We follow a 4-point spacing system:

- **0**: 0
- **1**: 0.25rem (4px)
- **2**: 0.5rem (8px)
- **3**: 0.75rem (12px)
- **4**: 1rem (16px)
- **5**: 1.25rem (20px)
- **6**: 1.5rem (24px)
- **8**: 2rem (32px)
- **10**: 2.5rem (40px)
- **12**: 3rem (48px)
- **16**: 4rem (64px)

## Shadow

- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **default**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **Card Shadow**: `0 4px 20px -5px rgba(0, 0, 0, 0.1), 0 2px 10px -5px rgba(0, 0, 0, 0.04)`
- **Card Hover Shadow**: `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 15px -5px rgba(0, 0, 0, 0.05)`

## Border Radius

- **none**: 0
- **sm**: 0.125rem (2px)
- **default**: 0.25rem (4px)
- **md**: 0.375rem (6px)
- **lg**: 0.5rem (8px)
- **xl**: 0.75rem (12px)
- **2xl**: 1rem (16px)
- **full**: 9999px

## Transitions

- **fast**: 150ms
- **normal**: 300ms
- **slow**: 500ms

## AI-Themed Elements

### Patterns & Backgrounds
- **Circuit Pattern**: Background pattern used for hero sections and cards
  ```jsx
  <div className="pattern-circuit opacity-[0.03]"></div>
  ```

### Animations
- **Data Points**: Animated dots that appear in backgrounds to create a data-visualization effect
  ```jsx
  <div className="data-points">
    {[...Array(20)].map((_, i) => (
      <div 
        key={i}
        className="data-point"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      ></div>
    ))}
  </div>
  ```

- **Pulse**: Pulsing animation for emphasizing elements
  ```jsx
  <div className="animate-[pulse_3s_infinite]"></div>
  ```

- **Shine**: Moving gradient effect for buttons
  ```jsx
  <button className="btn-ai">Button Text</button>
  ```

- **FadeIn**: Smooth entrance animation for content
  ```jsx
  <div className="animate-[fadeIn_0.3s_ease-in]"></div>
  ```

### Gradients
- **Text Gradient**: Gradient applied to text
  ```jsx
  <h1 className="text-gradient">Heading</h1>
  ```

- **Button Gradient**: Gradient background for buttons
  ```jsx
  <button className="btn-ai">Button Text</button>
  ```

- **Border Gradient**: Gradient applied to borders or underlines
  ```jsx
  <div className="bg-gradient-to-r from-primary-light via-primary to-accent-purple"></div>
  ```

## Components

### Header

The header is the main navigation component that appears at the top of every page.

```jsx
<header className="ai-header">
  <div className="container mx-auto px-4 py-3 flex justify-between items-center">
    <!-- Logo and navigation -->
  </div>
</header>
```

### Footer

The footer contains copyright information and links to important pages.

```jsx
<footer className="ai-footer">
  <div className="container mx-auto px-4">
    <!-- Footer content -->
  </div>
</footer>
```

### Main Content Container

The main content container wraps all page content.

```jsx
<main className="flex-grow container mx-auto px-4 py-8">
  <!-- Page content -->
</main>
```

### Cards

AI-themed cards with hover effects and top gradient border.

```jsx
<div className="ai-card">
  <!-- Card content -->
</div>
```

### Buttons

#### Primary AI Button
```jsx
<button className="btn-ai">
  Button Text
</button>
```

#### Secondary Button
```jsx
<button className="btn-secondary">
  Button Text
</button>
```

#### Success Button
```jsx
<button className="btn-success">
  Button Text
</button>
```

#### Danger Button
```jsx
<button className="btn-danger">
  Button Text
</button>
```

### Glass Card Effect

Semi-transparent card with backdrop blur.

```jsx
<div className="glass-card">
  <!-- Card content -->
</div>
```

### Notifications

#### Success Notification
```jsx
<div className="bg-green-50 border-l-4 border-success text-success p-4 rounded shadow animate-[fadeIn_0.3s_ease-in] flex items-center">
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
  Success message
</div>
```

#### Error Notification
```jsx
<div className="bg-red-50 border-l-4 border-error text-error p-4 rounded shadow animate-[fadeIn_0.3s_ease-in] flex items-center">
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  Error message
</div>
```

## CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #1E40AF;
  --color-primary-dark: #1E3A8A;
  --color-primary-light: #93C5FD;
  --color-accent-purple: #7C3AED;
  --color-accent-teal: #0D9488;
  --color-dark-gray: #1F2937;
  --color-medium-gray: #4B5563;
  --color-light-gray: #F3F4F6;
  --color-white: #FFFFFF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
}

/* Dark mode variables */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #3B82F6;
    --color-primary-dark: #2563EB;
    --color-primary-light: #60A5FA;
    --color-dark-gray: #E5E7EB;
    --color-medium-gray: #9CA3AF;
    --color-light-gray: #111827;
    --color-white: #1F2937;
  }
}
```

## Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Accessibility

- Text should maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text
- Interactive elements should have a focus state with a visible outline
- All interactive elements should be keyboard accessible
- Animations should respect user preferences for reduced motion

## Dark Mode

Dark mode should be implemented consistently across all components using CSS variables for color switching. All AI-themed elements should have appropriate dark mode versions. 