# PRD: GTD Frontend Application

**Spec ID:** SPEC-FRONTEND-001  
**Status:** Draft  
**Last Updated:** 2026-02-07  
**Owner:** Backend Shootout Team

---

## 1. Overview

### 1.1 Purpose
A unified Next.js frontend that can switch between multiple backend implementations for the GTD (Getting Things Done) application shootout comparison.

### 1.2 Target Users
- Developers comparing backend frameworks
- End users managing tasks via GTD methodology

### 1.3 Key Goals
- Provide a consistent UI across all backend implementations
- Enable easy backend switching via UI controls
- Demonstrate real-world GTD workflow patterns
- Support performance testing and comparison

---

## 2. Functional Requirements

### 2.1 Core GTD Features (MVP)

#### Tasks
- [ ] **List Tasks**: Display all tasks with filtering by status (inbox, next, waiting, done)
- [ ] **Create Task**: Quick-add with title input, optional project assignment
- [ ] **Edit Task**: Modify title, status, project assignment
- [ ] **Complete Task**: Mark as done with one-click
- [ ] **Delete Task**: Remove permanently
- [ ] **Process Inbox**: Bulk process inbox items (set status/project)

#### Projects
- [ ] **List Projects**: View all projects with status
- [ ] **Create Project**: Add new project with name
- [ ] **Edit Project**: Rename, change status (active/someday/archive)
- [ ] **Delete Project**: Remove (with confirmation if tasks exist)
- [ ] **View Project Tasks**: See all tasks belonging to a project

#### Contexts (Stretch)
- [ ] **Tag with Context**: Assign contexts (@home, @work, @errands)
- [ ] **Filter by Context**: View tasks by context

### 2.2 Backend Switching
- [ ] **Backend Selector**: Dropdown to choose active backend
- [ ] **Backend Status**: Show connection status for each backend
- [ ] **Header Injection**: Automatically set `x-backend` header per selection
- [ ] **Local Storage**: Persist backend preference

### 2.3 UI/UX Requirements
- [ ] **Responsive Design**: Mobile-first, works on all devices
- [ ] **Dark Mode**: Support system preference
- [ ] **Keyboard Shortcuts**: `n` for new task, `?` for help
- [ ] **Loading States**: Skeleton loaders for async operations
- [ ] **Error Handling**: Toast notifications for API errors
- [ ] **Offline Detection**: Show warning when backend unreachable

---

## 3. Technical Requirements

### 3.1 Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui or similar
- **Forms**: React Hook Form + Zod validation

### 3.2 API Integration
- **Base URL**: `http://localhost:8787` (Cloudflare Gateway)
- **Headers**: `x-backend: <backend-name>`
- **Contract**: Follows `specs/openapi.yaml`
- **Error Handling**: Standard HTTP status codes with error messages

### 3.3 Performance
- [ ] **Initial Load**: < 2s on 3G
- [ ] **API Response**: < 500ms perceived (optimistic updates)
- [ ] **Bundle Size**: < 200KB initial JS
- [ ] **Caching**: TanStack Query caching for list endpoints

---

## 4. Data Models

### 4.1 Task
```typescript
interface Task {
  id: string;           // UUID
  title: string;
  status: 'inbox' | 'next' | 'waiting' | 'done';
  project_id: string | null;
  created_at: string;   // ISO 8601
  updated_at?: string;  // ISO 8601
}
```

### 4.2 Project
```typescript
interface Project {
  id: string;           // UUID
  name: string;
  status: 'active' | 'someday' | 'archive';
  created_at?: string;  // ISO 8601
}
```

### 4.3 Backend
```typescript
interface Backend {
  id: string;           // e.g., 'bun-sqlite', 'elixir-phoenix'
  name: string;         // Display name
  url: string;          // Direct URL for health checks
  status: 'online' | 'offline' | 'unknown';
}
```

---

## 5. User Flows

### 5.1 Adding a Task
1. User clicks "New Task" or presses `n`
2. Modal/form appears with title input
3. Optional: Select project from dropdown
4. Submit creates task in "inbox" status
5. Task appears in inbox list immediately (optimistic)
6. API call confirms, error reverts if failed

### 5.2 Processing Inbox (GTD Style)
1. User navigates to Inbox view
2. Sees list of unprocessed tasks (status: inbox)
3. For each task, quick actions:
   - Do it (mark done)
   - Defer (set status to 'next' or 'waiting')
   - Delegate (add note, set waiting)
   - Add to project

### 5.3 Switching Backends
1. User selects backend from dropdown
2. Frontend clears local cache
3. Sets `x-backend` header for all requests
4. Refetches current view data
5. Persists selection to localStorage

---

## 6. Non-Functional Requirements

### 6.1 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus management

### 6.2 Browser Support
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari/Chrome

### 6.3 Testing
- Unit tests for components (Vitest)
- Integration tests for API calls (MSW)
- E2E tests for critical flows (Playwright)

---

## 7. Success Criteria

- [ ] All MVP features functional with at least one backend
- [ ] Backend switching works seamlessly
- [ ] Lighthouse score > 90 (Performance, Accessibility)
- [ ] Zero critical accessibility violations
- [ ] < 1s average API response time (excluding network)

---

## 8. Open Questions

1. Should we support real-time updates (WebSocket/SSE)?
2. Do we need user authentication for multi-user scenarios?
3. Should we add task search/filter beyond status?
4. Export/import functionality for data portability?

---

## 9. Related Documents

- `specs/openapi.yaml` - API Contract
- `specs/PRD-Gateway.md` - Gateway PRD
- `specs/PRD-Backend-BunSQLite.md` - Primary Backend PRD
