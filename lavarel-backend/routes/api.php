<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TantervController;

Route::get('/tanterv', [TantervController::class, 'index']);
Route::get('/tanterv/{id}', [TantervController::class, 'show']);
Route::post('/tanterv', [TantervController::class, 'store']);
Route::put('/tanterv/{id}', [TantervController::class, 'update']);
Route::delete('/tanterv/{id}', [TantervController::class, 'destroy']);