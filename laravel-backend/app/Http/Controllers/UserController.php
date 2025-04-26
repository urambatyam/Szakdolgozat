<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
/**
 *  Kezeli a felhasználókkal kapcsolatos CRUD műveleteket és a profiladatok (jelszó, email) módosítását.
 *  Nincs használatban
 */
class UserController extends Controller
{    
    /**
     * Visszaadja az összes regisztrált felhasználót.
     *
     * @return JsonResponse A felhasználók Eloquent kollekciója.
     */
    public function index()
    {
        return User::all();
    }
    /**
     * Visszaad egy adott felhasználót az azonosítója alapján.
     * A Route Model Binding segítségével automatikusan betölti a User modellt.
     *
     * @param User $user A lekérdezendő User modell példány (route model binding).
     * @return User A kért User modell.
     */
    public function show(User $user)
    {
        return $user;
    }
    /**
     * Frissíti egy adott felhasználó adatait a kérésben megadott értékekkel.
     * A jelszó frissítésekor a User modell automatikusan hasheli azt.
     *
     * @param Request $request A bejövő HTTP kérés, amely a frissítendő adatokat tartalmazza.
     * @param User $user A frissítendő User modell példány.
     * @return JsonResponse A frissített User modell, vagy hiba esetén JSON válasz.
     * @throws ValidationException Ha a validálás sikertelen.
     */
    public function update(Request $request, User $user)
    {
        $values = $request->validate([
            'name' => 'nullable|max:25|string',
            'email' => 'nullable|string|email|unique:users',
            'role' => 'nullable|in:student,teacher,admin',
            'password' => 'nullable'
        ]);
        $user->update($values);
        return $user;
    }
    /**
     * Megváltoztatja a felhasználó jelszavát, ha a jelenlegi jelszó helyes.
     * A User modell automatikusan hasheli az új jelszót.
     *
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse Sikeres válasz üzenettel, vagy hibaüzenet 401-es státusszal.
     * @throws ValidationException Ha a validálás sikertelen.
     */
    public function ChangePassword(Request $request)
    {
            $values = $request->validate([
                'code' => 'required|string|exists:users,code',
                'currentPassword' => 'required|string|min:6|max:12',
                'newPassword' => 'required|string|min:6|max:12',
            ]);
            $user = User::find($values['code']);
            if (!$user || !Hash::check($values['currentPassword'], $user->password)) {
                return response()->json([
                    'message' => 'Hibás felhasználói jelszó vagy kód.' 
                ], 401); 
            }
            $user->update([
                'password' => $values['newPassword']
            ]);
            return response()->json(['message' => 'A jelszó sikeresen frissítve.'], 200);
    }
    /**
     * Megváltoztatja a felhasználó email címét, ha a jelszó helyes.
     *
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse Sikeres válasz üzenettel, vagy hibaüzenet 401-es státusszal.
     * @throws ValidationException Ha a validálás sikertelen (pl. az új email már foglalt).
     */
    public function ChangeEmail(Request $request)
    {
        $values = $request->validate([
            'code' => 'required|string|exists:users,code',
            'password' => 'required|string|min:6|max:12',
            'newEmail' => 'required|string|email|unique:users,email',
        ]);
        $user = User::find($values['code']);
        if (!$user || !Hash::check($values['password'], $user->password)) {
            return response()->json([
                'message' => 'Hibás felhasználói jelszó vagy kód.' 
            ], 401); 
        }
        $user->update([
            'email' => $values['newEmail']
        ]);
        return response()->json(['message' => 'A Email sikeresen frissítve.'], 200);
    }
    /**
     * Törli a megadott felhasználót az adatbázisból.
     *
     * @param User $user Az eltávolítandó User modell példány.
     * @return JsonResponse Sikeres törlést jelző üzenetet tartalmazó JSON válasz.
     */
    public function destroy(User $user)
    {
        $code = $user->code;
        $user->delete();

        return ['message' => 'A/Az '.$code.' kurzus törölve lett!'];
    }

}
