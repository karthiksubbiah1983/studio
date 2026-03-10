

import { createContext, useContext, useReducer, Dispatch, ReactNode, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { FormElementInstance, Section, ElementType, FormVersion, Form, Submission, Category, SubCategory, Rule, ClipboardItem, Workflow, Site, Task, Configuration, LocalDataset, ChecklistRepository, TaskType, TaskTypeConfiguration, ChecklistCategory, ChecklistQuestion, ChecklistAnswerOption, RoomEntry } from "@/lib/types";
import { createNewElement } from "@/lib/form-elements";
import { getAllElements, findElementRecursive, evaluateRule } from "@/lib/utils";
import { useFirebase, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, DocumentReference, setDoc, query, where, getDoc, getDocs } from "firebase/firestore";
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { useRouter } from "next/navigation";
import { relationalDataDemoTemplate, editableTableCascadingDemo, cascadingDemoTemplate, demoTemplate, demoCategory, sampleChecklistRepository, sampleTaskTypes, sampleTaskTypeConfigurations, sampleSite } from "@/lib/demo-data";


const LOCAL_STORAGE_KEY = "formBuilderState";

type State = {
  forms: Form[];
  categories: Category[];
  sites: Site[];
  tasks: Task[];
  submissions: Submission[];
  checklistRepository: ChecklistRepository;
  taskTypes: TaskType[];
  taskTypeConfigurations: TaskTypeConfiguration[];
  activeFormId: string | null;
  selectedElement: { elementId: string; sectionId: string } | null;
  draggedElement: { element: FormElementInstance; sectionId: string } | { type: ElementType; id?: string } | { sectionId: string } | null;
  clipboard: ClipboardItem | null;
  formState: { [key: string]: { value: any, fullObject?: any, isVisible?: boolean } };
  activePopupId: string | null;
};

const initialState: State = {
  forms: [],
  categories: [],
  sites: [],
  tasks: [],
  submissions: [],
  checklistRepository: { categories: [], questions: [] },
  taskTypes: [],
  taskTypeConfigurations: [],
  activeFormId: null,
  selectedElement: null,
  draggedElement: null,
  clipboard: null,
  formState: {},
  activePopupId: null,
};

// Helper function to deep clone and assign new IDs
const cloneWithNewIds = <T extends { id: string; [key: string]: any }>(item: T): T => {
  const itemClone = JSON.parse(JSON.stringify(item));
  const idMap: { [oldId: string]: string } = {};

  // Recursively traverses the object to find all IDs and create new ones
  const collectIds = (obj: any) => {
    if (obj && typeof obj === 'object') {
      if (obj.id && typeof obj.id === 'string' && !idMap[obj.id]) {
        idMap[obj.id] = crypto.randomUUID();
      }
      // Check all properties for nested objects or arrays
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          obj[key].forEach(collectIds);
        } else if (typeof obj[key] === 'object') {
          collectIds(obj[key]);
        }
      }
    }
  };

  collectIds(itemClone);

  // Recursively traverses the object to update all old IDs with new ones
  const updateIds = (obj: any) => {
    if (obj && typeof obj === 'object') {
      // Update the object's own ID
      if (obj.id && idMap[obj.id]) {
        obj.id = idMap[obj.id];
      }
      
      // Update any property that might be an ID reference
      const referenceKeys = ['sourceElementId', 'comparisonElementId', 'targetElementId', 'dataSourceParentId', 'linkedDatasetId'];
      for (const refKey of referenceKeys) {
          if (obj[refKey] && idMap[obj[refKey]]) {
              obj[refKey] = idMap[obj[refKey]];
          }
      }

      // Update the key to be unique
      if (obj.key && typeof obj.key === 'string') {
        obj.key = `${obj.key}_${Math.random().toString(36).substring(2, 7)}`;
      }

      // Recurse into nested objects and arrays
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          obj[key].forEach(updateIds);
        } else if (typeof obj[key] === 'object') {
          updateIds(obj[key]);
        }
      }
    }
  };

  updateIds(itemClone);
  return itemClone;
};


// Recursive function to find and update/add/delete an element
const findAndModifyElement = (elements: FormElementInstance[], action: Action): FormElementInstance[] => {
    switch (action.type) {
        case "ADD_ELEMENT": {
            const { parentId, type, index, id: newElementId } = action.payload;

            // Check if element with this ID already exists at any level to prevent duplicates from rapid events
            const elementExists = (els: FormElementInstance[], elementId: string): boolean => {
                return els.some(e => e.id === elementId || (e.elements && elementExists(e.elements, elementId)));
            };
            if (newElementId && elementExists(elements, newElementId)) {
                return elements; // Prevent adding duplicate
            }

             if (parentId) { // Add to container
                return elements.map(el => {
                    if (el.id === parentId && (el.type === 'Container' || el.type === 'Popup')) {
                        const newElement = createNewElement(type, newElementId);
                        const newElements = [...(el.elements || [])];
                        if (index !== undefined) {
                            newElements.splice(index, 0, newElement);
                        } else {
                            newElements.push(newElement);
                        }
                        return { ...el, elements: newElements };
                    }
                    if (el.elements) { // Recurse
                        return { ...el, elements: findAndModifyElement(el.elements, action) };
                    }
                    return el;
                });
             }
             break; // Handled at section level if no parentId
        }
        case "UPDATE_ELEMENT": {
            return elements.map(el => {
                if (el.id === action.payload.element.id) {
                    return action.payload.element;
                }
                if (el.elements) return { ...el, elements: findAndModifyElement(el.elements, action) };
                if (el.type === 'EditableTable' && el.columns) {
                    return {
                        ...el,
                        columns: el.columns.map(col => {
                            if (col.element.id === action.payload.element.id) {
                                return { ...col, element: action.payload.element };
                            }
                            return col;
                        })
                    };
                }
                return el;
            });
        }
        case "DELETE_ELEMENT": {
            return elements.reduce((acc, el) => {
                if (el.id === action.payload.elementId) return acc;
                if (el.elements) {
                    acc.push({ ...el, elements: findAndModifyElement(el.elements, action) });
                } else {
                    acc.push(el);
                }
                return acc;
            }, [] as FormElementInstance[]);
        }
        case "CLONE_ELEMENT": {
            const newElements: FormElementInstance[] = [];
            for (const el of elements) {
                newElements.push(el);
                if (el.id === action.payload.elementId) {
                    newElements.push(cloneWithNewIds(el));
                } else if (el.elements) {
                    // This is tricky. We need to check if the clone needs to happen in a nested element.
                    const newSubElements = findAndModifyElement(el.elements, action);
                    // if the length changed, it means something was cloned inside.
                    if (newSubElements.length > el.elements.length) {
                       newElements.pop(); // remove the old parent
                       newElements.push({ ...el, elements: newSubElements }); // push the parent with new children
                    }
                }
            }
            return newElements;
        }
    }
    return elements;
};

const getInitialFormState = (sections: Section[], configurations: Configuration[] | undefined): { [key: string]: { value: any, fullObject?: any, isVisible?: boolean } } => {
    const state: { [key: string]: { value: any, fullObject?: any, isVisible?: boolean } } = {};
    if (!sections) return state;

    sections.forEach(section => {
        state[section.id] = {
            value: undefined,
            isVisible: !section.hidden
        }
    });
    
    const allElements = getAllElements(sections);
    allElements.forEach(element => {
        if ('id' in element && !state[element.id]) { // Ensure not to overwrite section state
             if (element.type === 'EditableTable') {
                if (state[element.id] === undefined) {
                    const defaultRowCount = element.defaultRowCount || 0;
                    const initialRows = [];
                    for (let i = 0; i < defaultRowCount; i++) {
                        const newRow: Record<string, any> = { _rowId: crypto.randomUUID(), _previewData: {} };
                        element.columns?.forEach(col => {
                            if (col.element.key) {
                                newRow[col.element.key] = col.element.defaultValue ?? '';
                            }
                        });
                        initialRows.push(newRow);
                    }
                    state[element.id] = { value: initialRows, isVisible: !element.hidden };
                }
            } else if (state[element.id] === undefined) {
                 state[element.id] = { 
                    value: 'defaultValue' in element ? element.defaultValue : undefined,
                    isVisible: !element.hidden && element.type !== 'Popup'
                };
            }
        }
    });

    if (configurations) {
        configurations.forEach(config => {
            state[`config::${config.key}`] = { value: config.value, isVisible: true };
        });
    }

    return state;
}

type Action =
  | { type: "SET_STATE"; payload: Partial<State> }
  | { type: "ADD_FORM"; payload: Form }
  | { type: "SET_FORMS"; payload: Form[] }
  | { type: "UPDATE_FORM_METADATA"; payload: { categoryId?: string; subCategoryId?: string | null } }
  | { type: "DELETE_FORM"; payload: { formId: string } }
  | { type: "CLONE_FORM"; payload: { formId: string, newName: string } }
  | { type: "SET_ACTIVE_FORM"; payload: { formId: string } }
  | { type: "ADD_SECTION" }
  | { type: "UPDATE_SECTION"; payload: Section }
  | { type: "DELETE_SECTION"; payload: { sectionId: string } }
  | { type: "CLONE_SECTION"; payload: { sectionId: string } }
  | { type: "ADD_ELEMENT"; payload: { sectionId: string; type: ElementType; index?: number, parentId?: string, id?: string } }
  | { type: "UPDATE_ELEMENT"; payload: { sectionId: string; element: FormElementInstance } }
  | { type: "DELETE_ELEMENT"; payload: { sectionId: string; elementId: string } }
  | { type: "CLONE_ELEMENT"; payload: { sectionId: string; elementId: string } }
  | { type: "SELECT_ELEMENT"; payload: { elementId: string; sectionId: string } | null }
  | { type: "SET_DRAGGED_ELEMENT"; payload: { element: FormElementInstance; sectionId: string } | { type: ElementType; id?: string } | { sectionId: string } | null }
  | { type: "MOVE_ELEMENT"; payload: { from: { sectionId: string, elementId: string }, to: { sectionId: string, index?: number, parentId?: string } } }
  | { type: "MOVE_SECTION"; payload: { fromIndex: number; toIndex: number } }
  | { type: "SAVE_VERSION"; payload: { name: string; description: string; type: "draft" | "published"; sections: Section[]; rules: Rule[]; workflows: Workflow[]; configurations?: Configuration[]; localDatasets?: LocalDataset[]; timestamp: string; } }
  | { type: "LOAD_VERSION"; payload: { versionId: string } }
  | { type: "DELETE_VERSION"; payload: { versionId: string } }
  | { type: "ADD_SUBMISSION"; payload: { formId: string, data: Record<string, any>, taskId?: string } }
  | { type: "ADD_CATEGORY"; payload: { name: string } }
  | { type: "UPDATE_CATEGORY"; payload: { category: Category } }
  | { type: "DELETE_CATEGORY"; payload: { categoryId: string } }
  | { type: "ADD_SUBCATEGORY"; payload: { categoryId: string; name: string } }
  | { type: "UPDATE_SUBCATEGORY"; payload: { categoryId: string; subCategory: SubCategory } }
  | { type: "DELETE_SUBCATEGORY"; payload: { categoryId: string; subCategoryId: string } }
  | { type: "COPY_TO_CLIPBOARD"; payload: ClipboardItem | null }
  | { type: "PASTE_FROM_CLIPBOARD"; payload: { sectionId?: string; index?: number } }
  | { type: "ADD_SITE"; payload: { name: string } }
  | { type: "DELETE_SITE"; payload: { siteId: string } }
  | { type: "ADD_TASK"; payload: { taskTypeId: string; siteId: string; } }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "SET_USER_SETTINGS"; payload: { categories: Category[], sites: Site[] } }
  | { type: "SET_FORM_STATE"; payload: { [key: string]: { value: any, fullObject?: any, isVisible?: boolean } } }
  | { type: "UPDATE_USER_DRIVEN_STATE"; payload: { elementId: string; value: any; fullObject?: any, isVisible?: boolean } }
  | { type: "SET_ACTIVE_POPUP"; payload: string | null }
  | { type: 'SAVE_CHECKLIST_CATEGORY', payload: Partial<ChecklistCategory> }
  | { type: 'DELETE_CHECKLIST_CATEGORY', payload: { categoryId: string } }
  | { type: 'SAVE_CHECKLIST_QUESTION', payload: ChecklistQuestion }
  | { type: 'DELETE_CHECKLIST_QUESTION', payload: { questionId: string } }
  | { type: 'ADD_TASK_TYPE', payload: { name: string } }
  | { type: 'UPDATE_TASK_TYPE', payload: { id: string, name: string } }
  | { type: 'DELETE_TASK_TYPE', payload: { id: string } }
  | { type: 'UPDATE_TASK_TYPE_CONFIG', payload: TaskTypeConfiguration };


// Helper to recursively manage categories
const manageCategory = (
    categories: ChecklistCategory[], 
    action: 
        | { type: 'SAVE_CHECKLIST_CATEGORY', payload: Partial<ChecklistCategory> }
        | { type: 'DELETE_CHECKLIST_CATEGORY', payload: { categoryId: string } }
): ChecklistCategory[] => {
    switch (action.type) {
        case 'SAVE_CHECKLIST_CATEGORY': {
            const { id, parentId, ...rest } = action.payload;
            if (id) { // Update existing
                return categories.map(cat => 
                    cat.id === id 
                        ? { ...cat, ...rest }
                        : { ...cat, children: manageCategory(cat.children || [], action) }
                );
            } else { // Add new
                const newCategory: ChecklistCategory = { id: crypto.randomUUID(), name: rest.name || 'New Category', children: [], ...rest };
                if (parentId) {
                    return categories.map(cat => 
                        cat.id === parentId
                            ? { ...cat, children: [...(cat.children || []), newCategory] }
                            : { ...cat, children: manageCategory(cat.children || [], action) }
                    );
                }
                return [...categories, newCategory]; // Add to root
            }
        }
        case 'DELETE_CHECKLIST_CATEGORY': {
            const { categoryId } = action.payload;
            return categories.filter(cat => cat.id !== categoryId).map(cat => ({
                ...cat,
                children: manageCategory(cat.children || [], action)
            }));
        }
        default:
            return categories;
    }
};

const builderReducer = (state: State, action: Action): State => {
  const activeForm = state.forms.find(f => f.id === state.activeFormId);
  const activeFormSections = activeForm?.versions[0]?.sections || [];
  const activeFormConfigurations = activeForm?.versions[0]?.configurations || [];

  switch (action.type) {
    case 'SAVE_CHECKLIST_CATEGORY':
    case 'DELETE_CHECKLIST_CATEGORY':
        return {
            ...state,
            checklistRepository: {
                ...state.checklistRepository,
                categories: manageCategory(state.checklistRepository.categories, action),
            }
        };

    case 'SAVE_CHECKLIST_QUESTION': {
        const questions = [...state.checklistRepository.questions];
        const index = questions.findIndex(q => q.id === action.payload.id);
        if (index > -1) {
            questions[index] = action.payload;
        } else {
            questions.push({ ...action.payload, id: crypto.randomUUID() });
        }
        return { ...state, checklistRepository: { ...state.checklistRepository, questions } };
    }

    case 'DELETE_CHECKLIST_QUESTION':
        return {
            ...state,
            checklistRepository: {
                ...state.checklistRepository,
                questions: state.checklistRepository.questions.filter(q => q.id !== action.payload.questionId),
            }
        };
    
    case 'ADD_TASK_TYPE': {
        const newTaskType: TaskType = { 
            id: crypto.randomUUID(), 
            name: action.payload.name, 
            allowedCategoryIds: [],
            categorySelection: 'single',
            uiLayout: 'single-table',
            roomEntryLabel: 'Room/Unit'
        };
        const newConfig: TaskTypeConfiguration = {
            taskTypeId: newTaskType.id,
            enabledCategoryIds: [],
            enabledQuestionIds: [],
            overrides: [],
        }
        return { ...state, taskTypes: [...state.taskTypes, newTaskType], taskTypeConfigurations: [...state.taskTypeConfigurations, newConfig] };
    }

    case 'UPDATE_TASK_TYPE':
        return { ...state, taskTypes: state.taskTypes.map(tt => tt.id === action.payload.id ? { ...tt, name: action.payload.name } : tt) };

    case 'DELETE_TASK_TYPE':
        return {
            ...state,
            taskTypes: state.taskTypes.filter(tt => tt.id !== action.payload.id),
            taskTypeConfigurations: state.taskTypeConfigurations.filter(c => c.taskTypeId !== action.payload.id),
        }

    case 'UPDATE_TASK_TYPE_CONFIG':
        return {
            ...state,
            taskTypeConfigurations: state.taskTypeConfigurations.map(c => c.taskTypeId === action.payload.taskTypeId ? action.payload : c)
        };
    case "ADD_FORM": {
        const newForm = action.payload;
        const newState = { ...state, forms: [...state.forms, newForm] };
        return newState;
    }
    case "SET_FORMS":
        return { ...state, forms: action.payload };
    case "CLONE_FORM": {
        const formToClone = state.forms.find(f => f.id === action.payload.formId);
        if (!formToClone) return state;

        const clonedForm = cloneWithNewIds(formToClone);
        clonedForm.title = action.payload.newName;

        const formIndex = state.forms.findIndex(f => f.id === action.payload.formId);
        const newForms = [...state.forms];
        newForms.splice(formIndex + 1, 0, clonedForm);
        
        return { ...state, forms: newForms };
    }
    case "SET_FORM_STATE":
        return { ...state, formState: action.payload };
    case "UPDATE_USER_DRIVEN_STATE": {
        const { elementId, value, fullObject, isVisible } = action.payload;
        const newState = {
            ...state,
            formState: {
                ...state.formState,
                [elementId]: { 
                    ...state.formState[elementId],
                    value, 
                    fullObject,
                    isVisible: isVisible !== undefined ? isVisible : state.formState[elementId]?.isVisible
                }
            }
        };
        return newState;
    }
    case "SET_ACTIVE_POPUP":
      return { ...state, activePopupId: action.payload };
    case "ADD_SITE": {
      const newSite: Site = { id: crypto.randomUUID(), name: action.payload.name };
      return { ...state, sites: [...state.sites, newSite] };
    }
    case "DELETE_SITE": {
      return { ...state, sites: state.sites.filter(s => s.id !== action.payload.siteId) };
    }
    case "ADD_TASK": {
      const { taskTypeId, siteId } = action.payload;
      const newTask: Task = {
        id: crypto.randomUUID(),
        taskTypeId,
        siteId,
        status: 'Assigned',
        assignedAt: new Date().toISOString(),
      };
      return { ...state, tasks: [...state.tasks, newTask] };
    }
    case "UPDATE_TASK": {
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      }
    }
    case "COPY_TO_CLIPBOARD": {
        return { ...state, clipboard: action.payload };
    }
    case "PASTE_FROM_CLIPBOARD": {
        if (!activeForm || !state.clipboard) return state;

        const { sectionId, index } = action.payload;

        if (state.clipboard.type === 'section') {
            const newSection = cloneWithNewIds(state.clipboard.content);
            const targetIndex = index ?? activeFormSections.length;
            const newSections = [...activeFormSections];
            newSections.splice(targetIndex, 0, newSection);
            return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSections }) };
        }

        if (state.clipboard.type === 'element' && sectionId) {
            const newElement = cloneWithNewIds(state.clipboard.content);
            const newSections = activeFormSections.map(s => {
                if (s.id === sectionId) {
                    const newElements = [...s.elements];
                    const targetIndex = index ?? newElements.length;
                    newElements.splice(targetIndex, 0, newElement);
                    return { ...s, elements: newElements };
                }
                return s;
            });
            return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSections }) };
        }
        
        return state;
    }
    case "SET_ACTIVE_FORM": {
      const form = state.forms.find(f => f.id === action.payload.formId);
      const sections = form?.versions[0]?.sections || [];
      const configurations = form?.versions[0]?.configurations;
      const formState = getInitialFormState(sections, configurations);
      return { ...state, activeFormId: action.payload.formId, selectedElement: null, formState };
    }
    case "ADD_SECTION":
       if (!activeForm) return state;
      const newSectionsAfterAdd = [
          ...activeFormSections,
          { id: crypto.randomUUID(), title: "New Section", displayMode: "default", elements: [] },
        ];
      return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSectionsAfterAdd }) };

    case "ADD_ELEMENT": {
      if (!activeForm) return state;
      const { sectionId, type, index, parentId, id: newElementId } = action.payload;
      
      const newSectionsWithElement = activeFormSections.map((section) => {
          if (section.id === sectionId) {
            
             // Check if element with this ID already exists to prevent duplicates
            const elementExists = (els: FormElementInstance[], elementId: string): boolean => {
                return els.some(e => e.id === elementId || (e.elements && elementExists(e.elements, elementId)));
            };
            if (newElementId && elementExists(section.elements, newElementId)) {
                return section; // Prevent adding duplicate
            }

            if (parentId) { // Add to container
                const newElements = findAndModifyElement(section.elements, action);
                return { ...section, elements: newElements };
            } else { // Add to section
                const newElement = createNewElement(type, newElementId);
                const newElements = [...section.elements];
                if (index !== undefined) {
                    newElements.splice(index, 0, newElement);
                } else {
                    newElements.push(newElement);
                }
                return { ...section, elements: newElements };
            }
          }
          return section;
        });
        return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSectionsWithElement }) };
    }
    case "UPDATE_ELEMENT": {
      if (!activeForm) return state;
      const { sectionId } = action.payload;
      const newSectionsWithUpdate = activeFormSections.map((section) =>
          section.id === sectionId
            ? { ...section, elements: findAndModifyElement(section.elements, action) }
            : section
        );
      return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSectionsWithUpdate }) };
    }
    case "UPDATE_SECTION": {
        if (!activeForm) return state;
        const newSectionsWithSectionUpdate = activeFormSections.map(s => s.id === action.payload.id ? action.payload : s);
        return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSectionsWithSectionUpdate }) };
    }
    case "SELECT_ELEMENT":
      return { ...state, selectedElement: action.payload };

    case "DELETE_ELEMENT": {
        if (!activeForm) return state;
        const { sectionId, elementId } = action.payload;
        const newSectionsAfterDelete = activeFormSections.map((section) =>
              section.id === sectionId
                ? { ...section, elements: findAndModifyElement(section.elements, action) }
                : section
            );

        return {
            ...state,
            forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSectionsAfterDelete }),
            selectedElement: state.selectedElement?.elementId === elementId ? null : state.selectedElement,
        };
    }
    case "DELETE_SECTION": {
        if (!activeForm) return state;
        const newSectionsAfterSecDelete = activeFormSections.filter(s => s.id !== action.payload.sectionId)
        return {
            ...state,
            forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSectionsAfterSecDelete }),
            selectedElement: state.selectedElement?.sectionId === action.payload.sectionId ? null : state.selectedElement,
        };
    }
    case "CLONE_ELEMENT": {
      if (!activeForm) return state;
      const { sectionId } = action.payload;
      const sectionIndex = activeFormSections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return state;
      
      const newElements = findAndModifyElement([...activeFormSections[sectionIndex].elements], action);
      const newSections = [...activeFormSections];
      newSections[sectionIndex] = { ...newSections[sectionIndex], elements: newElements };
      
      return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSections }) };
    }
    case "CLONE_SECTION": {
      if (!activeForm) return state;
      const { sectionId } = action.payload;
      const sectionIndex = activeFormSections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return state;

      const sectionToClone = activeFormSections[sectionIndex];
      const clonedSection = cloneWithNewIds(sectionToClone);

      const newSectionsWithClone = [...activeFormSections];
      newSectionsWithClone.splice(sectionIndex + 1, 0, clonedSection);

      return {
          ...state,
          forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSectionsWithClone }),
          selectedElement: { sectionId: clonedSection.id, elementId: "" }
      }
    }
    case "SET_DRAGGED_ELEMENT":
        return { ...state, draggedElement: action.payload };

    case "MOVE_SECTION": {
        if (!activeForm) return state;
        const { fromIndex, toIndex } = action.payload;
        const newSectionsMoved = [...activeFormSections];
        const [removed] = newSectionsMoved.splice(fromIndex, 1);
        newSectionsMoved.splice(toIndex, 0, removed);
        return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: newSectionsMoved }) };
    }
    case "MOVE_ELEMENT": {
        if (!activeForm) return state;
        const { from, to } = action.payload;
        let elementToMove: FormElementInstance | undefined;
        let currentSections = [...activeFormSections];

        // Find and remove the element from its original location
        const removeFromSource = (elements: FormElementInstance[]): FormElementInstance[] => {
            const newElements: FormElementInstance[] = [];
            for (const el of elements) {
                if (el.id === from.elementId) {
                    elementToMove = el;
                    continue;
                }
                if (el.elements) {
                    newElements.push({ ...el, elements: removeFromSource(el.elements) });
                } else {
                    newElements.push(el);
                }
            }
            return newElements;
        }

        currentSections = currentSections.map(s => {
            if (s.id === from.sectionId) {
                return { ...s, elements: removeFromSource(s.elements) };
            }
            return s;
        });
       
        if (!elementToMove) return state;

        // Add the element to its new location
        const addToDestination = (elements: FormElementInstance[]): FormElementInstance[] => {
            if (to.parentId) { // Dropping into a container
                return elements.map(el => {
                    if (el.id === to.parentId) {
                        const newContainerElements = [...(el.elements || [])];
                        newContainerElements.splice(to.index !== undefined ? to.index : newContainerElements.length, 0, elementToMove!);
                        return { ...el, elements: newContainerElements };
                    }
                    if (el.elements) {
                        return { ...el, elements: addToDestination(el.elements) };
                    }
                    return el;
                });
            }
            return elements; // Should be handled at section level
        }

        currentSections = currentSections.map(s => {
            if (s.id === to.sectionId) {
                if (to.parentId) { // Dropping in a container inside the target section
                    return { ...s, elements: addToDestination(s.elements) };
                } else { // Dropping directly into a section
                    const newElements = [...s.elements];
                    newElements.splice(to.index !== undefined ? to.index : newElements.length, 0, elementToMove!);
                    return { ...s, elements: newElements };
                }
            }
            return s;
        });

        return { ...state, forms: updateActiveFormInState(state.forms, state.activeFormId!, { sections: currentSections }) };
    }
    case "ADD_SUBMISSION": {
        const { formId, data, taskId } = action.payload;
        const newSubmission: Submission = {
            id: crypto.randomUUID(),
            formId,
            taskId,
            timestamp: new Date().toISOString(),
            data,
        };
        const newTasks = state.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, status: 'Submitted' as 'Submitted', submissionId: newSubmission.id, submittedAt: newSubmission.timestamp };
          }
          return task;
        });
        return {
            ...state,
            submissions: [newSubmission, ...(state.submissions || [])],
            tasks: newTasks,
        }
    }
     case "SET_USER_SETTINGS": {
        const { categories, sites } = action.payload;
        return { ...state, categories: categories || [], sites: sites || [] };
    }
    case "ADD_CATEGORY": {
        const newCategory: Category = {
            id: crypto.randomUUID(),
            name: action.payload.name,
            subCategories: [],
        };
        const newCategories = [...state.categories, newCategory];
        return { ...state, categories: newCategories };
    }
    case "UPDATE_CATEGORY": {
        return {
            ...state,
            categories: state.categories.map(c => c.id === action.payload.category.id ? action.payload.category : c),
        };
    }
    case "DELETE_CATEGORY": {
        const newCategories = state.categories.filter(c => c.id !== action.payload.categoryId);
        return {
            ...state,
            categories: newCategories,
            forms: state.forms.map(f => f.categoryId === action.payload.categoryId ? {...f, categoryId: undefined, subCategoryId: undefined} : f)
        };
    }
    case "ADD_SUBCATEGORY": {
        const newSubCategory: SubCategory = {
            id: crypto.randomUUID(),
            name: action.payload.name,
        };
        const newCategoriesWithSub = state.categories.map(c => c.id === action.payload.categoryId ? { ...c, subCategories: [...c.subCategories, newSubCategory] } : c);
        return { ...state, categories: newCategoriesWithSub };
    }
    case "UPDATE_SUBCATEGORY": {
        const updatedCategories = state.categories.map(c => c.id === action.payload.categoryId ? { ...c, subCategories: c.subCategories.map(sc => sc.id === action.payload.subCategory.id ? action.payload.subCategory : sc) } : c);
        return { ...state, categories: updatedCategories };
    }
    case "DELETE_SUBCATEGORY": {
        const updatedCategoriesWithSubDelete = state.categories.map(c => c.id === action.payload.categoryId ? { ...c, subCategories: c.subCategories.filter(sc => sc.id !== action.payload.subCategoryId) } : c);
        return {
            ...state,
            categories: updatedCategoriesWithSubDelete,
            forms: state.forms.map(f => f.subCategoryId === action.payload.subCategoryId ? {...f, subCategoryId: undefined} : f)
        };
    }
    case "SAVE_VERSION": {
        if (!activeForm) return state;
        const { name, description, type, sections, rules, workflows, configurations, localDatasets, timestamp } = action.payload;
        const newVersion: FormVersion = { id: crypto.randomUUID(), name, description, type, timestamp, sections, rules, workflows, configurations, localDatasets };
        const updatedVersions = [newVersion, ...activeForm.versions];
        const newForms = state.forms.map(form => 
            form.id === state.activeFormId ? { ...form, versions: updatedVersions } : form
        );
        const newFormState = getInitialFormState(newVersion.sections, newVersion.configurations);
        return { ...state, forms: newForms, formState: newFormState };
    }
    case "LOAD_VERSION": {
        if (!activeForm) return state;
        const versionToLoad = activeForm.versions.find(v => v.id === action.payload.versionId);
        if (!versionToLoad) return state;
        const otherVersions = activeForm.versions.filter(v => v.id !== action.payload.versionId);
        const newVersions = [versionToLoad, ...otherVersions];
        const newForms = state.forms.map(form => 
            form.id === state.activeFormId ? { ...form, versions: newVersions } : form
        );
        const formState = getInitialFormState(versionToLoad.sections, versionToLoad.configurations);
        return { ...state, forms: newForms, formState };
    }
    case "DELETE_VERSION": {
        if (!activeForm) return state;
        const newVersions = activeForm.versions.filter(v => v.id !== action.payload.versionId);
        const newForms = state.forms.map(form => 
            form.id === state.activeFormId ? { ...form, versions: newVersions } : form
        );
        return { ...state, forms: newForms };
    }
     case "SET_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

/**
 * Updates the sections of the latest version of the active form.
 */
const updateActiveFormInState = (forms: Form[], activeFormId: string, updates: Partial<FormVersion>): Form[] => {
    return forms.map(form => {
        if (form.id === activeFormId) {
            const latestVersion = form.versions[0];
            const updatedVersions = [...form.versions];
            updatedVersions[0] = {
                ...latestVersion,
                ...updates,
                timestamp: new Date().toISOString(), // Update timestamp on change
            };
            return { ...form, versions: updatedVersions };
        }
        return form;
    });
};

type AddNewFormPayload = {
    title: string;
    description?: string;
    categoryId: string;
    subCategoryId: string | null;
};

type BuilderContextType = {
  state: State;
  dispatch: (action: Action) => void;
  addNewForm: (payload: AddNewFormPayload) => Promise<DocumentReference | null>;
  forms: Form[];
  categories: Category[];
  sites: Site[];
  tasks: Task[];
  activeForm: Form | null;
  sections: Section[];
  setSections: (sections: Section[]) => void;
  rules: Rule[];
  updateRules: (rules: Rule[], configurations: Configuration[]) => void;
  workflows: Workflow[];
  updateWorkflows: (workflows: Workflow[]) => void;
  configurations: Configuration[];
  updateConfigurations: (configurations: Configuration[]) => void;
  localDatasets: LocalDataset[];
  updateLocalDatasets: (datasets: LocalDataset[]) => void;
  checklistRepository: ChecklistRepository;
  taskTypes: TaskType[];
  taskTypeConfigurations: TaskTypeConfiguration[];
  clipboard: ClipboardItem | null;
  submissions: Submission[];
  formState: { [key: string]: { value: any, fullObject?: any, isVisible?: boolean } };
  setFormState: (state: { [key: string]: { value: any, fullObject?: any, isVisible?: boolean } }) => void;
  updateFormState: (elementId: string, value: any, fullObject?: any, isVisible?: boolean) => void;
  activePopupId: string | null;
  setActivePopupId: (id: string | null) => void;
};

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  const [userDrivenState, setUserDrivenState] = useState<{ elementId: string; value: any; timestamp: number } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  
  // Load from localStorage or Firestore on initial render
  useEffect(() => {
    if (isUserLoading) return;

    let loadedState: Partial<State> | null = null;
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        loadedState = JSON.parse(savedStateJSON);
      }
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
      loadedState = null;
    }

    const mergedState: State = { ...initialState };
    if (loadedState) {
        // Ensure all properties from initialState are present
        mergedState.forms = loadedState.forms || initialState.forms;
        mergedState.categories = loadedState.categories || initialState.categories;
        mergedState.sites = loadedState.sites || initialState.sites;
        mergedState.tasks = loadedState.tasks || initialState.tasks;
        mergedState.submissions = loadedState.submissions || initialState.submissions;
    }

    if (!mergedState.forms.some(f => f.id === demoTemplate.id)) {
        mergedState.forms.unshift(demoTemplate);
    }
    if (!mergedState.forms.some(f => f.id === cascadingDemoTemplate.id)) {
        mergedState.forms.unshift(cascadingDemoTemplate);
    }
    if (!mergedState.forms.some(f => f.id === editableTableCascadingDemo.id)) {
        mergedState.forms.unshift(editableTableCascadingDemo);
    }
     if (!mergedState.forms.some(f => f.id === relationalDataDemoTemplate.id)) {
        mergedState.forms.unshift(relationalDataDemoTemplate);
    }
    if (!mergedState.categories.some(c => c.id === demoCategory.id)) {
        mergedState.categories.unshift(demoCategory);
    }
    if (!mergedState.sites.some(s => s.id === sampleSite.id)) {
        mergedState.sites.unshift(sampleSite);
    }

    mergedState.checklistRepository = sampleChecklistRepository;
    mergedState.taskTypes = sampleTaskTypes;
    mergedState.taskTypeConfigurations = sampleTaskTypeConfigurations;

    dispatch({ type: 'SET_STATE', payload: mergedState });
    setIsLoaded(true);

  }, [isUserLoading]);

  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    if (isLoaded) {
        // Filter out demo data before saving to prevent persistence issues.
        const formsToSave = state.forms.filter(f => !f.id.startsWith('demo-'));
        const categoriesToSave = state.categories.filter(c => c.id !== 'demo-templates');
        const sitesToSave = state.sites.filter(s => s.id !== 'demo-site-1');

        const stateToSave = {
            forms: formsToSave,
            categories: categoriesToSave,
            sites: sitesToSave,
            tasks: state.tasks,
            submissions: state.submissions,
            checklistRepository: state.checklistRepository,
            taskTypes: state.taskTypes,
            taskTypeConfigurations: state.taskTypeConfigurations,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [state.forms, state.categories, state.sites, state.tasks, state.submissions, state.checklistRepository, state.taskTypes, state.taskTypeConfigurations, isLoaded]);


  const activeForm = state.forms.find(f => f.id === state.activeFormId) || null;
  const sections = activeForm?.versions[0]?.sections || [];
  const rules = activeForm?.versions[0]?.rules || [];
  const workflows = activeForm?.versions[0]?.workflows || [];
  const configurations = activeForm?.versions[0]?.configurations || [];
  const localDatasets = activeForm?.versions[0]?.localDatasets || [];
  const activePopupId = state.activePopupId;
  const checklistRepository = state.checklistRepository;
  const taskTypes = state.taskTypes;
  const taskTypeConfigurations = state.taskTypeConfigurations;

  // This effect runs the rule engine whenever a user-driven state change occurs.
  useEffect(() => {
    if (!isLoaded || !activeForm || !userDrivenState) return;

    let nextFormState = { ...state.formState };
    const allElements = getAllElements(sections);

    // This function determines the visibility of a single element
    const getElementVisibility = (element: FormElementInstance, rowContext?: any): boolean => {
        const context = rowContext ? { ...state.formState, ...rowContext } : state.formState;

        const hideRuleMet = rules.some(r =>
            r.behaviors.some(b => b.type === 'hide' && b.targetElementId === element.id) &&
            evaluateRule(r, context, configurations, sections, rowContext)
        );
        if (hideRuleMet) return false;

        const showRules = rules.filter(r => r.behaviors.some(b => b.type === 'show' && b.targetElementId === element.id));
        if (showRules.length > 0) {
            return showRules.some(r => evaluateRule(r, context, configurations, sections, rowContext));
        }

        return !element.hidden;
    };

    allElements.forEach(element => {
        if (element.type === 'EditableTable' && state.formState[element.id]?.value) {
            // For tables, re-evaluate visibility for each column in each row
            const newRows = state.formState[element.id].value.map((row: any) => {
                const newRow = { ...row, _internal: { ...row._internal, visibility: {} } };
                element.columns?.forEach(col => {
                    const isVisible = getElementVisibility(col.element, newRow);
                    newRow._internal.visibility[col.element.id] = isVisible;
                });
                return newRow;
            });
            nextFormState[element.id] = { ...state.formState[element.id], value: newRows };
        } else {
            const isVisible = getElementVisibility(element);
            if (nextFormState[element.id]) {
                nextFormState[element.id].isVisible = isVisible;
            } else {
                nextFormState[element.id] = { value: undefined, isVisible };
            }
        }
    });
    
    if (JSON.stringify(nextFormState) !== JSON.stringify(state.formState)) {
         dispatch({ type: 'SET_FORM_STATE', payload: nextFormState });
    }
  }, [userDrivenState]);
  
 const addNewForm = useCallback(async (payload: AddNewFormPayload): Promise<DocumentReference | null> => {
    const { title, description, categoryId, subCategoryId } = payload;
    const newVersion: FormVersion = {
      id: crypto.randomUUID(),
      name: "Version 1",
      description: description || "Initial version",
      type: "draft",
      timestamp: new Date().toISOString(),
      sections: [{ id: crypto.randomUUID(), title: "New Section", displayMode: "default", elements: [] }],
      rules: [],
      workflows: [],
      configurations: [],
      localDatasets: [],
    };
    const newFormWithId: Form = {
      id: crypto.randomUUID(),
      title,
      categoryId,
      subCategoryId,
      versions: [newVersion],
    };
    dispatch({ type: "ADD_FORM", payload: newFormWithId });
    return Promise.resolve(null);
  }, []);

  const setSections = useCallback((newSections: Section[]) => {
    if (!activeForm) return;
    const newVersions = [...activeForm.versions];
    newVersions[0] = { ...newVersions[0], sections: newSections, timestamp: new Date().toISOString() };
    const newForms = state.forms.map(f => (f.id === activeForm.id ? { ...f, versions: newVersions } : f));
    dispatch({ type: "SET_STATE", payload: { forms: newForms } });
  }, [activeForm, state.forms]);

  const updateRules = useCallback((newRules: Rule[], newConfigurations: Configuration[]) => {
    if (!activeForm) return;
    const newVersions = [...activeForm.versions];
    newVersions[0] = { ...newVersions[0], rules: newRules, configurations: newConfigurations, timestamp: new Date().toISOString() };
    const newForms = state.forms.map(f => (f.id === activeForm.id ? { ...f, versions: newVersions } : f));
    const newFormState = getInitialFormState(newVersions[0].sections, newConfigurations);
    dispatch({ type: "SET_STATE", payload: { forms: newForms, formState: newFormState } });
  }, [activeForm, state.forms]);

  const updateWorkflows = useCallback((newWorkflows: Workflow[]) => {
    if (!activeForm) return;
    const newVersions = [...activeForm.versions];
    newVersions[0] = { ...newVersions[0], workflows: newWorkflows, timestamp: new Date().toISOString() };
    const newForms = state.forms.map(f => (f.id === activeForm.id ? { ...f, versions: newVersions } : f));
    dispatch({ type: "SET_STATE", payload: { forms: newForms } });
  }, [activeForm, state.forms]);

  const updateConfigurations = useCallback((newConfigurations: Configuration[]) => {
    if (!activeForm) return;
    const newVersions = [...activeForm.versions];
    newVersions[0] = { ...newVersions[0], configurations: newConfigurations, timestamp: new Date().toISOString() };
    const newForms = state.forms.map(f => (f.id === activeForm.id ? { ...f, versions: newVersions } : f));
    const newFormState = getInitialFormState(newVersions[0].sections, newConfigurations);
    dispatch({ type: "SET_STATE", payload: { forms: newForms, formState: newFormState } });
  }, [activeForm, state.forms]);

  const updateLocalDatasets = useCallback((newDatasets: LocalDataset[]) => {
    if (!activeForm) return;
    const newVersions = [...activeForm.versions];
    newVersions[0] = { ...newVersions[0], localDatasets: newDatasets, timestamp: new Date().toISOString() };
    const newForms = state.forms.map(f => (f.id === activeForm.id ? { ...f, versions: newVersions } : f));
    dispatch({ type: "SET_STATE", payload: { forms: newForms } });
  }, [activeForm, state.forms]);

  const setFormState = useCallback((newState: { [key: string]: { value: any; fullObject?: any; isVisible?: boolean } }) => {
    dispatch({ type: "SET_FORM_STATE", payload: newState });
  }, []);

  const updateFormState = useCallback((elementId: string, value: any, fullObject?: any, isVisible?: boolean) => {
    dispatch({ type: "UPDATE_USER_DRIVEN_STATE", payload: { elementId, value, fullObject, isVisible } });
    
    // This is the trigger for the rule engine.
    setUserDrivenState({ elementId, value, timestamp: Date.now() });
    
  }, []);

  const setActivePopupId = useCallback((id: string | null) => {
    dispatch({ type: "SET_ACTIVE_POPUP", payload: id });
  }, []);

  const enhancedDispatch = useCallback((action: Action) => {
    if (action.type === "UPDATE_ELEMENT") {
      const { element } = action.payload;
      setUserDrivenState({ elementId: element.id, value: "prop_change", timestamp: Date.now() });
    }
    dispatch(action);
  }, []);

  const contextValue = useMemo(() => ({
    state, 
    dispatch: enhancedDispatch, 
    addNewForm, 
    forms: state.forms, 
    categories: state.categories, 
    sites: state.sites, 
    tasks: state.tasks, 
    submissions: state.submissions, 
    activeForm, 
    sections, 
    setSections, 
    rules, 
    updateRules, 
    workflows, 
    updateWorkflows, 
    configurations, 
    updateConfigurations, 
    localDatasets, 
    updateLocalDatasets,
    checklistRepository,
    taskTypes,
    taskTypeConfigurations,
    clipboard: state.clipboard, 
    formState: state.formState, 
    setFormState, 
    updateFormState, 
    activePopupId, 
    setActivePopupId
  }), [
    state,
    enhancedDispatch,
    addNewForm,
    activeForm,
    sections,
    setSections,
    rules,
    updateRules,
    workflows,
    updateWorkflows,
    configurations,
    updateConfigurations,
    localDatasets,
    updateLocalDatasets,
    checklistRepository,
    taskTypes,
    taskTypeConfigurations,
    setFormState,
    updateFormState,
    activePopupId,
    setActivePopupId
  ]);
  
  if (!isLoaded) {
    return (
        <main className="flex flex-col items-center justify-center w-full min-h-screen bg-background p-4 md:p-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-primary">CoPilot</h1>
                <p className="text-muted-foreground mt-2">Loading your form builder...</p>
            </div>
        </main>
    );
  }

  return (
    <BuilderContext.Provider value={contextValue}>
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
};
