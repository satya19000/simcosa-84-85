import { c as createSsrRpc } from "./router-DmVoGMMZ.js";
import { r as requireApproved } from "./middleware-DTj2Jai3.js";
import { c as createServerFn } from "./server-CEk-2QtH.js";
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
const deleteMemory = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("09cfcc99efa88845cc1ccc7cf9d4f9ef041b252e9bf2970ae90789ca0b8437d4"));
const deleteComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("06cc2fd6d3b89226bc51ee370b1f16d39c146bff56aa0bbffff07020ee07c643"));
export {
  deleteComment as a,
  addComment as b,
  deleteMemory as d,
  listMemories as l,
  postMemory as p,
  toggleLike as t
};
