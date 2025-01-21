<?php

namespace App\Http\Controllers;

use App\Models\Tanterv;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TantervController extends Controller
{
    public function index()
    {
        $curriculum = Tanterv::all();
        return response()->json([
            'status' => true,
            'message' => 'A tanterveket sikeresen lekértük!',
            'data' => $curriculum
        ], 200);
    }

    public function show($id)
    {
        $curriculum = Tanterv::findOrFail($id);
        return response()->json([
            'status' => true,
            'message' => 'A tantervet sikeresen lekértük!',
            'data' => $curriculum
        ], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tantervNev' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'A tanterv név túl hasszú!',
                'errors' => $validator->errors()
            ], 422);
        }

        $curriculum = Tanterv::create($request->all());
        return response()->json([
            'status' => true,
            'message' => 'Sikeresen lérehoztuk az új tantervet!',
            'data' => $curriculum
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tantervNev' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'A tanterv név túl hasszú!',
                'errors' => $validator->errors()
            ], 422);
        }

        $curriculum = Tanterv::findOrFail($id);
        $curriculum->update($request->all());

        return response()->json([
            'status' => true,
            'message' => 'A tantervet sikeresen firsitetük!',
            'data' => $curriculum
        ], 200);
    }

    public function destroy($id)
    {
        $curriculum = Tanterv::findOrFail($id);
        $curriculum->delete();
        
        return response()->json([
            'status' => true,
            'message' => 'A tantervet sikeresen törültük!'
        ], 204);
    }
}
