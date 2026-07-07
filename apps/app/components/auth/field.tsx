import { type InputHTMLAttributes } from "react"
import { Input } from "@workspace/ui/components/input"

interface FieldProps {
  name: string
  label: string
  errors?: string[]
  children?: React.ReactNode
  className?: string
}

export function Field({ name, label, errors, children, className }: FieldProps) {
  const errorId = `${name}-error`
  const hasErrors = errors && errors.length > 0

  return (
    <div className={className}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hasErrors && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {errors.map((e) => e)}
        </p>
      )}
    </div>
  )
}

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "name"> {
  name: string
  label: string
  errors?: string[] | undefined
}

export function InputField({ name, label, errors, ...inputProps }: InputFieldProps) {
  const errorId = `${name}-error`
  const hasErrors = errors && errors.length > 0

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        {...inputProps}
      />
      {hasErrors &&
        errors.map((e) => (
          <p key={e} id={errorId} className="text-sm text-destructive" role="alert">
            {e}
          </p>
        ))}
    </div>
  )
}
