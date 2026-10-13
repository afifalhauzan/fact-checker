<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConversationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::middleware('throttle:auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->prefix('conversations')->group(function () {
    Route::get('/', [ConversationController::class, 'index']);
    Route::get('/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::post('/{conversation}/messages', [ConversationController::class, 'storeMessages']);
    Route::delete('/{conversation}', [ConversationController::class, 'destroy']);
});
