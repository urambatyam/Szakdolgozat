<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
        /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return User::all();
    }
        /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return $user;
    }
    /**
     * Update the specified resource in storage.
    */
    public function update(Request $request, User $user)
    {
        //Gate::authorize('update');
        $values = $request->validate([
            'name' => 'nullable|max:25|string',
            'email' => 'nullable|string|email|unique:users',
            'role' => 'nullable|in:student,teacher,admin',
            'password' => 'nullable'
        ]);

        $user->update($values);

        return $user;
    }
    public function updatePassword(Request $request, User $user)
    {
    
        // Validálás
        $request->validate([
            'current_password' => ['required', function ($attribute, $value, $fail) use ($user) {
                if (!Hash::check($value, $user->password)) {
                    $fail('A jelenlegi jelszó helytelen.');
                }
            }],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
    
        // Jelszó frissítése
        $user->update([
            'password' => Hash::make($request->password)
        ]);
    
        return response()->json(['message' => 'A jelszó sikeresen frissítve.'], 200);
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $code = $user->code;
        //Gate::authorize('delete');
        $user->delete();

        return ['message' => 'A/Az '.$code.' kurzus törölve lett!'];
    }

}
