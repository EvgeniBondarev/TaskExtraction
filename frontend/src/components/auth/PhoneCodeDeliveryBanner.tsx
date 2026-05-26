interface Props {
  phone: string;
  delivery: string;
  hint: string;
}

export function PhoneCodeDeliveryBanner({ phone, delivery, hint }: Props) {
  const isApp = delivery === "app" || !delivery;

  return (
    <div className={`te-code-delivery te-code-delivery--${delivery || "app"}`} role="status">
      <div className="te-code-delivery__icon" aria-hidden>
        {isApp ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>
      <div className="te-code-delivery__body">
        <strong className="te-code-delivery__title">
          {isApp ? "Код в приложении Telegram" : "Код отправлен"}
        </strong>
        <p className="te-code-delivery__hint">{hint}</p>
        {isApp && (
          <ol className="te-code-delivery__steps">
            <li>
              На телефоне <span className="te-code-delivery__phone">{phone}</span> откройте Telegram
            </li>
            <li>Найдите чат <strong>«Telegram»</strong> (синяя галочка, вверху списка)</li>
            <li>Введите 5-значный код ниже — SMS обычно не приходит</li>
          </ol>
        )}
      </div>
    </div>
  );
}
