<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login with email and password. Returns user and token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->input('email'))->first();

        if (! $user
            || ! Hash::check($request->input('password'), $user->password)
        ) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $user->tokens()->where('name', 'auth')->delete();

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'user'                               => $user,
            'can_manage_users'                   => $user->canManageUsers(),
            'can_edit_products'                  => $user->canEditProducts(),
            'can_view_sale_periods_and_reports'  => $user->canViewSalePeriodsAndReports(),
            'token'                              => $token,
            'token_type'                         => 'Bearer',
        ]);
    }

    /**
     * Logout: revoke the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * Return the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user'                              => $user,
            'can_manage_users'                  => $user->canManageUsers(),
            'can_edit_products'                 => $user->canEditProducts(),
            'can_view_sale_periods_and_reports'  => $user->canViewSalePeriodsAndReports(),
        ]);
    }

    /**
     * Change password: requires old_password to be correct, new_password and confirmation must match.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'old_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($validated['old_password'], $user->password)) {
            throw ValidationException::withMessages([
                'old_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->password = $validated['new_password'];
        $user->save();

        return response()->json(['message' => 'Password updated.']);
    }
}
