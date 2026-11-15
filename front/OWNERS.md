# Разделение работы: К и М

Две папки — `nuvio к` и `nuvio м` — это два независимых рабочих каталога одного проекта.
В каждой лежит **общий каркас** плюс **только свои файлы**. Файлы зон не пересекаются,
поэтому объединение проходит без конфликтов.

| | Файлов |
|---|---|
| общий каркас (в обеих папках) | 71 |
| только в `nuvio к` | 11 |
| только в `nuvio м` | 7 |

**Важно:** приложение собирается только **после** объединения веток. В папке К нет страниц
входа, новостей и профиля, а `App.tsx` их импортирует; в папке М нет `App.tsx`. Это
сделано намеренно — так видно, что каждый делал свою часть, а не копировал чужую.

---

## Зоны

### Общий каркас — в обеих папках

Не коммитится никем в одиночку: меняется только по согласованию, отдельным коммитом.

| Группа | Файлы |
|---|---|
| Контракт данных | `src/types/index.ts` |
| Сеть и сессия | `src/api/*.ts` |
| Состояние | `src/context/AuthContext.tsx`, `CartContext.tsx` |
| Механика загрузки | `src/hooks/useAsync.ts` |
| Атомы UI | `src/components/AuthShell.tsx`, `Img.tsx`, `Icons.tsx`, `States.tsx` |
| Форматирование | `src/utils/format.ts` |
| Точка входа, стили | `src/main.tsx`, `src/styles/index.css`, `src/vite-env.d.ts` |
| Окружение | `package.json`, `tsconfig*.json`, `vite.config.ts`, `.oxlintrc.json`, `index.html`, `.gitignore`, `.gitattributes`, `.env.example` |
| Контракт и доки | `openapi.yaml`, `README.md`, `OWNERS.md`, `docs/` |
| Ресурсы | `public/` |

### К — витрина (только в `nuvio к`)

Главная, каталог, карточка товара, поиск, корзина, оформление заказа, каркас страницы.

| Файлы |
|---|
| `src/App.tsx` — маршруты всего приложения |
| `src/components/Layout.tsx`, `Header.tsx`, `Footer.tsx` |
| `src/components/ProductCard.tsx`, `CartDropdown.tsx`, `SearchModal.tsx` |
| `src/pages/Home.tsx`, `Catalog.tsx`, `Product.tsx`, `Checkout.tsx` |

### М — аккаунт и контент (только в `nuvio м`)

Вход, регистрация, профиль покупателя, админка, новости.

| Файлы |
|---|
| `src/pages/Login.tsx`, `Register.tsx` |
| `src/pages/News.tsx`, `NewsArticle.tsx` |
| `src/pages/Profile.tsx` |
| `src/pages/profile/AdminProfile.tsx`, `UserProfile.tsx` |

---

## Как собирается проект

```
        база (71 файл: контракт, типы, каркас)
                 │
      ┌──────────┴──────────┐
 ветка k/витрина       ветка m/аккаунт
   + 11 файлов            + 7 файлов
      └──────────┬──────────┘
              слияние → 89 файлов = полный проект
```

Проверено: слияние проходит **без конфликтов**, после объединения `tsc` не даёт ошибок,
`vite build` собирает `55 modules`.

---

## Порядок работы с git

Папки — не ветки, а рабочие каталоги. Ветки создаются в общем репозитории.
Настройка двух аккаунтов и коммиты из VS Code — в [`docs/GIT.md`](docs/GIT.md).

### 1. Первый коммит: база (делает один человек)

В папке `nuvio к`:

```bash
git init
git branch -M main
git config user.name "К"
git config user.email "k@example.com"

git add .
git commit -m "база: контракт API, типы, контексты, общие компоненты"

git remote add origin git@github-k:OWNER/nuvio.git
git push -u origin main
```

### 2. Каждый уходит в свою ветку

**К** — от базы:

```bash
git checkout -b k/витрина
git add -A                      # добавятся 11 файлов витрины
git commit -m "[К] витрина: каркас, шапка, подвал, корзина, поиск, страницы магазина"
git push -u origin k/витрина
```

**М** — сначала забрать базу, потом своя ветка:

```bash
git init
git config user.name "М"
git config user.email "m@example.com"
git remote add origin git@github-m:OWNER/nuvio.git
git fetch origin
git reset --hard origin/main
git checkout -b m/аккаунт
git add -A                      # добавятся 7 файлов зоны М
git commit -m "[М] аккаунт и контент: вход, регистрация, профиль, новости, админка"
git push -u origin m/аккаунт
```

### 3. Объединение

На GitHub: два Pull Request — `k/витрина → main` и `m/аккаунт → main`. Оба вливаются
без конфликтов: файлы не пересекаются.

Или из терминала в папке К:

```bash
git checkout main
git merge --no-ff k/витрина -m "слияние: витрина"
git merge --no-ff m/аккаунт -m "слияние: аккаунт и контент"
```

После слияния в обеих папках делают `git pull`, и проект собирается целиком.

---

## Дальше — ежедневная работа

```bash
git pull --rebase        # перед началом
```

Правьте только файлы своей зоны. Если нужна правка общего файла — согласуйте
и сделайте отдельный коммит `[К+М] ...`, второй забирает его через `git pull`.

## Префиксы коммитов

| Префикс | Что |
|---|---|
| `[К]` | правка витрины |
| `[М]` | правка аккаунта и контента |
| `[К+М]` | общий каркас, только по согласованию |

## Локальный запуск

```bash
npm install     # один раз: node_modules не копировались
npm run dev     # http://localhost:5173
```

Пока ветки не объединены, полный сайт не запустится — это ожидаемо. Для проверки
своей части достаточно `npx tsc --noEmit` и правки в браузере, если страница
не зависит от чужой зоны.

Если обе папки запущены одновременно, второй порт займётся автоматически (5174).
Чтобы адреса не путались:

```bash
npm run dev -- --port 5173   # в «nuvio к»
npm run dev -- --port 5174   # в «nuvio м»
```
