import React from 'react';

export interface TimelineStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  date?: Date;
}

export interface TimelineProps {
  steps: TimelineStep[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  steps,
  orientation = 'vertical',
  className = '',
}) => {
  const formatDate = (date?: Date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStepStyles = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-blue-500 border-blue-500',
          line: 'bg-blue-500',
          text: 'text-gray-900',
          icon: (
            <svg
              className="w-4 h-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case 'current':
        return {
          circle: 'bg-orange-500 border-orange-500 animate-pulse',
          line: 'bg-gray-300',
          text: 'text-gray-900 font-semibold',
          icon: (
            <div className="w-2 h-2 bg-white rounded-full" aria-hidden="true" />
          ),
        };
      case 'pending':
        return {
          circle: 'bg-white border-gray-300',
          line: 'bg-gray-300',
          text: 'text-gray-500',
          icon: null,
        };
    }
  };

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const styles = getStepStyles(step.status);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Step indicator */}
                <div className="flex items-center w-full">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${styles.circle}`}
                      aria-label={`${step.label}: ${step.status}`}
                    >
                      {styles.icon}
                    </div>
                  </div>

                  {/* Connecting line */}
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-2" aria-hidden="true">
                      <div className={`h-full ${styles.line}`} />
                    </div>
                  )}
                </div>

                {/* Label and date */}
                <div className="mt-3 text-center">
                  <p className={`text-sm ${styles.text}`}>{step.label}</p>
                  {step.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(step.date)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const styles = getStepStyles(step.status);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Step indicator and line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${styles.circle}`}
                aria-label={`${step.label}: ${step.status}`}
              >
                {styles.icon}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="w-0.5 flex-1 mt-2 min-h-[40px]" aria-hidden="true">
                  <div className={`h-full ${styles.line}`} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <p className={`text-base ${styles.text}`}>{step.label}</p>
              {step.date && (
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(step.date)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
