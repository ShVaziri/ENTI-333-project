# UCalgary Student Textbook Marketplace - Design Guidelines

## Design Approach
**Hybrid Reference-Based:** Drawing from modern marketplace aesthetics (Airbnb's card design, Facebook Marketplace's functional layout) combined with campus-community feel. Prioritizing quick scanning, trust-building, and efficient transactions between students.

## Typography System
- **Primary Font:** Inter or DM Sans from Google Fonts - clean, readable, modern
- **Headings:** Font weight 700, sizes: text-3xl (hero), text-2xl (page titles), text-xl (section headers), text-lg (card titles)
- **Body Text:** Font weight 400, text-base for descriptions, text-sm for metadata (price, condition, course codes)
- **Course Codes:** Font weight 600, uppercase, text-sm for prominence and scannability
- **Accent Elements:** Font weight 500 for buttons, badges, and calls-to-action

## Layout & Spacing System
**Spacing Units:** Consistently use Tailwind units of 2, 4, 6, 8, 12, and 16
- Component padding: p-4 or p-6
- Card spacing: gap-6 for grids, space-y-4 for vertical stacks
- Section margins: mb-8 or mb-12 between major sections
- Page containers: max-w-7xl mx-auto px-4

## Component Library

### Navigation Header
- Fixed top navigation with logo, search bar, and user menu
- Height: h-16
- Logo area includes UCalgary branding element
- Search bar prominently centered (min-w-96)
- Right side: "Post Listing" CTA button + avatar/login

### Hero Section (Homepage)
- Height: 60vh minimum
- **Hero Image:** Campus library or students studying with textbooks (subtle overlay for text readability)
- Centered content with heading + search interface
- Direct course code search input with prominent search button
- Quick filter pills below search (Popular courses: CPSC, ECON, MATH, etc.)
- Buttons on hero image use backdrop-blur-sm with semi-transparent backgrounds

### Listing Cards
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- Card structure: rounded-lg border with hover:shadow-lg transition
- Image: aspect-ratio-[3/4], object-cover, rounded-t-lg
- Content padding: p-4
- Course code badge: top-right absolute position on image
- Card includes: course code, title, author, price (large, bold), condition badge, timestamp
- CTA: "View Details" or "Message Seller" button at bottom

### Listing Detail Page
- Two-column layout: lg:grid-cols-5 gap-8
- Left column (lg:col-span-3): Image gallery with main image + thumbnails
- Right column (lg:col-span-2): Sticky sidebar with details
  - Course code prominently displayed
  - Title (text-2xl font-bold)
  - Author, condition badge, price (text-3xl font-bold)
  - Seller info card with avatar, name, joined date
  - "Message Seller" primary CTA button
  - Description section below details

### Search & Filters Sidebar
- Sticky sidebar: lg:w-64
- Filter sections with space-y-6
- Course code input with autocomplete
- Price range slider
- Condition checkboxes
- "Apply Filters" button at bottom

### Messaging Interface
- Split view: Conversations list (w-80) + Active chat area
- Conversation list: User avatar, name, listing thumbnail, last message preview
- Chat area: Messages with sender alignment (left for received, right for sent)
- Message bubbles: rounded-2xl with p-3
- Input area fixed at bottom with textarea + send button

### Seller Dashboard
- Tab navigation: "Active Listings" | "Sold" | "Messages"
- Active listings: Same card grid as browse page
- Each card has action buttons: "Mark as Sold" | "Edit" | "Delete"
- Empty states with friendly illustrations and "Post Your First Book" CTA

### Forms (Post Listing / Login)
- Single column: max-w-2xl mx-auto
- Form fields: space-y-6
- Input styling: rounded-lg border-2 focus:border-primary transition
- Image upload: Drag-and-drop area with preview thumbnails
- Condition dropdown with visual indicators
- Course code input with department suggestions

### Authentication Pages
- Centered card: max-w-md mx-auto with p-8
- UCalgary logo at top
- Form with clean inputs
- Email validation indicator for @ucalgary.ca
- Social login options below primary form

### Status Badges
- Pill-shaped: rounded-full px-3 py-1 text-sm font-medium
- Conditions: "New" | "Like New" | "Good" | "Used"
- Status: "Active" | "Sold"
- Positioned consistently on cards (top-right for images, inline for lists)

### Buttons
- Primary CTA: rounded-lg px-6 py-3 font-semibold
- Secondary: rounded-lg px-6 py-3 font-medium with border
- Icon buttons: rounded-full p-2 for actions
- All buttons include hover and active states

## Images

### Hero Image
- Full-width background image of UCalgary campus (MacEwan Student Centre or library)
- Students studying with textbooks in foreground
- Subtle gradient overlay for text legibility
- Use backdrop-blur-sm on content container

### Listing Images
- Product-style photos of textbooks (cover visible, good lighting)
- Aspect ratio 3:4 for consistency
- Support multiple images per listing (gallery view on detail page)
- Image upload placeholder shows book icon + "Upload Photo" text

### Empty States
- Friendly illustrations for no results, no messages, no listings
- Simple line art style with relevant icons (books, chat bubbles)

### User Avatars
- Circular, consistent sizing: w-10 h-10 for small, w-16 h-16 for profile
- Fallback to initials in geometric background patterns

## Animations
**Minimal and purposeful:**
- Card hover: transition-shadow duration-200
- Button hover: subtle scale (scale-105) with transition
- Page transitions: Simple fade-in for content loading
- No parallax, no scroll-triggered animations

## Accessibility
- All interactive elements have clear focus states (ring-2 ring-offset-2)
- Sufficient contrast ratios throughout
- Form labels always visible (not placeholder-only)
- Image alt text for all textbook covers
- Keyboard navigation support for all interactions