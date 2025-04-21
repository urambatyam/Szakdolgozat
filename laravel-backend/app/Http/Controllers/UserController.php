<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
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
