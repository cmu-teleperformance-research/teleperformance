import { useState, useEffect } from "react";
import StepSidebar from "./StepSidebar";
import PromptBanner from "./PromptBanner";
import { screenMap } from "./utils/screenMaps";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function WorkflowPortal({
  scenario,
  persona,
  step,
  completed,
  onAdvance,
  onReset,
  onGoToStep,
  workflowData,
  setWorkflowData,
}) {
  const [workflow, setWorkflow] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(true);

  useEffect(() => {
    setWorkflowLoading(true);
    setWorkflow(null);
    fetch(`${BASE_URL}/workflow/${scenario}`)
      .then(r => r.json())
      .then(data => setWorkflow(data))
      .catch(() => setWorkflow(null))
      .finally(() => setWorkflowLoading(false));
  }, [scenario]);

  const updateData = (key, val) => setWorkflowData(prev => ({ ...prev, [key]: val }));

  if (workflowLoading || !workflow) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const steps = workflow.steps ?? [];
  const currentStepData = steps[step];
  const Screen = (screenMap[scenario] ?? screenMap.flight_cancellation)[Math.min(step, 5)];

  function advance() {
    onAdvance(steps[step].id);
  }

  return (
    <div className="h-full flex">
      <StepSidebar steps={steps} current={step} completed={completed} onGoToStep={onGoToStep} />
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        <div className="max-w-3xl mx-auto space-y-4">
          {currentStepData && <PromptBanner prompt={currentStepData.prompt} />}
          <Screen
            onAdvance={advance}
            onReset={onReset}
            workflowData={workflowData}
            updateData={updateData}
            workflow={workflow}
            persona={persona}
          />
        </div>
      </div>
    </div>
  );
}
