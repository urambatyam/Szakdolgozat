<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse; 
use Illuminate\Validation\ValidationException; 
use Illuminate\Support\Facades\Mail; 
use App\Mail\NewUserRegistered;      
use Illuminate\Support\Facades\Log; 

/**
 * Kezeli a felhasználói hitelesítési műveleteket: regisztráció, bejelentkezés, kijelentkezés.
 */
class AuthController extends Controller
{
    /**
     * Új felhasználó regisztrálása a rendszerbe.
     *
     * Generál egy egyedi felhasználói kódot, generál egy jelszót,
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
        $userEmailSent = false;
        $adminEmailSent = false;
        $emailError = null;
        if ($adminEmail) {
            try {
                Mail::to($adminEmail)->send(new NewUserRegistered($user, $values['password'])); 
                $adminEmailSent = true;
            } catch (\Exception $e) {
                Log::error('Admin email küldése sikertelen (regisztáció): ' . $adminEmail . ' Hiba: ' . $e->getMessage());
                $emailError .= 'Admin értesítő küldése sikertelen.'; 
            }
        }
        if ($user && $user->email) {
            try {
                Mail::to($user->email)->send(new NewUserRegistered($user, $values['password']));
                $userEmailSent = true;
            } catch (\Exception $e) {
                Log::error('Email küldése a felhasználónak sikertelen (regisztáció): ' . $user->email . ' Hiba: ' . $e->getMessage());
                $emailError = 'Felhasználói értesítő küldése sikertelen. '; 
            }
        } else {
             Log::warning('Nem található felhasználó vagy email cím a jegyhez tartozó értesítéshez: user_code=' . $user->user_code);
             $emailError = 'Felhasználói értesítő nem küldhető (nincs email cím). ';
        }

        $message = 'Új felhasználó registrációja sikeresen megtörtént';
        if ($emailError) {
            $message .= ',de az email küldés sikertelen.: ' . trim($emailError);
        } elseif ($userEmailSent && $adminEmailSent) {
             $message .= '. Értesítő email sikeresen elküldve.';
        } elseif ($adminEmailSent) {
             $message .= '. Admin értesítő sikeresen elküldve.';
        }

        return response()->json([
            'message' => $message,
            'user' => $user,
            'user_email_sent' => $userEmailSent,
            'admin_email_sent' => $adminEmailSent
        ], 201); 
    }

    /**
     * Felhasználó bejelentkeztetése a felhasználói Athena kód és jelszó alapján.
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
     * Törli a felhasználóhoz tartozó összes Sanctum API tokent.
     *
     * @param Request $request A bejövő HTTP kérés.
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