<x-mail::message>
# Sikeres Regisztráció

Szia {{ $userName }},

Sikeresen regisztráltak a rendszerbe. Az alábbi adatokkal tudsz bejelentkezni:

**Felhasználói kód:** `{{ $userCode }}`
**Jelszó:** `{{ $userPassword }}`

Javasoljuk, hogy az első bejelentkezés után változtasd meg a jelszavadat a profilodban.

<x-mail::button :url="$loginUrl">
Bejelentkezés
</x-mail::button>

Üdvözlettel,<br>
{{ config('app.name') }}
</x-mail::message>
