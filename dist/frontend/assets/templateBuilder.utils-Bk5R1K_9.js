const d=t=>new Intl.DateTimeFormat("uk-UA",{day:"2-digit",month:"long",year:"numeric"}).format(t),f=t=>new Intl.DateTimeFormat("uk-UA",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(t),y=new Date("1990-01-15T12:00:00.000Z"),k=new Date("2025-09-03T12:00:00.000Z"),w=new Date("2026-02-17T12:00:00.000Z"),u={orientation:"portrait",marginPreset:"standard",fontFamily:"times",fontSizePt:14,lineHeight:1.5},v={standard:{top:"18mm",right:"16mm",bottom:"18mm",left:"16mm"},narrow:{top:"12mm",right:"12mm",bottom:"12mm",left:"12mm"},wide:{top:"24mm",right:"22mm",bottom:"24mm",left:"22mm"}},A={times:'"Times New Roman", Georgia, serif',golos:'"Golos Text", Arial, sans-serif',arial:"Arial, Helvetica, sans-serif"},g=t=>({orientation:(t==null?void 0:t.orientation)==="landscape"?"landscape":"portrait",marginPreset:(t==null?void 0:t.marginPreset)==="narrow"||(t==null?void 0:t.marginPreset)==="wide"?t.marginPreset:"standard",fontFamily:(t==null?void 0:t.fontFamily)==="golos"||(t==null?void 0:t.fontFamily)==="arial"?t.fontFamily:"times",fontSizePt:typeof(t==null?void 0:t.fontSizePt)=="number"&&t.fontSizePt>=10&&t.fontSizePt<=18?t.fontSizePt:u.fontSizePt,lineHeight:typeof(t==null?void 0:t.lineHeight)=="number"&&t.lineHeight>=1.15&&t.lineHeight<=2?t.lineHeight:u.lineHeight}),x=t=>{const r=g(t),i=v[r.marginPreset];return{pageWidth:r.orientation==="landscape"?"297mm":"210mm",pageHeight:r.orientation==="landscape"?"210mm":"297mm",pageSizeRule:`A4 ${r.orientation}`,marginShorthand:`${i.top} ${i.right} ${i.bottom} ${i.left}`,fontFamily:A[r.fontFamily]}},S=t=>{const r=g(t),i=x(r);return`
    body {
      max-width: ${i.pageWidth};
      min-height: ${i.pageHeight};
      margin: 16px auto;
      padding: ${i.marginShorthand};
      background: #ffffff;
      color: #111827;
      font-family: ${i.fontFamily};
      font-size: ${r.fontSizePt}pt;
      line-height: ${r.lineHeight};
      box-shadow: 0 0 0 1px rgba(36, 50, 74, 0.1);
    }
    p { margin: 0 0 0.9rem; }
    h1, h2, h3 { margin: 0 0 1rem; }
    ul, ol { margin: 0 0 1rem 1.5rem; }
    blockquote {
      margin: 0 0 1rem;
      padding-left: 1rem;
      border-left: 3px solid rgba(44, 95, 178, 0.22);
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td, th {
      border: 1px solid #d6deea;
      padding: 0.45rem 0.6rem;
      vertical-align: top;
    }
    .template-token {
      display: inline-block;
      padding: 0.08rem 0.3rem;
      border: 1px solid rgba(44, 95, 178, 0.18);
      border-radius: 0.35rem;
      background: rgba(61, 118, 209, 0.06);
      color: #2c5fb2;
      font-family: "SFMono-Regular", "JetBrains Mono", monospace;
      font-size: 10pt;
      white-space: nowrap;
    }
    .template-token-table {
      margin: 0 0 1rem;
      border: 1px solid rgba(44, 95, 178, 0.16);
      border-radius: 0.45rem;
      overflow: hidden;
      background: rgba(61, 118, 209, 0.03);
    }
    .template-token-table-caption {
      padding: 0.45rem 0.65rem;
      border-bottom: 1px solid rgba(44, 95, 178, 0.14);
      background: rgba(61, 118, 209, 0.07);
      color: #2c5fb2;
      font-family: "SFMono-Regular", "JetBrains Mono", monospace;
      font-size: 10pt;
      font-weight: 600;
    }
    .template-token-table table {
      margin: 0;
      background: #ffffff;
      table-layout: fixed;
    }
    .template-token-table-placeholder {
      padding: 0.8rem 0.9rem;
      color: #5b677a;
      font-style: italic;
      text-align: center;
    }
    .template-token-table th,
    .template-token-table td {
      white-space: normal;
      word-break: normal;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    .template-token-table th:nth-child(1),
    .template-token-table td:nth-child(1) {
      width: 7%;
      text-align: center;
    }
    .template-token-table th:nth-child(2),
    .template-token-table td:nth-child(2) {
      width: 51%;
      text-align: left;
    }
    .template-token-table th:nth-child(3),
    .template-token-table td:nth-child(3) {
      width: 13%;
      text-align: center;
    }
    .template-token-table th:nth-child(4),
    .template-token-table td:nth-child(4) {
      width: 14%;
      text-align: center;
    }
    .template-token-table th:nth-child(5),
    .template-token-table td:nth-child(5) {
      width: 15%;
      text-align: center;
    }
  `},e=(t,r,i,n,l,a,c,o)=>({id:r,label:i,group:t,description:n,token:(o==null?void 0:o.token)||r,example:l,kind:a,inflection:c,defaultCaseMode:(o==null?void 0:o.defaultCaseMode)||"default",renderMode:(o==null?void 0:o.renderMode)||"inline"}),$=(t=new Date)=>{const r=[e("Користувач","user.fullName","ПІБ користувача","Зібране ПІБ з полів профілю","Іваненко Іван Іванович","text","person"),e("Користувач","user.firstName","Ім'я","Ім'я користувача","Іван","text","person"),e("Користувач","user.lastName","Прізвище","Прізвище користувача","Іваненко","text","person"),e("Користувач","user.patronymic","По батькові","По батькові користувача","Іванович","text","person"),e("Користувач","user.position","Посада","Статус або посада з профілю","Адвокат","text","generic"),e("Користувач","user.positionGenitive","Посада в родовому відмінку","Посада користувача з автоматичним переведенням у родовий відмінок","Адвоката","text","generic",{token:"user.position",defaultCaseMode:"genitive"}),e("Користувач","user.legalStatus","Статус діяльності","Юрист / адвокат / адвокат + БПД","Адвокат","text","generic"),e("Користувач","user.organizationType","Тип організації","Самозайнята особа, ФОП або юрособа","ФОП","text","generic"),e("Користувач","user.emailLogin","Логін / email входу","Email, який використовується для входу в систему","lawyer@example.ua","text","none"),e("Користувач","user.emailPrimary","Основний email","Основна електронна пошта з профілю","lawyer@example.ua","text","none"),e("Користувач","user.emailSecondary","Додаткові email","Усі додаткові email з профілю","office@example.ua, billing@example.ua","text","none"),e("Користувач","user.phonePrimary","Основний телефон","Основний номер телефону з профілю","+380 67 123 45 67","text","none"),e("Користувач","user.phoneSecondary","Додаткові телефони","Усі додаткові телефони з профілю","+380 67 000 00 01, +380 67 000 00 02","text","none"),e("Користувач","user.city","Місто","Окреме місто користувача з адреси профілю","Київ","text","generic"),e("Користувач","user.taxId","РНОКПП","Податковий номер користувача","1234567890","text","none"),e("Користувач","user.legalForm","Організаційно-правова форма","Форма юридичної особи користувача","ТОВ","text","generic"),e("Користувач","user.legalEntityName","Назва юридичної особи","Власна назва юридичної особи з профілю","Право на захист","text","generic"),e("Користувач","user.legalEntityDisplayName","Повна назва юридичної особи","Організаційно-правова форма разом із власною назвою","ТОВ Право на захист","text","generic"),e("Користувач","user.edrpou","ЄДРПОУ","Код ЄДРПОУ юридичної особи користувача","12345678","text","none"),e("Користувач","user.bankName","Банк","Назва банку з профілю","ПриватБанк","text","generic"),e("Користувач","user.bankMfo","МФО","Банківський МФО користувача","305299","text","none"),e("Користувач","user.iban","IBAN","Банківський рахунок користувача","UA123456789012345678901234567","text","none"),e("Користувач","user.taxSystem","Форма оподаткування","Податкова система з профілю","Загальна система","text","generic"),e("Користувач","user.vatPayer","Платник ПДВ","Ознака платника ПДВ","Так","text","generic"),e("Користувач","user.legalAddress","Юридична адреса","Повна юридична адреса з профілю","м. Київ, вул. Хрещатик, 1, оф. 5","text","generic"),e("Користувач","user.legalAddress.region","Юридична адреса: область","Область юридичної адреси","Київська область","text","generic"),e("Користувач","user.legalAddress.city","Юридична адреса: місто","Місто юридичної адреси","Київ","text","generic"),e("Користувач","user.legalAddress.cityCode","Юридична адреса: індекс","Поштовий індекс юридичної адреси","01001","text","none"),e("Користувач","user.legalAddress.street","Юридична адреса: вулиця","Вулиця юридичної адреси","Хрещатик","text","generic"),e("Користувач","user.legalAddress.building","Юридична адреса: будинок","Будинок юридичної адреси","1","text","none"),e("Користувач","user.legalAddress.apartment","Юридична адреса: офіс / квартира","Квартира або офіс юридичної адреси","5","text","none"),e("Користувач","user.legalAddress.unit","Юридична адреса: приміщення","Квартира, офіс або приміщення юридичної адреси","5","text","none",{token:"user.legalAddress.apartment"}),e("Користувач","user.actualSameAsLegal","Фактична адреса збігається з юридичною","Ознака, що фактична адреса збігається з юридичною","Так","text","generic"),e("Користувач","user.actualAddress","Фактична адреса","Повна фактична адреса з профілю","м. Київ, вул. Січових Стрільців, 15, кв. 8","text","generic"),e("Користувач","user.actualAddress.region","Фактична адреса: область","Область фактичної адреси","Київська область","text","generic"),e("Користувач","user.actualAddress.city","Фактична адреса: місто","Місто фактичної адреси","Київ","text","generic"),e("Користувач","user.actualAddress.cityCode","Фактична адреса: індекс","Поштовий індекс фактичної адреси","04053","text","none"),e("Користувач","user.actualAddress.street","Фактична адреса: вулиця","Вулиця фактичної адреси","Січових Стрільців","text","generic"),e("Користувач","user.actualAddress.building","Фактична адреса: будинок","Будинок фактичної адреси","15","text","none"),e("Користувач","user.actualAddress.apartment","Фактична адреса: офіс / квартира","Квартира або офіс фактичної адреси","8","text","none"),e("Користувач","user.actualAddress.unit","Фактична адреса: приміщення","Квартира, офіс або приміщення фактичної адреси","8","text","none",{token:"user.actualAddress.apartment"}),e("Користувач","user.additionalAddresses","Додаткові адреси","Усі додаткові адреси користувача одним списком","м. Київ, вул. Саксаганського, 12; м. Львів, вул. Шевченка, 8","text","generic"),e("Користувач","user.director.sameAsUser","Керівник = користувач","Чи збігаються дані керівника з даними користувача","Так","text","generic"),e("Користувач","user.director.fullName","ПІБ керівника","ПІБ керівника з профілю","Іваненко Іван Іванович","text","person"),e("Користувач","user.director.fullNameGenitive","ПІБ керівника в родовому відмінку","ПІБ керівника з автоматичним переведенням у родовий відмінок","Іваненка Івана Івановича","text","person",{token:"user.director.fullName",defaultCaseMode:"genitive"}),e("Користувач","user.director.firstName","Ім'я керівника","Ім'я керівника","Іван","text","person"),e("Користувач","user.director.lastName","Прізвище керівника","Прізвище керівника","Іваненко","text","person"),e("Користувач","user.director.middleName","По батькові керівника","По батькові керівника","Іванович","text","person"),e("Користувач","user.director.position","Посада керівника","Посада керівника з профілю","Директор","text","generic"),e("Користувач","user.director.positionGenitive","Посада керівника в родовому відмінку","Посада керівника з автоматичним переведенням у родовий відмінок","Директора","text","generic",{token:"user.director.position",defaultCaseMode:"genitive"}),e("Користувач","user.director.actingBasis","Підстава дії керівника","На підставі чого діє керівник","Статут","text","generic"),e("Користувач","user.certificateNumber","Номер свідоцтва","Номер свідоцтва або посвідчення","№ 5821","text","none"),e("Користувач","user.certificateDate","Дата видачі","Дата видачі свідоцтва або посвідчення","20 травня 2018","date","none"),e("Користувач","user.issuedBy","Ким видано","Орган, що видав документ","Рада адвокатів міста Києва","text","generic"),e("Користувач","user.registryNumber","Номер запису ЄДР","Реєстровий номер з профілю","RAU-000123","text","none"),e("Користувач","user.registryDate","Дата запису ЄДР","Дата внесення до реєстру","11 березня 2019","date","none"),e("Користувач","user.contractNumber","Номер контракту","Номер контракту з профілю","ДГ-15/24","text","none"),e("Користувач","user.contractWith","З ким контракт","Контрагент за контрактом","АО Право і Порядок","text","generic")],i=[e("Клієнт","client.number","Номер клієнта","Внутрішній номер клієнта","CL-2026-0018","text","none"),e("Клієнт","client.type","Тип клієнта","ФО, ФОП або юридична особа","Фізична особа","text","generic"),e("Клієнт","client.registrationDate","Дата додавання","Дата додавання клієнта з форми",d(k),"date","none"),e("Клієнт","client.displayName","Клієнт","ПІБ або назва клієнта","Петренко Петро Петрович","text","person"),e("Клієнт","client.firstName","Ім'я","Ім'я клієнта","Петро","text","person"),e("Клієнт","client.lastName","Прізвище","Прізвище клієнта","Петренко","text","person"),e("Клієнт","client.patronymic","По батькові","По батькові клієнта","Петрович","text","person"),e("Клієнт","client.birthDate","Дата народження","Дата народження клієнта",d(y),"date","none"),e("Клієнт","client.companyName","Назва компанії","Назва юрособи або ФОП","ТОВ Юрклієнт","text","none"),e("Клієнт","client.companyForm","Орг.-правова форма","Організаційно-правова форма юрособи","ТОВ","text","none"),e("Клієнт","client.edrpou","ЄДРПОУ","Код ЄДРПОУ","12345678","text","none"),e("Клієнт","client.inn","ІПН / РНОКПП","Податковий номер клієнта","1234567890","text","none"),e("Клієнт","client.passportNumber","Паспорт","Серія та номер паспорта клієнта","АА 123456","text","none"),e("Клієнт","client.phone","Телефон","Основний телефон клієнта","+380 50 123 45 67","text","none"),e("Клієнт","client.additionalPhones","Додаткові телефони","Усі додаткові телефони клієнта","+380 67 000 00 01, +380 67 000 00 02","text","none"),e("Клієнт","client.email","Email","Основний email клієнта","client@example.ua","text","none"),e("Клієнт","client.additionalEmails","Додаткові email","Усі додаткові email клієнта","office@example.ua, billing@example.ua","text","none"),e("Клієнт","client.whatsapp","WhatsApp","WhatsApp клієнта","+380 50 123 45 67","text","none"),e("Клієнт","client.viber","Viber","Viber клієнта","+380 50 123 45 67","text","none"),e("Клієнт","client.skype","Skype","Skype клієнта","live:client.legal","text","none"),e("Клієнт","client.telegram","Telegram","Telegram клієнта","@client_legal","text","none"),e("Клієнт","client.registrationAddress","Адреса реєстрації / юридична адреса","Повна адреса реєстрації або юридична адреса","м. Київ, вул. Хрещатик, 1, кв. 10","text","generic"),e("Клієнт","client.registrationRegion","Область реєстрації","Область адреси реєстрації або юридичної адреси","Київська область","text","generic"),e("Клієнт","client.registrationCity","Місто реєстрації","Місто адреси реєстрації або юридичної адреси","Київ","text","generic"),e("Клієнт","client.registrationPostalCode","Індекс реєстрації","Поштовий індекс адреси реєстрації або юридичної адреси","01001","text","none"),e("Клієнт","client.actualSameAsRegistration","Фактична адреса збігається з адресою реєстрації","Ознака, що фактична адреса збігається з адресою реєстрації","Так","text","generic"),e("Клієнт","client.actualAddress","Фактична адреса","Повна фактична адреса клієнта","м. Львів, вул. Шевченка, 5","text","generic"),e("Клієнт","client.actualRegion","Фактична область","Область фактичної адреси","Львівська область","text","generic"),e("Клієнт","client.actualCity","Фактичне місто","Місто фактичної адреси","Львів","text","generic"),e("Клієнт","client.actualPostalCode","Фактичний індекс","Поштовий індекс фактичної адреси","79000","text","none"),e("Клієнт","client.taxationForm","Форма оподаткування","Форма оподаткування ФОП або юрособи","Спрощена система","text","generic"),e("Клієнт","client.taxationBasis","Підстава діяльності","Підстава діяльності ФОП або підписанта","Виписка з ЄДР","text","generic"),e("Клієнт","client.contactPerson.fullName","Контактна особа","ПІБ контактної особи юрособи","Савченко Марина Олегівна","text","person"),e("Клієнт","client.contactPerson.firstName","Ім'я контактної особи","Ім'я контактної особи","Марина","text","person"),e("Клієнт","client.contactPerson.lastName","Прізвище контактної особи","Прізвище контактної особи","Савченко","text","person"),e("Клієнт","client.contactPerson.middleName","По батькові контактної особи","По батькові контактної особи","Олегівна","text","person"),e("Клієнт","client.contactPerson.position","Посада контактної особи","Посада контактної особи","Юрисконсульт","text","generic"),e("Клієнт","client.contactPerson.phone","Телефон контактної особи","Основний номер контактної особи","+380 67 555 44 33","text","none"),e("Клієнт","client.contactPerson.additionalPhones","Додаткові телефони контактної особи","Усі додаткові телефони контактної особи","+380 67 555 44 34, +380 67 555 44 35","text","none"),e("Клієнт","client.contactPerson.email","Email контактної особи","Основний email контактної особи","contact@example.ua","text","none"),e("Клієнт","client.contactPerson.additionalEmails","Додаткові email контактної особи","Усі додаткові email контактної особи","assistant@example.ua, legal@example.ua","text","none"),e("Клієнт","client.contactPerson.whatsapp","WhatsApp контактної особи","WhatsApp контактної особи","+380 67 555 44 33","text","none"),e("Клієнт","client.contactPerson.viber","Viber контактної особи","Viber контактної особи","+380 67 555 44 33","text","none"),e("Клієнт","client.contactPerson.skype","Skype контактної особи","Skype контактної особи","live:contact.person","text","none"),e("Клієнт","client.contactPerson.telegram","Telegram контактної особи","Telegram контактної особи","@contact_person","text","none"),e("Клієнт","client.director.fullName","ПІБ керівника","ПІБ керівника або підписанта","Іваненко Ігор Петрович","text","person"),e("Клієнт","client.director.fullNameGenitive","ПІБ керівника в родовому відмінку","ПІБ керівника з автоматичним переведенням у родовий відмінок","Іваненка Ігоря Петровича","text","person",{token:"client.director.fullName",defaultCaseMode:"genitive"}),e("Клієнт","client.director.firstName","Ім'я керівника","Ім'я керівника або підписанта","Ігор","text","person"),e("Клієнт","client.director.lastName","Прізвище керівника","Прізвище керівника або підписанта","Іваненко","text","person"),e("Клієнт","client.director.middleName","По батькові керівника","По батькові керівника або підписанта","Петрович","text","person"),e("Клієнт","client.director.position","Посада керівника","Посада керівника або підписанта","Директор","text","generic"),e("Клієнт","client.director.positionGenitive","Посада керівника в родовому відмінку","Посада керівника з автоматичним переведенням у родовий відмінок","Директора","text","generic",{token:"client.director.position",defaultCaseMode:"genitive"}),e("Клієнт","client.director.actingBasis","Підстава підпису","На підставі чого діє керівник або підписант","Статут","text","generic"),e("Клієнт","client.bankName","Банк","Назва банку клієнта","ПриватБанк","text","generic"),e("Клієнт","client.bankMfo","МФО","Банківський МФО клієнта","305299","text","none"),e("Клієнт","client.bankIban","IBAN","Банківський рахунок клієнта","UA123456789012345678901234567","text","none"),e("Клієнт","client.comment","Коментар","Коментар до клієнта","Працює через контактну особу, договір підписує директор.","text","generic")],n=[e("Справа","case.startDate","Дата додавання справи","Дата, вказана у формі створення або редагування справи",d(w),"date","none"),e("Справа","case.title","Суть справи","Коротка назва або суть справи","Стягнення заборгованості","text","generic"),e("Справа","case.number","Номер справи","Внутрішній номер справи","CASE-2026-0015","text","none"),e("Справа","case.type","Категорія справи","Категорія справи з форми","Цивільна","text","generic"),e("Справа","case.priority","Пріоритет","Пріоритет справи","Високий","text","generic"),e("Справа","case.courtName","Назва установи","Назва суду або іншої установи","Шевченківський районний суд м. Києва","text","generic"),e("Справа","case.courtAddress","Адреса установи","Адреса суду або іншої установи","м. Київ, вул. Дегтярівська, 31-А","text","generic"),e("Справа","case.registryNumber","Номер справи в реєстрі","Номер справи в державному реєстрі","761/12345/26","text","none"),e("Справа","case.judgeName","Особа, у веденні якої справа","ПІБ судді або іншої відповідальної особи","Коваленко Олена Ігорівна","text","person"),e("Справа","case.proceedingStage","Стадія розгляду","Поточна стадія розгляду справи","Підготовче провадження","text","generic"),e("Справа","case.description","Опис справи","Детальний опис справи","Позов про стягнення заборгованості за договором поставки.","text","generic"),e("Справа","case.participantsSummary","Учасники справи","Усі учасники справи одним списком","Позивач: Петренко Петро Петрович; Відповідач: ТОВ Контрагент","text","generic"),e("Справа","case.firstParticipantName","Перший учасник","Найменування або ПІБ першого учасника","Петренко Петро Петрович","text","person"),e("Справа","case.firstParticipantRole","Роль першого учасника","Роль першого учасника у справі","Позивач","text","generic"),e("Справа","case.plaintiffName","Позивач","ПІБ або назва позивача","Петренко Петро Петрович","text","person"),e("Справа","case.defendantName","Відповідач","ПІБ або назва відповідача","ТОВ Контрагент","text","person")],l=[e("Розрахунок","calculation.name","Назва розрахунку","Назва розрахунку","Прибуткова операція","text","generic"),e("Розрахунок","calculation.date","Дата розрахунку","Дата розрахунку з форми","11 березня 2026","date","none"),e("Розрахунок","calculation.dueDate","Строк оплати","Строк оплати з форми розрахунку","18 березня 2026","date","none"),e("Розрахунок","calculation.subjectType","Суб'єкт","Обраний суб'єкт розрахунку","Клієнт","text","generic"),e("Розрахунок","calculation.description","Опис","Опис призначення розрахунку","Розрахунок по договору правничої допомоги.","text","generic"),e("Розрахунок","calculation.internalNotes","Службові примітки","Внутрішні коментарі до розрахунку","Оплату очікуємо після погодження клієнтом.","text","generic"),e("Розрахунок","calculation.totalAmount","Загалом","Підсумкова сума розрахунку","1 200,00 грн","currency","none"),e("Розрахунок","calculation.totalAmountWords","Загалом прописом","Підсумкова сума розрахунку текстом","одна тисяча двісті грн 00 коп","text","generic"),e("Розрахунок","calculation.selectedTable","Таблиця послуг розрахунку","Готова таблиця рядків розрахунку для актів, рахунків та додатків","№ | Назва послуги | кількість | од. виміру | сума","text","none",{renderMode:"table"})],a=[e("Подія","event.title","Назва події","Назва події або засідання","Підготовче судове засідання","text","generic"),e("Подія","event.type","Тип події","Тип календарної події","Засідання","text","generic"),e("Подія","event.date","Дата події","Дата події","25 березня 2026","date","none"),e("Подія","event.time","Час події","Час початку події","14:30","text","none"),e("Подія","event.dateTime","Дата і час","Дата та час початку події","25.03.2026, 14:30","date","none"),e("Подія","event.endDate","Дата завершення","Дата завершення для події типу 'від і до'","25 березня 2026","date","none"),e("Подія","event.endTime","Час завершення","Час завершення події","16:00","text","none"),e("Подія","event.isAllDay","Подія на весь день","Ознака події на весь день","Так","text","generic"),e("Подія","event.location","Місце події","Локація або адреса події","м. Київ, вул. Дегтярівська, 31-А","text","generic"),e("Подія","event.courtRoom","Зала / кабінет","Номер залу або кабінету","Зал № 12","text","generic"),e("Подія","event.responsibleContact","Контакти відповідальної особи","ПІБ, телефон або email відповідальної особи","Іваненко Іван Іванович, +380671234567","text","generic"),e("Подія","event.judgeName","Суддя / контакт","Суддя або контакт із форми події","Коваленко Олена Ігорівна","text","person"),e("Подія","event.reminderValue","Нагадати за","Числове значення нагадування","1","number","none"),e("Подія","event.reminderUnit","Одиниця нагадування","Хвилини, години, дні або тижні","днів","text","generic"),e("Подія","event.isRecurring","Повторювана подія","Ознака повторюваної події","Так","text","generic"),e("Подія","event.recurrencePattern","Повторювати","Схема повторення події","Щотижня","text","generic"),e("Подія","event.recurrenceInterval","Інтервал повтору","Числовий інтервал повторення","1","number","none"),e("Подія","event.recurrenceEndDate","Повтор до","Дата завершення повтору","30 квітня 2026","date","none"),e("Подія","event.description","Опис","Опис події з форми","Коротко опишіть зміст події","text","generic")];return[{id:"user",label:"Користувач",description:"Поля з профілю користувача та картки юрособи / ФОП",variables:r},{id:"client",label:"Клієнт",description:"Поля з форми створення / редагування клієнта",variables:i},{id:"case",label:"Справа",description:"Поля з форми створення / редагування справи",variables:n},{id:"calculation",label:"Розрахунок",description:"Поля з форми створення / редагування розрахунку",variables:l},{id:"event",label:"Подія",description:"Поля з форми створення / редагування події",variables:a},{id:"system",label:"Система",description:"Службові значення, що підставляються автоматично",variables:[e("Система","system.today","Сьогодні","Поточна дата",d(t),"date","none"),e("Система","system.now","Дата і час","Поточна дата та час",f(t),"date","none")]}]},N=(t,r)=>{var c;const i=t.trim();if(!i||r==="none"||/^[A-Z0-9._-]+$/i.test(i)&&!/[А-Яа-яІіЇїЄєҐґ]/.test(i))return t;const n=i.toLowerCase(),l=i[0]===((c=i[0])==null?void 0:c.toUpperCase()),a=o=>l?o[0].toUpperCase()+o.slice(1):o;if(r==="person"){if(/(ич|ович|евич|йович|івна|ївна)$/.test(n))return a(`${n}а`);if(n.endsWith("ія"))return a(`${n.slice(0,-2)}ії`);if(n.endsWith("я"))return a(`${n.slice(0,-1)}і`);if(n.endsWith("а")){const o=n.slice(0,-1),s=o.slice(-1);return"гкхжчшщ".includes(s)?a(`${o}і`):a(`${o}и`)}if(n.endsWith("ій"))return a(`${n.slice(0,-2)}ія`);if(n.endsWith("ий"))return a(`${n.slice(0,-2)}ого`);if(n.endsWith("й"))return a(`${n.slice(0,-1)}я`);if(/[бвгґджзклмнпрстфхцчшщ]$/.test(n))return a(`${n}а`)}if(r==="generic"){if(n.endsWith("ія"))return a(`${n.slice(0,-2)}ії`);if(n.endsWith("я"))return a(`${n.slice(0,-1)}і`);if(n.endsWith("а")){const o=n.slice(0,-1);return a(`${o}и`)}if(n.endsWith("ь"))return a(`${n.slice(0,-1)}я`);if(/[бвгґджзклмнпрстфхцчшщ]$/.test(n))return a(`${n}у`)}return t},P=(t,r)=>!t||r==="none"?t:t.replace(/[A-Za-zА-Яа-яІіЇїЄєҐґ'’-]+/g,i=>N(i,r)),T=t=>{const r=new Map;return t.forEach(i=>{i.variables.forEach(n=>{r.set(n.id,n)})}),r},p=(t,r=t.defaultCaseMode==="genitive")=>`{{${t.token}${r?"|genitive":""}}}`,E=(t,r=t.defaultCaseMode==="genitive")=>{const i=p(t,r);return t.renderMode==="table"?`
      <div class="template-token-table mceNonEditable" contenteditable="false" data-token-id="${t.id}" data-case-mode="${r?"genitive":"default"}">
        <div class="template-token-table-caption">${i}</div>
        <table>
          <colgroup>
            <col style="width: 7%;" />
            <col style="width: 51%;" />
            <col style="width: 13%;" />
            <col style="width: 14%;" />
            <col style="width: 15%;" />
          </colgroup>
          <thead>
            <tr>
              <th>№</th>
              <th>Назва послуги</th>
              <th>Кількість</th>
              <th>Тип обліку</th>
              <th>Сума</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5" class="template-token-table-placeholder">
                Рядки таблиці будуть підставлені з обраного розрахунку під час формування документа
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p></p>
    `:`<span class="template-token mceNonEditable" contenteditable="false" data-token-id="${t.id}" data-case-mode="${r?"genitive":"default"}">${i}</span>&nbsp;`},M=(t,r)=>{if(!t)return"";const l=new DOMParser().parseFromString(`<div id="template-root">${t}</div>`,"text/html").getElementById("template-root");return l?(l.querySelectorAll("*").forEach(a=>{[...a.attributes].forEach(c=>{c.name.startsWith("data-mce-")&&a.removeAttribute(c.name)})}),l.querySelectorAll(".template-token").forEach(a=>{const c=a.dataset.tokenId||"",o=r.get(c),s=a.dataset.caseMode==="genitive";a.className="template-token",a.setAttribute("contenteditable","false"),a.textContent=o?p(o,s):a.textContent||""}),l.querySelectorAll(".template-token-table").forEach(a=>{const c=a.dataset.tokenId||"",o=r.get(c),s=a.dataset.caseMode==="genitive",m=o?p(o,s):a.textContent||"";a.className="template-token-table",a.setAttribute("contenteditable","false"),a.innerHTML=`
      <div class="template-token-table-caption">${m}</div>
      <table>
        <colgroup>
          <col style="width: 7%;" />
          <col style="width: 51%;" />
          <col style="width: 13%;" />
          <col style="width: 14%;" />
          <col style="width: 15%;" />
        </colgroup>
        <thead>
          <tr>
            <th>№</th>
            <th>Назва послуги</th>
            <th>Кількість</th>
            <th>Тип обліку</th>
            <th>Сума</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5" class="template-token-table-placeholder">
              Рядки таблиці будуть підставлені з обраного розрахунку під час формування документа
            </td>
          </tr>
        </tbody>
      </table>
    `}),l.innerHTML):t},C=(t,r)=>{if(!t)return"Без змінних";const l=new DOMParser().parseFromString(`<div id="template-root">${t}</div>`,"text/html").getElementById("template-root");if(!l)return"Без змінних";const a=[...l.querySelectorAll(".template-token"),...l.querySelectorAll(".template-token-table")];if(a.length===0)return"Без змінних";const c=new Set;a.forEach(b=>{const h=r.get(b.dataset.tokenId||"");h&&c.add(h.group)});const o=[...c],s=o.slice(0,2).join(", "),m=o.length>2?` +${o.length-2}`:"";return`${a.length} змінн. • ${s}${m}`},D=(t,r,i=u)=>{const n=g(i),l=x(n);return`<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${t}</title>
    <style>
      :root {
        color-scheme: light;
      }

      @page {
        size: ${l.pageSizeRule};
        margin: ${l.marginShorthand};
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f4f7fb;
        color: #162033;
        font-family: "Golos Text", sans-serif;
      }

      .page-shell {
        width: ${l.pageWidth};
        min-height: ${l.pageHeight};
        margin: 0 auto;
        padding: ${l.marginShorthand};
        background: #ffffff;
        box-shadow: 0 16px 34px rgba(16, 25, 38, 0.08);
      }

      .document-body {
        font-family: ${l.fontFamily};
        font-size: ${n.fontSizePt}pt;
        line-height: ${n.lineHeight};
        color: #111827;
        word-break: normal;
        overflow-wrap: normal;
        hyphens: none;
      }

      .document-body p {
        margin: 0 0 0.9rem;
      }

      .document-body ul,
      .document-body ol {
        margin: 0 0 1rem 1.5rem;
      }

      .document-body h1,
      .document-body h2,
      .document-body h3 {
        margin: 0 0 1rem;
        font-weight: 700;
      }

      .template-token {
        display: inline-block;
        padding: 0.08rem 0.3rem;
        border: 1px solid rgba(44, 95, 178, 0.18);
        border-radius: 0.35rem;
        background: rgba(61, 118, 209, 0.06);
        color: #2c5fb2;
        font-family: "SFMono-Regular", "JetBrains Mono", monospace;
        font-size: 10pt;
      }

      .template-token-table {
        margin: 0 0 1rem;
        border: 1px solid rgba(44, 95, 178, 0.16);
        border-radius: 0.45rem;
        overflow: hidden;
        background: rgba(61, 118, 209, 0.03);
      }

      .template-token-table-caption {
        padding: 0.45rem 0.65rem;
        border-bottom: 1px solid rgba(44, 95, 178, 0.14);
        background: rgba(61, 118, 209, 0.07);
        color: #2c5fb2;
        font-family: "SFMono-Regular", "JetBrains Mono", monospace;
        font-size: 10pt;
        font-weight: 600;
      }

      .template-token-table table {
        margin: 0;
        background: #ffffff;
      }

      .template-token-table-placeholder {
        padding: 0.8rem 0.9rem;
        color: #5b677a;
        font-style: italic;
        text-align: center;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      td,
      th {
        border: 1px solid #d6deea;
        padding: 0.45rem 0.6rem;
        vertical-align: top;
        white-space: normal;
        word-break: normal;
        overflow-wrap: break-word;
        hyphens: auto;
      }

      th {
        white-space: nowrap;
      }

      th:first-child,
      td:first-child {
        width: 6.5%;
      }

      th:nth-child(2),
      td:nth-child(2) {
        width: 51.5%;
      }

      th:nth-child(3),
      td:nth-child(3) {
        width: 13%;
      }

      th:nth-child(4),
      td:nth-child(4) {
        width: 14%;
      }

      th:nth-child(5),
      td:nth-child(5) {
        width: 15%;
      }

      td:nth-child(1),
      td:nth-child(3),
      td:nth-child(4),
      td:nth-child(5),
      th:nth-child(1),
      th:nth-child(3),
      th:nth-child(4),
      th:nth-child(5) {
        text-align: center;
      }

      td:nth-child(2) {
        text-align: left;
      }

      @media print {
        body {
          background: #ffffff;
        }

        .page-shell {
          box-shadow: none;
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="page-shell">
      <div class="document-body">${r}</div>
    </main>
  </body>
</html>`};export{u as D,$ as a,D as b,S as c,p as d,M as e,E as f,T as g,C as s,P as t};
