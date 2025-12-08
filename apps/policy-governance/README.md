# Policy & Governance Application

The **Policy Governance** application enables organizations to author, govern, and monitor their policies. It shifts the paradigm from static PDF documents to computable, data-driven policy objects with extracted obligations.

## 🚀 Key Features

*   **Policy Authoring**: Rich text editor (Tiptap) for drafting policies with structural semantics.
*   **Obligation Extraction**: Context-aware tool to highlight text and extract "Who must do What".
*   **Lifecycle Management**: Workflow states (`Draft` -> `Active` -> `Archived`) with version control.
*   **Compliance Dashboard**: Visual overview of organization-wide governance health and critical risks.
*   **Read-Only Mode**: Enforced immutability for Active policies to ensure audit integrity.

## 🛠 Tech Stack

*   **Framework**: React 18 + Vite
*   **Styling**: TailwindCSS + Lucide Icons
*   **State Management**: Zustand
*   **Rich Text**: Tiptap (ProseMirror wrapper)
*   **Testing**: Vitest + React Testing Library

## 🏗 Project Structure

*   `src/store`: Zustand store for Policies and Obligations.
*   `src/types`: TypeScript definitions for Policy types (`PolicyDocument`, `Obligation`, `Clause`).
*   `src/components/editor`: Core editing logical (Tiptap configuration, `ClauseHighlighter`, `ObligationComposer`).
*   `src/components/dashboard`: Compliance visualization components.

## 🏃‍♂️ Running Locally

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Start Dev Server**:
    ```bash
    npm run dev
    ```
3.  **Run Tests**:
    ```bash
    npm test
    ```

## 🧪 Usage Guide

### Creating a Policy
1.  Click **"New Policy"** in the list view.
2.  Enter a title and select a type (e.g., Instruction, Notice).
3.  Use the **Document Text** tab to write your content.

### Extracting Obligations
1.  Highlight a sentence in the editor (e.g., "The CO must approve all leave.").
2.  Click **"Extract Obligation"** in the floating menu.
3.  Fill in the Actor ("CO") and attributes in the sidebar.
4.  The text will turn **Green** to indicate it is now a tracked obligation.

### Publishing
1.  When ready, click **"Publish"** in the header.
2.  The policy status changes to `Active`.
3.  The editor becomes read-only.
