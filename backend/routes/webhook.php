<?php

use App\Http\Controllers\Webhook\FacebookLeadgenWebhookController;

Route::get('facebook-leadgen', [FacebookLeadgenWebhookController::class, 'verify']);
Route::post('facebook-leadgen', [FacebookLeadgenWebhookController::class, 'handle']);
