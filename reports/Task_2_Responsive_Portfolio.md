# Task 2 - Responsive Portfolio

The portfolio is the home page of the project. I kept the structure deliberately simple: an introduction, two project case studies, a skills section, a short profile, and links to the code and LinkedIn announcement. The page is built in React with custom CSS rather than a component template.

## Decisions I made

- Used semantic sections, headings, navigation, links, and buttons so the page still makes sense without its visual styling.
- Built the layout with CSS Grid and Flexbox, then changed the composition at 980 px, 720 px, and 430 px instead of shrinking the desktop version.
- Added a real mobile menu with an announced expanded state, visible keyboard focus, and large touch targets.
- Respected `prefers-reduced-motion` and used WebP images for the storefront previews.
- Linked the portfolio directly to the task dashboard, store, repository, LinkedIn post, and downloadable resume.

## What I checked

The Vite production build completes successfully, and a component test confirms that the main introduction and project action render. I also reviewed the page in a desktop viewport and at 390 × 844. The mobile menu, stacked project cards, typography, and footer remain usable without horizontal scrolling.

The biggest adjustment was spacing on the narrow layout. Keeping the desktop spacing made the page feel slow and oversized on a phone, so I reduced section gaps and let the project previews stack earlier while keeping the same content order.
