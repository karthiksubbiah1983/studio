
"use client";

import { createContext, useContext, useReducer, Dispatch, ReactNode, useEffect, useState } from "react";
import { FormElementInstance, Section, ElementType, FormVersion, Form, Submission } from "@/lib/types";
import { createNewElement } from "@/lib/form-elements";

type FormIndex = {
  id: string;
  title: string;
};

type State = {
  formIndex: FormIndex[];
  submissions: Submission[];
  activeForm: Form | null; // Only the fully loaded active form
  selectedElement: { elementId: string; sectionId: string } | null;
  draggedElement: { element: FormElementInstance; sectionId: string } | { type: ElementType } | { sectionId: string } | null;
};

type Action =
  | { type: "ADD_FORM"; payload: { title: string } }
  | { type: "UPDATE_FORM_TITLE"; payload: { formId: string, title: string } }
  | { type: "DELETE_FORM"; payload: { formId: string } }
  | { type: "SET_ACTIVE_FORM"; payload: { formId: string | null } }
  | { type: "LOAD_FORM_DATA"; payload: { form: Form } }
  | { type: "ADD_SECTION" }
  | { type: "ADD_ELEMENT"; payload: { sectionId: string; type: ElementType; index?: number, parentId?: string } }
  | { type: "UPDATE_ELEMENT"; payload: { sectionId: string; element: FormElementInstance } }
  | { type: "UPDATE_SECTION"; payload: Section }
  | { type: "SELECT_ELEMENT"; payload: { elementId: string; sectionId: string } | null }
  | { type: "DELETE_ELEMENT"; payload: { elementId: string; sectionId: string } }
  | { type: "DELETE_SECTION"; payload: { sectionId: string } }
  | { type: "CLONE_ELEMENT"; payload: { elementId: string; sectionId: string } }
  | { type: "CLONE_SECTION"; payload: { sectionId: string } }
  | { type: "SET_DRAGGED_ELEMENT"; payload: State['draggedElement'] }
  | { type: "MOVE_SECTION"; payload: { fromIndex: number, toIndex: number } }
  | { type: "MOVE_ELEMENT"; payload: { from: { sectionId: string; elementId: string }, to: { sectionId: string; index?: number, parentId?: string } } }
  | { type: "SAVE_VERSION"; payload: { name: string; description: string; type: "draft" | "published"; sections: Section[] } }
  | { type: "LOAD_VERSION"; payload: { versionId: string } }
  | { type: "DELETE_VERSION"; payload: { versionId: string } }
  | { type: "ADD_SUBMISSION"; payload: { formId: string, data: Record<string, any> } }
  | { type: "SET_STATE"; payload: Partial<State> };

const initialState: State = {
  formIndex: [],
  submissions: [],
  activeForm: null,
  selectedElement: null,
  draggedElement: null,
};

// Helper function to deep clone and assign new IDs
const cloneWithNewIds = <T extends { id: string }>(item: T): T => {
  const newItem = JSON.parse(JSON.stringify(item));
  newItem.id = crypto.randomUUID();
  if ('elements' in newItem && Array.isArray(newItem.elements)) {
    (newItem as any).elements = newItem.elements.map((el: any) => cloneWithNewIds(el));
  }
  return newItem;
};

// Recursive function to find and update/add/delete an element
const findAndModifyElement = (elements: FormElementInstance[], action: Action): FormElementInstance[] => {
    switch (action.type) {
        case "ADD_ELEMENT": {
             const { parentId, type, index } = action.payload;
             if (parentId) { // Add to container
                return elements.map(el => {
                    if (el.id === parentId && el.type === 'Container') {
                        const newElement = createNewElement(type);
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
                if (el.id === action.payload.element.id) return action.payload.element;
                if (el.elements) return { ...el, elements: findAndModifyElement(el.elements, action) };
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
                    const clonedSub = findAndModifyElement([el], action);
                    newElements.pop();
                    newElements.push(...clonedSub);
                }
            }
            return newElements;
        }
    }
    return elements;
};

const builderReducer = (state: State, action: Action): State => {
  const activeForm = state.activeForm;
  const activeFormSections = activeForm?.versions[0]?.sections || [];

  switch (action.type) {
    case "ADD_FORM": {
        const newFormId = crypto.randomUUID();
        const newForm: Form = {
            id: newFormId,
            title: action.payload.title,
            versions: [{
              id: crypto.randomUUID(),
              name: "Initial Draft",
              description: "",
              type: "draft",
              timestamp: new Date().toISOString(),
              sections: [{ id: crypto.randomUUID(), title: "New Section", config: "expanded", elements: [] }]
            }]
        };

        const newFormIndex: FormIndex = { id: newForm.id, title: newForm.title };
        if (typeof window !== "undefined") {
            localStorage.setItem(`form-builder-form-${newForm.id}`, JSON.stringify(newForm));
        }

        // This is a bit of a hack for the special dispatch, we return the ID via the state itself
        return {
            ...state,
            formIndex: [...state.formIndex, newFormIndex],
            activeForm: newForm,
        };
    }
    case "UPDATE_FORM_TITLE": {
      return {
        ...state,
        formIndex: state.formIndex.map(form =>
          form.id === action.payload.formId ? { ...form, title: action.payload.title } : form
        ),
        activeForm: state.activeForm && state.activeForm.id === action.payload.formId 
          ? { ...state.activeForm, title: action.payload.title } 
          : state.activeForm,
      }
    }
    case "DELETE_FORM": {
        if (typeof window !== "undefined") {
            localStorage.removeItem(`form-builder-form-${action.payload.formId}`);
        }
        return {
            ...state,
            formIndex: state.formIndex.filter(f => f.id !== action.payload.formId),
            activeForm: state.activeForm?.id === action.payload.formId ? null : state.activeForm,
        };
    }
    case "SET_ACTIVE_FORM":
        return { ...state, activeForm: null, selectedElement: null };

    case "LOAD_FORM_DATA":
        return { ...state, activeForm: action.payload.form };

    // All actions below operate on the active form
    case "ADD_SECTION":
       if (!activeForm) return state;
      const newSectionsAfterAdd = [
          ...activeFormSections,
          { id: crypto.randomUUID(), title: "New Section", config: "expanded", elements: [] },
        ];
      return { ...state, activeForm: updateActiveFormSections(activeForm, newSectionsAfterAdd) };

    case "ADD_ELEMENT": {
      if (!activeForm) return state;
      const { sectionId, type, index, parentId } = action.payload;
      const newSectionsWithElement = activeFormSections.map((section) => {
          if (section.id === sectionId) {
            const newElement = createNewElement(type);
            if (parentId) { // Add to container
                const newElements = findAndModifyElement(section.elements, action);
                return { ...section, elements: newElements };
            } else { // Add to section
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
        return { ...state, activeForm: updateActiveFormSections(activeForm, newSectionsWithElement) };
    }
    case "UPDATE_ELEMENT": {
      if (!activeForm) return state;
      const { sectionId } = action.payload;
      const newSectionsWithUpdate = activeFormSections.map((section) =>
          section.id === sectionId
            ? { ...section, elements: findAndModifyElement(section.elements, action) }
            : section
        );
      return { ...state, activeForm: updateActiveFormSections(activeForm, newSectionsWithUpdate) };
    }
    case "UPDATE_SECTION": {
        if (!activeForm) return state;
        const newSectionsWithSectionUpdate = activeFormSections.map(s => s.id === action.payload.id ? action.payload : s);
        return { ...state, activeForm: updateActiveFormSections(activeForm, newSectionsWithSectionUpdate) };
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
            activeForm: updateActiveFormSections(activeForm, newSectionsAfterDelete),
            selectedElement: state.selectedElement?.elementId === elementId ? null : state.selectedElement,
        };
    }
    case "DELETE_SECTION": {
        if (!activeForm) return state;
        const newSectionsAfterSecDelete = activeFormSections.filter(s => s.id !== action.payload.sectionId)
        return {
            ...state,
            activeForm: updateActiveFormSections(activeForm, newSectionsAfterSecDelete),
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
      
      return { ...state, activeForm: updateActiveFormSections(activeForm, newSections) };
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
          activeForm: updateActiveFormSections(activeForm, newSectionsWithClone),
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
        return { ...state, activeForm: updateActiveFormSections(activeForm, newSectionsMoved) };
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

        return { ...state, activeForm: updateActiveFormSections(activeForm, currentSections) };
    }
    case "SAVE_VERSION": {
      if (!activeForm) return state;
      const { name, description, type, sections } = action.payload;
      const newVersion: FormVersion = {
        id: crypto.randomUUID(),
        name,
        description,
        type,
        timestamp: new Date().toISOString(),
        sections,
      };
      
      const newForm: Form = {
        ...activeForm,
        versions: [newVersion, ...activeForm.versions]
      };
      return { ...state, activeForm: newForm };
    }
    case "LOAD_VERSION": {
      if (!activeForm) return state;
      const version = activeForm.versions.find(v => v.id === action.payload.versionId);
      if (version) {
        // Bring this version to the front (making it the latest draft)
        const otherVersions = activeForm.versions.filter(v => v.id !== action.payload.versionId);
        const newActiveForm = {
            ...activeForm,
            versions: [version, ...otherVersions]
        };

        return {
          ...state,
          activeForm: newActiveForm,
          selectedElement: null,
        };
      }
      return state;
    }
    case "DELETE_VERSION": {
      if (!activeForm) return state;
      const newActiveForm = {
        ...activeForm,
        versions: activeForm.versions.filter(v => v.id !== action.payload.versionId)
      };
      return { ...state, activeForm: newActiveForm };
    }
    case "ADD_SUBMISSION": {
        const { formId, data } = action.payload;
        const newSubmission: Submission = {
            id: crypto.randomUUID(),
            formId,
            timestamp: new Date().toISOString(),
            data,
        };
        return {
            ...state,
            submissions: [newSubmission, ...(state.submissions || [])],
        }
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
const updateActiveFormSections = (activeForm: Form, sections: Section[]): Form => {
    if (!activeForm) return activeForm;

    const latestVersion = activeForm.versions[0];
    const updatedVersions = [...activeForm.versions];
    updatedVersions[0] = {
        ...latestVersion,
        sections: sections,
        timestamp: new Date().toISOString(), // Update timestamp on change
    };
    
    return {
        ...activeForm,
        versions: updatedVersions,
    };
};


type BuilderContextType = {
  state: State;
  dispatch: (action: Action) => string | void;
  forms: FormIndex[];
  activeForm: Form | null;
  sections: Section[];
};

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

const FORM_INDEX_KEY = "form-builder-index";
const SUBMISSIONS_KEY = "form-builder-submissions";
const getFormKey = (formId: string) => `form-builder-form-${formId}`;

export const BuilderProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatchAction] = useReducer(builderReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedIndex = localStorage.getItem(FORM_INDEX_KEY);
        const storedSubmissions = localStorage.getItem(SUBMISSIONS_KEY);
        const initialFormIndex = storedIndex ? JSON.parse(storedIndex) : [];
        const initialSubmissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];

        dispatchAction({ type: "SET_STATE", payload: { formIndex: initialFormIndex, submissions: initialSubmissions } });

      } catch (error) {
        console.error("Failed to parse state from localStorage", error);
      }
      setIsInitialized(true);
    }
  }, []);
  
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
        localStorage.setItem(FORM_INDEX_KEY, JSON.stringify(state.formIndex));
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(state.submissions));
        if (state.activeForm) {
            localStorage.setItem(getFormKey(state.activeForm.id), JSON.stringify(state.activeForm));
        }
    }
  }, [state, isInitialized]);

  const sections = state.activeForm?.versions[0]?.sections || [];
  
  const dispatch = (action: Action) => {
    if (action.type === 'ADD_FORM') {
      const newState = builderReducer(state, action);
      dispatchAction({type: "SET_STATE", payload: newState });
      return newState.activeForm!.id;
    }
    dispatchAction(action);
  }

  return (
    <BuilderContext.Provider value={{ state, dispatch, forms: state.formIndex, activeForm: state.activeForm, sections }}>
      {isInitialized ? children : null}
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

    