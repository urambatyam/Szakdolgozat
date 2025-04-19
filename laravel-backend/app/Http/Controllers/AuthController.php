<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse; 
use Illuminate\Validation\ValidationException; 

/**
 * Kezeli a felhasználói hitelesítési műveleteket: regisztráció, bejelentkezés, kijelentkezés.
 */
class AuthController extends Controller
{
    /**
     * Új felhasználó regisztrálása a rendszerbe.
     *
     * Generál egy egyedi felhasználói kódot (`code`), hash-eli a jelszót (a User modell 'hashed' cast-ja által),
     * létrehozza a felhasználót, majd generál egy Sanctum API tokent.
     *
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse A létrehozott felhasználó adatait és az API tokent tartalmazó JSON válasz.
     * @throws ValidationException Ha a validálás sikertelen.
     */
    public function register(Request $request): JsonResponse
    {
        $values = $request->validate([
            'name' => 'required|max:25|string',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|confirmed|min:6', 
            'role' => 'nullable|in:student,teacher,admin',
            'curriculum_id' => 'nullable|exists:curricula,id' 
        ]);

        do {
            $codeChars = str_split(Str::upper(Str::random(6))); 
            $numberCount = rand(2, 4);
            $positionsToReplace = array_rand($codeChars, $numberCount);
            if (!is_array($positionsToReplace)) {
                $positionsToReplace = [$positionsToReplace];
            }
            foreach ($positionsToReplace as $position) {
                $codeChars[$position] = rand(0, 9); 
            }
            $code = implode('', $codeChars);
            $exists = User::where('code', $code)->exists();

        } while ($exists);

        $values['code'] = $code; 
        $user = User::create($values);
        $token = $user->createToken('titok'); 

        return response()->json([
            'user' => $user,
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer'
        ], 201); 
    }

    /**
     * Felhasználó bejelentkeztetése a felhasználói kód (`code`) és jelszó alapján.
     *
     * Ellenőrzi a megadott adatokat, és ha érvényesek, generál egy új Sanctum API tokent.
     *
     * @param Request $request A bejövő HTTP kérés.
     * @return JsonResponse A bejelentkezett felhasználó adatait és az API tokent, vagy hibaüzenetet tartalmazó JSON válasz.
     * @throws ValidationException Ha a validálás sikertelen.
     */
    public function login(Request $request): JsonResponse
    {
        $values = $request->validate([
            'code' => 'required|string|exists:users,code',
            'password' => 'required|string' 
        ]);

        $user = User::find($values['code']);

        if (!$user || !Hash::check($values['password'], $user->password)) {
            return response()->json([
                'message' => 'Hibás felhasználói kód vagy jelszó.' 
            ], 401); 
        }

        $token = $user->createToken('titok'); 

        return response()->json([
            'user' => $user,
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer'
        ]); 
    }

    /**
     * Kijelentkezteti a jelenleg hitelesített felhasználót.
     *
     * Törli a felhasználóhoz tartozó összes Sanctum API tokent.
     *
     * @param Request $request A bejövő HTTP kérés (a hitelesített felhasználó eléréséhez).
     * @return JsonResponse Sikeres kijelentkezést jelző üzenetet tartalmazó JSON válasz.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Sikeres kijelentkezés.'
        ]); 
    }

    /**
     * Visszaadja a jelenleg hitelesített felhasználó adatait.
     *
     * Ellenőrzi, hogy van-e bejelentkezett felhasználó.
     *
     * @return User|JsonResponse A bejelentkezett felhasználó User objektuma, vagy 401-es hiba JSON válasz.
     */
    public function role(): User | JsonResponse
    {
        if (Auth::check()) {
            return Auth::user();
        }

        return response()->json([
            'message' => 'Hitelesítés szükséges.' 
        ], 401); 
    }
}