import React from "react"

interface Step {
  id: string
  title: string
  icon: React.ReactNode
}

interface OnboardingProgressProps {
  steps: Step[]
  currentStep: string
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ steps, currentStep }) => {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="mb-8">
      <div className="hidden sm:flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step indicator */}
            <div className="relative flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index <= currentStepIndex ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {step.icon}
              </div>
              <span
                className={`mt-2 text-xs ${index <= currentStepIndex ? "text-blue-900 font-medium" : "text-gray-500"}`}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${index < currentStepIndex ? "bg-blue-900" : "bg-gray-200"}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile view */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-gray-500">
          Etapa {currentStepIndex + 1} de {steps.length}
        </p>
        <div className="mt-2 flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center">
            {steps[currentStepIndex].icon}
          </div>
          <span className="ml-2 text-blue-900 font-medium">{steps[currentStepIndex].title}</span>
        </div>
      </div>
    </div>
  )
}

export default OnboardingProgress

