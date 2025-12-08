# Org Chart Application

The **Org Chart Application** is the primary interface for visualizing and managing the structure of the organization. It provides an interactive, hierarchical view of Organizations, Positions, and Personnel, serving as both a directory and a command-and-control surface.

## 🚀 Features

### Navigation & Visualization
- **Interactive Graph**: Pan, zoom, and explore the hierarchy.
- **Breadcrumbs**: Track your path deep into the organization and jump back to parents.
- **Minimap**: Maintain orientation in large structures.
- **Smart Visuals**:
  - **Vacancy Indicators**: Dashed borders and badges highlight unfilled positions.
  - **Health Dots**: Green/Yellow/Red indicators show organizational manning health.
  - **Tiger Teams**: Distinct styling for cross-functional teams.

### Discovery
- **Global Search**: Press `/` or click the top bar to instantly find any Organization, Position, or Person.
- **Fuzzy Matching**: Finds results even with partial or imperfect queries.

### Management & Editing
- **Create Units**: Add new sub-organizations directly from the sidebar.
- **Manage Positions**: Create new billets/positions within any unit.
- **Assign Personnel**: "Fill" vacant positions by assigning people to them.
- **Undo System**: Safely experiment with structure; structural changes can be undone.

## 🛠 Usage Guide

### 1. Navigation
- **Click** any node to focus on it and open deeper levels of the hierarchy.
- **Hover** over nodes to see quick stats (e.g., vacancy counts, occupant names).
- Use the **Breadcrumbs** in the top-left to navigate up the chain of command.

### 2. Inspector Panel (Sidebar)
When you select a node, the sidebar provides detailed context:
- **Organizations**: View mission, roster stats, and functional services.
- **Positions**: View billet code, qualifications, and current occupant.
- **People**: View rank, rating, and assigned roles.

### 3. Management Actions
To modify the structure (if authorized):
1. Select the parent Organization or Position.
2. Look for the **Management** section in the sidebar.
3. Click **Add Sub-Unit** or **Add Position**.
4. To fill a vacancy, select the empty Position and click **Assign Person**.

## 💻 Developer Setup

### Prerequisites
- Node.js (v18+)
- npm

### Quick Start
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Testing
Run the unit test suite with Vitest:
```bash
npm run test
```

### Key Libraries
- **@xyflow/react**: Core graph visualization engine.
- **Tailwind CSS**: Styling framework (blueprint-dark theme).
- **Zustand** (via internal hooks): State management.
- **Vitest**: Testing framework.
