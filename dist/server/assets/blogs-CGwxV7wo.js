import { c as createSsrRpc } from "./createSsrRpc-Cmq_3J-V.js";
import { r as requireApproved, a as requireAdmin } from "./middleware-BO_Q6bST.js";
import { c as createServerFn } from "./server-CCM_JU5a.js";
const listBlogs = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("8686183d6a6ba2b592b6701a4744f2382ab793460bb9170eef3e065c8053f712"));
const getBlog = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("47d1f3f1865d7310115b58213d25b1a381eb05d7edc8565b16c233590fa03d84"));
const createBlog = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("ce5407d6be6a5dc5170d1fd12bd3c7dd623a3b20751f26c3ca533a362ffb5584"));
const updateBlog = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("23b737aab2c939f4b2c85fb517e41f21ea9455c0d69802b5ee61213aa5d0825d"));
const deleteBlog = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("93b2e42f92a3ed4f183a5d3c06e2139a5aef3bf6a43bd185ba1de268d2dde104"));
const toggleBlogLike = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("a9c4a56341797bb0c8d7cb03f843a0404199d790e22d46d41be3dd59b826f7f5"));
const addBlogComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSsrRpc("2f2d99b2535c6293c0dcfb019144edb5c94344e062f7843bcee721057985e492"));
const setBlogFeatured = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("d0d8f90a3ba48085c5ca0a3b75d8b60a2b51d7f4ca225cf37291c5308760796a"));
const setBlogPublished = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(createSsrRpc("204075850850b80f6d04c75f371e7e4d6d5172ed82bc69c377ff72553f57df0c"));
export {
  setBlogPublished as a,
  addBlogComment as b,
  createBlog as c,
  deleteBlog as d,
  getBlog as g,
  listBlogs as l,
  setBlogFeatured as s,
  toggleBlogLike as t,
  updateBlog as u
};
