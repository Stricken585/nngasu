// Токен сессии лежит в sessionStorage: он свой у каждой вкладки (в отличие от
// cookie), поэтому в разных вкладках можно сидеть под разными профилями.
// Перезагрузка вкладки сессию сохраняет, закрытие — нет.
const KEY = 'access_token'

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(KEY, token)
    else sessionStorage.removeItem(KEY)
  } catch {
    // хранилище недоступно (приватный режим и т.п.) — сессия живёт до перезагрузки
  }
}
