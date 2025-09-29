
"use client";

import { createContext, useContext, useReducer, Dispatch, ReactNode, useEffect, useState } from "react";
import { FormElementInstance, Section, ElementType, FormVersion, Form, Submission } from "@/lib/types";
import { createNewElement } from "@/lib/form-elements";

type State = {
  forms: Form[];
  submissions: Submission[];
  activeFormId: string | null;
  selectedElement: { elementId: string; sectionId: string } | null;
  draggedElement: { element: FormElementInstance; sectionId: string } | { type: ElementType } | { sectionId: string } | null;
};

type Action =
  | { type: "ADD_FORM"; payload: { title: string, description?: string } }
  | { type: "UPDATE_FORM_TITLE"; payload: { formId: string, title: string } }
  | { type: "DELETE_FORM"; payload: { formId: string } }
  | { type: "CLONE_FORM", payload: { formId: string, newName: string } }
  | { type: "SET_ACTIVE_FORM"; payload: { formId: string | null } }
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
  | { type: "SET_STATE"; payload: Partial<State> }
  | { type: "SET_SECTIONS"; payload: { sections: Section[] } };


const initialState: State = {
  forms: [],
  submissions: [],
  activeFormId: null,
  selectedElement: null,
  draggedElement: null,
};

// Helper function to deep clone and assign new IDs
const cloneWithNewIds = <T extends { id: string; key?: string, elements?: any[], sections?: any[], versions?: any[] }>(item: T): T => {
  const itemClone = JSON.parse(JSON.stringify(item));
  
  const reIdRecursive = (obj: any) => {
    if (obj.id) obj.id = crypto.randomUUID();
    
    // Check for conditional logic triggers and update them if they exist in the map
    if (obj.conditionalLogic && obj.conditionalLogic.triggerElementId && idMap[obj.conditionalLogic.triggerElementId]) {
      obj.conditionalLogic.triggerElementId = idMap[obj.conditionalLogic.triggerElementId];
    }

    if (obj.elements && Array.isArray(obj.elements)) {
      obj.elements.forEach(reIdRecursive);
    }
  };

  const idMap: { [oldId: string]: string } = {};

  // First pass: collect all old IDs and create new ones
  const collectIds = (obj: any) => {
    if (obj.id) {
        const newId = crypto.randomUUID();
        idMap[obj.id] = newId;
    }
    if (obj.elements && Array.isArray(obj.elements)) obj.elements.forEach(collectIds);
    if (obj.sections && Array.isArray(obj.sections)) obj.sections.forEach(collectIds);
    if (obj.versions && Array.isArray(obj.versions)) obj.versions.forEach(collectIds);
  }
  collectIds(itemClone);

  // Second pass: update all IDs
  const updateIds = (obj: any) => {
     if (obj.id && idMap[obj.id]) obj.id = idMap[obj.id];

     if (obj.key) obj.key = `${obj.key}_${Math.random().toString(36).substring(2, 7)}`;

     // Update conditional logic triggers
     if (obj.conditionalLogic && obj.conditionalLogic.triggerElementId && idMap[obj.conditionalLogic.triggerElementId]) {
        obj.conditionalLogic.triggerElementId = idMap[obj.conditionalLogic.triggerElementId];
     }
     
     if (obj.elements && Array.isArray(obj.elements)) obj.elements.forEach(updateIds);
     if (obj.sections && Array.isArray(obj.sections)) obj.sections.forEach(collectIds);
     if (obj.versions && Array.isArray(obj.versions)) obj.versions.forEach(updateIds);
  }
  updateIds(itemClone);


  return itemClone;
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

const builderReducer = (state: State, action: Action): State => {
  const activeForm = state.forms.find(f => f.id === state.activeFormId);
  const activeFormSections = activeForm?.versions[0]?.sections || [];

  switch (action.type) {
    case "ADD_FORM": {
        const { title, description } = action.payload;
        const newFormId = crypto.randomUUID();
        const newForm: Form = {
            id: newFormId,
            title: title,
            versions: [{
              id: crypto.randomUUID(),
              name: "Version 1",
              description: description || "Initial version",
              type: "draft",
              timestamp: new Date().toISOString(),
              sections: [{ id: crypto.randomUUID(), title: "New Section", config: "expanded", elements: [] }]
            }]
        };
        // This is a bit of a hack for the special dispatch, we return the ID via the state itself
        return {
            ...state,
            forms: [...state.forms, newForm],
            activeFormId: newFormId
        };
    }
    case "UPDATE_FORM_TITLE": {
      return {
        ...state,
        forms: state.forms.map(form =>
          form.id === action.payload.formId ? { ...form, title: action.payload.title } : form
        )
      }
    }
    case "DELETE_FORM": {
        return {
            ...state,
            forms: state.forms.filter(f => f.id !== action.payload.formId),
            activeFormId: state.activeFormId === action.payload.formId ? null : state.activeFormId,
        };
    }
    case "CLONE_FORM": {
        const { formId, newName } = action.payload;
        const formToClone = state.forms.find(f => f.id === formId);
        if (!formToClone || formToClone.versions.length === 0) return state;

        // Take the content of the latest version of the form to clone
        const latestVersionContent = formToClone.versions[0];
        
        // Deep clone the sections and assign new IDs to everything
        const newSections = cloneWithNewIds({ sections: latestVersionContent.sections }).sections;

        const newForm: Form = {
            id: crypto.randomUUID(),
            title: newName,
            versions: [
                {
                    id: crypto.randomUUID(),
                    name: "Initial Draft",
                    description: `Cloned from "${formToClone.title}"`,
                    type: "draft",
                    timestamp: new Date().toISOString(),
                    sections: newSections,
                }
            ]
        };

        const formIndex = state.forms.findIndex(f => f.id === formId);
        const newForms = [...state.forms];
        newForms.splice(formIndex + 1, 0, newForm);

        return {
            ...state,
            forms: newForms,
        };
    }
    case "SET_ACTIVE_FORM":
      return { ...state, activeFormId: action.payload.formId, selectedElement: null };

    // All actions below operate on the active form
    case "SET_SECTIONS": {
      if (!activeForm) return state;
      const newForms = state.forms.map(form => {
        if (form.id === state.activeFormId) {
            const newVersions = [...form.versions];
            newVersions[0] = {
                ...newVersions[0],
                sections: action.payload.sections,
                timestamp: new Date().toISOString(),
            };
            return { ...form, versions: newVersions };
        }
        return form;
      });
      return { ...state, forms: newForms };
    }
    case "ADD_SECTION":
       if (!activeForm) return state;
      const newSectionsAfterAdd = [
          ...activeFormSections,
          { id: crypto.randomUUID(), title: "New Section", config: "expanded", elements: [] },
        ];
      return { ...state, forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSectionsAfterAdd }) };

    case "ADD_ELEMENT": {
      if (!activeForm) return state;
      const { sectionId, type, index, parentId } = action.payload;
      const newSectionsWithElement = activeFormSections.map((section) => {
          if (section.id === sectionId) {
            if (parentId) { // Add to container
                const newElements = findAndModifyElement(section.elements, action);
                return { ...section, elements: newElements };
            } else { // Add to section
                const newElement = createNewElement(type);
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
        return { ...state, forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSectionsWithElement }) };
    }
    case "UPDATE_ELEMENT": {
      if (!activeForm) return state;
      const { sectionId } = action.payload;
      const newSectionsWithUpdate = activeFormSections.map((section) =>
          section.id === sectionId
            ? { ...section, elements: findAndModifyElement(section.elements, action) }
            : section
        );
      return { ...state, forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSectionsWithUpdate }) };
    }
    case "UPDATE_SECTION": {
        if (!activeForm) return state;
        const newSectionsWithSectionUpdate = activeFormSections.map(s => s.id === action.payload.id ? action.payload : s);
        return { ...state, forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSectionsWithSectionUpdate }) };
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
            forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSectionsAfterDelete }),
            selectedElement: state.selectedElement?.elementId === elementId ? null : state.selectedElement,
        };
    }
    case "DELETE_SECTION": {
        if (!activeForm) return state;
        const newSectionsAfterSecDelete = activeFormSections.filter(s => s.id !== action.payload.sectionId)
        return {
            ...state,
            forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSectionsAfterSecDelete }),
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
      
      return { ...state, forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSections }) };
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
          forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSectionsWithClone }),
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
        return { ...state, forms: updateActiveForm(state.forms, state.activeFormId!, { sections: newSectionsMoved }) };
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

        return { ...state, forms: updateActiveForm(state.forms, state.activeFormId!, { sections: currentSections }) };
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
      
      const newForms = state.forms.map(form => {
        if (form.id === state.activeFormId) {
          const newVersions = [newVersion, ...form.versions];
          return { ...form, versions: newVersions };
        }
        return form;
      });
      return { ...state, forms: newForms };
    }
    case "LOAD_VERSION": {
      if (!activeForm) return state;
      const versionToLoad = activeForm.versions.find(v => v.id === action.payload.versionId);
      if (!versionToLoad) return state;

      const newDraftVersion: FormVersion = {
        id: crypto.randomUUID(),
        name: `Draft from ${versionToLoad.name}`,
        description: `Based on version: ${versionToLoad.name}`,
        type: 'draft',
        timestamp: new Date().toISOString(),
        sections: JSON.parse(JSON.stringify(versionToLoad.sections)) // Deep copy
      };
      
      const newForms = state.forms.map(form => {
          if (form.id === state.activeFormId) {
              const otherVersions = form.versions.filter(v => v.id !== versionToLoad.id);
              const newVersions = [newDraftVersion, versionToLoad, ...otherVersions];
              return { ...form, versions: newVersions };
          }
          return form;
      });

      return {
          ...state,
          forms: newForms,
          selectedElement: null,
      };
    }
    case "DELETE_VERSION": {
      if (!activeForm) return state;
      const newForms = state.forms.map(form => {
        if (form.id === state.activeFormId) {
            return { ...form, versions: form.versions.filter(v => v.id !== action.payload.versionId) };
        }
        return form;
      });
      return { ...state, forms: newForms };
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
const updateActiveForm = (forms: Form[], activeFormId: string, updates: { sections: Section[] }): Form[] => {
    return forms.map(form => {
        if (form.id === activeFormId) {
            const latestVersion = form.versions[0];
            const updatedVersions = [...form.versions];
            updatedVersions[0] = {
                ...latestVersion,
                sections: updates.sections,
                timestamp: new Date().toISOString(), // Update timestamp on change
            };
            return { ...form, versions: updatedVersions };
        }
        return form;
    });
};


type BuilderContextType = {
  state: State;
  dispatch: (action: Action) => string | void;
  forms: Form[];
  activeForm: Form | null;
  sections: Section[];
  setSections: (sections: Section[]) => void;
};

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "form-builder-state";

export const BuilderProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatchAction] = useReducer(builderReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          // Simple validation to check if the stored state is somewhat valid
          if (parsedState && Array.isArray(parsedState.forms)) {
            dispatchAction({ type: "SET_STATE", payload: parsedState });
          } else {
             throw new Error("Invalid state format");
          }
        } else {
            // If no state, create a default form
            const defaultFormId = crypto.randomUUID();
            const defaultForm: Form = {
                id: defaultFormId,
                title: "My First Form",
                versions: [{
                  id: crypto.randomUUID(),
                  name: "Initial Draft",
                  description: "",
                  type: "draft",
                  timestamp: new Date().toISOString(),
                  sections: [{ id: crypto.randomUUID(), title: "New Section", config: "expanded", elements: [] }]
                }]
            };
            dispatchAction({ type: "SET_STATE", payload: { forms: [defaultForm], activeFormId: defaultFormId, submissions: [] } });
        }
      } catch (error) {
        console.error("Failed to load state from localStorage, initializing with default.", error);
        // Fallback to loading/parsing fails
         const defaultFormId = crypto.randomUUID();
         const defaultForm: Form = {
            id: defaultFormId,
            title: "My First Form",
            versions: [{
              id: crypto.randomUUID(),
              name: "Initial Draft",
              description: "",
              type: "draft",
              timestamp: new Date().toISOString(),
              sections: [{ id: crypto.randomUUID(), title: "New Section", config: "expanded", elements: [] }]
            }]
         };
         dispatchAction({ type: "SET_STATE", payload: { forms: [defaultForm], activeFormId: defaultFormId, submissions: [] } });
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [state, isLoading]);

  const activeForm = state.forms.find(f => f.id === state.activeFormId) || null;
  const sections = activeForm?.versions[0]?.sections || [];
  
  const dispatch = (action: Action): string | void => {
    if (action.type === 'ADD_FORM') {
      const newState = builderReducer(state, action);
      dispatchAction({type: "SET_STATE", payload: newState });
      return newState.activeFormId;
    }
    dispatchAction(action);
  }
  
  const setSections = (newSections: Section[]) => {
    dispatchAction({ type: 'SET_SECTIONS', payload: { sections: newSections }})
  }

  if (isLoading) {
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
    <BuilderContext.Provider value={{ state, dispatch, forms: state.forms, activeForm, sections, setSections }}>
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
