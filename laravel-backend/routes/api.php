<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseForumController;
use App\Http\Controllers\CurriculumController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::apiResource('courses', CourseController::class)->middleware('auth:sanctum');
Route::get('/courses/user/{user_code}', [CourseController::class, 'getAllCoursesOFUser'])->middleware('auth:sanctum');


Route::get('/course_forum/{course_id}', [CourseForumController::class, 'show'])->middleware('auth:sanctum');
Route::post('/course_forum', [CourseForumController::class, 'store'])->middleware('auth:sanctum');
Route::delete('/course_forum/{id}', [CourseForumController::class, 'destroy'])->middleware('auth:sanctum');

Route::apiResource('curricula', CurriculumController::class)->middleware('auth:sanctum');
Route::apiResource('user', UserController::class)->except(['store'])->middleware('auth:sanctum');
Route::put('/user/password', [UserController::class, 'updatePassword'])->middleware('auth:sanctum');

Route::apiResource('grade', GradeController::class)->except(['show'])->middleware('auth:sanctum');
Route::get('/grade/course/{course_id}', [GradeController::class, 'getAllGradesInCourse'])->middleware('auth:sanctum');
Route::get('/grade/student/{student_code}', [GradeController::class, 'getAllGradesOFStudent'])->middleware('auth:sanctum');
Route::get('/statistic/{course_id}', [GradeController::class, 'statisticAbaoutCourse'])->middleware('auth:sanctum');
Route::get('/statistic', [GradeController::class, 'statisticAbaoutAll'])->middleware('auth:sanctum');



