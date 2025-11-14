"use client";

import * as React from "react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

/* ---------- Types ---------- */

interface SelectContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedValue: string;
  selectedLabel: string;
  setSelectedLabel: React.Dispatch<React.SetStateAction<string>>;
  handleValueChange: (newValue: string, label: string | React.ReactNode) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

interface TriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placeholder?: string;
  children?: React.ReactNode;
}

interface ContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top" | "bottom";
  children: React.ReactNode;
}

interface ItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface GroupProps {
  children: React.ReactNode;
  className?: string;
}

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

interface SeparatorProps {
  className?: string;
}

/* ---------- Context ---------- */

const SelectContext = React.createContext<SelectContextType | undefined>(
  undefined
);

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within Select");
  }
  return context;
};

/* ---------- Composants ---------- */

const Select: React.FC<SelectProps> = ({
  children,
  value,
  onValueChange,
  defaultValue = "",
  disabled = false,
  required = false,
  name,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(
    value ?? defaultValue
  );
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const selectRef = React.useRef<HTMLDivElement>(null);

  // fermer quand on clique ailleurs
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ FIX: Initialiser le label au montage et quand value change
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
      
      // Interface pour typer les props des SelectItem
      interface SelectItemProps {
        value?: string;
        children?: React.ReactNode;
      }
      
      // Chercher le label correspondant dans les enfants
      const findLabel = (node: React.ReactNode): string | null => {
        if (!node) return null;
        
        if (React.isValidElement<SelectItemProps>(node)) {
          const props = node.props;
          
          // Si c'est un SelectItem avec la bonne valeur
          if (props?.value === value) {
            const childContent = props.children;
            if (typeof childContent === 'string') {
              return childContent;
            }
            if (React.isValidElement(childContent)) {
              // Extraire le texte des enfants React
              return extractText(childContent);
            }
          }
          
          // Chercher récursivement dans les enfants
          if (props?.children) {
            const result = findLabel(props.children);
            if (result) return result;
          }
        }
        
        // Si c'est un tableau d'enfants
        if (Array.isArray(node)) {
          for (const child of node) {
            const result = findLabel(child);
            if (result) return result;
          }
        }
        
        return null;
      };
      
      const label = findLabel(children);
      if (label) {
        setSelectedLabel(label);
      }
    }
  }, [value, children]);

  // Fonction helper pour extraire le texte d'un React.ReactNode
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
      const props = node.props;
      if (props?.children) {
        return extractText(props.children);
      }
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join('');
    }
    return '';
  };

  const handleValueChange = (newValue: string, label: string | React.ReactNode) => {
    setSelectedValue(newValue);
    setSelectedLabel(
      typeof label === "string" ? label : extractText(label)
    );
    setIsOpen(false);
    onValueChange?.(newValue);
  };

  const contextValue: SelectContextType = {
    isOpen,
    setIsOpen,
    selectedValue,
    selectedLabel,
    setSelectedLabel,
    handleValueChange,
    disabled,
    required,
    name,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

/* ---------- Sous-composants ---------- */

const SelectTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ className = "", children, placeholder = "Sélectionner...", ...props }, ref) => {
    const { isOpen, setIsOpen, disabled, selectedValue } = useSelect();

    return (
      <button
        ref={ref}
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
          bg-white px-3 py-2 text-sm text-left
          placeholder:text-gray-500 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:cursor-not-allowed disabled:opacity-50
          ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""}
          ${className}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        {...props}
      >
        <span className={selectedValue ? "text-gray-900" : "text-gray-500"}>
          {children || placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue: React.FC<{ placeholder?: string }> = ({
  placeholder = "Sélectionner...",
}) => {
  const { selectedLabel, selectedValue } = useSelect();
  return (
    <span className={selectedValue ? "text-gray-900" : "text-gray-500"}>
      {selectedLabel || placeholder}
    </span>
  );
};

const SelectContent: React.FC<ContentProps> = ({
  className = "",
  children,
  position = "bottom",
  ...props
}) => {
  const { isOpen } = useSelect();
  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg
        max-h-60 overflow-auto
        animate-in fade-in-0 zoom-in-95
        ${position === "top" ? "bottom-full mb-1" : "top-full mt-1"}
        ${className}`}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
};

const SelectItem: React.FC<ItemProps> = ({
  value,
  children,
  className = "",
  disabled = false,
  ...props
}) => {
  const { selectedValue, handleValueChange } = useSelect();
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (!disabled) {
      handleValueChange(value, children);
    }
  };

  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm
        hover:bg-gray-100 focus:bg-gray-100
        ${isSelected ? "bg-blue-50 text-blue-600" : "text-gray-900"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}`}
      onClick={handleClick}
      {...props}
    >
      {isSelected && <CheckIcon className="h-4 w-4 mr-2 text-blue-600" />}
      <span className={isSelected ? "ml-0" : "ml-6"}>{children}</span>
    </div>
  );
};

const SelectGroup: React.FC<GroupProps> = ({ children, className = "" }) => (
  <div className={`py-1 ${className}`}>{children}</div>
);

const SelectLabel: React.FC<LabelProps> = ({ children, className = "" }) => (
  <div
    className={`px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${className}`}
  >
    {children}
  </div>
);

const SelectSeparator: React.FC<SeparatorProps> = ({ className = "" }) => (
  <div className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} />
);

/* ---------- Exports ---------- */
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};