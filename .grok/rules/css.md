# CSS

This project uses custom CSS. Follow these standards:

- **Use rem units** instead of px (e.g., `.75rem` not `12px`)
- **Use CSS custom properties** (e.g., `var(--spacing-single)`) instead of hardcoded values for padding, margin, and gap
- **Never use `--spacing-*` variables for width/height** - use rem or px values instead
- **No leading zeros** in decimal values (e.g., `.9375rem` not `0.9375rem`)
- **No fallback values** in CSS variables unless absolutely necessary
- **Use `background-color`** instead of the `background` shorthand
- **Use `border: 0`** instead of `border: none`
- **SVG icons**: Use `currentColor` in SVGs and CSS `mask` property for colorization
- **Don't add unnecessary font declarations** if they're inherited from parent elements
- **Prefer flexbox over CSS grid** for layouts - use `display: flex` with `flex-wrap: wrap` for multi-column layouts instead of `display: grid`

**Brand colors (CSS custom properties in `src/styles/partials/variables.css`):**
- Primary: `--color-primary`, `--color-primary-dark`, `--color-primary-semidark`, `--color-primary-light`
- Secondary: `--color-secondary`, `--color-secondary-dark`, `--color-secondary-semidark`, `--color-secondary-light`
- Tertiary: `--color-tertiary`, `--color-tertiary-dark`, `--color-tertiary-light`

## Class names

Component styles use CSS Modules. The file is the block. A modifier is its own class. Use camelCase.

```tsx
import styles from "./item.module.css";

className={`${styles.item} ${current ? styles.itemCurrent : ""}`}
```

```css
.item {}
.itemCurrent {}
```

Global CSS in `src/styles` uses BEM. Write those class names as strings.

```tsx
className="button button--primary"
```

```css
.button {}
.button--primary {}
.button__icon {}
```

## Media Query Organization

Screen widths live in `src/styles/partials/screens.css`.

**Structure media queries at the end of the file**, not nested inside selectors:

```css
/* Mobile-first base styles */
.list {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-single);
}

.title {
	font-size: 1.25rem;
}

/* Tablet styles */
@media (width >= 768px) {
	.list {
		flex-direction: row;
	}

	.title {
		font-size: 1.5rem;
	}
}

/* Laptop styles */
@media (width >= 1024px) {
	.title {
		font-size: 2rem;
	}
}
```

**Key principles:**
- Write mobile-first base styles at the top
- Use only these widths, in this order: xs `520px`, sm `640px`, md `768px`, lg `1024px`, xl `1280px`
- Group each width in one `@media` block at the end of the file
- Write the query as `(width >= 768px)` for tablet. Copy the px value from `screens.css`
- `var(--screen-md)` does not work inside `@media`
- Add a comment header before each block, such as `/* Tablet styles */` and `/* Laptop styles */`
- Only include properties that change at that breakpoint
