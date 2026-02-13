'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectDropdownProps {
    label: string;
    options: { value: string; label: string }[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    isModern?: boolean;
}

export function MultiSelectDropdown({
    label,
    options,
    selectedValues,
    onChange,
    placeholder,
    isModern = false
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newValues);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${isModern ? 'bg-white rounded-xl' : 'bg-white rounded-lg'} border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 font-medium text-gray-700 min-w-[180px] cursor-pointer flex items-center justify-between gap-2 transition-all hover:bg-gray-50`}
            >
                <span className="truncate max-w-[150px]">
                    {selectedValues.length === 0 ? placeholder : `${selectedValues.length} sélectionné(s)`}
                </span>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute z-[60] mt-2 w-64 bg-white border border-gray-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ${isModern ? 'rounded-2xl' : 'rounded-lg'} py-2 animate-in fade-in zoom-in duration-200 right-0 md:left-0`}>
                    <div className="px-3 py-2 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                        {label}
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => { onChange([]); setIsOpen(false); }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between group transition-colors"
                        >
                            <span className={`font-medium ${selectedValues.length === 0 ? 'text-blue-600' : 'text-gray-700'}`}>Toutes / Tous</span>
                            {selectedValues.length === 0 && <Check size={16} className="text-blue-600" />}
                        </button>
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => toggleOption(opt.value)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between group transition-colors"
                            >
                                <span className={`font-medium ${selectedValues.includes(opt.value) ? 'text-blue-600' : 'text-gray-700'}`}>{opt.label}</span>
                                {selectedValues.includes(opt.value) && <Check size={16} className="text-blue-600" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
