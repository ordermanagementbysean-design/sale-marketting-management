<?php

namespace App\Http\Controllers\User;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = array_map(
            fn (UserRole $role) => ['value' => $role->value, 'label' => $role->label()],
            UserRole::cases()
        );

        return response()->json($roles);
    }
}
