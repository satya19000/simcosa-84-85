import { c as createSsrRpc } from "./router-CBd90zdT.js";
import { r as requireApproved } from "./middleware-kw9m56U6.js";
import { c as createServerFn } from "./server-BQd5bh2q.js";
const listGallery = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("ed01fb10c2765f96827b4840cbb8c2b27108f6ad8d25060fc53d08de0bf38c9d"));
const uploadGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("99da4081e401e388a612265a7617d134a407e27c1d3a1e0ec44e469483df93a7"));
const editGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("d2aa529dc03095ba5fb8062e31c64f4747d3debe23225255c5648165506c6cc6"));
const deleteGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("bf94916a7551dc3f1057769ff3ad9eb88ed827898be8d0f59a90bac3ff0c2fc2"));
const toggleGalleryLike = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("e8b22e22f9df73a24e601ccfc157f0555c32de9b357c9e8edff53091a0f0e8ad"));
const addGalleryComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("10dededf20386ec95a028d0cd78c51a07705fbb7e6f581ab3f13064362d24396"));
const deleteGalleryComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("22a707742f3fadf8fe1f913c7a6b6e591edfad34fdf675c9a7dfd8ac78a59c5d"));
export {
  deleteGalleryComment as a,
  addGalleryComment as b,
  deleteGalleryItem as d,
  editGalleryItem as e,
  listGallery as l,
  toggleGalleryLike as t,
  uploadGalleryItem as u
};
