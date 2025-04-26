<?php

namespace App\Http\Controllers;

use App\Models\SubjectMatter;
use Illuminate\Http\Request;
/**
 * Kezeli a kurzusokhoz tartozó tárgytematikák lekérdezését és frissítését.
 */

class SubjectMatterController extends Controller
{

    /**
     * Visszaadja egy adott kurzushoz tartozó tárgytematikát.
     * Ha nem található a kurzushoz tematika, 404-es hibát dob.
     *
     * @param int $courseId Annak a kurzusnak az azonosítója, amelynek a tematikáját le szeretnénk kérni.
     * @return SubjectMatter A megtalált SubjectMatter modell példány.
     * @throws ModelNotFoundException Ha a megadott $courseId-hoz nem található SubjectMatter bejegyzés.
     */
    public function getSubjectMatterOfCourse(int $courseId)
    {
        return SubjectMatter::whereHas('course', function ($query) use ($courseId) {
            $query->where('id', $courseId);
        })->firstOrFail();
    }

    /**
     * Frissíti a megadott azonosítójú tárgytematika adatait a kérésben kapott értékekkel.
     * A frissítéshez szükség van a tematika ('id') és a kurzus ('course_id') azonosítójára is.
     *
     * @param Request $request A bejövő HTTP kérés, amely tartalmazza a frissítendő adatokat.
     * @return SubjectMatter|JsonResponse A frissített SubjectMatter modell példány, vagy hiba esetén JSON válasz.
     * @throws ValidationException Ha a validálás sikertelen.
     */
    public function update(Request $request)
    {
        $values = $request->validate([
            'id' => 'required|exists:subject_matters,id|integer',
            'course_id' => 'required|exists:courses,id|integer',
            'topic' => 'nullable|string|max:255',
            'goal' => 'nullable|string|max:255',
            'requirements' => 'nullable|string|max:255',
        ]);
        $subjectMatter = SubjectMatter::find($values['id']);
        if (!$subjectMatter) {
            return response()->json(['message' => 'A megadott azonosítóval nem található tematika.'], 404);
        }
        if ($subjectMatter->course_id != $values['course_id']) {
            return response()->json(['message' => 'A tematika nem ehhez a kurzushoz tartozik.'], 400);
       }
        $subjectMatter->update($values);
        return response()->json($subjectMatter,201);
    }
}
