import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  options?: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  onChange,
  options = [],
  placeholder = "选择或输入...",
  className,
}) => {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "," ||
      e.key === "，" ||
      e.key === "、"
    ) {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      if (trimmedValue && !value.includes(trimmedValue)) {
        onChange?.([...value, trimmedValue]);
        setInputValue("");
        setIsOpen(false);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange?.(value.slice(0, -1));
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (!value.includes(optionValue)) {
      onChange?.([...value, optionValue]);
    }
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveValue = (valueToRemove: string) => {
    onChange?.(value.filter(v => v !== valueToRemove));
  };

  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(option.value)
  );

  return (
    <div className={cn("relative", className)}>
      <div className="min-h-10 w-full rounded-md border border-primary bg-white px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {value.map(item => (
            <Badge key={item} variant="secondary" className="gap-1">
              {item}
              <button
                type="button"
                onClick={() => handleRemoveValue(item)}
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {isOpen && (filteredOptions.length > 0 || inputValue) && (
        <div className="absolute top-full z-50 w-full mt-1 bg-white border border-primary rounded-md shadow-md max-h-60 overflow-auto">
          {filteredOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
            >
              {option.label}
            </button>
          ))}
          {inputValue &&
            !filteredOptions.some(opt => opt.value === inputValue) && (
              <button
                type="button"
                onClick={() => handleOptionClick(inputValue)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none border-t"
              >
                创建 &quot;{inputValue}&quot;
              </button>
            )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
