<?php
//https://mailtrap.io/blog/send-email-in-laravel/
//https://dev.to/yasserelgammal/generate-random-password-in-laravel-4003
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse; 
use Illuminate\Validation\ValidationException; 
use Illuminate\Support\Facades\Mail; // <-- Hozzáadva
use App\Mail\NewUserRegistered;      // <-- Hozzáadva
use Illuminate\Support\Facades\Log; 

/**
 * Kezeli a felhasználói hitelesítési műveleteket: regisztráció, bejelentkezés, kijelentkezés.
 */
class AuthController extends Controller
{
    /**
     * Új felhasználó regisztrálása a rendszerbe.
     *
     * Generál egy egyedi felhasználói kódot (`code`), generál egy jelszót,
     * létrehozza a felhasználót (a jelszó hashelése a User modellen keresztül történik),
     * majd emailt küld a felhasználónak és az adminnak a belépési adatokkal.
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
            'role' => 'nullable|in:student,teacher,admin',
            'curriculum_id' => 'nullable|exists:curricula,id' 
        ]);

        do {
            $codeChars = str_split(Str::upper(Str::random(5))); 
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
        $values['password'] = Str::password(12,true, true, true, false); 
        $user = User::create($values);
        $adminEmail = "salt90502@gmail.com";
        try {
            // Küldés az új felhasználónak
            Mail::to($user->email)->send(new NewUserRegistered($user, $values['password']));

            // Másolat küldése az adminnak (ugyanazzal a sablonnal)
            if ($adminEmail) { // Csak akkor küldjön, ha be van állítva
                 Mail::to($adminEmail)->send(new NewUserRegistered($user, $values['password']));
            }

        } catch (\Exception $e) {
            // Hiba logolása, ha az email küldés sikertelen
            Log::error('Regisztrációs email küldése sikertelen: ' . $user->email . ' Hiba: ' . $e->getMessage());
            // Fontos: Döntsd el, mi történjen ilyenkor. Lehet, hogy a felhasználót létrehoztad,
            // de az email nem ment ki. Visszaadhatsz egy figyelmeztetést.
             return response()->json([
                 'message' => 'Felhasználó létrehozva, de az értesítő email küldése sikertelen!',
                 // Csak a biztonságos adatokat adjuk vissza
                 'user' => $user
             ], 201); // Létrehozva, de figyelmeztetéssel
        }
        return response()->json([
            'message' => 'Felhasználó sikeresen regisztrálva. Az adatok emailben elküldve.',
            'user' => $user
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