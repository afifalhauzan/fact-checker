<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\TelaahInteractionController;
use App\Http\Controllers\TelaahMatchController;
use App\Http\Controllers\TelaahPostController;
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

// TelaahBareng. Reads are public; every write comes through the web server with its internal key
Route::prefix('telaah-bersama')->group(function () {
    Route::get('/', [TelaahPostController::class, 'index']);
    Route::get('/attachments/{attachment}', [TelaahPostController::class, 'attachment'])->whereNumber('attachment');

    Route::middleware('internal')->group(function () {
        Route::post('/similar', [TelaahMatchController::class, 'similar']);
        Route::get('/missing-embeddings', [TelaahMatchController::class, 'missingEmbeddings']);
        Route::get('/shared/{shareKey}', [TelaahPostController::class, 'findShared'])->where('shareKey', '[0-9a-f]{64}');
        Route::put('/{post}/embedding', [TelaahMatchController::class, 'storeEmbedding'])->whereNumber('post');
        Route::post('/{post}/matched', [TelaahMatchController::class, 'matched'])->whereNumber('post');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/', [TelaahPostController::class, 'store'])->middleware('throttle:telaah-post');
            Route::patch('/{post}', [TelaahPostController::class, 'update'])->whereNumber('post');
            Route::delete('/{post}', [TelaahPostController::class, 'destroy'])->whereNumber('post');
            Route::post('/{post}/comments', [TelaahInteractionController::class, 'storeComment'])
                ->whereNumber('post')->middleware('throttle:telaah-comment');
            Route::delete('/{post}/comments/{comment}', [TelaahInteractionController::class, 'destroyComment'])
                ->whereNumber(['post', 'comment']);
            Route::post('/{post}/reactions', [TelaahInteractionController::class, 'toggleReaction'])->whereNumber('post');
            Route::post('/{post}/reports', [TelaahInteractionController::class, 'storeReport'])->whereNumber('post');
        });
    });

    Route::get('/{post}', [TelaahPostController::class, 'show'])->whereNumber('post');
});

Route::middleware('auth:sanctum')->prefix('conversations')->group(function () {
    Route::get('/', [ConversationController::class, 'index']);
    Route::get('/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::post('/{conversation}/messages', [ConversationController::class, 'storeMessages']);
    Route::patch('/{conversation}', [ConversationController::class, 'update']);
    Route::delete('/{conversation}', [ConversationController::class, 'destroy']);
});
