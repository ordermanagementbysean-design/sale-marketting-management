<?php

namespace App\Http\Controllers\User;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! Auth::user()->canManageUsers()) {
            abort(403, 'You do not have permission to view users.');
        }

        $users = User::query()
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        if (! Auth::user()->canManageUsers()) {
            abort(403, 'You do not have permission to create users.');
        }

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'role'     => ['sometimes', 'string', Rule::in(UserRole::values())],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => $validated['password'],
            'role'     => $validated['role'] ?? UserRole::MARKETING->value,
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        $authUser = Auth::user();
        if (! $authUser->canManageUsers() && $authUser->id !== $user->id) {
            abort(403, 'You do not have permission to view this user.');
        }

        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $authUser  = Auth::user();
        $isSelf    = $authUser->id === $user->id;
        $canManage = $authUser->canManageUsers();

        if (! $canManage && ! $isSelf) {
            abort(403, 'You do not have permission to update this user.');
        }

        $rules = [
            'name'     => ['sometimes', 'string', 'max:255'],
            'password' => ['sometimes', 'string', 'confirmed', Password::defaults()],
        ];
        if ($canManage) {
            $rules['email'] = ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)];
            $rules['role']  = ['sometimes', 'string', Rule::in(UserRole::values())];
        }
        $validated = $request->validate($rules);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if ($canManage && isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (isset($validated['password'])) {
            $user->password = $validated['password'];
        }
        if ($canManage && array_key_exists('role', $validated)) {
            $user->role = $validated['role'];
        }
        $user->save();

        return response()->json($user);
    }

    public function destroy(User $user): JsonResponse
    {
        if (! Auth::user()->canManageUsers()) {
            abort(403, 'You do not have permission to delete users.');
        }
        if (Auth::id() === $user->id) {
            abort(403, 'You cannot delete your own account.');
        }

        $user->delete();

        return response()->json(null, 204);
    }
}
