'use client';

import React, { useRef, useId, useState } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './Select.module.css';

interface OptionChildProps {
  value?: string | number;
  children?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  className?: string;
  children?: React.ReactNode;
  options?: SelectOption[];
  placeholder?: string;
}

export function Select({
  id: propId,
  className = '',
  children,
  options: propOptions,
  value,
  defaultValue,
  onChange,
  disabled,
  placeholder = '',
  name,
  ...rest
}: SelectProps): React.ReactElement {
  const { dir } = useI18n();
  const generatedId = useId();
  const selectId = propId || generatedId;
  const nativeSelectRef = useRef<HTMLSelectElement>(null);

  // Extract options from props or children
  const options: SelectOption[] = React.useMemo(() => {
    if (propOptions && propOptions.length > 0) return propOptions;
    const extracted: SelectOption[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const p = child.props as OptionChildProps;
        extracted.push({
          value: String(p.value ?? ''),
          label: p.children ?? p.value,
          disabled: Boolean(p.disabled),
        });
      }
    });
    return extracted;
  }, [children, propOptions]);

  // Current controlled / uncontrolled value
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (value !== undefined) return String(value);
    if (defaultValue !== undefined) return String(defaultValue);
    return options[0]?.value ?? '';
  });

  const activeValue = value !== undefined ? String(value) : internalValue;

  const selectedOption = options.find((o) => o.value === activeValue) || options[0];
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleRadixChange = (newVal: string) => {
    setInternalValue(newVal);

    if (nativeSelectRef.current) {
      nativeSelectRef.current.value = newVal;
      const evt = new Event('change', { bubbles: true });
      nativeSelectRef.current.dispatchEvent(evt);
    }

    if (onChange) {
      const syntheticEvent = {
        target: { value: newVal, name: name || selectId, id: selectId },
        currentTarget: { value: newVal, name: name || selectId, id: selectId },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInternalValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      {/* Synchronized accessible native select for test frameworks and form submissions */}
      <select
        ref={nativeSelectRef}
        id={selectId}
        name={name}
        value={activeValue}
        onChange={handleNativeChange}
        disabled={disabled}
        className={styles.hiddenNativeSelect}
        tabIndex={-1}
        {...rest}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {typeof opt.label === 'string' ? opt.label : opt.value}
            </option>
          ))}
      </select>

      {/* Luxury Radix UI Select Trigger and Overlay */}
      <RadixSelect.Root
        value={activeValue}
        onValueChange={handleRadixChange}
        disabled={disabled}
        dir={dir}
      >
        <RadixSelect.Trigger
          className={styles.trigger}
          tabIndex={0}
        >
          <span className={styles.valueText}>
            <bdi>{displayLabel}</bdi>
          </span>
          <RadixSelect.Icon className={styles.icon}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={styles.content}
            position="popper"
            sideOffset={6}
            align="start"
          >
            <RadixSelect.Viewport className={styles.viewport}>
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={styles.item}
                >
                  <RadixSelect.ItemText>
                    <span className={styles.itemText}>
                      <bdi>{opt.label}</bdi>
                    </span>
                  </RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className={styles.itemIndicator}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
