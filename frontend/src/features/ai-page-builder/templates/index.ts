import type { TemplateConfig, TemplateId } from "../types";
import { longFormProductTemplate } from "./longFormProduct";
import { productShowcaseTemplate } from "./productShowcase";
import { problemSolutionTemplate } from "./problemSolution";
import { bundleOfferTemplate } from "./bundleOffer";
import { viralTiktokProductTemplate } from "./viralTiktokProduct";
import { flashSaleTemplate } from "./flashSale";

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  long_form_product: longFormProductTemplate,
  product_showcase: productShowcaseTemplate,
  problem_solution: problemSolutionTemplate,
  bundle_offer: bundleOfferTemplate,
  viral_tiktok_product: viralTiktokProductTemplate,
  flash_sale: flashSaleTemplate,
};

export const TEMPLATE_LIST: TemplateConfig[] = Object.values(TEMPLATES);

export { longFormProductTemplate } from "./longFormProduct";
export { productShowcaseTemplate } from "./productShowcase";
export { problemSolutionTemplate } from "./problemSolution";
export { bundleOfferTemplate } from "./bundleOffer";
export { viralTiktokProductTemplate } from "./viralTiktokProduct";
export { flashSaleTemplate } from "./flashSale";
