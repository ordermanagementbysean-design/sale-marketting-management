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

Route::any('/', function () {
    return response()->json(['message' => 'API is running']);
});

Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);
    Route::apiResource('users', UserController::class);
    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/sale-periods', [ProductSalePeriodController::class, 'listAll']);
    Route::post('/sale-periods/import', ProductSalePeriodImportController::class);
    Route::get('/sale-periods/status-report', ProductSalePeriodStatusReportController::class);
    Route::get('/sale-periods/profit-row-color-settings', [ProfitRowColorSettingsController::class, 'show']);
    Route::put('/sale-periods/profit-row-color-settings', [ProfitRowColorSettingsController::class, 'update']);
    Route::post('/sale-periods/profit-row-color-settings/reset', [ProfitRowColorSettingsController::class, 'reset']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::post('/products/import', [ProductImportController::class, 'store']);
    Route::get('/products/import/{importId}', [ProductImportController::class, 'show']);
    Route::get('/products/eligible-users', [ProductController::class, 'eligibleUsers']);
    Route::get('/products/{product}/sale-periods', [ProductSalePeriodController::class, 'index']);
    Route::post('/products/{product}/sale-periods', [ProductSalePeriodController::class, 'store']);
    Route::put('/products/{product}/sale-periods/{productSalePeriod}', [ProductSalePeriodController::class, 'update']);
    Route::delete('/products/{product}/sale-periods/{productSalePeriod}', [ProductSalePeriodController::class, 'destroy']);
    Route::get('/products/{product}/sale-periods/{productSalePeriod}/cost-entries', [ProductSalePeriodCostEntryController::class, 'index']);
    Route::post('/products/{product}/sale-periods/{productSalePeriod}/cost-entries', [ProductSalePeriodCostEntryController::class, 'store']);
    Route::put('/products/{product}/sale-periods/{productSalePeriod}/cost-entries/{costEntry}', [ProductSalePeriodCostEntryController::class, 'update']);
    Route::get('/products/{product}/ad-links', [ProductAdLinkController::class, 'index']);
    Route::post('/products/{product}/ad-links', [ProductAdLinkController::class, 'store']);
    Route::put('/products/{product}/ad-links/{productAdLink}', [ProductAdLinkController::class, 'update']);
    Route::delete('/products/{product}/ad-links/{productAdLink}', [ProductAdLinkController::class, 'destroy']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::put('/products/{product}/visibility', [ProductController::class, 'updateVisibility']);
    Route::post('/ai-page-builder/edit-with-ai', EditWithAiController::class);
});

Route::middleware([RequireCompanyId::class])->group(function () {
    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('connected-accounts', ConnectedAccountController::class)->except(['create', 'edit']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/sync/ghtk', [OrderController::class, 'syncGhtk']);
    Route::post('/sync/facebook', [OrderController::class, 'syncFacebook']);
});
