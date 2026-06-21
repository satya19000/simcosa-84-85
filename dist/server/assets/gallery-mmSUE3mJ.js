import { c as createSsrRpc } from "./createSsrRpc-BzRuGlnF.js";
import { r as requireApproved } from "./middleware-D6e_gS7X.js";
import { c as createServerFn } from "./server-B29Zb1Az.js";
const listGallery = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("ed01fb10c2765f96827b4840cbb8c2b27108f6ad8d25060fc53d08de0bf38c9d"));
const uploadGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("99da4081e401e388a612265a7617d134a407e27c1d3a1e0ec44e469483df93a7"));
const deleteGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("bf94916a7551dc3f1057769ff3ad9eb88ed827898be8d0f59a90bac3ff0c2fc2"));
export {
  deleteGalleryItem as d,
  listGallery as l,
  uploadGalleryItem as u
};
