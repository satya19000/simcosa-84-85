import { c as createSsrRpc } from "./router-CxW41eXB.js";
import { r as requireApproved } from "./middleware-DcrzD3h4.js";
import { c as createServerFn } from "./server-Dnlq8-1X.js";
const listMemories = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(createSsrRpc("b0d6200ea808e73a221faf82c362ec58b2a03ca94d33e58347f805d9087f54ea"));
const postMemory = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("2065dd745dedbf088f44f3f3b299404d1ba89b3168af234c4c886a35fc6fb65c"));
const addMemoryImages = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("6e93f25e82133db9daf8acfce0d56aff0a445582b59c372a54c67e82ecf744b1"));
const deleteMemoryImage = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("ff8f33c3a684d090734a57c181aec621c60f3fa8eb031e3e6328f337803d8a24"));
const reorderMemoryImages = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("30fe95381bbaaa1da871f982ebe17dba82a7b7c15753d8862fd18c2896001643"));
const toggleLike = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("e184df1fbbb69e55cfb60a3d022bf393270215e9e1cd47bd7c7f3a37184b86f3"));
const addComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("c8064c21e72cfcfa435af44c92e16331acf572539341a658c887017ee837bd30"));
const editMemory = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("45d603cbe08dcb5867d92444fe2b0a2e47624b08cc9800beeb1954ee5e952368"));
const deleteMemory = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("09cfcc99efa88845cc1ccc7cf9d4f9ef041b252e9bf2970ae90789ca0b8437d4"));
const deleteComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("06cc2fd6d3b89226bc51ee370b1f16d39c146bff56aa0bbffff07020ee07c643"));
export {
  addMemoryImages as a,
  deleteMemoryImage as b,
  deleteComment as c,
  deleteMemory as d,
  editMemory as e,
  addComment as f,
  listMemories as l,
  postMemory as p,
  reorderMemoryImages as r,
  toggleLike as t
};
