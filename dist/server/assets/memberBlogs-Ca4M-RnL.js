import { c as createSsrRpc } from "./router-TV6HlS94.js";
import { r as requireApproved, a as requireAdmin } from "./middleware-QHgTRr5E.js";
import { c as createServerFn } from "./server-qvj13OZq.js";
const getMemberBySlug = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("ee27abc08ddb6ca4ce8d58fededf9321cdf198a2e4ae472865b426d862734fc4"));
const listMemberBlogItems = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("50bcd0f2b5eb3da7c3b0be35c6d0c3dd3d4d77f7930d18737dd2ed3d31fe0852"));
const getMemberStorageUsage = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("ec5ed1538d442c48f370eea58ee14a48b6b22ed00c6f09984c55c8978c76d20b"));
const addMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("f8f0784d737eb9c9ea3872ddd172ac0928f9523920ac9490de11836707ed8640"));
const editMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("b97dd90213707117aff72b2f21486f25f4378626d3eb755a9540a2a245c5adee"));
const deleteMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("444acdbddaa9000a21e1ea734b2985e61e85e80a3462221a57aaefa739c4f00f"));
const populateMemberSlugs = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).handler(createSsrRpc("2e0a2b0b3c1a0cb19388f76deab7d3d3dba6e24e479e4dc10141d5df69aa7602"));
createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("33e0fefb67e0ee3425222e652505be3b239fe01f5cdbc7b34ce03bc031c569e6"));
export {
  getMemberStorageUsage as a,
  addMemberBlogItem as b,
  deleteMemberBlogItem as d,
  editMemberBlogItem as e,
  getMemberBySlug as g,
  listMemberBlogItems as l,
  populateMemberSlugs as p
};
