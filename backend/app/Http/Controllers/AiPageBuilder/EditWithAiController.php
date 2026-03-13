<?php

namespace App\Http\Controllers\AiPageBuilder;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EditWithAiController extends Controller
{
    /**
     * Nhận instruction + template JSON, gửi lên Gemini để chỉnh sửa cấu trúc template (vd: đổi thứ tự section),
     * trả về template JSON mới. Frontend dùng template mới + data form hiện tại để render preview.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $valid = $request->validate([
            'instruction' => ['required', 'string', 'max:2000'],
            'template'    => ['required', 'array'],
            'template.id'  => ['required', 'string', 'max:64'],
            'template.name' => ['nullable', 'string'],
            'template.structure' => ['nullable', 'array'],
            'template.sections' => ['required', 'array'],
            'data'         => ['nullable', 'array'],
            'data.*'       => ['nullable'],
        ]);

        $apiKey = config('services.gemini.api_key');
        if (empty($apiKey)) {
            return response()->json([
                'message' => 'Gemini API key chưa cấu hình (GEMINI_API_KEY trong .env).',
            ], 503);
        }

        $slim = $this->slimTemplateForPrompt($valid['template']);
        $templateJson = json_encode($slim, JSON_UNESCAPED_UNICODE);
        $instruction = $valid['instruction'];
        $slimData = $this->slimDataForPrompt($valid['template'], $valid['data'] ?? []);
        $dataBlock = $slimData !== []
            ? "\nData:" . json_encode($slimData, JSON_UNESCAPED_UNICODE)
            : '';
        $templateToHtml = $this->buildTemplateToHtmlReference($valid['template']);
        $prompt = "You edit a page template. Each section has id, type, label; sections render to HTML. Use section id in sectionSettings.\n\n{$templateToHtml}\n\nEdit per instruction. Return JSON only.\nT:{$templateJson}{$dataBlock}\nInstruction: {$instruction}\nFormat: {\"structure\":[\"type\",...],\"sectionIds\":[\"id\",...],\"content\":{\"fieldKey\":\"value\"},\"sectionSettings\":{\"sectionId\":{\"settingKey\":value}}}. Keep structure and sectionIds in same order as T. content=only changed text field keys. sectionSettings=style/color: use section id (from T.sections[].id) and setting keys listed above.";

        $model = config('services.gemini.model', 'gemini-2.0-flash');
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent?key=' . $apiKey;
        $response = Http::timeout(60)->post($url, [
            'contents' => [
                ['parts' => [['text' => $prompt]]],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature'      => 0.2,
                // Gemini 3 uses "thinking" tokens that count toward limit; allow enough for thought + full JSON
                'maxOutputTokens'  => 8192,
            ],
        ]);

        if (! $response->successful()) {
            $body = $response->json();
            $message = $body['error']['message'] ?? $response->body();
            return response()->json(['message' => 'Gemini API lỗi: ' . $message], 502);
        }

        $body = $response->json();
        $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if ($text === null) {
            return response()->json(['message' => 'Gemini không trả về nội dung.'], 502);
        }

        // Gemini có thể wrap trong ```json ... ``` hoặc trả raw
        $text = trim($text);
        if (preg_match('/^```(?:json)?\s*([\s\S]*?)```\s*$/m', $text, $m)) {
            $text = trim($m[1]);
        }
        $parsed = json_decode($text, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $errorMessage = json_last_error_msg();
            Log::error('Không parse được JSON từ Gemini: ' . $errorMessage, [
                'response' => $body,
            ]);

            return response()->json(['message' => 'Không parse được JSON từ Gemini: ' . $errorMessage], 502);
        }

        if (! is_array($parsed) || empty($parsed['structure']) || empty($parsed['sectionIds'])) {
            return response()->json(['message' => 'Gemini trả về thiếu structure hoặc sectionIds.'], 502);
        }

        $content = $parsed['content'] ?? [];
        $content = is_array($content) ? $content : [];
        $sectionSettings = $parsed['sectionSettings'] ?? [];
        $sectionSettings = is_array($sectionSettings) ? $sectionSettings : [];

        $template = $this->mergeReorderedTemplate($valid['template'], $parsed['structure'], $parsed['sectionIds']);
        $template = $this->applyContentToTemplate($template, $content);
        $template = $this->applySectionSettings($template, $sectionSettings);

        return response()->json(['template' => $template]);
    }

    /** Chỉ gửi field text/textarea/url, truncate → giảm token. */
    private function slimDataForPrompt(array $template, array $data): array
    {
        if (empty($data)) {
            return [];
        }
        $textTypes = ['text', 'textarea', 'url'];
        $keys = [];
        foreach ($template['sections'] ?? [] as $section) {
            foreach ($section['fields'] ?? [] as $field) {
                $type = $field['type'] ?? 'text';
                if (in_array($type, $textTypes, true)) {
                    $key = $field['key'] ?? null;
                    if ($key !== null) {
                        $keys[$key] = true;
                    }
                }
            }
        }
        $out = [];
        $maxLen = 150;
        foreach ($keys as $key => $_) {
            if (! array_key_exists($key, $data)) {
                continue;
            }
            $v = $data[$key];
            if ($v === null || $v === '') {
                $out[$key] = '';
                continue;
            }
            $s = is_scalar($v) ? (string) $v : json_encode($v);
            $out[$key] = mb_strlen($s) > $maxLen ? mb_substr($s, 0, $maxLen) . '…' : $s;
        }
        return $out;
    }

    /**
     * Build template→HTML reference from the request template (id, type, label, settings keys, content keys).
     * So structure is defined by the frontend template, not hardcoded in backend.
     */
    private function buildTemplateToHtmlReference(array $template): string
    {
        $lines = ['Template→HTML: use section id in sectionSettings; content keys for text changes.'];
        foreach ($template['sections'] ?? [] as $section) {
            $id = $section['id'] ?? '';
            $type = $section['type'] ?? '';
            $label = $section['label'] ?? '';
            $settings = $section['settings'] ?? [];
            $settingKeys = is_array($settings) ? array_keys($settings) : [];
            $fieldKeys = [];
            foreach ($section['fields'] ?? [] as $field) {
                $key = $field['key'] ?? null;
                if ($key !== null && $key !== '') {
                    $fieldKeys[] = $key;
                }
            }
            $settingsStr = $settingKeys !== [] ? ' settings: ' . implode(', ', $settingKeys) . '.' : '';
            $contentStr = $fieldKeys !== [] ? ' content: ' . implode(', ', $fieldKeys) . '.' : '';
            $lines[] = "- id={$id} type={$type} label=" . trim($label) . ".{$settingsStr}{$contentStr}";
        }
        return implode("\n", $lines);
    }

    /** Template tối thiểu gửi Gemini: chỉ id, structure, sections với id, type, label, fields chỉ key+type → giảm token. */
    private function slimTemplateForPrompt(array $template): array
    {
        $sections = [];
        foreach ($template['sections'] ?? [] as $section) {
            $fields = [];
            foreach ($section['fields'] ?? [] as $field) {
                $fields[] = ['key' => $field['key'] ?? '', 'type' => $field['type'] ?? 'text'];
            }
            $sections[] = [
                'id'     => $section['id'] ?? '',
                'type'   => $section['type'] ?? '',
                'label'  => $section['label'] ?? '',
                'fields' => $fields,
            ];
        }

        return [
            'id'        => $template['id'] ?? '',
            'name'     => $template['name'] ?? '',
            'structure' => $template['structure'] ?? [],
            'sections' => $sections,
        ];
    }

    /** Merge thứ tự mới (structure + sectionIds) vào template đầy đủ, giữ nguyên toàn bộ section/field. */
    private function mergeReorderedTemplate(array $fullTemplate, array $structure, array $sectionIds): array
    {
        $sectionsById = [];
        foreach ($fullTemplate['sections'] ?? [] as $section) {
            $sectionsById[$section['id']] = $section;
        }
        $reorderedSections = [];
        foreach ($sectionIds as $id) {
            if (isset($sectionsById[$id])) {
                $reorderedSections[] = $sectionsById[$id];
            }
        }
        if (count($reorderedSections) !== count($fullTemplate['sections'] ?? [])) {
            $reorderedSections = $fullTemplate['sections'];
            $structure = $fullTemplate['structure'] ?? [];
        }

        return [
            'id'        => $fullTemplate['id'] ?? '',
            'name'      => $fullTemplate['name'] ?? '',
            'structure' => $structure,
            'sections'  => $reorderedSections,
        ];
    }

    /** Gán content (key => value) vào defaultValue của từng field trong template. */
    private function applyContentToTemplate(array $template, array $content): array
    {
        if (empty($content)) {
            return $template;
        }
        $sections = [];
        foreach ($template['sections'] ?? [] as $section) {
            $fields = [];
            foreach ($section['fields'] ?? [] as $field) {
                $key = $field['key'] ?? null;
                if ($key !== null && array_key_exists($key, $content)) {
                    $field['defaultValue'] = $content[$key];
                }
                $fields[] = $field;
            }
            $section['fields'] = $fields;
            $sections[] = $section;
        }
        $template['sections'] = $sections;

        return $template;
    }

    /** Gán sectionSettings (sectionId => [key => value]) vào section.settings. */
    private function applySectionSettings(array $template, array $sectionSettings): array
    {
        if (empty($sectionSettings)) {
            return $template;
        }
        $sections = [];
        foreach ($template['sections'] ?? [] as $section) {
            $id = $section['id'] ?? null;
            if ($id !== null && isset($sectionSettings[$id]) && is_array($sectionSettings[$id])) {
                $section['settings'] = array_merge($section['settings'] ?? [], $sectionSettings[$id]);
            }
            $sections[] = $section;
        }
        $template['sections'] = $sections;

        return $template;
    }
}
