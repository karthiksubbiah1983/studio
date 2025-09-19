
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
  | { type: "ADD_ELEMENT"; payload: { sectionId: string; type: ElementType; index?: number } }
  | { type: "UPDATE_ELEMENT"; payload: { sectionId: string; element: FormElementInstance } }
  | { type: "UPDATE_SECTION"; payload: Section }
  | { type: "SELECT_ELEMENT"; payload: { elementId: string; sectionId: string } | null }
  | { type: "DELETE_ELEMENT"; payload: { elementId: string; sectionId: string } }
  | { type: "DELETE_SECTION"; payload: { sectionId: string } }
  | { type: "CLONE_ELEMENT"; payload: { elementId: string; sectionId: string } }
  | { type: "CLONE_SECTION"; payload: { sectionId: string } }
  | { type: "SET_DRAGGED_ELEMENT"; payload: State['draggedElement'] }
  | { type: "MOVE_SECTION"; payload: { fromIndex: number, toIndex: number } }
  | { type: "MOVE_ELEMENT"; payload: { from: { sectionId: string; elementId: string }, to: { sectionId: string; index: number } } }
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
      const { sectionId, type, index } = action.payload;
      const newElement = createNewElement(type);
      return {
        ...state,
        sections: state.sections.map((section) => {
          if (section.id === sectionId) {
            const newElements = [...section.elements];
            if (index !== undefined) {
              newElements.splice(index, 0, newElement);
            } else {
              newElements.push(newElement);
            }
            return { ...section, elements: newElements };
          }
          return section;
        }),
      };
    }
    case "UPDATE_ELEMENT": {
      const { sectionId, element } = action.payload;
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === sectionId
            ? { ...section, elements: section.elements.map(el => el.id === element.id ? element : el) }
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
                ? { ...section, elements: section.elements.filter(el => el.id !== elementId) }
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

      const section = newSections[sectionIndex];
      const elementIndex = section.elements.findIndex(e => e.id === elementId);
      if (elementIndex === -1) return state;

      const elementToClone = section.elements[elementIndex];
      const clonedElement = cloneWithNewIds(elementToClone);
      
      section.elements.splice(elementIndex + 1, 0, clonedElement);

      return {
        ...state,
        sections: newSections,
        selectedElement: { sectionId: sectionId, elementId: clonedElement.id }
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
        const fromSection = state.sections.find(s => s.id === from.sectionId);
        elementToMove = fromSection?.elements.find(el => el.id === from.elementId);
       
        if (!elementToMove) return state;

        const newSections = state.sections.map(section => {
            if (section.id === from.sectionId) {
                return { ...section, elements: section.elements.filter(el => el.id !== from.elementId) };
            }
            return section;
        });

        return {
            ...state,
            sections: newSections.map(section => {
                if (section.id === to.sectionId) {
                    const newElements = [...section.elements];
                    newElements.splice(to.index, 0, elementToMove as FormElementInstance);
                    return { ...section, elements: newElements };
                }
                return section;
            })
        };
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
