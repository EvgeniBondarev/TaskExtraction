import { IntegrationBrandIcon, IntegrationProvider } from "../IntegrationBrandIcon";

const ITEMS: { provider: IntegrationProvider; text: string }[] = [
  { provider: "jira", text: "Создание issue в Jira Cloud с привязкой к исходному сообщению" },
  { provider: "trello", text: "Карточка на выбранной доске и списке Trello" },
  { provider: "github", text: "Issue в репозитории GitHub с метаданными из чата" },
  { provider: "slack", text: "Уведомление в канал Slack при появлении задачи" },
];

export function IntegrationFeatureList() {
  return (
    <ul className="lp-int-list">
      {ITEMS.map((item) => (
        <li key={item.provider}>
          <IntegrationBrandIcon provider={item.provider} size={22} />
          <span>{item.text}</span>
        </li>
      ))}
      <li className="lp-int-list-extra">
        <span className="lp-int-list-dot" aria-hidden />
        <span>Ручная отправка из карточки задачи и обратные ссылки в панель</span>
      </li>
    </ul>
  );
}
