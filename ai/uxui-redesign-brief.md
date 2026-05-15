# Claude Code UX/UI Redesign Brief

## 使用目的

這份文件是給 Claude Code 使用的 UX/UI 改造指令與設計上下文。

目標是讓 Claude Code 參考以下 Dribbble 作品的設計語言，大幅改造現有專案的 UX/UI：

https://dribbble.com/shots/17135322-Dashboard-Financial-Report

重要的是：這不是要求 Claude Code 做 pixel-perfect clone，而是萃取它的設計語言，並轉化成適合現有專案的產品介面。

---

# 1. Main Instruction for Claude Code

```md
You are a senior product designer + frontend engineer.

I want to significantly redesign the UX/UI of this project, inspired by this Dribbble reference:
https://dribbble.com/shots/17135322-Dashboard-Financial-Report

Important:
Do NOT create a pixel-perfect clone.
Extract the design language and adapt it to my existing product.
Do NOT change business logic, API contracts, routing behavior, state management, or data models unless absolutely necessary.
Focus on UX/UI, layout, components, hierarchy, spacing, and visual polish.

## Target design language

The reference has the following characteristics:

1. Overall style
- Clean fintech dashboard
- Mostly white / off-white background
- High whitespace
- Thin borders and subtle dividers
- Minimal but premium feeling
- Dashboard-like information density, but not visually noisy

2. Layout
- Left sidebar navigation
- Main content area with a strong page title
- Top-level tabs / category switcher
- Metric cards arranged in a grid
- Right-side panel for monthly report / activity / secondary information
- Multiple small cards with charts and financial numbers
- Clear separation between primary financial summary and supporting details

3. Visual identity
- Mostly monochrome: white, black, gray
- Bright lime/yellow-green accent color for active states, highlights, positive indicators, selected tabs, and chart emphasis
- Black cards or dark blocks used sparingly for contrast
- Rounded cards, soft shadows, thin borders
- Small financial charts embedded inside cards

4. Typography
- Strong title hierarchy
- Large financial numbers
- Small muted labels
- Compact but readable dashboard copy
- Avoid decorative typography

5. Components to redesign
Please inspect the existing project and identify current equivalents of:
- App shell / layout
- Sidebar navigation
- Header / top navigation
- Dashboard page layout
- Metric cards
- Tables / lists
- Chart cards
- Buttons
- Tabs
- Filters
- Empty states
- Form controls if present

## Task

First, inspect the codebase and produce a redesign plan before modifying files.

The plan should include:
1. Current frontend stack and styling approach
2. Main routes/pages that need redesign
3. Existing reusable components that should be refactored
4. New design tokens to introduce
5. Component-by-component migration plan
6. Risks and files likely to be touched

After the plan, implement the redesign in this order:

### Phase 1: Design foundation
- Create or update design tokens:
  - colors
  - spacing
  - border radius
  - shadows
  - typography scale
  - chart colors
- Centralize these tokens in the existing styling system.
- Do not scatter hardcoded styles across pages.

### Phase 2: Core layout
- Redesign the app shell.
- Create a cleaner sidebar.
- Improve page container width, grid spacing, card layout, and responsive behavior.
- Preserve existing navigation behavior.

### Phase 3: Dashboard components
- Redesign cards, financial summary blocks, chart containers, data lists, buttons, tabs, and filters.
- Use the Dribbble reference as inspiration:
  - off-white background
  - white cards
  - black text
  - lime accent
  - subtle borders
  - clean grid
  - compact financial dashboard feeling

### Phase 4: Page-level UX pass
- Apply the new components to the most important dashboard pages.
- Improve information hierarchy.
- Make important numbers easier to scan.
- Reduce visual noise.
- Keep all existing data and interactions working.

### Phase 5: Quality check
- Run lint/typecheck/tests/build if available.
- Fix any UI regressions.
- Provide a final summary:
  - files changed
  - design system changes
  - before/after UX differences
  - remaining recommendations

## Constraints

- Do not rewrite the whole app from scratch.
- Do not introduce a new UI library unless clearly justified.
- Prefer refactoring existing components.
- Keep the app responsive.
- Keep accessibility in mind:
  - sufficient contrast
  - visible focus states
  - semantic buttons/links
  - readable font sizes
- Avoid over-animation.
- Avoid glassmorphism, heavy gradients, or overly decorative effects.
- The result should feel like a serious fintech / financial dashboard product, not a generic template.

Begin by inspecting the project and showing me the redesign plan.
```

---

# 2. Design Brief

可以在專案中新增：

```txt
docs/design-brief.md
```

內容如下：

```md
# UX/UI Redesign Brief

## Goal

Redesign the product into a cleaner, more premium fintech dashboard experience.

The target visual direction is inspired by:
https://dribbble.com/shots/17135322-Dashboard-Financial-Report

This is not a request to copy the design.
The goal is to extract the design language and adapt it to the current product.

## Design Keywords

- Clean
- Fresh
- Financial dashboard
- Premium but minimal
- High readability
- Monochrome base
- Lime accent
- Data-first
- Calm but modern

## Visual System

### Background
Use an off-white or very light neutral background.

### Cards
Cards should be white, softly rounded, with subtle borders or very light shadows.

### Accent
Use a lime / yellow-green accent for:
- active navigation
- selected tabs
- positive growth
- chart highlights
- small badges
- primary CTA accents

Do not overuse the accent color.

### Dark Elements
Use black or near-black elements only for contrast:
- sidebar
- highlighted card
- selected financial module
- strong CTA area

### Typography
- Large, confident page titles
- Large financial numbers
- Small muted supporting labels
- Compact dashboard copy
- No decorative fonts

## UX Principles

1. Financial numbers should be scannable within 3 seconds.
2. Primary metrics should appear before secondary details.
3. Do not make every card equally important.
4. Use spacing and hierarchy instead of borders everywhere.
5. Reduce cognitive load.
6. Keep user actions obvious.
7. Preserve all current business logic.

## Components to Standardize

- AppShell
- Sidebar
- PageHeader
- MetricCard
- ChartCard
- DataTable
- Tabs
- FilterBar
- Button
- Badge
- EmptyState
- LoadingState
- FormField

## Implementation Rules

- Do not hardcode random colors.
- Introduce design tokens.
- Keep layout responsive.
- Do not break existing API calls.
- Do not change existing route names.
- Do not remove existing functionality.
- Run checks before finishing.

## Expected Outcome

The app should look like a coherent fintech dashboard:
- cleaner
- more spacious
- more premium
- easier to scan
- less visually fragmented
- closer to a modern financial reporting product
```

---

# 3. First Claude Code Command

建議先不要直接修改檔案，而是先讓 Claude Code 讀 brief 並提出計畫。

```md
Read docs/design-brief.md first.

Then inspect the current frontend codebase and propose a UX/UI redesign plan.
Do not modify files yet.
```

Claude Code 應該先回覆：

1. current frontend stack  
2. styling system  
3. key pages  
4. reusable components  
5. token plan  
6. migration plan  
7. risk list  
8. files likely to be touched  

確認方向正確後，再讓它進入實作。

---

# 4. Implementation Command: Phase 1 + Phase 2

第一輪只做基礎層，不要一口氣改完整個專案。

```md
Proceed with Phase 1 and Phase 2 only:

## Phase 1: Design foundation
- Add or update design tokens:
  - colors
  - spacing
  - radius
  - shadows
  - typography scale
  - chart colors
- Centralize these tokens in the existing styling system.
- Avoid hardcoded one-off styles.

## Phase 2: Core layout
- Redesign the app shell.
- Create or refactor the sidebar navigation.
- Improve global page container spacing, max width, grid layout, and responsive behavior.
- Preserve existing navigation, routing, state, and business logic.

Do not touch API logic.
Do not rewrite page-level business behavior.
After implementation, run available checks and summarize changed files.
```

---

# 5. Component System Requirement

這段很重要。它可以避免 Claude Code 只是在各頁面亂塞 className。

```md
Before redesigning pages, create reusable primitives:

- DashboardShell
- SidebarNav
- PageHeader
- MetricCard
- ChartCard
- FinanceCard
- SectionPanel
- StatusBadge
- EmptyState
- FilterTabs

Then refactor pages to use these components.

Avoid one-off styling inside page files.
Avoid scattering visual decisions across the app.
The redesign should become a small design system, not just a visual patch.
```

---

# 6. Page-Level Redesign Command

當 Phase 1 + Phase 2 完成後，再挑核心頁面改造。

```md
Now apply the new design system to the most important dashboard page first.

Goals:
- Make primary financial information easier to scan.
- Improve hierarchy between primary metrics and secondary details.
- Use clean card layouts inspired by the Dribbble reference.
- Use white/off-white surfaces, subtle borders, black text, and lime accents.
- Keep all existing data, actions, loading states, error states, and empty states.

Do not modify business logic.
Do not invent fake data if real data already exists.
If mock data already exists in the project, keep it clearly separated from production logic.

After finishing this page:
- Run available checks.
- Summarize files changed.
- Explain what changed in UX terms.
```

---

# 7. Rollout Command for Other Pages

當第一頁結果滿意，再擴散到其他頁面。

```md
Apply the same design system to the remaining dashboard-related pages.

Keep the visual language consistent:
- off-white app background
- white cards
- near-black text
- muted gray labels
- lime accent
- rounded cards
- subtle borders
- clean dashboard grid

Prioritize consistency over novelty.
Avoid redesigning every page differently.
Preserve all existing functionality and data behavior.

After implementation:
- Run lint/typecheck/tests/build if available.
- Fix regressions.
- Provide a final summary of:
  - pages changed
  - components reused
  - design tokens used
  - known limitations
  - recommended next improvements
```

---

# 8. Negative Constraints

這段可以降低 Claude Code 過度發揮的機率。

```md
Avoid the following:

- Do not create a pixel-perfect clone of the Dribbble shot.
- Do not use random gradients.
- Do not add unnecessary animations.
- Do not use too many colors.
- Do not make every card bright green.
- Do not rewrite the whole frontend.
- Do not introduce a new UI library unless necessary.
- Do not change API behavior.
- Do not change route names.
- Do not change data models.
- Do not invent fake data if real data already exists.
- Do not remove existing edge cases, loading states, error states, or empty states.
- Do not make the UI look like a generic SaaS template.
- Do not optimize only for screenshot beauty at the cost of actual usability.
```

---

# 9. UX Acceptance Criteria

Claude Code 完成後，可以用這段要求它自我檢查。

```md
Please review the redesign against these acceptance criteria:

## Visual Quality
- Does the app feel like a premium fintech dashboard?
- Is the visual language consistent across pages?
- Are colors, radius, spacing, typography, and shadows tokenized?
- Is the lime accent used intentionally and sparingly?

## UX Clarity
- Can users identify the most important financial numbers quickly?
- Is there clear hierarchy between primary and secondary information?
- Are actions easy to find?
- Are filters, tabs, and navigation easy to understand?

## Engineering Quality
- Are reusable components created or improved?
- Are page files cleaner after refactor?
- Are styles centralized rather than scattered?
- Are business logic and API behavior preserved?

## Accessibility
- Is text contrast sufficient?
- Are focus states visible?
- Are buttons and links semantic?
- Are font sizes readable?

## Reliability
- Do existing tests still pass?
- Does the project build successfully?
- Are loading, error, and empty states preserved?
- Does responsive behavior still work?
```

---

# 10. Recommended Workflow

建議流程：

## Step 1: Audit

```md
Read docs/design-brief.md.
Inspect the frontend codebase.
Return a redesign plan only.
Do not modify files.
```

## Step 2: Design Foundation

```md
Implement design tokens and reusable visual primitives.
Do not redesign all pages yet.
```

## Step 3: App Shell

```md
Redesign the app shell, sidebar, page container, and global layout.
Preserve routing and business logic.
```

## Step 4: One Core Page

```md
Apply the new design system to one core dashboard page.
Use this as the reference implementation.
```

## Step 5: Expand

```md
Apply the approved design system to the remaining dashboard pages.
```

## Step 6: Polish

```md
Review loading, error, empty, responsive, hover, focus, and chart states.
Run checks and summarize remaining recommendations.
```

---

# 11. Short Version Prompt

如果只想貼一段比較短的，可以用這版：

```md
You are a senior product designer + frontend engineer.

Redesign this project’s UX/UI using this Dribbble shot as design inspiration:
https://dribbble.com/shots/17135322-Dashboard-Financial-Report

Do not clone it pixel-perfectly.
Extract the design language:
- clean fintech dashboard
- off-white background
- white rounded cards
- subtle borders/shadows
- black/gray monochrome base
- lime/yellow-green accent
- strong financial-number hierarchy
- clean sidebar
- compact dashboard cards
- small embedded charts
- premium but minimal feeling

First inspect the codebase and produce a redesign plan.
Do not modify files until the plan is clear.

When implementing:
1. Create/update design tokens.
2. Refactor reusable components first.
3. Redesign app shell and sidebar.
4. Apply the system to one core dashboard page.
5. Expand to other pages only after the pattern is stable.

Do not change business logic, API contracts, routes, state management, or data models.
Do not introduce a new UI library unless necessary.
Do not scatter hardcoded styles.
Preserve loading, error, empty, and responsive states.
Run available checks before finishing.
```

---

# 12. Notes for Human Reviewer

這份 brief 的核心精神是：

- 不要叫 Claude Code「模仿圖片」
- 要叫它「萃取設計語言」
- 不要一開始就重畫所有頁面
- 要先做 token、layout、component primitive
- 先改一個核心頁面，確認風格後再擴散
- 每一輪都要求它 run checks
- 永遠明確限制：不改 business logic、不改 API、不改 routing、不 invent fake data

比較理想的結果不是「看起來像 Dribbble 截圖」，而是你的專案獲得一套更一致、可維護、可延展的 fintech dashboard design system。
