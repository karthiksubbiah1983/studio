# Digitise Admin - A Low-Code Internal Tool Builder

## Application Purpose

**Digitise Admin** is a powerful, no-code/low-code platform designed for creating, managing, and deploying complex data collection forms, dynamic checklists, and automated task management workflows. Its primary purpose is to enable administrators and developers to rapidly digitize internal business processes—such as inspections, incident reports, housekeeping checks, and data entry tasks—without writing extensive code.

It replaces traditional paper forms and manual workflows with intelligent, data-driven, and interactive digital experiences, all managed through a user-friendly visual interface.

---

## Core Features

### 1. Form Builder (FormForge)

The heart of the application is a visual form builder that allows for the creation of sophisticated data collection templates.

-   **Drag-and-Drop Interface:** Build complex form layouts visually by dragging elements onto a canvas.
-   **Rich Component Library:**
    -   **Basic Inputs:** Text fields, Textareas, Selects, Checkboxes, Radio Groups, Date Pickers.
    -   **Advanced Components:** `Editable Table` for row-based data entry, `Data Grid` for displaying tabular data, `File Upload`, and `Rich Text` editors.
    -   **Layout Elements:** Use `Container` and `Popup` elements to group fields and create advanced layouts.
-   **Versioning:** Save forms as `Drafts` or publish them as immutable `Published` versions. You can easily load, view, and manage the entire history of a form template.
-   **Cloning & Categorization:** Quickly create variations of existing forms by cloning them. Organize all templates with a user-defined system of categories and sub-categories.

### 2. Dynamic Checklists & Task Management

Go beyond simple forms by creating interactive, checklist-driven tasks.

-   **Centralized Checklist Repository:** Manage a hierarchical library of checklist categories and questions (e.g., Building Safety → Fire Safety → Fire Extinguishers). This creates a single source of truth for all inspection items.
-   **Configurable Task Types:** Define different types of tasks (e.g., "General Site Inspection," "Hotel Room Housekeeping"). Each task type can be configured to use a specific subset of questions and categories from the main repository.
-   **Task Execution & Layouts:** Assign tasks to specific "Sites" (e.g., locations, departments). The task completion UI can be dynamically rendered as a multi-tab interface (one tab per room/area) or as a single, consolidated table view.
-   **Task Lifecycle Management:** Track the status of all tasks from "Assigned" to "Submitted" through dedicated dashboards for "My Tasks" and "All Tasks."

### 3. Data Management

The application provides flexible ways to manage the data that powers your forms.

-   **Form-Specific Datasets:** Create and manage local datasets directly within a form template. These datasets function like small, self-contained spreadsheets and can be used to populate `DataGrid` and `DataList` components, perfect for predefined option lists.
-   **Dynamic API Integration:** Populate components like `Select`, `Combobox`, and `DataGrid` with data fetched from external APIs. The system robustly supports cascading selects, where the options in one dropdown dynamically update based on the selection in another, both within tables and in standalone fields.

### 4. Rules & Workflow Engine

This is the most powerful feature, allowing you to build intelligent, automated logic without writing code.

-   **Conditional Logic (Rules):** The "IF...THEN" engine allows you to create complex form behaviors.
    -   **Flexible Conditions:** Build conditions based on a field's value, the current date, task status, or a custom configuration variable. The engine can even inspect hidden metadata within a list's options (e.g., check if a selected item has a `priority` of `high`).
    -   **Powerful Behaviors:** Trigger actions like showing/hiding fields, enabling/disabling them, changing element colors, setting field values, and dynamically filtering the contents of a list based on user input.
-   **Post-Submission Automation (Workflows):** Define automated actions that run *after* a form is submitted.
    -   **Data-Driven Triggers:** Initiate workflows based on the data the user submitted.
    -   **Automated Actions:** Automatically create follow-up tasks, change a task's status, or trigger mail configurations based on the workflow logic.

### 5. Administration & Management

The platform includes a full suite of administrative UIs to manage the entire system.

-   **Template Dashboard:** A central hub to view, search, and manage all form templates and their versions.
-   **Task History:** A chronological audit log of all task assignments and submissions for complete traceability.
-   **Site & Category Management:** Simple interfaces for adding, editing, and deleting the sites and categories that organize your application's structure.
