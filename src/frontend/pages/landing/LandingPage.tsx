import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  FileText,
  FolderKanban,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "../../common/Logo";
import "./LandingPage.css";

const heroBullets = [
  "CRM для юриста, адвоката, адвокатського бюро та юридичної компанії",
  "Клієнти, справи, документи, задачі та календар в одній системі",
  "Швидкий старт без складного впровадження та зайвих функцій",
];

const heroPills = [
  "Приватна практика",
  "Адвокатське бюро",
  "Юридична компанія",
  "Контроль доступів",
];

const painPoints = [
  {
    title: "Клієнти, справи та документи розкидані по різних сервісах",
    description:
      "Коли контакти в таблицях, задачі в месенджерах, а документи по папках, юрист витрачає час на пошук замість оплачуваної роботи.",
  },
  {
    title: "Дедлайни, засідання та зустрічі легко пропустити",
    description:
      "Без єдиного календаря та списку задач зростає ризик пропущених строків, засідань і критично важливих дій по справі.",
  },
  {
    title: "Команді складно працювати без зрозумілого розмежування доступів",
    description:
      "У юридичній компанії важливо, щоб керівник контролював практику, а кожен співробітник бачив лише ті дані, які потрібні для роботи.",
  },
];

const features = [
  {
    icon: Users,
    title: "База клієнтів",
    description:
      "Зберігайте контакти, історію комунікації, статуси та пов’язані справи в єдиній картці клієнта.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Облік юридичних справ",
    description:
      "Фіксуйте етапи роботи, відповідальних, задачі, строки та всі матеріали по справі без хаосу.",
  },
  {
    icon: FileText,
    title: "Документи в одному місці",
    description:
      "Прикріплюйте договори, процесуальні документи та файли до клієнта або справи, щоб нічого не губилося.",
  },
  {
    icon: CalendarClock,
    title: "Календар юриста та дедлайни",
    description:
      "Тримайте під контролем зустрічі, судові події, нагадування та важливі строки в одному календарі.",
  },
  {
    icon: LockKeyhole,
    title: "Розмежування доступів",
    description:
      "Налаштовуйте ролі та права доступу, щоб захищати дані клієнтів і впорядковувати командну роботу.",
  },
  {
    icon: FolderKanban,
    title: "Порядок у щоденній роботі",
    description:
      "Менше ручних уточнень, менше дублювання, більше контролю над завантаженням і статусом кожної справи.",
  },
];

const pricingPlans = [
  {
    name: "Безкоштовний",
    badge: "Для старту",
    price: "0 грн",
    subtitle:
      "Щоб без ризику перевірити, як CRM для юриста працює у вашому реальному сценарії.",
    features: [
      "До 1 клієнта",
      "До 3 справ",
      "Базовий кабінет для знайомства з системою",
    ],
    note: "Підійде, щоб швидко оцінити продукт на практиці.",
    accent: "soft",
  },
  {
    name: "Про",
    badge: "Найкращий вибір",
    price: "299 грн/місяць",
    subtitle:
      "Для юриста або адвоката, який хоче вести всю щоденну роботу в одній системі без обмежень.",
    features: [
      "Без обмежень по клієнтах",
      "Без обмежень по справах",
      "Повноцінний робочий кабінет на щодень",
    ],
    note: "Оптимальний тариф для приватної практики та особистого кабінету юриста.",
    accent: "primary",
  },
  {
    name: "Корпоративний",
    badge: "Для команд",
    price: "499 грн перший + 199 грн кожен наступний",
    subtitle:
      "Для юридичних компаній, яким потрібна командна робота, ролі та адміністративне керування доступами.",
    features: [
      "Кілька акаунтів у спільному пулі",
      "Адмін-панель для розмежування доступів",
      "Масштабування команди без зміни процесу",
    ],
    note: "Підходить для адвокатського бюро, фірми та команди, що зростає.",
    accent: "soft",
  },
];

const comparisonRows = [
  ["Клієнти", "До 1", "Без обмежень", "За потребою команди"],
  ["Справи", "До 3", "Без обмежень", "За потребою команди"],
  ["Робота кількох користувачів", "Ні", "Один акаунт", "Так"],
  ["Адмін-панель і доступи", "Ні", "Ні", "Так"],
  ["Для кого", "Ознайомлення", "Приватна практика", "Юридична компанія"],
];

const faqItems = [
  {
    question: "Кому підходить Law Organizer?",
    answer:
      "Law Organizer підходить приватним юристам, адвокатам, адвокатським бюро та юридичним компаніям, яким потрібна CRM-система для клієнтів, справ, документів і календаря.",
  },
  {
    question: "Чим відрізняється Про від Корпоративного?",
    answer:
      "Про розрахований на одного користувача без обмежень по клієнтах і справах. Корпоративний додає спільний пул акаунтів і адміністративну панель для керування ролями та доступами.",
  },
  {
    question: "Навіщо потрібен безкоштовний тариф?",
    answer:
      "Щоб без оплати перевірити сервіс на власному робочому сценарії та зрозуміти, наскільки зручно вам вести клієнтів, справи й документи в одному кабінеті.",
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <div className="landing-shell">
        <header className="landing-header">
          <Link to="/" className="landing-brand" aria-label="Law Organizer">
            <Logo className="landing-logo" />
            <div className="landing-brand-copy">
              <strong>Law Organizer</strong>
              <span>CRM для юриста, адвоката та юридичної компанії</span>
            </div>
          </Link>

          <nav className="landing-nav" aria-label="Основна навігація">
            <Link to="/login" className="landing-nav-link">
              Вхід
            </Link>
            <Link to="/register" className="landing-nav-button">
              Реєстрація
            </Link>
          </nav>
        </header>

        <main className="landing-main">
          <section className="landing-hero">
            <div className="landing-hero-copy">
              <div className="landing-kicker">
                <Sparkles size={16} />
                <span>
                  CRM-система для юридичної практики та керування справами
                </span>
              </div>

              <h1>
                CRM для юриста:
                <span>
                  {" "}
                  клієнти, справи, документи та дедлайни в одному місці.
                </span>
              </h1>

              <p className="landing-lead">
                Law Organizer допомагає юристам і юридичним компаніям навести
                порядок у роботі: вести базу клієнтів, контролювати юридичні
                справи, зберігати документи, бачити календар подій і не втрачати
                важливі строки.
              </p>

              <div className="landing-actions">
                <Link to="/register" className="landing-primary-cta">
                  Створити акаунт
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="landing-secondary-cta">
                  Увійти в кабінет
                </Link>
              </div>

              <div
                className="landing-hero-pills"
                aria-label="Сценарії використання"
              >
                {heroPills.map((item) => (
                  <span key={item} className="landing-hero-pill">
                    {item}
                  </span>
                ))}
              </div>

              <ul className="landing-trust-list">
                {heroBullets.map((item) => (
                  <li key={item}>
                    <BadgeCheck size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-preview">
              <div className="landing-preview-frame">
                <div className="landing-preview-topbar">
                  <span>Сьогодні під контролем</span>
                  <strong>5 активних справ</strong>
                </div>

                <div className="landing-preview-ribbon">
                  <span>Про</span>
                  <b>Без обмежень по клієнтах і справах</b>
                </div>

                <div className="landing-preview-grid">
                  <article className="landing-preview-card landing-preview-card-accent">
                    <div className="landing-preview-card-header">
                      <Users size={18} />
                      <span>Клієнти</span>
                    </div>
                    <strong>24</strong>
                    <p>
                      Контакти, історія роботи та пов’язані справи зібрані в
                      одній клієнтській базі.
                    </p>
                  </article>

                  <article className="landing-preview-card">
                    <div className="landing-preview-card-header">
                      <BriefcaseBusiness size={18} />
                      <span>Справи</span>
                    </div>
                    <ul className="landing-preview-list">
                      <li>
                        <span>Господарський спір</span>
                        <b>Строк завтра</b>
                      </li>
                      <li>
                        <span>Договірний супровід</span>
                        <b>3 документи</b>
                      </li>
                      <li>
                        <span>Претензійна робота</span>
                        <b>Новий етап</b>
                      </li>
                    </ul>
                  </article>

                  <article className="landing-preview-card">
                    <div className="landing-preview-card-header">
                      <CalendarClock size={18} />
                      <span>Календар</span>
                    </div>
                    <div className="landing-preview-calendar">
                      <span>11:00</span>
                      <p>Зустріч з клієнтом щодо стратегії справи</p>
                    </div>
                    <div className="landing-preview-calendar">
                      <span>15:30</span>
                      <p>Підготовка процесуальних документів</p>
                    </div>
                  </article>

                  <article className="landing-preview-card landing-preview-card-muted">
                    <div className="landing-preview-card-header">
                      <ShieldCheck size={18} />
                      <span>Команда</span>
                    </div>
                    <p>
                      Керівник бачить загальну картину, а співробітники працюють
                      у межах своїх ролей і доступів.
                    </p>
                  </article>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-metrics">
            <article>
              <strong>1 кабінет</strong>
              <span>для всієї щоденної роботи юриста</span>
            </article>
            <article>
              <strong>299 грн/місяць</strong>
              <span>за безлімітний тариф для приватної практики</span>
            </article>
            <article>
              <strong>499 + 199 грн</strong>
              <span>для командної роботи та керування доступами</span>
            </article>
          </section>

          <section
            className="landing-section landing-problems"
            aria-labelledby="landing-problems-title"
          >
            <div className="landing-section-heading">
              <p>Чому це потрібно</p>
              <h2 id="landing-problems-title">
                Юридична практика втрачає гроші й час не через брак клієнтів, а
                через безлад у процесах
              </h2>
            </div>

            <div className="landing-problem-grid">
              {painPoints.map((item) => (
                <article key={item.title} className="landing-problem-card">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            className="landing-section landing-features"
            aria-labelledby="landing-features-title"
          >
            <div className="landing-section-heading">
              <p>Що всередині</p>
              <h2 id="landing-features-title">
                Усе, що потрібно для щоденної роботи юриста та юридичної
                компанії
              </h2>
            </div>

            <div className="landing-feature-grid">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="landing-feature-card">
                  <div className="landing-feature-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            className="landing-section landing-pricing"
            aria-labelledby="landing-pricing-title"
          >
            <div className="landing-section-heading">
              <p>Тарифи</p>
              <h2 id="landing-pricing-title">
                Оберіть тариф під свій формат роботи та почніть без зайвих
                витрат
              </h2>
            </div>

            <div className="landing-pricing-intro">
              <p>
                Почніть з безкоштовного тарифу, якщо хочете протестувати
                систему. Обирайте <strong>Про</strong>, якщо шукаєте повноцінну
                CRM для юриста. Переходьте на <strong>Корпоративний</strong>,
                якщо у вас команда і потрібне керування ролями та доступами.
              </p>
            </div>

            <div className="landing-pricing-grid">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.name}
                  className={`landing-pricing-card ${plan.accent === "primary" ? "landing-pricing-card-primary" : ""}`}
                >
                  <div className="landing-pricing-head">
                    <span className="landing-pricing-badge">{plan.badge}</span>
                    <h3>{plan.name}</h3>
                  </div>
                  <strong>{plan.price}</strong>
                  <p>{plan.subtitle}</p>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <small>{plan.note}</small>
                  <Link to="/register" className="landing-pricing-cta">
                    Зареєструватися
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section
            className="landing-section landing-compare"
            aria-labelledby="landing-compare-title"
          >
            <div className="landing-section-heading">
              <p>Порівняння</p>
              <h2 id="landing-compare-title">
                Швидке порівняння тарифів без дрібного шрифту
              </h2>
            </div>

            <div
              className="landing-compare-table"
              role="table"
              aria-label="Порівняння тарифів"
            >
              <div
                className="landing-compare-row landing-compare-row-head"
                role="row"
              >
                <span role="columnheader">Параметр</span>
                <span role="columnheader">Безкоштовний</span>
                <span role="columnheader">Про</span>
                <span role="columnheader">Корпоративний</span>
              </div>
              {comparisonRows.map((row) => (
                <div key={row[0]} className="landing-compare-row" role="row">
                  {row.map((cell, cellIndex) => (
                    <span key={`${row[0]}-${cellIndex}`} role="cell">
                      {cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section
            className="landing-section landing-faq"
            aria-labelledby="landing-faq-title"
          >
            <div className="landing-section-heading">
              <p>FAQ</p>
              <h2 id="landing-faq-title">
                Відповіді на часті запитання перед підключенням
              </h2>
            </div>

            <div className="landing-faq-list">
              {faqItems.map((item) => (
                <details key={item.question} className="landing-faq-item">
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="landing-final-cta">
            <div className="landing-final-cta-copy">
              <p>Готові навести порядок у юридичній практиці?</p>
              <h2>
                Почніть вести клієнтів, справи та документи в одній CRM уже
                сьогодні.
              </h2>
              <span>
                Спробуйте безкоштовно або одразу підключіть тариф, який
                підходить вашому формату роботи.
              </span>
            </div>
            <div className="landing-final-cta-actions">
              <Link to="/register" className="landing-primary-cta">
                Зареєструватися
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="landing-secondary-cta">
                Уже є акаунт
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
