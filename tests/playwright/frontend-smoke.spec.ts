import { devices, expect, test } from "@playwright/test";

const { defaultBrowserType: _defaultBrowserType, ...iphone13 } =
  devices["iPhone 13"];

const authUser = {
  id: "user-1",
  email: "owner@laworganizer.test",
  firstName: "Олексій",
  lastName: "Коваленко",
  role: "organization_owner",
  tenantId: "tenant-1",
  emailVerified: true,
  mfaEnabled: false,
  status: "active",
};

const authOrganization = {
  id: "org-1",
  name: "Law Organizer Test Firm",
  legalForm: "llc",
  email: "office@laworganizer.test",
  subscriptionPlan: "professional",
  subscriptionStatus: "active",
  maxUsers: 5,
  status: "active",
};

const clients = [
  {
    id: "client-1",
    tenantId: "tenant-1",
    type: "individual",
    firstName: "Олексій",
    lastName: "Подубфалов",
    patronymic: "Анатолійович",
    email: "podubfalov@example.com",
    phone: "+380954222222",
    status: "active",
    metadata: { client_number: "001" },
    createdAt: "2026-03-07T09:00:00.000Z",
    updatedAt: "2026-03-07T09:00:00.000Z",
  },
];

const cases = [
  {
    id: "case-1",
    tenantId: "tenant-1",
    caseNumber: "001/001",
    registryCaseNumber: "491/882/25",
    caseType: "civil",
    assignedLawyerId: "user-1",
    clientId: "client-1",
    client: clients[0],
    title: "Стягнення заборгованості",
    description: "Позов про стягнення заборгованості",
    priority: "medium",
    status: "active",
    startDate: "2026-03-07",
    nextHearingDate: "2026-03-21",
    courtName: "Ананьївський районний суд",
    judgeName: "Іваненко І.І.",
    plaintiffName: "Подубфалов О.А.",
    defendantName: "ТОВ Боржник",
    createdAt: "2026-03-07T10:00:00.000Z",
    updatedAt: "2026-03-08T12:00:00.000Z",
  },
];

const documents = [
  {
    id: "doc-1",
    tenantId: "tenant-1",
    caseId: "case-1",
    clientId: "client-1",
    title: "Позовна заява",
    originalName: "pozov.pdf",
    fileName: "pozov.pdf",
    type: "other",
    mimeType: "application/pdf",
    size: 120400,
    status: "draft",
    accessLevel: "internal",
    malwareScanStatus: "clean",
    createdAt: "2026-03-08T10:00:00.000Z",
    updatedAt: "2026-03-08T10:00:00.000Z",
    uploadedBy: "user-1",
  },
];

const calendarEvents = [
  {
    id: "event-1",
    tenantId: "tenant-1",
    caseId: "case-1",
    type: "hearing",
    title: "Судове засідання",
    description: "Підготовче засідання у справі",
    eventDate: "2026-03-21",
    eventTime: "10:30:00",
    durationMinutes: 60,
    location: "м. Одеса",
    courtRoom: "Зал 3",
    judgeName: "Іваненко І.І.",
    participants: { participants: ["Позивач", "Відповідач"] },
    reminderSent: false,
    reminderDaysBefore: 2,
    status: "scheduled",
    notes: "Підготувати оригінали документів",
    createdAt: "2026-03-09T08:00:00.000Z",
    updatedAt: "2026-03-09T08:00:00.000Z",
    case: {
      id: "case-1",
      caseNumber: "001/001",
      title: "Стягнення заборгованості",
    },
  },
];

const pricelists = [
  {
    id: "price-1",
    tenantId: "tenant-1",
    name: "Судова практика",
    description: "Базові ставки для судових справ",
    type: "litigation",
    status: "active",
    isDefault: true,
    items: [
      {
        id: "item-1",
        category: "Позови",
        name: "Підготовка позову",
        description: "Пакет документів",
        price: 5000,
      },
    ],
    metadata: { currency: "UAH" },
    createdAt: "2026-03-07T10:00:00.000Z",
    updatedAt: "2026-03-09T09:00:00.000Z",
  },
];

const dashboardStats = {
  stats: [
    {
      label: "Активні справи",
      value: 12,
      change: 8,
      trend: "up",
      icon: "briefcase",
    },
    { label: "Клієнти", value: 38, change: 3, trend: "up", icon: "users" },
    {
      label: "Події тижня",
      value: 7,
      change: 0,
      trend: "neutral",
      icon: "calendar",
    },
    { label: "Дохід", value: 245000, change: 12, trend: "up", icon: "wallet" },
  ],
  recentCases: [
    {
      id: "case-1",
      caseNumber: "001/001",
      title: "Стягнення заборгованості",
      clientName: "Подубфалов О.А.",
      status: "active",
      priority: "medium",
      nextHearingDate: "2026-03-21",
    },
  ],
  upcomingEvents: [
    {
      id: "event-1",
      title: "Судове засідання",
      type: "hearing",
      eventDate: "2026-03-21T10:30:00.000Z",
      location: "м. Одеса",
      caseNumber: "001/001",
    },
  ],
  activityFeed: [
    {
      id: "act-1",
      userName: "Олексій Коваленко",
      action: "updated",
      entityType: "case",
      entityDescription: "001/001",
      timestamp: "2026-03-09T07:00:00.000Z",
    },
  ],
  pendingTasks: [
    {
      id: "task-1",
      title: "Підготувати позицію по справі",
      type: "deadline",
      dueDate: "2026-03-18",
      caseNumber: "001/001",
      priority: "high",
    },
  ],
  revenueData: [
    { date: "2026-03-01", amount: 70000, paidAmount: 50000 },
    { date: "2026-03-05", amount: 85000, paidAmount: 65000 },
  ],
};

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function installApiMocks(page: import("@playwright/test").Page) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/^\/api/, "");

    if (pathname === "/organizations/onboarding") {
      return route.fulfill(
        json({
          completed: true,
          percentage: 100,
          steps: [
            { step: "organization_details", completed: true },
            { step: "subscription", completed: true },
            { step: "team_invite", completed: true },
          ],
        }),
      );
    }

    if (pathname === "/dashboard/stats") {
      return route.fulfill(json(dashboardStats));
    }

    if (pathname === "/clients") {
      return route.fulfill(
        json({
          data: clients,
          total: clients.length,
          page: 1,
          limit: 20,
        }),
      );
    }

    if (pathname === "/clients/next-number") {
      return route.fulfill(json({ clientNumber: "002" }));
    }

    if (
      pathname.startsWith("/clients/") &&
      pathname !== "/clients/next-number"
    ) {
      return route.fulfill(json(clients[0]));
    }

    if (pathname === "/cases") {
      return route.fulfill(
        json({
          data: cases,
          total: cases.length,
          page: 1,
          limit: 20,
        }),
      );
    }

    if (pathname === "/cases/next-number") {
      return route.fulfill(json({ caseNumber: "001/002" }));
    }

    if (/^\/cases\/[^/]+\/timeline$/.test(pathname)) {
      return route.fulfill(
        json([
          {
            type: "event",
            date: "2026-03-09",
            data: { title: "Підготовче засідання" },
          },
        ]),
      );
    }

    if (pathname.startsWith("/cases/")) {
      return route.fulfill(json(cases[0]));
    }

    if (pathname.startsWith("/documents")) {
      return route.fulfill(
        json({
          data: documents,
          total: documents.length,
          page: 1,
          limit: 20,
        }),
      );
    }

    if (pathname.startsWith("/events/calendar")) {
      return route.fulfill(json(calendarEvents));
    }

    if (pathname.startsWith("/pricelists")) {
      return route.fulfill(
        json({
          data: pricelists,
          total: pricelists.length,
          page: 1,
          limit: 100,
        }),
      );
    }

    if (
      route.request().method() === "POST" ||
      route.request().method() === "PUT" ||
      route.request().method() === "PATCH" ||
      route.request().method() === "DELETE"
    ) {
      return route.fulfill(json({ ok: true }));
    }

    return route.fulfill(json({}));
  });
}

async function seedStoredSession(
  context: import("@playwright/test").BrowserContext,
) {
  await context.addInitScript(
    ({ user, organization }) => {
      window.localStorage.setItem("access_token", "test-access-token");
      window.localStorage.setItem("refresh_token", "test-refresh-token");
      window.localStorage.setItem("auth_user", JSON.stringify(user));
      window.localStorage.setItem(
        "auth_organization",
        JSON.stringify(organization),
      );
      window.localStorage.setItem("auth_remember_me", "true");
    },
    { user: authUser, organization: authOrganization },
  );
}

test.describe("frontend smoke audit", () => {
  test("public auth shell renders and preserves accessibility basics", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /crm для юриста:.*клієнти, справи, документи та дедлайни в одному місці/i,
      }),
    ).toBeVisible();

    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Вхід до кабінету" }),
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('input[type="password"]')).toBeFocused();

    expect(consoleErrors).toEqual([]);
  });

  test("authenticated critical routes render without console/runtime failures", async ({
    page,
    context,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await seedStoredSession(context);
    await installApiMocks(page);

    const routes = [
      { path: "/dashboard", heading: "Дашборд" },
      { path: "/clients", heading: "Мої клієнти" },
      { path: "/cases", heading: "Мої справи" },
      { path: "/documents", heading: "Файли" },
      { path: "/calendar", heading: "Календар" },
      { path: "/pricelists", heading: "Прайс-листи" },
    ];

    for (const routeInfo of routes) {
      await page.goto(routeInfo.path, { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: routeInfo.heading }),
      ).toBeVisible();
      await expect(page.locator("main#main-content")).toBeVisible();
    }

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("frontend mobile viewport audit", () => {
  test.use(iphone13);

  test("critical routes stay within the mobile viewport", async ({
    page,
    context,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await seedStoredSession(context);
    await installApiMocks(page);

    const routes = [
      { path: "/dashboard", heading: "Дашборд" },
      { path: "/clients", heading: "Мої клієнти" },
      { path: "/cases", heading: "Мої справи" },
      { path: "/documents", heading: "Файли" },
      { path: "/documents/scan-session", heading: "Додати скан" },
      { path: "/calendar", heading: "Календар" },
      { path: "/pricelists", heading: "Прайс-листи" },
    ];

    for (const routeInfo of routes) {
      await page.goto(routeInfo.path, { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: routeInfo.heading }),
      ).toBeVisible();
      await expect(page.locator(".mobile-menu-button")).toBeVisible();
      await expect(page.locator(".mobile-nav-bottom")).toHaveCount(0);

      const metrics = await page.evaluate(() => {
        let maxRight = 0;

        for (const element of Array.from(document.body.querySelectorAll("*"))) {
          const rect = element.getBoundingClientRect();

          if (rect.width > 0 && rect.height > 0) {
            maxRight = Math.max(maxRight, rect.right);
          }
        }

        return {
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          maxRight,
        };
      });

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
      expect(metrics.maxRight).toBeLessThanOrEqual(metrics.innerWidth + 1);
    }

    expect(consoleErrors).toEqual([]);
  });
});
