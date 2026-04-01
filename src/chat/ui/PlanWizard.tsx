import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { WizardStepDef } from '../plan/stepGenerator.js';
import { ParamType } from '../providers/interface.js';

export interface PlanWizardProps {
  toolDisplayName: string;
  steps: WizardStepDef[];
  onComplete: (answers: Record<string, unknown>) => void;
  onCancel: () => void;
  /** Optional param types for value conversion */
  paramTypes?: Record<string, ParamType>;
}

function convertValue(
  raw: string,
  paramName: string,
  paramType?: ParamType,
): unknown {
  if (paramType === 'boolean') {
    return raw === 'Yes' || raw === 'true';
  }
  if (paramType === 'number') {
    return parseFloat(raw);
  }
  if (paramType === 'string[]' || paramType === 'number[]') {
    const items = raw.split(',').map((s) => s.trim());
    if (paramType === 'number[]') return items.map((s) => parseFloat(s));
    return items;
  }
  // Booleans from choice
  if (raw === 'Yes') return true;
  if (raw === 'No') return false;
  return raw;
}

export function PlanWizard({
  toolDisplayName,
  steps,
  onComplete,
  onCancel,
  paramTypes,
}: PlanWizardProps): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [textValue, setTextValue] = useState('');
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [multilineLines, setMultilineLines] = useState<string[]>(['']);
  const [requiredHint, setRequiredHint] = useState(false);

  const step = steps[currentStep];
  const totalSteps = steps.length;

  const storeAndAdvance = useCallback(
    (value: unknown) => {
      const newAnswers = { ...answers };
      // Skip storing undefined/empty for optional skips
      if (value !== undefined) {
        newAnswers[step.paramName] = value;
      }
      setAnswers(newAnswers);
      setRequiredHint(false);

      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
        setTextValue('');
        setChoiceIndex(0);
        setMultilineLines(['']);
      } else {
        // Final step - complete
        onComplete(newAnswers);
      }
    },
    [answers, step, currentStep, totalSteps, onComplete],
  );

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = steps[currentStep - 1];
      setCurrentStep(currentStep - 1);
      setRequiredHint(false);
      // Restore previous answer
      const prevAnswer = answers[prevStep.paramName];
      if (prevStep.inputType === 'choice' && prevStep.options) {
        const idx = prevStep.options.indexOf(String(prevAnswer));
        setChoiceIndex(idx >= 0 ? idx : 0);
      } else if (prevStep.inputType === 'multiline') {
        const lines = typeof prevAnswer === 'string' ? prevAnswer.split('\n') : [''];
        setMultilineLines(lines);
      } else {
        setTextValue(prevAnswer !== undefined ? String(prevAnswer) : '');
      }
    }
  }, [currentStep, steps, answers]);

  // Keyboard handling for choice and general navigation
  useInput(
    (input, key) => {
      if (key.escape) {
        onCancel();
        return;
      }

      // Skip optional param with 's'
      if (input.toLowerCase() === 's' && !step.required && step.inputType === 'choice') {
        storeAndAdvance(undefined);
        return;
      }

      if (step.inputType === 'choice') {
        const options = step.options || [];
        if (key.upArrow) {
          setChoiceIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
          return;
        }
        if (key.downArrow) {
          setChoiceIndex((prev) => (prev >= options.length - 1 ? 0 : prev + 1));
          return;
        }
        if (key.return) {
          const selected = options[choiceIndex];
          const paramType = paramTypes?.[step.paramName];
          storeAndAdvance(convertValue(selected, step.paramName, paramType));
          return;
        }
        // Backspace on choice goes back
        if (key.backspace || key.delete) {
          goBack();
          return;
        }
      }

      if (step.inputType === 'multiline') {
        // Ctrl+D finishes multiline
        if (input === '\x04' || key.tab) {
          const value = multilineLines.join('\n');
          if (!value.trim() && step.required) {
            setRequiredHint(true);
            return;
          }
          storeAndAdvance(value);
          return;
        }
        if (key.return) {
          setMultilineLines((prev) => [...prev, '']);
          return;
        }
        if (key.backspace || key.delete) {
          setMultilineLines((prev) => {
            if (prev.length === 1 && prev[0] === '') {
              // Empty multiline, go back
              goBack();
              return prev;
            }
            const updated = [...prev];
            const lastLine = updated[updated.length - 1];
            if (lastLine === '' && updated.length > 1) {
              updated.pop();
            } else {
              updated[updated.length - 1] = lastLine.slice(0, -1);
            }
            return updated;
          });
          return;
        }
        if (!key.ctrl && !key.meta && input && !key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow) {
          setMultilineLines((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = (updated[updated.length - 1] || '') + input;
            return updated;
          });
        }
      }
    },
    { isActive: step?.inputType === 'choice' || step?.inputType === 'multiline' },
  );

  const handleTextSubmit = useCallback(
    (value: string) => {
      if (!value.trim() && step.required) {
        setRequiredHint(true);
        return;
      }
      if (!value.trim() && !step.required) {
        // Skip optional
        storeAndAdvance(undefined);
        return;
      }
      const paramType = paramTypes?.[step.paramName];
      storeAndAdvance(convertValue(value, step.paramName, paramType));
    },
    [step, storeAndAdvance, paramTypes],
  );

  // Handle backspace on empty text to go back
  useInput(
    (_input, key) => {
      if (key.escape) {
        onCancel();
        return;
      }
      if ((key.backspace || key.delete) && textValue === '' && currentStep > 0) {
        goBack();
      }
      // Skip optional with 's' when field is empty
      if (_input.toLowerCase() === 's' && !step.required && textValue === '') {
        storeAndAdvance(undefined);
      }
    },
    { isActive: step?.inputType === 'text' },
  );

  if (!step) return <Text>No steps to display.</Text>;

  // Build footer hints
  const footerParts: string[] = [];
  if (step.inputType === 'multiline') {
    footerParts.push('[Enter] New line', '[Ctrl+D] Done');
  } else {
    footerParts.push('[Enter] Next');
  }
  footerParts.push('[Esc] Cancel');
  if (currentStep > 0) {
    footerParts.push(step.inputType === 'choice' ? '[Backspace] Back' : '[Backspace on empty] Back');
  }
  if (!step.required) {
    footerParts.push('[S] Skip');
  }

  return (
    <Box flexDirection="column">
      <Box
        borderStyle="round"
        borderColor="#F472B6"
        flexDirection="column"
        paddingLeft={1}
        paddingRight={1}
      >
        {/* Header */}
        <Text bold>
          Step {currentStep + 1} of {totalSteps} — {toolDisplayName}
        </Text>
        <Text>{''}</Text>

        {/* Question */}
        <Text>{step.label}</Text>
        <Text>{''}</Text>

        {/* Input area */}
        {step.inputType === 'choice' && step.options ? (
          <Box flexDirection="column">
            {step.options.map((opt, i) => (
              <Text key={opt} inverse={i === choiceIndex}>
                {i === choiceIndex ? '> ' : '  '}
                {opt}
              </Text>
            ))}
          </Box>
        ) : null}

        {step.inputType === 'text' ? (
          <Box>
            <Text color="#F472B6">{'> '}</Text>
            <TextInput
              value={textValue}
              onChange={(val) => {
                setTextValue(val);
                setRequiredHint(false);
              }}
              onSubmit={handleTextSubmit}
              focus={true}
              showCursor={true}
              placeholder={step.defaultValue || ''}
            />
          </Box>
        ) : null}

        {step.inputType === 'multiline' ? (
          <Box flexDirection="column">
            {multilineLines.map((line, i) => (
              <Text key={i}>
                {i === multilineLines.length - 1 ? (
                  <Text color="#F472B6">{'> '}</Text>
                ) : (
                  <Text>{'  '}</Text>
                )}
                {line}
                {i === multilineLines.length - 1 ? <Text color="#666">_</Text> : null}
              </Text>
            ))}
          </Box>
        ) : null}

        {requiredHint ? (
          <Text color="#FF637E">Required</Text>
        ) : null}

        <Text>{''}</Text>

        {/* Footer hints */}
        <Text dimColor>{footerParts.join('  ')}</Text>
      </Box>

      <Box paddingLeft={1}>
        <Text color="#F472B6">Plan Mode Activated</Text>
      </Box>
    </Box>
  );
}
