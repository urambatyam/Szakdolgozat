<?php

namespace App\Http\Controllers;

use App\Models\CourseForum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
/**
 * Kezeli a kurzus forum bejgyzések lekrédeséit és műveleteit: létrehozás, lekérdezés, törlés.
 */
class CourseForumController extends Controller
{

    /**
     * Új fórumbejegyzést hoz létre a megadott kurzushoz.
     * A bejegyzést a jelenleg bejelentkezett felhasználóhoz rendeli.
     *
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse A létrehozott CourseForum modell példány, vagy hiba esetén JSON válasz.
     * @throws ValidationException Ha a validálás sikertelen.
     */

    public function store(Request $request)
    {
        $values = $request->validate([
            'course_id' => 'required|exists:courses,id|integer',
            'message' => 'required|max:255'
        ]);
        $forum = $request->user()->forums()->create($values);
        return response()->json($forum, 201);
    }

    /**
     * Visszaadja az összes fórumbejegyzést egy adott kurzushoz.
     *
     * @param int $course_id Annak a kurzusnak az azonosítója, amelynek a bejegyzéseit le szeretnénk kérni.
     * @return JsonResponse A megadott kurzushoz tartozó fórumbejegyzések kollekciója,
     * vagy üres kollekció, ha nincs találat. Hiba esetén JSON válasz.
     */
    public function show(int $course_id)
    {
        return CourseForum::whereHas('course', function ($query) use ($course_id) {
            $query->where('id', $course_id);
        })->get();
    }


    /**
     * Töröl egy adott fórumbejegyzést az azonosítója alapján.
     * Ellenőrzi, hogy a felhasználónak van-e jogosultsága törölni a bejegyzést.
     *
     * @param CourseForum $courseForum Az eltávolítandó CourseForum modell példány.
     * @return JsonResponse Sikeres törlés esetén egy üzenetet tartalmazó JSON válasz.
     * Jogosultsági hiba esetén 403 Forbidden választ ad (a Gate::authorize kezeli).
     * Ha a modell nem található , 404 Not Found választ ad.
     */
    public function destroy(CourseForum $courseForum)
    {
        $id = $courseForum->id;
        Gate::authorize('delete', CourseForum::class);

        $courseForum->delete();

        return response()->json(['message' => 'A/Az '.$id.' kurzus bejegyzés törölve lett!']);
    }
}
