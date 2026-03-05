<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\ConnectedAccount;
use App\Models\Order;
use App\Services\FacebookService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class FacebookLeadgenWebhookController extends Controller
{
    /**
     * Facebook webhook verification (GET). Required when subscribing to Page webhook.
     */
    public function verify(Request $request): Response
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $expectedToken = config('services.facebook.verify_token');

        if ($mode === 'subscribe' && $expectedToken !== null && $token === $expectedToken) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response('Forbidden', 403);
    }

    /**
     * Handle incoming Leadgen webhook (POST). Creates an Order from lead data.
     */
    public function handle(Request $request, FacebookService $facebookService): Response
    {
        $input  = $request->all();
        $object = $input['object'] ?? null;

        if ($object !== 'page') {
            return response('OK', 200);
        }

        foreach ($input['entry'] ?? [] as $entry) {
            $pageId = (string) ($entry['id'] ?? '');
            foreach ($entry['changes'] ?? [] as $change) {
                if (($change['field'] ?? '') !== 'leadgen') {
                    continue;
                }
                $value = $change['value'] ?? [];
                $leadgenId = (string) ($value['leadgen_id'] ?? '');
                if ($leadgenId === '') {
                    continue;
                }

                $this->processLead($pageId, $leadgenId, $facebookService);
            }
        }

        return response('OK', 200);
    }

    private function processLead(string $pageId, string $leadgenId, FacebookService $facebookService): void
    {
        $account = ConnectedAccount::where('type', ConnectedAccount::TYPE_FACEBOOK)
            ->whereNotNull('company_id')
            ->get()
            ->first(function (ConnectedAccount $acc) use ($pageId) {
                $creds     = $acc->credentials ?? [];
                $accPageId = (string) ($creds['page_id'] ?? '');

                return $accPageId !== '' && $accPageId === $pageId;
            });

        if (! $account) {
            Log::info('Facebook Leadgen: no connected account for page_id', ['page_id' => $pageId, 'leadgen_id' => $leadgenId]);

            return;
        }

        $lead = $facebookService->getLead($account->credentials ?? [], $leadgenId);
        if (empty($lead)) {
            return;
        }

        $customerName = $this->pickLeadField($lead, ['full_name', 'name', 'ho_ten', 'customer_name']);
        $phone        = $this->pickLeadField($lead, ['phone_number', 'phone', 'sdt', 'dien_thoai']);

        Order::updateOrCreate(
            [
                'company_id'  => $account->company_id,
                'source'      => 'facebook',
                'external_id' => 'fb_lead_' . $leadgenId,
            ],
            [
                'connected_account_id' => $account->id,
                'customer_name'        => $customerName,
                'phone'                => $phone,
                'amount'               => null,
                'status'               => 'lead',
            ]
        );
    }

    /**
     * @param array<string, mixed> $lead
     * @param list<string>        $keys
     */
    private function pickLeadField(array $lead, array $keys): ?string
    {
        foreach ($keys as $key) {
            $v = $lead[$key] ?? null;
            if ($v !== null && $v !== '') {
                return (string) $v;
            }
        }

        return null;
    }
}
