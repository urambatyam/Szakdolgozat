<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseForumController;
use App\Http\Controllers\CurriculumController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::apiResource('courses', CourseController::class)->middleware('auth:sanctum');

Route::get('/course_forums/{course_name}', [CourseForumController::class, 'show'])->middleware('auth:sanctum');
Route::post('/course_forums', [CourseForumController::class, 'store'])->middleware('auth:sanctum');
Route::delete('/course_forums/{id}', [CourseForumController::class, 'show'])->middleware('auth:sanctum');

Route::apiResource('curricula', CurriculumController::class)->except(['index'])->middleware('auth:sanctum');
Route::apiResource('user', UserController::class)->except(['store'])->middleware('auth:sanctum');
Route::put('/user/password', [UserController::class, 'updatePassword'])->middleware('auth:sanctum');

Route::apiResource('grade', GradeController::class)->middleware('auth:sanctum');

Route::get('/statistic/{course_name}', [GradeController::class, 'statisticAbaoutCourse'])->middleware('auth:sanctum');
Route::get('/statistic', [GradeController::class, 'statisticAbaoutAll'])->middleware('auth:sanctum');



