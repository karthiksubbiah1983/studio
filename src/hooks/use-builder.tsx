
"use client";

import { createContext, useContext, useReducer, Dispatch, ReactNode, useEffect } from "react";
import { FormElementInstance, Section, ElementType, FormVersion } from "@/lib/types";
import { createNewElement } from "@/lib/form-elements";

type State = {
  sections: Section[];
  selectedElement: { elementId: string; sectionId: string } | null;
  draggedElement: { element: FormElementInstance; sectionId: string } | { type: ElementType } | { sectionId: string } | null;
  versions: FormVersion[];
};

type Action =
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
  | { type: "SET_STATE"; payload: State };

const initialState: State = {
  sections: [],
  selectedElement: null,
  draggedElement: null,
  versions: [],
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
  switch (action.type) {
    case "ADD_SECTION":
      return {
        ...state,
        sections: [
          ...state.sections,
          { id: crypto.randomUUID(), title: "New Section", config: "expanded", elements: [], columns: 1 },
        ],
      };
    case "ADD_ELEMENT": {
      const { sectionId, type, index, parentId } = action.payload;
      return {
        ...state,
        sections: state.sections.map((section) => {
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
        }),
      };
    }
    case "UPDATE_ELEMENT": {
      const { sectionId } = action.payload;
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === sectionId
            ? { ...section, elements: findAndModifyElement(section.elements, action) }
            : section
        ),
      };
    }
    case "UPDATE_SECTION":
        return {
            ...state,
            sections: state.sections.map(s => s.id === action.payload.id ? action.payload : s)
        };
    case "SELECT_ELEMENT":
      return { ...state, selectedElement: action.payload };
    case "DELETE_ELEMENT": {
        const { sectionId, elementId } = action.payload;
        return {
            ...state,
            sections: state.sections.map((section) =>
              section.id === sectionId
                ? { ...section, elements: findAndModifyElement(section.elements, action) }
                : section
            ),
            selectedElement: state.selectedElement?.elementId === elementId ? null : state.selectedElement,
        };
    }
    case "DELETE_SECTION": {
        return {
            ...state,
            sections: state.sections.filter(s => s.id !== action.payload.sectionId),
            selectedElement: state.selectedElement?.sectionId === action.payload.sectionId ? null : state.selectedElement,
        };
    }
    case "CLONE_ELEMENT": {
      const { sectionId, elementId } = action.payload;
      const newSections = [...state.sections];
      const sectionIndex = newSections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return state;

      const newElements = findAndModifyElement(newSections[sectionIndex].elements, action);
      newSections[sectionIndex] = { ...newSections[sectionIndex], elements: newElements };
      
      return {
        ...state,
        sections: newSections,
      };
    }
    case "CLONE_SECTION": {
      const { sectionId } = action.payload;
      const sectionIndex = state.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return state;

      const sectionToClone = state.sections[sectionIndex];
      const clonedSection = cloneWithNewIds(sectionToClone);

      const newSections = [...state.sections];
      newSections.splice(sectionIndex + 1, 0, clonedSection);

      return {
        ...state,
        sections: newSections,
        selectedElement: { sectionId: clonedSection.id, elementId: "" }
      };
    }
    case "SET_DRAGGED_ELEMENT":
        return { ...state, draggedElement: action.payload };
    case "MOVE_SECTION": {
        const { fromIndex, toIndex } = action.payload;
        const newSections = [...state.sections];
        const [removed] = newSections.splice(fromIndex, 1);
        newSections.splice(toIndex, 0, removed);
        return { ...state, sections: newSections };
    }
    case "MOVE_ELEMENT": {
        const { from, to } = action.payload;
        let elementToMove: FormElementInstance | undefined;
        let currentSections = [...state.sections];

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

        return { ...state, sections: currentSections };
    }
    case "SAVE_VERSION": {
      const { name, description, type, sections } = action.payload;
      const newVersion: FormVersion = {
        id: crypto.randomUUID(),
        name,
        description,
        type,
        timestamp: new Date().toISOString(),
        sections,
      };
      return {
        ...state,
        versions: [newVersion, ...state.versions],
      };
    }
    case "LOAD_VERSION": {
      const version = state.versions.find(v => v.id === action.payload.versionId);
      if (version) {
        return {
          ...state,
          sections: version.sections,
          selectedElement: null,
        };
      }
      return state;
    }
    case "DELETE_VERSION": {
      return {
        ...state,
        versions: state.versions.filter(v => v.id !== action.payload.versionId),
      };
    }
     case "SET_STATE":
      return { ...action.payload };
    default:
      return state;
  }
};

type BuilderContextType = {
  state: State;
  dispatch: Dispatch<Action>;
};

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "form-builder-state";

export const BuilderProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(builderReducer, initialState, (init) => {
    if (typeof window === "undefined") {
      return init;
    }
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        return JSON.parse(storedState);
      }
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
    }
    return init;
  });
  
  useEffect(() => {
    if (state.sections.length === 0) {
      dispatch({ type: "ADD_SECTION" });
    }
  }, [state.sections.length, dispatch]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
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
