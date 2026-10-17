# Нагадування: що треба налаштувати один раз

Код уже в репозиторії. Щоб сповіщення справді приходили **із закритим
браузером**, лишилось три кроки — усі на твоєму боці, бо це секрети.

---

## 1. Таблиця в Supabase

У Supabase → SQL Editor виконай хвіст `lib/supabase/schema.sql`
(блок «push-нагадування»): створює таблицю `push_subs` і політику RLS.

## 2. Ключі й змінні середовища

Згенеруй пару VAPID — це підпис, яким браузер перевіряє, що push справді
від тебе:

```
npx web-push generate-vapid-keys
```

У Vercel → Settings → Environment Variables додай:

| Змінна | Звідки взяти |
| --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | публічний ключ із команди вище |
| `VAPID_PUBLIC_KEY` | той самий публічний ключ |
| `VAPID_PRIVATE_KEY` | приватний ключ (нікому не показуй) |
| `VAPID_SUBJECT` | `mailto:self.farm.game@gmail.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` |
| `CRON_SECRET` | `openssl rand -hex 32` |

`service_role` і `VAPID_PRIVATE_KEY` **без** префікса `NEXT_PUBLIC_` —
інакше вони потраплять у код сторінки, який бачить кожен.

## 3. Планувальник

`/api/push/send` сам вираховує, кому зараз час: у кожної підписки свій
час і свій часовий пояс. Планувальнику треба лише стукати туди регулярно.

Запит:

```
POST https://<твій-домен>/api/push/send
Authorization: Bearer <CRON_SECRET>
```

Три варіанти, від кращого:

**Supabase Cron** — безкоштовно, точність до хвилини. У Supabase →
SQL Editor:

```sql
select cron.schedule(
  'self-farm-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://<твій-домен>/api/push/send',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    )
  );
  $$
);
```

**GitHub Actions** — теж безкоштовно, але запуск буває на 5–15 хв пізніше.

**Vercel Cron** — найпростіше вписати, але на тарифі Hobby це **один
раз на добу** з похибкою до години, тож для двох нагадувань на день не
годиться. На Pro — раз на хвилину, і тоді досить `vercel.json`:

```json
{ "crons": [{ "path": "/api/push/send", "schedule": "*/5 * * * *" }] }
```

Vercel сам підставляє `Authorization: Bearer $CRON_SECRET`, окремо
нічого вписувати не треба.

---

## Перевірка

```
curl -X POST https://<домен>/api/push/send -H "Authorization: Bearer <CRON_SECRET>"
```

Відповідь на кшталт `{"ok":true,"checked":1,"due":0,"sent":0}` означає, що
все живе: одну підписку бачить, часу слати ще не настав.

## Чого очікувати на пристроях

| | Із закритим браузером |
| --- | --- |
| Chrome, Edge, Firefox на компʼютері | так, поки браузер запущений у фоні |
| Android | так |
| iPhone / iPad | **лише** якщо гру додано на головний екран (Поділитись → «На екран «Додому»») і нагадування увімкнені вже звідти |

Це обмеження Apple, не наше: у звичайній вкладці Safari push недоступний
узагалі. Гра це розпізнає й показує підказку замість того, щоб мовчки
не працювати.

Якщо push не налаштований (немає ключів), нагадування не зникають — вони
працюють старим способом, поки відкрита вкладка, і вікно в Хатині про це
прямо каже.
