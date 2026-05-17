import { TelegramStatus } from "../api/telegram";
import { SetupStepItem } from "../components/SetupStepper";

export const TELEGRAM_WIZARD_STEPS: SetupStepItem[] = [
  { id: "credentials", label: "Ключи API", description: "my.telegram.org" },
  { id: "auth", label: "Вход", description: "Телефон или QR" },
  { id: "chats", label: "Чаты", description: "Что отслеживать" },
  { id: "done", label: "Готово", description: "Можно работать" },
];

export function getTelegramWizardStep(
  status: TelegramStatus | null,
  hasMonitored: boolean
): { current: number; completed: number } {
  if (!status) return { current: 0, completed: -1 };
  if (!status.has_credentials) return { current: 0, completed: -1 };
  if (!status.is_authorized) return { current: 1, completed: 0 };
  if (!hasMonitored) return { current: 2, completed: 1 };
  return { current: 3, completed: 3 };
}
