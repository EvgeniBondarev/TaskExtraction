import type { ReactNode } from "react";
import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { IconClassification, IconKanban, IconSync, IconTelegram } from "./FlowIcons";

const STEPS: {
  id: number;
  title: string;
  sub: string;
  icon: ReactNode;
}[] = [
  {
    id: 1,
    title: "Входящее сообщение",
    sub: "Группа или канал, который вы отслеживаете",
    icon: <IconTelegram size={26} />,
  },
  {
    id: 2,
    title: "Классификация LLM",
    sub: "Без тегов и спецслов — задача, вопрос или шум",
    icon: <IconClassification size={26} />,
  },
  {
    id: 3,
    title: "Панель и канбан",
    sub: "Карточка задачи и лента с контекстом",
    icon: <IconKanban size={26} />,
  },
  {
    id: 4,
    title: "Синхронизация",
    sub: "Автоматическая отправка во внешние системы",
    icon: <IconSync size={26} />,
  },
];

export function FlowDiagram() {
  return (
    <div className="lp-flow" aria-label="Схема работы продукта">
      <div className="lp-flow-track">
        {STEPS.map((step, i) => (
          <div key={step.id} className="lp-flow-step">
            <div className="lp-flow-node">{step.icon}</div>
            <div className="lp-flow-text">
              <span className="lp-flow-step-label">Шаг {step.id}</span>
              <strong>{step.title}</strong>
              <span>{step.sub}</span>
            </div>
            {i < STEPS.length - 1 && <div className="lp-flow-connector" aria-hidden />}
          </div>
        ))}
      </div>
      <div className="lp-flow-integrations" aria-label="Поддерживаемые интеграции">
        <IntegrationBrandIcon provider="jira" size={20} />
        <IntegrationBrandIcon provider="trello" size={20} />
        <IntegrationBrandIcon provider="github" size={20} />
        <IntegrationBrandIcon provider="slack" size={20} />
      </div>
    </div>
  );
}
