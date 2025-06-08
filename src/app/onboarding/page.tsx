'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { preferencesSchema } from '../../schemas/preferences'

interface UserPreferences {
  favoriteCountry: string;
  favoriteContinent: string;
  favoriteDestination: string;
}

export default function Onboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteCountry: '',
    favoriteContinent: '',
    favoriteDestination: ''
  })
  const [error, setError] = useState<string>('')

  const questions = [
    {
      question: "What is your favorite country?",
      field: "favoriteCountry"
    },
    {
      question: "What is your favorite continent?",
      field: "favoriteContinent"
    },
    {
      question: "What is your favorite destination?",
      field: "favoriteDestination"
    }
  ]

  const validateField = async (field: keyof UserPreferences, value: string) => {
    try {
      await preferencesSchema.validateAt(field, { [field]: value });
      setError('');
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const field = questions[currentStep].field as keyof UserPreferences;
    const isValid = await validateField(field, preferences[field]);
    
    if (!isValid) return;

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      try {
        // Validate all fields before submitting
        await preferencesSchema.validate(preferences);
        const res = await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences)
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save preferences');
        }
        
        router.push('/')
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      }
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = questions[currentStep].field as keyof UserPreferences;
    const value = e.target.value;
    
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate on change
    await validateField(field, value);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Geography Chat!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Let&apos;s get to know your preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {questions[currentStep].question}
            </label>
            <input
              type="text"
              value={preferences[questions[currentStep].field as keyof UserPreferences]}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              required
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {questions.length}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {currentStep < questions.length - 1 ? 'Next' : 'Start Chatting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 