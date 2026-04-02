import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { MultilineInput } from './input/index.js';
import { WizardStepDef } from '../plan/stepGenerator.js';
import { ParamType } from '../providers/interface.js';

const FRIENDLY_LABELS: Record<string, string> = {
  title: 'Title',
  start: 'Date & Time',
  end: 'Duration',
  description: 'Description',
  space: 'Space',
  address: 'Location',
  virtual: 'Event Type',
  private: 'Visibility',
  name: 'Name',
  quantity: 'Quantity',
  price: 'Price',
  event_id: 'Event',
  space_id: 'Space',
  ticket_type: 'Ticket Type',
};

function humanize(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const DURATION_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: '3 hours', hours: 3 },
  { label: 'Half day (4 hours)', hours: 4 },
  { label: 'All day', hours: 12 },
  { label: 'Multi-day \u2192 enter end date', hours: 0 },
];

export interface PlanWizardProps {
  toolDisplayName: string;
  steps: WizardStepDef[];
  onComplete: (answers: Record<string, unknown>) => void;
  onCancel: () => void;
  /** Optional param types for value conversion */
  paramTypes?: Record<string, ParamType>;
  spaceOptions?: Array<{ _id: string; title: string }>;
  /** Available content width from parent */
  columns: number;
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

type DatePhase = 'date' | 'duration' | 'end_date';

export function PlanWizard({
  toolDisplayName,
  steps: allSteps,
  onComplete,
  onCancel,
  paramTypes,
  spaceOptions,
  columns,
}: PlanWizardProps): React.JSX.Element {
  // Filter out merged steps (e.g., 'end' merged into 'start')
  const steps = allSteps.filter((s) => !s.merged);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [textValue, setTextValue] = useState('');
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [multilineValue, setMultilineValue] = useState('');
  const [requiredHint, setRequiredHint] = useState(false);

  const wizardInputColumns = columns - 4; // 2 for '> ' prompt + 2 for safety margin

  // Space selector state
  const [spaceScrollOffset, setSpaceScrollOffset] = useState(0);
  const [spaceCreateMode, setSpaceCreateMode] = useState(false);
  const [spaceCreateName, setSpaceCreateName] = useState('');
  const SPACE_MAX_VISIBLE = 8;

  // Date compound step state
  const [datePhase, setDatePhase] = useState<DatePhase>('date');
  const [dateStartValue, setDateStartValue] = useState('');
  const [durationChoiceIndex, setDurationChoiceIndex] = useState(0);

  const step = steps[currentStep];
  const totalSteps = steps.length;

  const isDateStep = step?.paramName === 'start';

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
        setMultilineValue('');
        setDatePhase('date');
        setDateStartValue('');
        setDurationChoiceIndex(0);
        setSpaceScrollOffset(0);
        setSpaceCreateMode(false);
        setSpaceCreateName('');
      } else {
        // Final step - complete
        onComplete(newAnswers);
      }
    },
    [answers, step, currentStep, totalSteps, onComplete],
  );

  const goBack = useCallback(() => {
    if (isDateStep && datePhase === 'duration') {
      setDatePhase('date');
      setTextValue(dateStartValue);
      return;
    }
    if (isDateStep && datePhase === 'end_date') {
      setDatePhase('duration');
      setTextValue('');
      return;
    }
    if (currentStep > 0) {
      const prevStep = steps[currentStep - 1];
      setCurrentStep(currentStep - 1);
      setRequiredHint(false);
      setDatePhase('date');
      setDateStartValue('');
      setDurationChoiceIndex(0);
      setSpaceScrollOffset(0);
      setSpaceCreateMode(false);
      setSpaceCreateName('');
      // Restore previous answer
      const prevAnswer = answers[prevStep.paramName];
      if (prevStep.inputType === 'choice' && prevStep.options) {
        const idx = prevStep.options.indexOf(String(prevAnswer));
        setChoiceIndex(idx >= 0 ? idx : 0);
      } else if (prevStep.inputType === 'multiline') {
        setMultilineValue(typeof prevAnswer === 'string' ? prevAnswer : '');
      } else {
        setTextValue(prevAnswer !== undefined ? String(prevAnswer) : '');
      }
    }
  }, [currentStep, steps, answers, isDateStep, datePhase, dateStartValue]);

  // Keyboard handling for choice, multiline, date duration, and space select
  useInput(
    (input, key) => {
      if (key.escape) {
        onCancel();
        return;
      }

      // Date step duration phase (choice-like)
      if (isDateStep && datePhase === 'duration') {
        if (key.upArrow) {
          setDurationChoiceIndex((prev) => (prev <= 0 ? DURATION_OPTIONS.length - 1 : prev - 1));
          return;
        }
        if (key.downArrow) {
          setDurationChoiceIndex((prev) => (prev >= DURATION_OPTIONS.length - 1 ? 0 : prev + 1));
          return;
        }
        if (key.return) {
          const selected = DURATION_OPTIONS[durationChoiceIndex];
          if (selected.hours === 0) {
            // Multi-day: switch to end_date input
            setDatePhase('end_date');
            setTextValue('');
            return;
          }
          // Store start date and calculated end
          const newAnswers = { ...answers, end: `${selected.hours} hours after start` };
          setAnswers(newAnswers);
          storeAndAdvance(dateStartValue);
          return;
        }
        if (key.backspace || key.delete) {
          goBack();
          return;
        }
        return;
      }

      // Space selector navigation
      if (step.inputType === 'space_select' && !spaceCreateMode && spaceOptions && spaceOptions.length > 0) {
        const totalOptions = spaceOptions.length + 1; // +1 for "Create new"
        if (key.upArrow) {
          setChoiceIndex(prev => {
            const next = prev <= 0 ? totalOptions - 1 : prev - 1;
            if (next < spaceScrollOffset) setSpaceScrollOffset(next);
            if (next >= spaceScrollOffset + SPACE_MAX_VISIBLE) setSpaceScrollOffset(next - SPACE_MAX_VISIBLE + 1);
            return next;
          });
          return;
        }
        if (key.downArrow) {
          setChoiceIndex(prev => {
            const next = prev >= totalOptions - 1 ? 0 : prev + 1;
            if (next >= spaceScrollOffset + SPACE_MAX_VISIBLE) setSpaceScrollOffset(next - SPACE_MAX_VISIBLE + 1);
            if (next < spaceScrollOffset) setSpaceScrollOffset(next);
            return next;
          });
          return;
        }
        if (key.return) {
          if (choiceIndex === spaceOptions.length) {
            // "+ Create new space"
            setSpaceCreateMode(true);
          } else {
            storeAndAdvance(spaceOptions[choiceIndex]._id);
          }
          return;
        }
        if (key.backspace || key.delete) {
          goBack();
          return;
        }
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
        // Tab finishes multiline
        if (key.tab) {
          const value = multilineValue;
          if (!value.trim() && step.required) {
            setRequiredHint(true);
            return;
          }
          storeAndAdvance(value);
          return;
        }
      }
    },
    { isActive: step?.inputType === 'choice' || step?.inputType === 'multiline' || step?.inputType === 'space_select' || (isDateStep && datePhase === 'duration') },
  );

  const handleTextSubmit = useCallback(
    (value: string) => {
      // Date step: handle phases
      if (isDateStep) {
        if (datePhase === 'date') {
          if (!value.trim()) {
            setRequiredHint(true);
            return;
          }
          setDateStartValue(value.trim());
          setDatePhase('duration');
          setTextValue('');
          return;
        }
        if (datePhase === 'end_date') {
          if (!value.trim()) {
            setRequiredHint(true);
            return;
          }
          // Store end date and advance
          const newAnswers = { ...answers, end: value.trim() };
          setAnswers(newAnswers);
          storeAndAdvance(dateStartValue);
          return;
        }
      }

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
    [step, storeAndAdvance, paramTypes, isDateStep, datePhase, dateStartValue, answers],
  );

  // Handle backspace on empty text to go back
  useInput(
    (_input, key) => {
      if (key.escape) {
        onCancel();
        return;
      }
      if ((key.backspace || key.delete) && textValue === '' && (currentStep > 0 || (isDateStep && datePhase !== 'date'))) {
        goBack();
      }
      // Skip optional with 's' when field is empty
      if (_input.toLowerCase() === 's' && !step.required && textValue === '') {
        storeAndAdvance(undefined);
      }
    },
    { isActive: step?.inputType === 'text' || (isDateStep && (datePhase === 'date' || datePhase === 'end_date')) },
  );

  if (!step) return <Text>No steps to display.</Text>;

  // Determine current question text
  let questionText = step.label;
  if (isDateStep) {
    if (datePhase === 'date') questionText = 'When does your event start?';
    else if (datePhase === 'duration') questionText = 'How long is the event?';
    else if (datePhase === 'end_date') questionText = 'When does your event end?';
  }

  // Build footer hints
  const footerParts: string[] = [];
  if (step.inputType === 'multiline') {
    footerParts.push('[Enter] New line', '[Ctrl+D] Done');
  } else if (isDateStep && datePhase === 'duration') {
    footerParts.push('[Enter] Select');
  } else {
    footerParts.push('[Enter] Next');
  }
  footerParts.push('[Esc] Cancel');
  if (currentStep > 0 || (isDateStep && datePhase !== 'date')) {
    if (step.inputType === 'choice' || step.inputType === 'space_select' || (isDateStep && datePhase === 'duration')) {
      footerParts.push('[Backspace] Back');
    } else {
      footerParts.push('[Backspace on empty] Back');
    }
  }
  if (!step.required) {
    footerParts.push('[S] Skip');
  }

  const separatorWidth = Math.min(process.stdout.columns || 80, 60);

  return (
    <Box flexDirection="column">
      {/* Progress bar */}
      <Box paddingLeft={1} flexWrap="wrap">
        {steps.map((s, i) => {
          const label = FRIENDLY_LABELS[s.paramName] || s.friendlyLabel || humanize(s.paramName);
          if (i < currentStep) {
            return <Text key={i} color="#FDE047">  {'\u2713'} {label}</Text>;
          } else if (i === currentStep) {
            return <Text key={i} bold color="#FDE047">  {'\u2192'} {label}</Text>;
          } else {
            return <Text key={i} dimColor>  {'\u00B7'} {label}</Text>;
          }
        })}
      </Box>
      <Box paddingLeft={1}>
        <Text dimColor>{'\u2500'.repeat(separatorWidth)}</Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor="#F472B6"
        flexDirection="column"
        paddingLeft={1}
        paddingRight={1}
        paddingTop={1}
        paddingBottom={1}
      >
        {/* Header */}
        <Box>
          <Text bold color="#FDE047">Step {currentStep + 1} of {totalSteps}</Text>
          <Text bold> {'\u2014'} {toolDisplayName}</Text>
        </Box>
        <Text>{''}</Text>

        {/* Question */}
        <Text>{questionText}</Text>
        <Text dimColor>{'\u2500'.repeat(40)}</Text>

        {/* Input area */}
        {isDateStep && datePhase === 'duration' ? (
          <Box flexDirection="column">
            {DURATION_OPTIONS.map((opt, i) => (
              <Box key={i} marginTop={i > 0 ? 1 : 0}>
                <Text inverse={i === durationChoiceIndex}>
                  {i === durationChoiceIndex ? '> ' : '  '}
                  {opt.label}
                </Text>
              </Box>
            ))}
          </Box>
        ) : step.inputType === 'choice' && step.options ? (
          <Box flexDirection="column">
            {step.options.map((opt, i) => (
              <Box key={opt} marginTop={i > 0 ? 1 : 0}>
                <Text inverse={i === choiceIndex}>
                  {i === choiceIndex ? '> ' : '  '}
                  {opt}
                </Text>
              </Box>
            ))}
          </Box>
        ) : null}

        {/* Space selector */}
        {step.inputType === 'space_select' && spaceOptions && spaceOptions.length > 0 && !spaceCreateMode ? (
          <Box flexDirection="column">
            {[...spaceOptions, { _id: '__create__', title: '+ Create new space' }]
              .slice(spaceScrollOffset, spaceScrollOffset + SPACE_MAX_VISIBLE)
              .map((opt, i) => {
                const realIndex = i + spaceScrollOffset;
                const isCreate = opt._id === '__create__';
                return (
                  <Box key={opt._id} marginTop={0}>
                    <Text inverse={realIndex === choiceIndex} color={isCreate ? '#10B981' : undefined}>
                      {realIndex === choiceIndex ? '> ' : '  '}{opt.title}
                    </Text>
                  </Box>
                );
              })}
          </Box>
        ) : null}

        {step.inputType === 'space_select' && spaceCreateMode ? (
          <Box>
            <Text color="#F472B6">{'> '}</Text>
            <Box flexGrow={1}>
              <MultilineInput
                value={spaceCreateName}
                onChange={setSpaceCreateName}
                onSubmit={(val) => { if (val.trim()) storeAndAdvance(val.trim()); }}
                focus={true}
                columns={wizardInputColumns}
                singleLine={true}
                placeholder="Enter space name..."
              />
            </Box>
          </Box>
        ) : null}

        {(step.inputType === 'text' || (isDateStep && (datePhase === 'date' || datePhase === 'end_date'))) && !(isDateStep && datePhase === 'duration') ? (
          <Box>
            <Text color="#F472B6">{'> '}</Text>
            <Box flexGrow={1}>
              <MultilineInput
                value={textValue}
                onChange={(val) => { setTextValue(val); setRequiredHint(false); }}
                onSubmit={handleTextSubmit}
                focus={true}
                columns={wizardInputColumns}
                singleLine={true}
                placeholder={isDateStep ? (datePhase === 'date' ? 'e.g. next Saturday at 7pm' : 'e.g. Sunday at 11am') : (step.defaultValue || '')}
              />
            </Box>
          </Box>
        ) : null}

        {step.inputType === 'multiline' ? (
          <Box flexDirection="column">
            <Box>
              <Text color="#F472B6">{'> '}</Text>
              <Box flexGrow={1}>
                <MultilineInput
                  value={multilineValue}
                  onChange={setMultilineValue}
                  onSubmit={() => {/* Enter inserts newline when submitOnEnter=false */}}
                  onCtrlD={(text) => {
                    if (!text.trim() && step.required) { setRequiredHint(true); return; }
                    storeAndAdvance(text);
                  }}
                  focus={true}
                  columns={wizardInputColumns}
                  submitOnEnter={false}
                  maxVisibleLines={6}
                  placeholder="Type here... (Tab to finish)"
                  continuationPrefix="  "
                />
              </Box>
            </Box>
          </Box>
        ) : null}

        {requiredHint ? (
          <Text color="#FF637E">Required</Text>
        ) : null}

        <Text>{''}</Text>

        {/* Footer hints */}
        <Box marginTop={1}>
          <Text dimColor>{footerParts.join('  ')}</Text>
        </Box>
      </Box>

      <Box paddingLeft={1}>
        <Text color="#F472B6">Plan Mode Activated</Text>
      </Box>
    </Box>
  );
}
