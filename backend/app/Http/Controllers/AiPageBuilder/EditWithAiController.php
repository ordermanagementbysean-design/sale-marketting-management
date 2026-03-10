<?php

namespace App\Http\Controllers\AiPageBuilder;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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
        $dataJson = ! empty($valid['data']) ? json_encode($valid['data'], JSON_UNESCAPED_UNICODE) : null;
        $dataBlock = $dataJson !== null
            ? "\n\nCurrent field values (edit these per instruction): {$dataJson}"
            : '';
        $prompt = "Edit template: reorder sections and/or change field content per instruction. Return only valid JSON, no markdown.\n\nTemplate: {$templateJson}{$dataBlock}\n\nInstruction: {$instruction}\n\nReturn JSON: {\"structure\":[\"type1\",...],\"sectionIds\":[\"id1\",\"id2\",...],\"content\":{\"field_key\":\"value\",...}}. structure + sectionIds = new order (all section ids, reordered). content = only fields whose text/value should change: key = field key, value = string or number. Omit content or use {} if only reorder.";

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' . $apiKey;
        $response = Http::timeout(60)->post($url, [
            'contents' => [
                ['parts' => [['text' => $prompt]]],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature'      => 0.3,
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
            return response()->json(['message' => 'Không parse được JSON từ Gemini: ' . json_last_error_msg()], 502);
        }

        if (! is_array($parsed) || empty($parsed['structure']) || empty($parsed['sectionIds'])) {
            return response()->json(['message' => 'Gemini trả về thiếu structure hoặc sectionIds.'], 502);
        }

        $content = $parsed['content'] ?? [];
        $content = is_array($content) ? $content : [];

        $template = $this->mergeReorderedTemplate($valid['template'], $parsed['structure'], $parsed['sectionIds']);
        $template = $this->applyContentToTemplate($template, $content);

        return response()->json(['template' => $template]);
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
}
