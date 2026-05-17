import { ScrollReveal } from "./ScrollReveal";

const GUIDE_STEPS = [
  {
    step: 1,
    title: "Ключи Telegram API",
    time: "3 мин",
    body: "Зайдите на my.telegram.org → API development tools. Скопируйте api_id и api_hash в настройках приложения.",
    tip: "Ключи хранятся зашифрованно на сервере.",
    link: "https://my.telegram.org/apps",
    linkLabel: "Открыть my.telegram.org",
  },
  {
    step: 2,
    title: "Вход в аккаунт",
    time: "2 мин",
    body: "Отсканируйте QR-код в Telegram или войдите по номеру телефона — как в обычном клиенте.",
    tip: "Сессия сохраняется: повторный вход не нужен.",
  },
  {
    step: 3,
    title: "Выбор чатов",
    time: "1 мин",
    body: "Отметьте группы и каналы поддержки, из которых нужно извлекать задачи. Можно добавить несколько.",
    tip: "Сначала показываются уже активные чаты.",
  },
  {
    step: 4,
    title: "Настройка LLM",
    time: "5 мин",
    body: "Укажите API-ключ и модель (OpenAI-совместимый endpoint). При желании отредактируйте промпт извлечения задач.",
    tip: "Без LLM классификация и создание задач не работают.",
  },
  {
    step: 5,
    title: "Интеграции (по желанию)",
    time: "10 мин",
    body: "Подключите Jira, Trello, GitHub Issues или Slack — новые задачи будут автоматически уходить в ваши инструменты.",
    tip: "Включите «авто-push» в карточке интеграции.",
  },
  {
    step: 6,
    title: "Работа в панели",
    time: "∞",
    body: "«Лента» — все сообщения с классификацией в реальном времени. «Задачи» — канбан Inbox → В работе → Готово → Архив.",
    tip: "Клик по карточке открывает детали и ссылки на внешние тикеты.",
  },
] as const;

interface Props {
  onTry: () => void;
}

export function BeginnerGuide({ onTry }: Props) {
  return (
    <section className="lp-guide" id="guide" aria-labelledby="lp-guide-title">
      <ScrollReveal className="lp-section-head lp-section-head--center">
        <span className="lp-badge">Гайд для новичков</span>
        <h2 id="lp-guide-title">С нуля до первой задачи за 5 минут</h2>
        <p className="lp-section-lead">
          Пошаговая инструкция — как в мастере настройки внутри приложения. Следуйте порядку, и панель
          начнёт работать с первого сообщения в чате.
        </p>
      </ScrollReveal>

      <ol className="lp-guide-list">
        {GUIDE_STEPS.map((item, index) => (
          <ScrollReveal
            key={item.step}
            as="li"
            className="lp-guide-item"
            delay={index * 50}
            direction="up"
          >
            <div className="lp-guide-marker" aria-hidden>
              <span className="lp-guide-num">{item.step}</span>
            </div>
            <div className="lp-guide-body">
              <div className="lp-guide-head">
                <h3>{item.title}</h3>
                <span className="lp-guide-time">~{item.time}</span>
              </div>
              <p>{item.body}</p>
              <p className="lp-guide-tip">{item.tip}</p>
              {"link" in item && item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="lp-guide-link">
                  {item.linkLabel}
                </a>
              )}
            </div>
          </ScrollReveal>
        ))}
      </ol>

      <ScrollReveal className="lp-guide-cta" direction="scale">
        <p>Готовы? Мастер настройки проведёт через шаги 1–3 автоматически.</p>
        <button type="button" className="lp-btn lp-btn--primary lp-btn--lg" onClick={onTry}>
          Начать настройку
        </button>
      </ScrollReveal>
    </section>
  );
}
