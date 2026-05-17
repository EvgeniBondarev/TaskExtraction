import type { ReactNode } from "react";
import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { FeedIllustration, KanbanIllustration, ShopChatIllustration } from "./LandingIllustrations";
import { ScrollReveal } from "./ScrollReveal";

type Step = {
  num: string;
  title: string;
  body: string;
  quote?: string;
  outcome?: string;
  bullets?: readonly string[];
  visual?: ReactNode;
};

const STEPS: Step[] = [
  {
    num: "1",
    title: "Покупатель пишет в чат",
    body: "В Telegram-группе поддержки интернет-магазина приходит обычное сообщение — без #задача, без команд боту.",
    quote: "Заказ №4821 не пришёл, проверьте статус доставки",
    visual: <ShopChatIllustration />,
  },
  {
    num: "2",
    title: "Сервис распознаёт поручение",
    body: "TaskExtraction передаёт текст в LLM. Модель понимает, что это задача для команды, а не просто вопрос.",
    outcome: "Карточка появляется в Inbox с текстом, автором и ссылкой на сообщение",
    visual: <KanbanIllustration />,
  },
  {
    num: "3",
    title: "Менеджер ведёт задачу на доске",
    body: "Сотрудник поддержки открывает панель «Задачи», переводит карточку по колонкам и при необходимости уточняет детали в модальном окне.",
    bullets: [
      "Inbox → В работе → Готово",
      "Вся переписка сохранена — не нужно копировать из Telegram",
    ],
    visual: <FeedIllustration />,
  },
  {
    num: "4",
    title: "Передача менеджеру или в трекер",
    body: "С auto-push тикет сразу создаётся в Jira / Trello, уведомление уходит в Slack. Или менеджер нажимает «Отправить» вручную из карточки.",
    visual: (
      <div className="lp-case-integrations" aria-hidden>
        <IntegrationBrandIcon provider="jira" size={44} />
        <IntegrationBrandIcon provider="trello" size={44} />
        <IntegrationBrandIcon provider="github" size={44} />
        <IntegrationBrandIcon provider="slack" size={44} />
      </div>
    ),
  },
];

export function LandingProductCase() {
  return (
    <div className="lp-case">
      <ScrollReveal className="lp-case-intro lp-section-head--center">
        <span className="lp-badge">Сценарий</span>
        <h2>Как это работает на примере магазина</h2>
        <p className="lp-section-lead">
          От одного сообщения покупателя до задачи на доске или тикета у ответственного — четыре шага без
          ручного переноса.
        </p>
      </ScrollReveal>

      <ol className="lp-case-timeline">
        {STEPS.map((step, index) => (
          <ScrollReveal
            key={step.num}
            as="li"
            className="lp-case-timeline-item"
            delay={index * 60}
            direction="up"
          >
            <div className="lp-case-timeline-rail" aria-hidden>
              <span className="lp-case-timeline-dot">{step.num}</span>
              {index < STEPS.length - 1 && <span className="lp-case-timeline-line" />}
            </div>

            <div className="lp-case-timeline-body">
              <h3>{step.title}</h3>
              <p>{step.body}</p>

              {step.quote && (
                <blockquote className="lp-case-quote">
                  <span className="lp-case-quote-label">Сообщение в чате</span>
                  «{step.quote}»
                </blockquote>
              )}

              {step.outcome && (
                <p className="lp-case-outcome">
                  <span className="lp-case-outcome-icon" aria-hidden>
                    ✓
                  </span>
                  {step.outcome}
                </p>
              )}

              {step.bullets && (
                <ul className="lp-case-bullets">
                  {step.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}

              {step.visual && <div className="lp-case-visual">{step.visual}</div>}
            </div>
          </ScrollReveal>
        ))}
      </ol>
    </div>
  );
}
