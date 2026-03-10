import axiosClient from "@/shared/utils/axios";
import type { FormValues, TemplateConfig } from "../types";
import { templateWithoutDefaultValues } from "../utils";

export interface EditWithAiPayload {
  instruction: string;
  /** JSON format của template — gửi bản không có defaultValue để giảm token */
  template: TemplateConfig;
  /** Giá trị form hiện tại (để Gemini chỉnh content); optional nhưng nên gửi khi cần sửa nội dung */
  data?: FormValues;
}

export interface EditWithAiResponse {
  template: TemplateConfig;
}

/**
 * Gửi instruction + template (+ data form nếu có) lên backend.
 * Backend trả về template mới (có thể đổi thứ tự section + defaultValues cho content).
 * Frontend dùng template trả về; field có defaultValue thì dùng defaultValue cho preview, còn lại dùng formValues.
 */
export async function editWithAi(payload: EditWithAiPayload): Promise<TemplateConfig> {
  const { data } = await axiosClient.post<EditWithAiResponse>(
    "/api/ai-page-builder/edit-with-ai",
    {
      instruction: payload.instruction,
      template: templateWithoutDefaultValues(payload.template),
      ...(payload.data != null && Object.keys(payload.data).length > 0 ? { data: payload.data } : {}),
    }
  );
  return data.template;
}
