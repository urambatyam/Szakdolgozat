<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseForumController;
use App\Http\Controllers\CurriculumController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SubjectMatterController;
use App\Http\Controllers\CalculusController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::post('/role', [AuthController::class, 'role'])->middleware('auth:sanctum');
Route::put('/changePassword', [UserController::class, 'ChangePassword'])->middleware('auth:sanctum');
Route::put('/changeEmail', [UserController::class, 'ChangeEmail'])->middleware('auth:sanctum');

Route::apiResource('courses', CourseController::class)->middleware('auth:sanctum');
Route::get('/courses/user/{user_code}', [CourseController::class, 'getAllCoursesOFUser'])->middleware('auth:sanctum');
Route::get('/courses-names', [CourseController::class, 'getAllCoursesNames'])->middleware('auth:sanctum');



Route::get('/course_forum/{course_id}', [CourseForumController::class, 'show'])->middleware('auth:sanctum');
Route::post('/course_forum', [CourseForumController::class, 'store'])->middleware('auth:sanctum');
Route::delete('/course_forum/{id}', [CourseForumController::class, 'destroy'])->middleware('auth:sanctum');

Route::apiResource('curricula', CurriculumController::class)->middleware('auth:sanctum');
Route::apiResource('user', UserController::class)->except(['store'])->middleware('auth:sanctum');
Route::put('/user/password', [UserController::class, 'updatePassword'])->middleware('auth:sanctum');

Route::apiResource('grade', GradeController::class)->except(['show'])->middleware('auth:sanctum');
Route::get('/grade/course/{course_id}', [GradeController::class, 'getAllGradesInCourse'])->middleware('auth:sanctum');
Route::get('/grade/student/{student_code}', [GradeController::class, 'getAllGradesOFStudent'])->middleware('auth:sanctum');

Route::get('/statisticCB/{course_id}', [CalculusController::class, 'courseBoxplot']);
Route::get('/statisticCCR/{course_id}', [CalculusController::class, 'coursecompletionRate']);
Route::get('/statisticCGR/{course_id}', [CalculusController::class, 'courseGradeRate']);
Route::get('/statisticCLR/{course_id}', [CalculusController::class, 'courseLinearRegression']);
Route::get('/statisticCD/{course_id}', [CalculusController::class, 'courseDistribution']);

Route::get('/statisticTSCC', [CalculusController::class, 'statisticToStudentCompletedCredits'])->middleware('auth:sanctum');
Route::get('/statisticSP', [CalculusController::class, 'statisticStudentProgress'])->middleware('auth:sanctum');
Route::get('/statisticASLR', [CalculusController::class, 'statisticAbaoutStudentLinearisRegressio'])->middleware('auth:sanctum');
Route::get('/statisticAST', [CalculusController::class, 'statisticAbaoutStudentTAN'])->middleware('auth:sanctum');
Route::get('/statisticAT', [CalculusController::class, 'statisticAllTAN'])->middleware('auth:sanctum');
Route::post('/optimalizeByBnB', [CalculusController::class, 'optimalizeByBnB'])->middleware('auth:sanctum');
Route::post('/optimalizeByGreedy', [CalculusController::class, 'optimalizeByGreedy'])->middleware('auth:sanctum');

Route::get('/subjectMatter/{course_id}', [SubjectMatterController::class, 'getSubjectMatterOfCourse'])->middleware('auth:sanctum');
Route::put('/subjectMatter', [SubjectMatterController::class, 'update'])->middleware('auth:sanctum');




