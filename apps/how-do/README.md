# How-Do Application

The **How-Do** application is the "Process Engine" of the Digital Backbone. It allows users to design, view, and assign ownership to operational processes (Swimlanes).

## Features

### 1. Process Discovery (Home)
- Search for processes ("How do I...?") by name or description.
- View status and step counts at a glance.

### 2. Process Viewer
- Read-only visualization of processes.
- **Swimlane Layout**: Steps are vertically grouped by their owner (Human Position or AI Agent).
- **Agent Integration**: Steps owned by AI Agents (Semantic Proxies) are marked with a 🤖 badge.
- **Obligation Linking**: Visual hints for obligations that likely apply to specific steps.

### 3. Process Editor (Designer)
- Interactive editor to define process steps.
- **Edit Owner**: Assign steps to Positions or Agents.
- Add and modify steps dynamically.

## Architecture
- **Tech Stack**: React 19, Vite, Vanilla CSS.
- **State Management**: Local React State (MVP) with Mock Data.
- **Components**:
    - `ProcessSearch`: Filterable list of processes.
    - `SwimlaneViewer`: Read-only display.
    - `SwimlaneEditor`: Write-mode display.

## Development

### Running Locally
```bash
npm run dev
```

### Testing
```bash
npm test
```
The test suite covers:
- Component rendering (Search, Viewer, Editor).
- Interaction flows (Navigation, Assignment).
- Mock data integrity.
