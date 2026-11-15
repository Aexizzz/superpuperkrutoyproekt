# Коммиты под двумя аккаунтами без SSH (HTTPS + токены)

Альтернатива [`GIT.md`](GIT.md). Тот же результат, но вместо ключей — Personal Access Token
и уже установленный Git Credential Manager 2.9.1.

## Почему это сложнее, чем с SSH

С SSH ключ выбирается по адресу: `git@github-k:...` или `git@github-m:...` — два «входа» в один хост.
С HTTPS хост всегда один и тот же (`github.com`), поэтому git по умолчанию не понимает,
под каким аккаунтом пушить, и берёт первый сохранённый токен.

**На вашей машине это уже так:** в Credential Manager сохранён аккаунт `mak5m-pgn`,
и без настройки **оба** пуша пойдут под ним.

Решение — указать имя пользователя прямо в адресе удалёнки:

```
https://K@github.com/OWNER/nuvio.git
https://M@github.com/OWNER/nuvio.git
```

Git передаёт `K` и `M` помощнику, и тот находит нужный токен.
Проверено на вашей установке: для `username=mak5m-pgn` GCM отдаёт токен, для неизвестного
пользователя — не отдаёт чужой, а ждёт входа.

---

## Шаг 1. Создать два токена

На github.com под **каждым** аккаунтом: Settings → Developer settings →
**Personal access tokens → Tokens (classic)** → Generate new token (classic).

- Note: `nuvio-K` (и `nuvio-M`)
- Expiration: 90 дней или больше
- Scopes: обязательно **`repo`** (даёт push в приватные репозитории)

Скопируйте токен — он показывается один раз.

> Аккаунт не появился в настройках? Значит, вы вошли не под ним. Переключите аккаунт
> в правом верхнем углу github.com и повторите.

## Шаг 2. Запомнить токены в Windows

Вместо `K` и `M` подставьте логины. Команда сохраняет токен для конкретного пользователя:

```powershell
cmdkey /generic:git:https://K@github.com /user:K /pass:ТОКЕН_К
cmdkey /generic:git:https://M@github.com /user:M /pass:ТОКЕН_M
```

Проверить, что записалось:

```powershell
cmdkey /list | Select-String "git:https://"
```

Должно быть две записи — по одной на каждый логин.

> Если что-то пошло не так: `cmdkey /delete:git:https://K@github.com`, затем повторить.
> Токен в истории PowerShell не сохраняется, но в `cmdkey` он лежит в защищённом хранилище Windows.

## Шаг 3. Настроить git под HTTPS

Один раз глобально — чтобы помощник не пытался «угадать» аккаунт:

```powershell
git config --global credential.https://github.com.useHttpPath false
```

(Значение по умолчанию и так `false`; строка нужна, если раньше что-то меняли.)

## Шаг 4. Папка K — первый коммит

Откройте в VS Code `C:\Users\Maksim\Desktop\nuvio к`, терминал:

```powershell
git init
git branch -M main

git config user.name "K"
git config user.email "k@example.com"

git add .
git commit -m "[К] первый коммит: проект, контракт API, документация"

git remote add origin https://K@github.com/OWNER/nuvio.git
git push -u origin main
```

Токен спросят один раз — вставится автоматически из хранилища. Если Windows покажет
окно входа, выберите **Token** (не «Browser»).

## Шаг 5. Папка M — подключиться к той же истории

`git init` со своим коммитом **не делать** — получится вторая несвязанная история.

```powershell
git init

git config user.name "M"
git config user.email "m@example.com"

git remote add origin https://M@github.com/OWNER/nuvio.git
git fetch origin
git reset --hard origin/main
```

Затем `git status` — должно быть `nothing to commit, working tree clean`.

---

## Дальше — панель VS Code

Всё как обычно: **Source Control** (`` Ctrl+Shift+G ``) → сообщение `[К] ...` → **Commit** → **Sync Changes**.

Push сам подставит нужный токен, потому что логин зашит в адрес удалёнки.

## Проверка «под кем я»

```powershell
git config user.email
git remote -v
git log -1 --format='%an <%ae>'
```

`git remote -v` должен показать ваш логин в адресе: `https://K@github.com/...`.

## Грабли

**`remote: Permission to OWNER/nuvio.git denied to M`.** Токен M не имеет scope `repo`,
либо аккаунт M не принят соавтором. Проверьте: Settings → Collaborators.

**`Authentication failed` при push.** Запись в `cmdkey` создана на другой логин,
чем в адресе удалёнки. Сверьте `git remote -v` и `cmdkey /list`.

**VS Code открыл окно «Sign in to GitHub».** Нажмите Cancel и отметьте «Don't ask again»:
вход через панель Accounts перезапишет сохранённый токен на аккаунт приложения.
Работайте через терминал и Sync Changes.

**Токен истёк.** `cmdkey /delete:git:https://K@github.com`, создать новый токен, повторить шаг 2.

**Оба пушат под одним аккаунтом.** В адресе удалёнки нет логина — исправить:

```powershell
git remote set-url origin https://M@github.com/OWNER/nuvio.git
```

---

## Что выбрать

| | SSH (`GIT.md`) | HTTPS (этот гайд) |
|---|---|---|
| Настройка | ключи + `~/.ssh/config` | два токена + `cmdkey` |
| Срок жизни | ключ не истекает | токен истекает (90 дней) |
| Риск перепутать аккаунт | низкий (разные хосты) | выше (один хост) |
| Корпоративный прокси/фаервол не режет | сложнее | проще |

Для двух аккаунтов на одной машине SSH удобнее. HTTPS оправдан, если SSH блокирует
сеть или вы уже работаете с токенами.
