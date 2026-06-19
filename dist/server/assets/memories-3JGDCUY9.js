import { c as createSsrRpc } from "./createSsrRpc-f0SVIepO.js";
import { r as requireApproved } from "./middleware-mNRpMe5L.js";
import { c as createServerFn } from "./server-voIeAJtn.js";
const listMemories = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("b0d6200ea808e73a221faf82c362ec58b2a03ca94d33e58347f805d9087f54ea"));
const postMemory = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("2065dd745dedbf088f44f3f3b299404d1ba89b3168af234c4c886a35fc6fb65c"));
const toggleLike = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("e184df1fbbb69e55cfb60a3d022bf393270215e9e1cd47bd7c7f3a37184b86f3"));
const addComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("c8064c21e72cfcfa435af44c92e16331acf572539341a658c887017ee837bd30"));
export {
  addComment as a,
  listMemories as l,
  postMemory as p,
  toggleLike as t
};
