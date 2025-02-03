<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    
    public function register(Request $request){
        $values = $request->validate([
            'name' => 'required|max:25|string',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|confirmed|min:6',
            'role' => 'nullable|in:student,teacher,admin',
        ]);
        do {
            $code = Str::upper(Str::random(5));
            $exists = User::where('code', $code)->exists();
        } while ($exists);
    
        $values['code'] = $code;
        
        //$values['password'] = bcrypt($values['password']);
        
        $user = User::create($values);
        $token = $user->createToken('titok');
    
        return response()->json([
            'user' => $user,
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer'
        ], 201);
    }

    public function login(Request $request){
        $request->validate([
            'email' => 'required|string|email|exists:users',
            'password' => 'required'
        ]);
        $user = User::where('email', $request->email)->first();

        if(!$user || !Hash::check($request->password, $user->password)){
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }
        $token = $user->createToken('titok');
        return response()->json([
            'user' => $user,
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer'
        ]);
    }
    public function logout(Request $request){
        $request->user()->tokens()->delete();
        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }
}
