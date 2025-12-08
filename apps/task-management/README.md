# Task Management Application

The **Task Management** application handles the execution layer of the Digital Backbone. It tracks actionable items (`Tasks`) and strategic containers (`Projects`) assigned to Organization units and Positions.

## 🚀 Key Features

*   **Task Inbox**: A prioritized list of tasks assigned to your position(s).
*   **Project Dashboard**: High-level view of initiatives, timelines, and progress.
*   **Holonic Structure**: Tasks are typed Holons linked to `Person`, `Position`, or `Organization` owners.
*   **State Management**: Local Zustand store (mocked for MVP) ready for API integration.

## 🛠 Tech Stack

*   **Framework**: React 18 + Vite
*   **Styling**: TailwindCSS + Lucide Icons
*   **State**: Zustand

## 🏗 Project Structure

*   `src/store`: `taskStore` managing global state.
*   `src/types`: Domain models for `Task`, `Project`, `Milestone`.
*   `src/components`: UI components (`TaskInbox`, `ProjectList`).

## 🏃‍♂️ Usage

1.  **Install**: `npm install`
2.  **Run**: `npm run dev`
3.  **Test**: `npm test`

## 🔮 Future Roadmap

*   **Process Integration**: Auto-generate tasks from "How-Do" process steps.
*   **Kanban View**: Drag-and-drop task management.
*   **SLA Tracking**: Visual countdowns for Governance compliance.
