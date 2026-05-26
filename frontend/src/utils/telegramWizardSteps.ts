import { TelegramStatus } from "../api/telegram";
import { SetupStepItem } from "../components/SetupStepper";
import type { SettingsMessages } from "../i18n/types";

export function getTelegramWizardSteps(settings: SettingsMessages): SetupStepItem[] {
  return settings.wizard.steps.map((s) => ({ ...s }));
}

export function getTelegramWizardStepsLegacy(settings: SettingsMessages): SetupStepItem[] {
  return settings.wizard.stepsLegacy.map((s) => ({ ...s }));
}

/** @deprecated use getTelegramWizardSteps(settings) */
export const TELEGRAM_WIZARD_STEPS: SetupStepItem[] = [];

export function getTelegramWizardStep(
  status: TelegramStatus | null,
  hasMonitored: boolean,
  hostedApp = true
): { current: number; completed: number } {
  if (!status) return { current: 0, completed: -1 };
  const hosted = hostedApp || Boolean(status.hosted_app);
  if (!hosted && !status.has_credentials) return { current: 0, completed: -1 };
  if (!status.is_authorized) {
    return hosted ? { current: 0, completed: -1 } : { current: 1, completed: 0 };
  }
  if (!hasMonitored) {
    return hosted ? { current: 1, completed: 0 } : { current: 2, completed: 1 };
  }
  return hosted ? { current: 2, completed: 2 } : { current: 3, completed: 3 };
}
