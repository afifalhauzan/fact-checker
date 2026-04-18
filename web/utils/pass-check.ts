  export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function calculatePasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[\d\W]/.test(password)) strength++;
  return strength;
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1: return "Terlalu lemah";
    case 2: return "Lemah";
    case 3: return "Cukup kuat";
    case 4: return "Sangat kuat";
    default: return "Terlalu lemah";
  }
}

export function getPasswordStrengthColor(segment: number, score: number): string {
  if (segment <= score) {
    switch (score) {
      case 1: return "bg-destructive";
      case 2: return "bg-yellow-500";
      case 3: return "bg-primary";
      case 4: return "bg-green-500";
      default: return "bg-border";
    }
  }
  return "bg-border";
}

export function getPasswordStrength(password: string): PasswordStrength {
  const score = calculatePasswordStrength(password);
  return {
    score,
    label: getPasswordStrengthLabel(score),
    color: getPasswordStrengthColor(1, score) // Base color for the strength
  };
}