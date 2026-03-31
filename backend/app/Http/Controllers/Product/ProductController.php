<?php

namespace App\Http\Controllers\Product;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductEditLog;
use App\Models\ProductVisibility;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->visibleToUser($request->user())->orderBy('code');

        if ($request->boolean('include_inactive') && Auth::user()->canEditProducts()) {
            // product managers may list all statuses
        } elseif ($request->filled('status')) {
            $query->where('status', (int) $request->input('status'));
        } else {
            $query->where('status', 1);
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('exclude_in_active_sale_period')) {
            $today = now()->toDateString();
            $query->whereDoesntHave('salePeriods', function ($q) use ($today) {
                $q->whereDate('start_at', '<=', $today)->whereDate('end_at', '>=', $today);
            });
        }

        $products = $query->paginate($request->integer('per_page', 15));

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to create products.');
        }

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'code'           => ['required', 'string', 'max:100', 'unique:products,code'],
            'unit'           => ['nullable', 'string', 'max:50'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'unit_price'     => ['nullable', 'numeric', 'min:0'],
            'vat_percent'    => ['nullable', 'numeric', 'min:0', 'max:100'],
            'vat_code'       => ['nullable', 'string', 'max:50'],
            'weight_gram'    => ['nullable', 'integer', 'min:0'],
            'status'         => ['nullable', 'integer', 'in:0,1'],
        ]);

        $payload = array_merge([
            'unit'            => 'cái',
            'purchase_price'  => 0,
            'unit_price'      => 0,
            'vat_percent'     => 0,
            'vat_code'        => null,
            'weight_gram'     => 0,
            'status'          => 1,
        ], $validated);

        $product = DB::transaction(function () use ($payload) {
            $product = Product::create($payload);
            foreach (UserRole::productViewerRoles() as $role) {
                ProductVisibility::create([
                    'product_id' => $product->id,
                    'role'       => $role,
                    'allow_all'  => true,
                ]);
            }

            return $product;
        });

        return response()->json($product, 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $canView = Product::query()->visibleToUser($request->user())->where('id', $product->id)->exists();
        if (! $canView) {
            abort(403, 'You do not have permission to view this product.');
        }

        $product->load([
            'editLogs.user:id,name,email',
            'visibilityRules',
            'allowedUsers:id,name,email,role',
            'salePeriods' => fn ($q) => $q->with([
                'marketingUser:id,name,email',
                'costEntries' => fn ($cq) => $cq->orderByDesc('created_at')->orderByDesc('id'),
                'adLinks' => fn ($aq) => $aq->with(['orders.product']),
            ]),
        ]);
        $product->setRelation('adLinks', $product->salePeriods->flatMap->adLinks);

        return response()->json($product);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to edit products.');
        }

        $validated = $request->validate([
            'name'           => ['sometimes', 'string', 'max:255'],
            'code'           => ['sometimes', 'string', 'max:100', 'unique:products,code,' . $product->id],
            'unit'           => ['sometimes', 'string', 'max:50'],
            'purchase_price' => ['sometimes', 'numeric', 'min:0'],
            'unit_price'     => ['sometimes', 'numeric', 'min:0'],
            'vat_percent'    => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'vat_code'       => ['sometimes', 'nullable', 'string', 'max:50'],
            'weight_gram'    => ['sometimes', 'integer', 'min:0'],
            'status'         => ['sometimes', 'integer', 'in:0,1'],
        ]);

        $changes = [];
        foreach ($validated as $key => $newValue) {
            $oldValue = $product->getAttribute($key);
            if ($oldValue != $newValue) {
                $changes[$key] = ['old' => $oldValue, 'new' => $newValue];
                $product->setAttribute($key, $newValue);
            }
        }

        if (empty($changes)) {
            return response()->json($product);
        }

        $product->save();

        ProductEditLog::create([
            'product_id' => $product->id,
            'user_id'    => Auth::id(),
            'changes'    => $changes,
            'created_at' => now(),
        ]);

        return response()->json($product);
    }

    /**
     * Update product visibility: which roles/departments and optionally specific users can view.
     * Only admin, manager, director.
     */
    public function updateVisibility(Request $request, Product $product): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission to edit product visibility.');
        }

        $validated = $request->validate([
            'visibility' => ['required', 'array'],
            'visibility.marketing' => ['sometimes', 'array'],
            'visibility.marketing.allow_all' => ['sometimes', 'boolean'],
            'visibility.marketing.user_ids' => ['sometimes', 'array'],
            'visibility.marketing.user_ids.*' => ['integer', 'exists:users,id'],
            'visibility.sale' => ['sometimes', 'array'],
            'visibility.sale.allow_all' => ['sometimes', 'boolean'],
            'visibility.sale.user_ids' => ['sometimes', 'array'],
            'visibility.sale.user_ids.*' => ['integer', 'exists:users,id'],
            'visibility.customer_service' => ['sometimes', 'array'],
            'visibility.customer_service.allow_all' => ['sometimes', 'boolean'],
            'visibility.customer_service.user_ids' => ['sometimes', 'array'],
            'visibility.customer_service.user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $visibility = $validated['visibility'];
        $departmentToRoles = [
            'marketing' => ['marketing'],
            'sale' => ['telesale', 'telesale_leader'],
            'customer_service' => ['customer_service'],
        ];

        DB::transaction(function () use ($product, $visibility, $departmentToRoles) {
            foreach ($departmentToRoles as $department => $roles) {
                $config = $visibility[$department] ?? ['allow_all' => true];
                $allowAll = $config['allow_all'] ?? true;
                $userIds = $config['user_ids'] ?? [];
                foreach ($roles as $role) {
                    ProductVisibility::updateOrCreate(
                        ['product_id' => $product->id, 'role' => $role],
                        ['allow_all' => $allowAll]
                    );
                }
            }
            $allowedIds = collect($departmentToRoles)->flatMap(function ($roles, $department) use ($visibility) {
                $config = $visibility[$department] ?? ['allow_all' => true];
                if (($config['allow_all'] ?? true) === false && ! empty($config['user_ids'] ?? [])) {
                    return $config['user_ids'];
                }
                return [];
            })->unique()->values()->toArray();
            $product->allowedUsers()->sync($allowedIds);
        });

        $product->load(['visibilityRules', 'allowedUsers:id,name,email,role']);
        return response()->json($product);
    }

    /**
     * Users eligible for product visibility (marketing, telesale, telesale_leader, customer_service).
     * Only for admin, manager, director.
     */
    public function eligibleUsers(Request $request): JsonResponse
    {
        if (! Auth::user()->canEditProducts()) {
            abort(403, 'You do not have permission.');
        }

        $users = User::query()
            ->whereIn('role', UserRole::productViewerRoles())
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json($users);
    }
}
