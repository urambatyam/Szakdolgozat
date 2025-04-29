<x-mail::message>
# **Tisztelt {{$username}},
##  Jegy beírás történt!

A {{$courseName}} kurzusban frisiteték az Ön osztályzatát {{$grade}}-re.

Üdvözlettel,<br>
{{ config('app.name') }}
</x-mail::message>
