<?php

use App\Http\Controllers\AiPageBuilder\EditWithAiController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Company\CompanyController;
use App\Http\Controllers\Company\ConnectedAccountController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\Product\ProductAdLinkController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Product\ProductImportController;
use App\Http\Controllers\Product\ProductSalePeriodController;
use App\Http\Controllers\Product\ProductSalePeriodCostEntryController;
use App\Http\Controllers\Product\ProductSalePeriodImportController;
use App\Http\Controllers\Product\ProductSalePeriodStatusReportController;
use App\Http\Controllers\Product\ProfitRowColorSettingsController;
use App\Http\Controllers\User\RoleController;
use App\Http\Controllers\User\UserController;
use App\Http\Middleware\RequireCompanyId;
use Illuminate\Support\Facades\Route;

Route::any('/', function () {
    return response()->json(['message' => 'API is running']);
});

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::prefix('me')->group(function () {
        Route::get('/', [AuthController::class, 'me']);
        Route::put('/password', [AuthController::class, 'changePassword']);
    });

    Route::apiResource('users', UserController::class);

    Route::get('/roles', [RoleController::class, 'index']);

    Route::prefix('sale-periods')->group(function () {
        Route::get('/', [ProductSalePeriodController::class, 'listAll']);
        Route::get('/status-report', ProductSalePeriodStatusReportController::class);

        Route::post('/import', ProductSalePeriodImportController::class);

        Route::get('/profit-row-color-settings', [ProfitRowColorSettingsController::class, 'show']);
        Route::put('/profit-row-color-settings', [ProfitRowColorSettingsController::class, 'update']);
        Route::post('/profit-row-color-settings/reset', [ProfitRowColorSettingsController::class, 'reset']);
    });

    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);

        Route::post('/import', [ProductImportController::class, 'store']);
        Route::get('/import/{importId}', [ProductImportController::class, 'show']);

        Route::get('/eligible-users', [ProductController::class, 'eligibleUsers']);

        Route::prefix('{product}')->group(function () {
            Route::get('/', [ProductController::class, 'show']);
            Route::put('/', [ProductController::class, 'update']);
            Route::delete('/', [ProductController::class, 'destroy']);

            Route::put('/visibility', [ProductController::class, 'updateVisibility']);

            Route::prefix('sale-periods')->group(function () {
                Route::get('/', [ProductSalePeriodController::class, 'index']);
                Route::post('/', [ProductSalePeriodController::class, 'store']);
                Route::put('/{productSalePeriod}', [ProductSalePeriodController::class, 'update']);
                Route::delete('/{productSalePeriod}', [ProductSalePeriodController::class, 'destroy']);

                Route::prefix('{productSalePeriod}/cost-entries')->group(function () {
                    Route::get('/', [ProductSalePeriodCostEntryController::class, 'index']);
                    Route::post('/', [ProductSalePeriodCostEntryController::class, 'store']);
                    Route::put('/{costEntry}', [ProductSalePeriodCostEntryController::class, 'update']);
                });
            });

            Route::prefix('ad-links')->group(function () {
                Route::get('/', [ProductAdLinkController::class, 'index']);
                Route::post('/', [ProductAdLinkController::class, 'store']);
                Route::put('/{productAdLink}', [ProductAdLinkController::class, 'update']);
                Route::delete('/{productAdLink}', [ProductAdLinkController::class, 'destroy']);
            });
        });
    });

    Route::prefix('ai-page-builder')->group(function () {
        Route::post('/edit-with-ai', EditWithAiController::class);
    });
});

Route::middleware([RequireCompanyId::class])->group(function () {
    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('connected-accounts', ConnectedAccountController::class)->except(['create', 'edit']);

    Route::get('/orders', [OrderController::class, 'index']);

    Route::prefix('sync')->group(function () {
        Route::post('/ghtk', [OrderController::class, 'syncGhtk']);
        Route::post('/facebook', [OrderController::class, 'syncFacebook']);
    });
});
