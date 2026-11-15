# Коммиты из VS Code под двумя GitHub-аккаунтами

Один общий репозиторий, две папки, два аккаунта, доступ по SSH-ключам.
Всё делается в VS Code 1.145 (установлен в `G:\Microsoft VS Code`).

> **Без SSH?** Смотрите [`GIT-HTTPS.md`](GIT-HTTPS.md) — то же самое на токенах.

Дальше `OWNER` — логин того, кто создаёт репозиторий (owner), `K` и `M` — ваши логины.

---

## Шаг 0. Создать репозиторий и добавить соавтора

На github.com под аккаунтом **K**:

1. **New repository** → имя `nuvio` → **Private** → **Create**.
2. Ничего не инициализировать (без README, без .gitignore) — иначе при первом push будет конфликт.
3. Settings → Collaborators → **Add people** → ввести логин **M** → M принимает приглашение на почту.

## Шаг 1. Два SSH-ключа

Откройте в VS Code терминал (**Terminal → New Terminal**, `` Ctrl+` ``) и выполните:

```powershell
ssh-keygen -t ed25519 -C "k@example.com" -f "$env:USERPROFILE\.ssh\id_k"
ssh-keygen -t ed25519 -C "m@example.com"  -f "$env:USERPROFILE\.ssh\id_m"
```

`-C` — это email аккаунта. Парольную фразу (passphrase) можно оставить пустой: ключ лежит
в личной папке Windows, а с ней VS Code работает без лишних запросов.

Файлы появятся в `C:\Users\Maksim\.ssh\`: `id_k`, `id_k.pub`, `id_m`, `id_m.pub`.

## Шаг 2. Добавить публичные ключи на GitHub

Покажите ключ и скопируйте целиком (одна строка):

```powershell
Get-Content "$env:USERPROFILE\.ssh\id_k.pub"
```

На github.com: **Settings → SSH and GPG keys → New SSH key** → Title `nuvio-K` → вставить → Add.

Повторите для `id_m.pub` **под аккаунтом M** (Title `nuvio-M`).

> Публичный ключ можно показывать кому угодно. Приватный (`id_k`, `id_m`, без `.pub`) — никогда не копировать и не коммитить.

## Шаг 3. Псевдонимы хостов

Без этого SSH отдаёт GitHub первый подходящий ключ, и вы пушите не под тем аккаунтом.

Создайте файл `C:\Users\Maksim\.ssh\config` (без расширения) с содержимым:

```sshconfig
Host github-k
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_k
    IdentitiesOnly yes

Host github-m
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_m
    IdentitiesOnly yes
```

`IdentitiesOnly yes` — ключевая строка: она запрещает подставлять другие ключи.

## Шаг 4. Проверить оба аккаунта

```powershell
ssh -T git@github-k
ssh -T git@github-m
```

Ожидаемый ответ: `Hi <логин>! You've successfully authenticated...`
Если логин не тот — вернитесь к шагу 3.

При первом подключении спросит `Are you sure you want to continue connecting?` — ответьте `yes`.

---

## Шаг 5. Папка K — первый коммит и push

В VS Code: **File → Open Folder** → `C:\Users\Maksim\Desktop\nuvio к`
Терминал (**Terminal → New Terminal**) — он откроется уже в этой папке:

```powershell
git init
git branch -M main

# локальная подпись — только для этого репозитория
git config user.name "K"
git config user.email "k@example.com"

git add .
git commit -m "[К] первый коммит: проект, контракт API, документация"
git remote add origin git@github-k:OWNER/nuvio.git
git push -u origin main
```

`git config` **без** `--global` — подпись applies только к этой папке. Если пропустить,
коммиты уйдут под `mak5m-pgn` из глобального конфига, и история перепутается.

## Шаг 6. Папка M — подключиться к тому же репозиторию

Важно: M **не** делает `git init` со своим коммитом — иначе получится вторая,
несвязанная история и слить её будет больно.

В VS Code откройте `C:\Users\Maksim\Desktop\nuvio м`, в терминале:

```powershell
git init

git config user.name "M"
git config user.email "m@example.com"

git remote add origin git@github-m:OWNER/nuvio.git
git fetch origin
git reset --hard origin/main
```

Папка уже содержит те же файлы, поэтому `reset --hard` просто свяжет её с историей
репозитория, ничего не перезаписав. Проверьте, что лишнего нет:

```powershell
git status
```

Должно быть `nothing to commit, working tree clean`.

---

## Дальше — работа через панель VS Code

1. Правите файлы своей зоны.
2. **Source Control** (`` Ctrl+Shift+G ``) → в списке изменений проверить, что нет чужих файлов.
3. Ввести сообщение: `[К] каталог: фильтр через сервер` → нажать **✓ Commit**.
4. **Sync Changes** (кнопка со стрелками) или в терминале `git push`.

Перед началом работы оба делают **Sync Changes** / `git pull --rebase`, чтобы не разойтись.

## Ежедневная проверка «под тем ли аккаунтом»

```powershell
git config user.email
git log -1 --format='%an <%ae>'
```

Первая строка — кем будете коммитить, вторая — кем был последний коммит.

---

## Грабли, на которые легко попасть

**VS Code предлагает войти в GitHub.** Панель Accounts внизу слева и расширение
«GitHub Pull Requests» умеют логинить один аккаунт на всё приложение. Для двух аккаунтов
это только мешает: не входите через них, работайте с SSH-адресами (`git@github-k:...`).
Тогда токены вообще не участвуют.

**Push идёт под чужим аккаунтом.** Значит, ключ подобран неверно или нет `IdentitiesOnly yes`
в `~/.ssh/config`. Проверка — `ssh -T git@github-k`.

**`remote: Permission to ... denied`.** Аккаунт M не принял приглашение соавтора,
либо в адресе удалёнки стоит `github.com` вместо `github-m`.

**Файлы `.env` попали в коммит.** `.gitignore` их уже исключает, но проверьте список
изменений в Source Control перед коммитом — ключи и токены в историю попадать не должны.

**Оба правят один файл из блока «К+М».** Это единственный реальный источник конфликтов.
Договоритесь: такие правки — отдельным коммитом `[К+М] ...`, второй сразу забирает через Sync.
